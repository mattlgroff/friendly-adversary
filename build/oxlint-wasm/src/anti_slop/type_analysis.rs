use std::collections::{HashMap, HashSet};

use super::{AliasInfo, Context};

fn trim_outer_parentheses(mut text: &str) -> &str {
    text = text.trim();
    loop {
        if !text.starts_with('(') || !text.ends_with(')') {
            return text;
        }
        let mut depth = 0_i32;
        let mut closes_at_end = false;
        for (index, ch) in text.char_indices() {
            match ch {
                '(' => depth += 1,
                ')' => {
                    depth -= 1;
                    if depth == 0 {
                        closes_at_end = index + ch.len_utf8() == text.len();
                        if !closes_at_end {
                            return text;
                        }
                    }
                }
                _ => {}
            }
        }
        if !closes_at_end {
            return text;
        }
        text = text[1..text.len() - 1].trim();
    }
}

fn strip_type_wrappers(mut text: &str) -> &str {
    text = trim_outer_parentheses(text);
    'wrappers: loop {
        let trimmed = text.trim();
        if let Some(rest) = trimmed.strip_prefix("readonly ") {
            text = trim_outer_parentheses(rest);
            continue;
        }
        for wrapper in ["Readonly", "Partial", "Required", "NonNullable"] {
            if let Some(inner) = generic_inner(trimmed, wrapper) {
                text = trim_outer_parentheses(inner);
                continue 'wrappers;
            }
        }
        return trimmed;
    }
}

fn generic_inner<'a>(text: &'a str, name: &str) -> Option<&'a str> {
    let text = text.trim();
    let rest = text.strip_prefix(name)?.trim_start();
    if !rest.starts_with('<') || !rest.ends_with('>') {
        return None;
    }
    matching_delimiter(rest, 0, '<', '>').filter(|end| *end + 1 == rest.len())?;
    Some(&rest[1..rest.len() - 1])
}

fn matching_delimiter(text: &str, start: usize, open: char, close: char) -> Option<usize> {
    let mut depth = 0_i32;
    let mut quote = None;
    let mut escaped = false;
    for (offset, ch) in text[start..].char_indices() {
        if let Some(active) = quote {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == active {
                quote = None;
            }
            continue;
        }
        if matches!(ch, '\'' | '"' | '`') {
            quote = Some(ch);
            continue;
        }
        if ch == open {
            depth += 1;
        } else if ch == close {
            depth -= 1;
            if depth == 0 {
                return Some(start + offset);
            }
        }
    }
    None
}

fn split_top_level(text: &str, delimiter: char) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut start = 0;
    let mut stack = Vec::new();
    let mut quote = None;
    let mut escaped = false;
    for (index, ch) in text.char_indices() {
        if let Some(active) = quote {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == active {
                quote = None;
            }
            continue;
        }
        if matches!(ch, '\'' | '"' | '`') {
            quote = Some(ch);
            continue;
        }
        match ch {
            '<' | '(' | '[' | '{' => stack.push(ch),
            '>' | ')' | ']' | '}' => {
                stack.pop();
            }
            _ if ch == delimiter && stack.is_empty() => {
                parts.push(text[start..index].trim());
                start = index + ch.len_utf8();
            }
            _ => {}
        }
    }
    parts.push(text[start..].trim());
    parts
}

fn is_identifier(text: &str) -> bool {
    let mut chars = text.chars();
    chars
        .next()
        .is_some_and(|ch| ch == '_' || ch == '$' || ch.is_ascii_alphabetic())
        && chars.all(|ch| ch == '_' || ch == '$' || ch.is_ascii_alphanumeric())
}

pub(super) fn resolves_to_unknown_text<'a>(
    text: &'a str,
    context: &Context<'a, '_>,
    visited: &mut HashSet<&'a str>,
) -> bool {
    let text = strip_type_wrappers(text);
    if text == "unknown" {
        return true;
    }
    if let Some(inner) =
        generic_inner(text, "Promise").or_else(|| generic_inner(text, "PromiseLike"))
    {
        return resolves_to_unknown_text(inner, context, visited);
    }
    if split_top_level(text, '|').len() > 1 {
        return split_top_level(text, '|')
            .into_iter()
            .any(|part| resolves_to_unknown_text(part, context, visited));
    }
    if is_identifier(text)
        && visited.insert(text)
        && let Some(alias) = context.aliases.get(text)
    {
        return resolves_to_unknown_text(alias.body, context, visited);
    }
    false
}

pub(super) fn resolves_to_object_text<'a>(
    text: &'a str,
    context: &Context<'a, '_>,
    visited: &mut HashSet<&'a str>,
) -> bool {
    let text = strip_type_wrappers(text);
    if text == "object" {
        return true;
    }
    if split_top_level(text, '|').len() > 1 {
        return split_top_level(text, '|')
            .into_iter()
            .any(|part| resolves_to_object_text(part, context, visited));
    }
    if is_identifier(text)
        && visited.insert(text)
        && let Some(alias) = context.aliases.get(text)
    {
        return resolves_to_object_text(alias.body, context, visited);
    }
    false
}

