use std::{
    borrow::Cow,
    collections::{HashMap, HashSet},
};

use oxc_ast::{AstKind, ast::*};
use oxc_diagnostics::OxcDiagnostic;
use oxc_semantic::Semantic;
use oxc_span::{GetSpan, Span};
use oxc_syntax::symbol::SymbolId;

mod type_analysis;

use type_analysis::{
    broad_kind_text, effectively_empty_object, resolves_to_object_text, resolves_to_unknown_text,
    type_reference, unsafe_dictionary_kind,
};

const RULES: [&str; 15] = [
    "no-chained-type-assertions",
    "no-conditional-empty-object-spread",
    "no-known-value-widening",
    "no-module-mocking",
    "no-object-parameters",
    "no-reflect-apply",
    "no-reflect-get",
    "no-runtime-typeof",
    "no-shape-in-symbol-names",
    "no-unknown-parameters",
    "no-unknown-returns",
    "no-unknown-type-aliases",
    "no-unsafe-dictionary-type",
    "no-widen-then-assert",
    "require-safety-comment-for-type-assertion",
];

const BUILT_INS: [&str; 8] = [
    "Record",
    "Readonly",
    "Partial",
    "Required",
    "Pick",
    "Omit",
    "PropertyKey",
    "NonNullable",
];

struct AliasInfo<'s> {
    body: &'s str,
    parameters: Vec<(&'s str, Option<&'s str>)>,
}

pub fn rule_names() -> &'static [&'static str] {
    &RULES
}