fn broad_kind_inner<'s, 'a>(
    text: &'s str,
    context: &Context<'s, 'a>,
    substitutions: &HashMap<&'s str, &'s str>,
    resolving: &mut HashSet<&'s str>,
    alias_mode: bool,
) -> Option<&'static str> {
    let text = substituted(text, substitutions);
    let text = trim_outer_parentheses(text.strip_prefix("readonly ").unwrap_or(text));
    if text == "unknown" || text == "any" {
        return Some("unknown");
    }
    if text == "object" {
        return Some("object");
    }
    if text.starts_with('{') && text.ends_with('}') {
        let body = text[1..text.len() - 1].trim();
        if body.is_empty() {
            return None;
        }
        let broad_dictionary = if let Some(open) = body.find('[')
            && let Some(close_offset) = body[open + 1..].find(']')
        {
            let key = body[open + 1..open + 1 + close_offset].trim();
            if let Some((_, constraint)) = key.split_once(" in ") {
                matches!(
                    constraint.trim(),
                    "string" | "number" | "symbol" | "PropertyKey"
                )
            } else {
                body[open + 1 + close_offset + 1..].contains(':')
            }
        } else {
            false
        };
        return if broad_dictionary {
            Some("open dictionary")
        } else if alias_mode {
            None
        } else {
            Some("anonymous object")
        };
    }
    let (name, arguments) = type_reference(text)?;
    if let Some(value) = substitutions.get(name).copied() {
        return broad_kind_inner(value, context, substitutions, resolving, alias_mode);
    }
    if matches!(name, "Readonly" | "Partial" | "Required" | "NonNullable")
        && context.built_in(name)
        && arguments.len() == 1
    {
        return broad_kind_inner(arguments[0], context, substitutions, resolving, alias_mode);
    }
    if name == "Record" && context.built_in(name) {
        return Some("open dictionary");
    }
    if resolving.insert(name)
        && let Some(alias) = context.aliases.get(name)
        && let Some(next) = bind_alias(alias, &arguments, substitutions)
    {
        if !alias.parameters.is_empty()
            && !dictionary_values(alias.body, context, &next, &mut HashSet::new()).is_empty()
        {
            resolving.remove(name);
            return Some("generic container");
        }
        let result = broad_kind_inner(alias.body, context, &next, resolving, true);
        resolving.remove(name);
        return result;
    }
    None
}

pub(super) fn broad_kind_text<'s, 'a>(
    text: &'s str,
    context: &Context<'s, 'a>,
    _visited: &mut HashSet<&'s str>,
) -> Option<&'static str> {
    broad_kind_inner(text, context, &HashMap::new(), &mut HashSet::new(), false)
}

pub(super) fn type_reference(text: &str) -> Option<(&str, Vec<&str>)> {
    let text = trim_outer_parentheses(text);
    if is_identifier(text) {
        return Some((text, Vec::new()));
    }
    let open = text.find('<')?;
    let name = text[..open].trim();
    if !is_identifier(name) || matching_delimiter(text, open, '<', '>') != Some(text.len() - 1) {
        return None;
    }
    Some((name, split_top_level(&text[open + 1..text.len() - 1], ',')))
}

fn bind_alias<'s, 'a>(
    alias: &'a AliasInfo<'s>,
    arguments: &[&'s str],
    base: &HashMap<&'s str, &'s str>,
) -> Option<HashMap<&'s str, &'s str>> {
    let mut substitutions = base.clone();
    for (index, (name, default)) in alias.parameters.iter().enumerate() {
        let value = substituted(arguments.get(index).copied().or(*default)?, &substitutions);
        substitutions.insert(name, value);
    }
    Some(substitutions)
}

fn substituted<'s>(text: &'s str, substitutions: &HashMap<&'s str, &'s str>) -> &'s str {
    let mut current = trim_outer_parentheses(text);
    let mut visited = HashSet::new();
    while is_identifier(current) && visited.insert(current) {
        let Some(next) = substitutions.get(current).copied() else {
            break;
        };
        current = trim_outer_parentheses(next);
    }
    current
}

pub(super) fn effectively_empty_object(text: &str) -> bool {
    let text = trim_outer_parentheses(text);
    if !text.starts_with('{') || !text.ends_with('}') {
        return false;
    }
    let body = text[1..text.len() - 1].trim();
    if body.is_empty() {
        return true;
    }
    split_top_level(body, ';').into_iter().all(|member| {
        let member = member.trim();
        member.is_empty()
            || (member.contains('?')
                && member
                    .rsplit_once(':')
                    .is_some_and(|(_, value)| trim_outer_parentheses(value) == "never"))
    })
}

fn unsafe_value_kind_inner<'s, 'a>(
    text: &'s str,
    context: &Context<'s, 'a>,
    substitutions: &HashMap<&'s str, &'s str>,
    resolving: &mut HashSet<&'s str>,
) -> Option<&'static str> {
    let text = substituted(text, substitutions);
    let text = trim_outer_parentheses(text.strip_prefix("readonly ").unwrap_or(text));
    match text {
        "unknown" => return Some("unknown"),
        "any" => return Some("any"),
        "object" => return Some("object"),
        _ => {}
    }
    if effectively_empty_object(text) {
        return Some("empty-object");
    }
    let unions = split_top_level(text, '|');
    if unions.len() > 1
        && unions
            .iter()
            .any(|part| unsafe_value_kind_inner(part, context, substitutions, resolving).is_some())
    {
        return Some("union");
    }
    let intersections = split_top_level(text, '&');
    if intersections.len() > 1 {
        let values = intersections
            .iter()
            .map(|part| unsafe_value_kind_inner(part, context, substitutions, resolving))
            .collect::<Vec<_>>();
        if values.contains(&Some("any")) {
            return Some("any");
        }
        return values.iter().all(Option::is_some).then_some(values[0]?);
    }
    let (name, arguments) = type_reference(text)?;
    if matches!(name, "Readonly" | "Partial" | "Required" | "NonNullable")
        && context.built_in(name)
        && arguments.len() == 1
    {
        return unsafe_value_kind_inner(arguments[0], context, substitutions, resolving);
    }
    if let Some(value) = substitutions.get(name).copied() {
        return unsafe_value_kind_inner(value, context, substitutions, resolving);
    }
    if context.empty_interfaces.contains(name) && !context.non_empty_interfaces.contains(name) {
        return Some("empty-object");
    }
    if resolving.insert(name)
        && let Some(alias) = context.aliases.get(name)
        && let Some(next) = bind_alias(alias, &arguments, substitutions)
    {
        let result = unsafe_value_kind_inner(alias.body, context, &next, resolving);
        resolving.remove(name);
        return result;
    }
    None
}

fn type_literal_dictionary_values(text: &str) -> Vec<&str> {
    let text = trim_outer_parentheses(text);
    if !text.starts_with('{') || !text.ends_with('}') {
        return Vec::new();
    }
    split_top_level(&text[1..text.len() - 1], ';')
        .into_iter()
        .filter_map(|member| {
            let close = member.find(']')?;
            if !member[..=close].contains('[') {
                return None;
            }
            let colon = member[close + 1..].find(':')? + close + 1;
            Some(member[colon + 1..].trim())
        })
        .collect()
}

fn dictionary_values<'s, 'a>(
    text: &'s str,
    context: &Context<'s, 'a>,
    substitutions: &HashMap<&'s str, &'s str>,
    resolving: &mut HashSet<&'s str>,
) -> Vec<(&'s str, HashMap<&'s str, &'s str>)> {
    let text = substituted(text, substitutions);
    let text = trim_outer_parentheses(text.strip_prefix("readonly ").unwrap_or(text));
    let literal_values = type_literal_dictionary_values(text);
    if !literal_values.is_empty() {
        return literal_values
            .into_iter()
            .map(|value| (value, substitutions.clone()))
            .collect();
    }
    let Some((name, arguments)) = type_reference(text) else {
        return Vec::new();
    };
    if let Some(value) = substitutions.get(name).copied() {
        return dictionary_values(value, context, substitutions, resolving);
    }
    if matches!(name, "Readonly" | "Partial" | "Required" | "NonNullable")
        && context.built_in(name)
        && arguments.len() == 1
    {
        return dictionary_values(arguments[0], context, substitutions, resolving);
    }
    if name == "Record" && context.built_in(name) && arguments.len() == 2 {
        return vec![(arguments[1], substitutions.clone())];
    }
    if matches!(name, "Pick" | "Omit") && context.built_in(name) && !arguments.is_empty() {
        return dictionary_values(arguments[0], context, substitutions, resolving);
    }
    if resolving.insert(name)
        && let Some(alias) = context.aliases.get(name)
        && let Some(next) = bind_alias(alias, &arguments, substitutions)
    {
        let values = dictionary_values(alias.body, context, &next, resolving);
        resolving.remove(name);
        return values;
    }
    Vec::new()
}

pub(super) fn unsafe_dictionary_kind<'s, 'a>(
    text: &'s str,
    context: &Context<'s, 'a>,
) -> Option<&'static str> {
    for (value, substitutions) in
        dictionary_values(text, context, &HashMap::new(), &mut HashSet::new())
    {
        if let Some(kind) =
            unsafe_value_kind_inner(value, context, &substitutions, &mut HashSet::new())
        {
            return Some(kind);
        }
    }
    None
}