struct Context<'s, 'a> {
    source: &'s str,
    aliases: HashMap<&'s str, AliasInfo<'s>>,
    empty_interfaces: HashSet<&'a str>,
    non_empty_interfaces: HashSet<&'a str>,
    shadowed_built_ins: HashSet<&'a str>,
    type_parameter_scopes: Vec<(&'a str, Span)>,
    imported_test_apis: HashSet<&'a str>,
    widened_bindings: HashMap<SymbolId, (u32, &'static str)>,
    known_bindings: HashSet<SymbolId>,
    declaration_types: HashMap<SymbolId, &'s str>,
    diagnostics: Vec<OxcDiagnostic>,
}

impl<'s, 'a> Context<'s, 'a> {
    fn report(&mut self, rule: &'static str, message: impl Into<Cow<'static, str>>, span: Span) {
        self.diagnostics.push(
            OxcDiagnostic::warn(message)
                .with_error_code("anti-slop", rule)
                .with_label(span),
        );
    }

    fn text(&self, span: Span) -> &'s str {
        self.source
            .get(span.start as usize..span.end as usize)
            .unwrap_or_default()
    }

    fn type_text(&self, ty: &TSType<'a>) -> &'s str {
        self.text(ty.span())
    }

    fn resolves_to_unknown(&self, text: &'s str) -> bool {
        let mut visited = HashSet::new();
        resolves_to_unknown_text(text, self, &mut visited)
    }

    fn resolves_to_object(&self, text: &'s str) -> bool {
        let mut visited = HashSet::new();
        resolves_to_object_text(text, self, &mut visited)
    }

    fn broad_kind(&self, text: &'s str) -> Option<&'static str> {
        broad_kind_text(text, self, &mut HashSet::new())
    }

    fn built_in(&self, name: &str) -> bool {
        BUILT_INS.contains(&name) && !self.shadowed_built_ins.contains(name)
    }

    fn type_parameter_shadows(&self, name: &str, span: Span) -> bool {
        self.type_parameter_scopes.iter().any(|(parameter, owner)| {
            *parameter == name && owner.start <= span.start && owner.end >= span.end
        })
    }

    fn is_shadowed_type(&self, text: &str, span: Span) -> bool {
        type_reference(text).is_some_and(|(name, arguments)| {
            arguments.is_empty() && self.type_parameter_shadows(name, span)
        })
    }

    fn expression_is_known(&self, semantic: &Semantic<'_>, expression: &Expression<'_>) -> bool {
        expression_is_known(expression)
            || expression
                .without_parentheses()
                .get_identifier_reference()
                .and_then(|identifier| identifier_symbol(semantic, identifier))
                .is_some_and(|symbol| self.known_bindings.contains(&symbol))
    }
}

fn identifier_symbol(
    semantic: &Semantic<'_>,
    identifier: &IdentifierReference<'_>,
) -> Option<SymbolId> {
    identifier
        .reference_id
        .get()
        .and_then(|reference| semantic.scoping().get_reference(reference).symbol_id())
}

fn expression_is_known(expression: &Expression<'_>) -> bool {
    matches!(
        expression.get_inner_expression(),
        Expression::ObjectExpression(_)
            | Expression::ArrayExpression(_)
            | Expression::ArrowFunctionExpression(_)
            | Expression::ClassExpression(_)
            | Expression::FunctionExpression(_)
            | Expression::NewExpression(_)
            | Expression::BooleanLiteral(_)
            | Expression::NullLiteral(_)
            | Expression::NumericLiteral(_)
            | Expression::BigIntLiteral(_)
            | Expression::RegExpLiteral(_)
            | Expression::StringLiteral(_)
            | Expression::TemplateLiteral(_)
            | Expression::UnaryExpression(_)
    )
}

fn object_expression_is_empty(expression: &Expression<'_>) -> bool {
    matches!(expression.without_parentheses(), Expression::ObjectExpression(object) if object.properties.is_empty())
}

fn member_call<'a>(call: &'a CallExpression<'a>) -> Option<(&'a Expression<'a>, &'a str)> {
    let member = call.callee.as_member_expression()?;
    Some((member.object(), member.static_property_name()?))
}

fn identifier_is_unresolved(
    semantic: &Semantic<'_>,
    expression: &Expression<'_>,
    name: &str,
) -> bool {
    let Some(identifier) = expression.without_parentheses().get_identifier_reference() else {
        return false;
    };
    identifier.name == name && semantic.is_unresolved_reference(identifier.node_id.get())
}

fn has_safety_comment(source: &str, assertion_start: usize) -> bool {
    let prefix = &source[..assertion_start.min(source.len())];
    let line_start = prefix.rfind('\n').map_or(0, |index| index + 1);
    if prefix[line_start..].contains("SAFETY:") {
        return true;
    }
    let before_line = prefix[..line_start].trim_end();
    let previous_start = before_line.rfind('\n').map_or(0, |index| index + 1);
    let previous_line = before_line[previous_start..].trim();
    previous_line.starts_with("//") && previous_line.contains("SAFETY:")
        || before_line.rfind("/*").is_some_and(|start| {
            before_line[start..].contains("SAFETY:") && before_line[start..].ends_with("*/")
        })
}

fn assertion_parts<'a>(kind: AstKind<'a>) -> Option<(&'a Expression<'a>, &'a TSType<'a>, Span)> {
    match kind {
        AstKind::TSAsExpression(node) => Some((&node.expression, &node.type_annotation, node.span)),
        AstKind::TSTypeAssertion(node) => {
            Some((&node.expression, &node.type_annotation, node.span))
        }
        _ => None,
    }
}

fn is_outer_assertion(
    nodes: &oxc_semantic::AstNodes<'_>,
    node_id: oxc_syntax::node::NodeId,
) -> bool {
    let mut parent = nodes.parent_kind(node_id);
    while let AstKind::ParenthesizedExpression(parenthesized) = parent {
        parent = nodes.parent_kind(parenthesized.node_id.get());
    }
    !matches!(
        parent,
        AstKind::TSAsExpression(_) | AstKind::TSTypeAssertion(_)
    )
}

fn assertion_chain_count(expression: &Expression<'_>) -> (usize, bool) {
    let mut current = expression.without_parentheses();
    let mut count = 1;
    let mut non_const = false;
    loop {
        match current {
            Expression::TSAsExpression(node) => {
                count += 1;
                non_const |= !node.type_annotation.is_const_type_reference();
                current = node.expression.without_parentheses();
            }
            Expression::TSTypeAssertion(node) => {
                count += 1;
                non_const |= !node.type_annotation.is_const_type_reference();
                current = node.expression.without_parentheses();
            }
            _ => break,
        }
    }
    (count, non_const)
}

fn report_known_widening(
    context: &mut Context<'_, '_>,
    semantic: &Semantic<'_>,
    expression: &Expression<'_>,
    target_text: &str,
    subject: &str,
) {
    let Some(target) = context.broad_kind(target_text) else {
        return;
    };
    if !context.expression_is_known(semantic, expression)
        || (object_expression_is_empty(expression)
            && matches!(target, "open dictionary" | "generic container"))
    {
        return;
    }
    context.report(
        "no-known-value-widening",
        format!("The explicit {target} type on {subject} discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract."),
        expression.span(),
    );
}

pub fn lint<'a>(semantic: &Semantic<'a>, source: &str) -> Vec<OxcDiagnostic> {
    let nodes = semantic.nodes();
    let mut context = Context {
        source,
        aliases: HashMap::new(),
        empty_interfaces: HashSet::new(),
        non_empty_interfaces: HashSet::new(),
        shadowed_built_ins: HashSet::new(),
        type_parameter_scopes: Vec::new(),
        imported_test_apis: HashSet::new(),
        widened_bindings: HashMap::new(),
        known_bindings: HashSet::new(),
        declaration_types: HashMap::new(),
        diagnostics: Vec::new(),
    };

    for node in nodes.iter() {
        match node.kind() {
            AstKind::TSTypeAliasDeclaration(alias) => {
                let parameters =
                    alias
                        .type_parameters
                        .as_deref()
                        .map_or_else(Vec::new, |declaration| {
                            declaration
                                .params
                                .iter()
                                .map(|parameter| {
                                    (
                                        context.text(parameter.name.span),
                                        parameter
                                            .default
                                            .as_ref()
                                            .map(|value| context.type_text(value)),
                                    )
                                })
                                .collect()
                        });
                context.aliases.insert(
                    context.text(alias.id.span),
                    AliasInfo {
                        body: context.type_text(&alias.type_annotation),
                        parameters,
                    },
                );
                if BUILT_INS.contains(&alias.id.name.as_str()) {
                    context.shadowed_built_ins.insert(alias.id.name.as_str());
                }
            }
            AstKind::TSInterfaceDeclaration(interface) => {
                if interface.extends.is_empty()
                    && effectively_empty_object(context.text(interface.body.span))
                {
                    context.empty_interfaces.insert(interface.id.name.as_str());
                } else {
                    context
                        .non_empty_interfaces
                        .insert(interface.id.name.as_str());
                }
                if BUILT_INS.contains(&interface.id.name.as_str()) {
                    context
                        .shadowed_built_ins
                        .insert(interface.id.name.as_str());
                }
            }
            AstKind::TSTypeParameter(parameter) => {
                if let Some(owner) = nodes
                    .ancestors(node.id())
                    .find_map(|ancestor| match ancestor.kind() {
                        AstKind::Function(_)
                        | AstKind::ArrowFunctionExpression(_)
                        | AstKind::TSCallSignatureDeclaration(_)
                        | AstKind::TSMethodSignature(_)
                        | AstKind::TSConstructSignatureDeclaration(_)
                        | AstKind::TSFunctionType(_)
                        | AstKind::TSConstructorType(_)
                        | AstKind::TSTypeAliasDeclaration(_)
                        | AstKind::TSInterfaceDeclaration(_) => Some(ancestor.kind().span()),
                        _ => None,
                    })
                {
                    context
                        .type_parameter_scopes
                        .push((parameter.name.name.as_str(), owner));
                }
            }
            AstKind::ImportDeclaration(import) => {
                for specifier in import.specifiers.as_ref().into_iter().flatten() {
                    let local = specifier.local();
                    if BUILT_INS.contains(&local.name.as_str()) {
                        context.shadowed_built_ins.insert(local.name.as_str());
                    }
                }
                if import.source.value == "vitest" || import.source.value == "@jest/globals" {
                    for specifier in import.specifiers.as_ref().into_iter().flatten() {
                        if let ImportDeclarationSpecifier::ImportSpecifier(specifier) = specifier {
                            let imported = specifier.imported.name();
                            if (import.source.value == "vitest" && imported == "vi")
                                || (import.source.value == "@jest/globals" && imported == "jest")
                            {
                                context
                                    .imported_test_apis
                                    .insert(specifier.local.name.as_str());
                            }
                        }
                    }
                }
            }
            AstKind::Function(function) => {
                if let Some(id) = &function.id
                    && BUILT_INS.contains(&id.name.as_str())
                {
                    context.shadowed_built_ins.insert(id.name.as_str());
                }
            }
            AstKind::Class(class) => {
                if let Some(id) = &class.id
                    && BUILT_INS.contains(&id.name.as_str())
                {
                    context.shadowed_built_ins.insert(id.name.as_str());
                }
            }
            _ => {}
        }
    }

    for node in nodes.iter() {
        if let AstKind::VariableDeclarator(declaration) = node.kind()
            && let Some(identifier) = declaration.id.get_binding_identifier()
            && let Some(symbol) = identifier.symbol_id.get()
        {
            if let Some(annotation) = declaration.type_annotation.as_deref() {
                context.declaration_types.insert(
                    symbol,
                    context.type_text(&annotation.type_annotation),
                );
            }
            if declaration.kind == VariableDeclarationKind::Const
                && declaration.init.as_ref().is_some_and(expression_is_known)
            {
                context.known_bindings.insert(symbol);
            }
        }
    }

    loop {
        let mut changed = false;
        for node in nodes.iter() {
            if let AstKind::VariableDeclarator(declaration) = node.kind()
                && declaration.kind == VariableDeclarationKind::Const
                && let (Some(identifier), Some(initializer)) = (
                    declaration.id.get_binding_identifier(),
                    declaration.init.as_ref(),
                )
                && let Some(symbol) = identifier.symbol_id.get()
                && let Some(source_name) =
                    initializer.without_parentheses().get_identifier_reference()
                && let Some(source_symbol) = identifier_symbol(semantic, source_name)
                && context.known_bindings.contains(&source_symbol)
            {
                changed |= context.known_bindings.insert(symbol);
            }
        }
        if !changed {
            break;
        }
    }

    for node in nodes.iter() {
        if let AstKind::VariableDeclarator(declaration) = node.kind()
            && declaration.kind == VariableDeclarationKind::Const
            && let (Some(identifier), Some(annotation), Some(initializer)) = (
                declaration.id.get_binding_identifier(),
                declaration.type_annotation.as_deref(),
                declaration.init.as_ref(),
            )
            && let Some(symbol) = identifier.symbol_id.get()
            && (expression_is_known(initializer)
                || initializer
                    .without_parentheses()
                    .get_identifier_reference()
                    .and_then(|identifier| identifier_symbol(semantic, identifier))
                    .is_some_and(|source| context.known_bindings.contains(&source)))
            && let Some(kind) = context.broad_kind(context.type_text(&annotation.type_annotation))
        {
            context
                .widened_bindings
                .insert(symbol, (declaration.span.end, kind));
        }
    }

    for node in nodes.iter() {
        let node_id = node.id();
        let kind = node.kind();
        match kind {
            AstKind::TSAsExpression(_) | AstKind::TSTypeAssertion(_) => {
                let (expression, ty, span) = assertion_parts(kind).expect("assertion kind");
                if is_outer_assertion(nodes, node_id) {
                    let (count, nested_non_const) = assertion_chain_count(expression);
                    if count > 1 && (nested_non_const || !ty.is_const_type_reference()) {
                        context.report(
                            "no-chained-type-assertions",
                            "This assertion chain discards type evidence. Keep the original precise type, or parse untrusted input at its boundary before narrowing it.",
                            span,
                        );
                    }
                }
                if !ty.is_const_type_reference() && !has_safety_comment(source, span.start as usize)
                {
                    context.report(
                        "require-safety-comment-for-type-assertion",
                        "This type assertion has no `SAFETY:` justification. State the checked invariant immediately before the assertion or its containing statement.",
                        span,
                    );
                }
                if is_outer_assertion(nodes, node_id)
                    && context.expression_is_known(semantic, expression)
                    && let Some(target) = context.broad_kind(context.type_text(ty))
                    && !(object_expression_is_empty(expression)
                        && matches!(target, "open dictionary" | "generic container"))
                {
                    context.report(
                        "no-known-value-widening",
                        format!("The explicit {target} type on assertion discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract."),
                        span,
                    );
                }
                if let Some(identifier) =
                    expression.without_parentheses().get_identifier_reference()
                    && let Some(symbol) = identifier_symbol(semantic, identifier)
                    && let Some((declared_at, broad_kind)) = context
                        .widened_bindings
                        .get(&symbol)
                        .copied()
                    && span.start > declared_at
                    && match (broad_kind, context.broad_kind(context.type_text(ty))) {
                        ("unknown", Some("unknown")) => false,
                        ("unknown", _) => true,
                        ("object", None | Some("anonymous object" | "open dictionary")) => true,
                        (
                            "open dictionary" | "generic container",
                            None | Some("anonymous object"),
                        ) => true,
                        _ => false,
                    }
                {
                    context.report(
                        "no-widen-then-assert",
                        format!("Binding \"{}\" discards {broad_kind} type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.", identifier.name),
                        span,
                    );
                }
            }
            AstKind::SpreadElement(spread) => {
                if let Expression::ConditionalExpression(conditional) =
                    spread.argument.without_parentheses()
                    && (object_expression_is_empty(&conditional.consequent)
                        || object_expression_is_empty(&conditional.alternate))
                {
                    context.report(
                        "no-conditional-empty-object-spread",
                        "This conditional spread hides property omission behind an empty object. Build the object in separate statements and add the property only when present.",
                        spread.span,
                    );
                }
            }
            AstKind::CallExpression(call) => {
                if let Some((object, method)) = member_call(call) {
                    if matches!(method, "apply" | "get")
                        && identifier_is_unresolved(semantic, object, "Reflect")
                    {
                        let (rule, message) = if method == "apply" {
                            (
                                "no-reflect-apply",
                                "Replace `Reflect.apply` with a typed function call. Model dynamic dispatch behind a named interface.",
                            )
                        } else {
                            (
                                "no-reflect-get",
                                "Replace `Reflect.get` with typed property access. Parse dynamic input into a named domain type before reading it.",
                            )
                        };
                        context.report(rule, message, call.span);
                    }
                    if matches!(method, "doMock" | "mock" | "unstable_mockModule")
                        && let Some(identifier) =
                            object.without_parentheses().get_identifier_reference()
                        && ((matches!(identifier.name.as_str(), "vi" | "jest")
                            && semantic.is_unresolved_reference(identifier.node_id.get()))
                            || context
                                .imported_test_apis
                                .contains(identifier.name.as_str()))
                    {
                        context.report(
                            "no-module-mocking",
                            "Replace module mocking with dependency injection through a real interface, service layer, or faithful test implementation.",
                            call.span,
                        );
                    }
                }
            }
            AstKind::UnaryExpression(unary) if unary.operator == UnaryOperator::Typeof => {
                context.report(
                    "no-runtime-typeof",
                    "A `typeof` check narrows a representation without establishing its contract. Parse input at its I/O boundary, then branch on the domain value.",
                    unary.span,
                );
            }
            AstKind::IdentifierReference(identifier)
                if identifier.name.to_ascii_lowercase().contains("shape") =>
            {
                context.report(
                    "no-shape-in-symbol-names",
                    format!("Rename symbol \"{}\" for its domain role; \"shape\" describes structure rather than ownership.", identifier.name),
                    identifier.span,
                );
            }
            AstKind::BindingIdentifier(identifier)
                if identifier.name.to_ascii_lowercase().contains("shape") =>
            {
                context.report(
                    "no-shape-in-symbol-names",
                    format!("Rename symbol \"{}\" for its domain role; \"shape\" describes structure rather than ownership.", identifier.name),
                    identifier.span,
                );
            }
            AstKind::IdentifierName(identifier)
                if identifier.name.to_ascii_lowercase().contains("shape") =>
            {
                context.report(
                    "no-shape-in-symbol-names",
                    format!("Rename symbol \"{}\" for its domain role; \"shape\" describes structure rather than ownership.", identifier.name),
                    identifier.span,
                );
            }
            AstKind::PrivateIdentifier(identifier)
                if identifier.name.to_ascii_lowercase().contains("shape") =>
            {
                context.report(
                    "no-shape-in-symbol-names",
                    format!("Rename symbol \"{}\" for its domain role; \"shape\" describes structure rather than ownership.", identifier.name),
                    identifier.span,
                );
            }
            AstKind::JSXIdentifier(identifier)
                if identifier.name.to_ascii_lowercase().contains("shape") =>
            {
                context.report(
                    "no-shape-in-symbol-names",
                    format!("Rename symbol \"{}\" for its domain role; \"shape\" describes structure rather than ownership.", identifier.name),
                    identifier.span,
                );
            }
            AstKind::FormalParameter(parameter) => {
                if let Some(annotation) = parameter.type_annotation.as_deref() {
                    let text = context.type_text(&annotation.type_annotation);
                    let name = parameter
                        .pattern
                        .get_identifier_name()
                        .map_or("parameter", |name| name.as_str());
                    if !context.is_shadowed_type(text, parameter.span)
                        && context.resolves_to_unknown(text)
                        && name != "cause"
                    {
                        context.report(
                            "no-unknown-parameters",
                            format!("Parameter `{name}` leaves input unparsed. Accept a named domain type; run the expected schema or parser at the I/O boundary before calling this function."),
                            annotation.type_annotation.span(),
                        );
                    }
                    if !context.is_shadowed_type(text, parameter.span)
                        && context.resolves_to_object(text)
                    {
                        context.report(
                            "no-object-parameters",
                            format!("Parameter `{name}` uses the broad `object` type. Accept a named owner type; parse external input at its boundary before calling this function."),
                            annotation.type_annotation.span(),
                        );
                    }
                }
            }
            AstKind::FormalParameterRest(parameter) => {
                if let Some(annotation) = parameter.type_annotation.as_deref() {
                    let text = context.type_text(&annotation.type_annotation);
                    if !context.is_shadowed_type(text, parameter.span)
                        && context.resolves_to_unknown(text)
                    {
                        context.report(
                            "no-unknown-parameters",
                            "Rest parameter leaves input unparsed. Accept a named domain type and parse input at its I/O boundary.",
                            annotation.type_annotation.span(),
                        );
                    }
                    if !context.is_shadowed_type(text, parameter.span)
                        && context.resolves_to_object(text)
                    {
                        context.report(
                            "no-object-parameters",
                            "Rest parameter uses the broad `object` type. Accept a named owner type and parse input at its boundary.",
                            annotation.type_annotation.span(),
                        );
                    }
                }
            }
            AstKind::TSTypeAliasDeclaration(alias) => {
                let text = context.type_text(&alias.type_annotation);
                if context.resolves_to_unknown(text) {
                    context.report(
                        "no-unknown-type-aliases",
                        format!("Type alias `{}` hides `unknown`. Keep `unknown` explicit at the parsing boundary or on an allowed `cause` field; otherwise use the parsed owner type.", alias.id.name),
                        alias.id.span,
                    );
                }
                if let Some(value) = unsafe_dictionary_kind(text, &context) {
                    context.report(
                        "no-unsafe-dictionary-type",
                        format!("This dictionary's {value} value type gives callers no concrete value contract. Use an owner/schema-derived value type; parse external payloads before insertion."),
                        alias.type_annotation.span(),
                    );
                }
            }
            AstKind::VariableDeclarator(declaration) => {
                if let (Some(annotation), Some(initializer), Some(name)) = (
                    declaration.type_annotation.as_deref(),
                    declaration.init.as_ref(),
                    declaration.id.get_identifier_name(),
                ) && context.expression_is_known(semantic, initializer)
                    && let Some(target) =
                        context.broad_kind(context.type_text(&annotation.type_annotation))
                    && !(matches!(initializer.get_inner_expression(), Expression::ObjectExpression(object) if object.properties.is_empty())
                        && matches!(target, "open dictionary" | "generic container"))
                {
                    context.report(
                        "no-known-value-widening",
                        format!("The explicit {target} type on binding `{name}` discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract."),
                        initializer.span(),
                    );
                }
            }
            AstKind::PropertyDefinition(property) => {
                if let (Some(annotation), Some(value)) =
                    (property.type_annotation.as_deref(), property.value.as_ref())
                {
                    let target = context.type_text(&annotation.type_annotation);
                    report_known_widening(&mut context, semantic, value, target, "property");
                }
            }
            AstKind::AccessorProperty(property) => {
                if let (Some(annotation), Some(value)) =
                    (property.type_annotation.as_deref(), property.value.as_ref())
                {
                    let target = context.type_text(&annotation.type_annotation);
                    report_known_widening(&mut context, semantic, value, target, "property");
                }
            }
            AstKind::AssignmentExpression(assignment)
                if assignment.operator == AssignmentOperator::Assign =>
            {
                if let AssignmentTarget::AssignmentTargetIdentifier(identifier) = &assignment.left
                    && let Some(symbol) = identifier_symbol(semantic, identifier)
                    && let Some(target) = context.declaration_types.get(&symbol).copied()
                {
                    report_known_widening(
                        &mut context,
                        semantic,
                        &assignment.right,
                        target,
                        "binding assignment",
                    );
                }
            }
            AstKind::ReturnStatement(statement) => {
                if let Some(argument) = statement.argument.as_ref()
                    && let Some(annotation) =
                        nodes
                            .ancestors(node_id)
                            .find_map(|ancestor| match ancestor.kind() {
                                AstKind::Function(function) => function.return_type.as_deref(),
                                AstKind::ArrowFunctionExpression(function) => {
                                    function.return_type.as_deref()
                                }
                                _ => None,
                            })
                {
                    let target = context.type_text(&annotation.type_annotation);
                    report_known_widening(&mut context, semantic, argument, target, "return value");
                }
            }
            AstKind::TSInterfaceDeclaration(interface) => {
                if let Some(value) =
                    unsafe_dictionary_kind(context.text(interface.body.span), &context)
                {
                    context.report(
                        "no-unsafe-dictionary-type",
                        format!("This dictionary's {value} value type gives callers no concrete value contract. Use an owner/schema-derived value type; parse external payloads before insertion."),
                        interface.body.span,
                    );
                }
            }
            _ => {}
        }

        let return_type = match kind {
            AstKind::Function(function) => function.return_type.as_deref(),
            AstKind::ArrowFunctionExpression(function) => function.return_type.as_deref(),
            AstKind::TSCallSignatureDeclaration(function) => function.return_type.as_deref(),
            AstKind::TSMethodSignature(function) => function.return_type.as_deref(),
            AstKind::TSConstructSignatureDeclaration(function) => function.return_type.as_deref(),
            AstKind::TSFunctionType(function) => Some(function.return_type.as_ref()),
            AstKind::TSConstructorType(function) => Some(function.return_type.as_ref()),
            _ => None,
        };
        if let Some(annotation) = return_type
            && !context
                .is_shadowed_type(context.type_text(&annotation.type_annotation), kind.span())
            && context.resolves_to_unknown(context.type_text(&annotation.type_annotation))
        {
            context.report(
                "no-unknown-returns",
                "This function exposes `unknown` to its caller. Parse the value at its boundary and return a named domain type.",
                annotation.type_annotation.span(),
            );
        }
    }

    context.diagnostics
}
