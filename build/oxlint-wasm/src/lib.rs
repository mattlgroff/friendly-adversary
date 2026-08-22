use std::{
    alloc::{Layout, alloc, dealloc},
    path::{Path, PathBuf},
    ptr, slice,
    sync::Arc,
};

use miette::JSONReportHandler;
use oxc_allocator::Allocator;
use oxc_diagnostics::{DiagnosticService, OxcDiagnostic};
use oxc_linter::{
    ConfigStore, ConfigStoreBuilder, ContextSubHost, ContextSubHostOptions, ExternalPluginStore,
    LintIgnoreMatcher, LintOptions, Linter, ModuleRecord, Oxlintrc, table::RuleTable,
};
use oxc_parser::{ParseOptions, Parser};
use oxc_semantic::SemanticBuilder;
use oxc_span::SourceType;
use rustc_hash::FxHashMap;
use serde::{Deserialize, Serialize};

mod anti_slop;

const ABI_VERSION: u32 = 2;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct LintRequest {
    source: String,
    path: String,
    #[serde(default)]
    config_json: Option<String>,
    #[serde(default)]
    config_path: Option<String>,
    #[serde(default)]
    ignore_patterns: Vec<String>,
    #[serde(default)]
    ignore_root: Option<String>,
}

#[derive(Serialize)]
struct LintResponse {
    abi_version: u32,
    upstream_version: &'static str,
    upstream_commit: &'static str,
    status: &'static str,
    diagnostics: Vec<serde_json::Value>,
    error: Option<String>,
}

#[derive(Serialize)]
struct RuleInventory {
    abi_version: u32,
    upstream_version: &'static str,
    upstream_commit: &'static str,
    total: usize,
    turned_on_by_default_count: usize,
    certified_count: usize,
    rules: Vec<RuleInventoryItem>,
}

#[derive(Serialize)]
struct RuleInventoryItem {
    plugin: String,
    name: &'static str,
    category: &'static str,
    turned_on_by_default: bool,
    is_tsgolint_rule: bool,
    certified_by_friendly_adversary: bool,
}

fn error_response(message: impl Into<String>) -> LintResponse {
    LintResponse {
        abi_version: ABI_VERSION,
        upstream_version: "1.76.0",
        upstream_commit: "65fe65d8429e1d1bdf86c517ff08bd119ee87660",
        status: "error",
        diagnostics: Vec::new(),
        error: Some(message.into()),
    }
}

fn render_diagnostics(
    diagnostics: Vec<OxcDiagnostic>,
    cwd: &Path,
    path: &Path,
    source: &str,
) -> Result<Vec<serde_json::Value>, String> {
    let handler = JSONReportHandler::new();
    DiagnosticService::wrap_diagnostics(cwd, path, source, diagnostics)
        .into_iter()
        .map(|diagnostic| {
            let mut output = String::new();
            handler
                .render_report(&mut output, diagnostic.as_ref())
                .map_err(|error| format!("Failed to render Oxlint diagnostic: {error}"))?;
            serde_json::from_str(&output)
                .map_err(|error| format!("Failed to serialize Oxlint diagnostic: {error}"))
        })
        .collect()
}

fn diagnostic_response(
    diagnostics: Vec<OxcDiagnostic>,
    cwd: &Path,
    path: &Path,
    source: &str,
) -> LintResponse {
    match render_diagnostics(diagnostics, cwd, path, source) {
        Ok(diagnostics) => LintResponse {
            abi_version: ABI_VERSION,
            upstream_version: "1.76.0",
            upstream_commit: "65fe65d8429e1d1bdf86c517ff08bd119ee87660",
            status: "ok",
            diagnostics,
            error: None,
        },
        Err(error) => error_response(error),
    }
}

fn certified_rule(plugin: &str, category: &str, is_tsgolint_rule: bool) -> bool {
    matches!(plugin, "eslint" | "unicorn" | "typescript" | "oxc")
        && category == "correctness"
        && !is_tsgolint_rule
}

fn severity_is_enabled(value: &serde_json::Value) -> bool {
    let severity = value
        .as_array()
        .and_then(|values| values.first())
        .unwrap_or(value);
    !matches!(severity, serde_json::Value::Number(number) if number.as_u64() == Some(0))
        && !matches!(severity, serde_json::Value::String(value) if value == "off" || value == "allow")
}

fn config_rule_is_certified(rule_id: &str) -> bool {
    let (plugin, name) = rule_id
        .split_once('/')
        .map_or((None, rule_id), |(plugin, name)| {
            let plugin = match plugin {
                "@typescript-eslint" => "typescript",
                other => other,
            };
            (Some(plugin), name)
        });
    RuleTable::new(None)
        .sections
        .into_iter()
        .flat_map(|section| {
            let category = section.category.as_str();
            section.rows.into_iter().map(move |rule| (rule, category))
        })
        .any(|(rule, category)| {
            plugin.is_none_or(|plugin| plugin == rule.plugin)
                && name == rule.name
                && certified_rule(&rule.plugin, category, rule.is_tsgolint_rule)
        })
}

fn validate_certified_config(json: &serde_json::Value) -> Result<(), String> {
    let Some(object) = json.as_object() else {
        return Err("Failed to parse config: expected a JSON object.".to_string());
    };
    if object
        .get("extends")
        .is_some_and(|value| value.as_array().is_none_or(|values| !values.is_empty()))
    {
        return Err(
            "extended configuration is not supported by the certified WebAssembly profile"
                .to_string(),
        );
    }
    if object
        .get("overrides")
        .is_some_and(|value| value.as_array().is_none_or(|values| !values.is_empty()))
    {
        return Err(
            "configuration overrides are not supported by the certified WebAssembly profile"
                .to_string(),
        );
    }
    if let Some(plugins) = object.get("plugins").and_then(serde_json::Value::as_array) {
        for plugin in plugins.iter().filter_map(serde_json::Value::as_str) {
            if !matches!(
                plugin,
                "eslint" | "unicorn" | "typescript" | "@typescript-eslint" | "oxc"
            ) {
                return Err(format!(
                    "plugin '{plugin}' is outside the certified WebAssembly rule profile"
                ));
            }
        }
    }
    if let Some(categories) = object
        .get("categories")
        .and_then(serde_json::Value::as_object)
    {
        for (category, severity) in categories {
            if category != "correctness" && severity_is_enabled(severity) {
                return Err(format!(
                    "category '{category}' is outside the certified WebAssembly rule profile"
                ));
            }
        }
    }
    if let Some(rules) = object.get("rules").and_then(serde_json::Value::as_object) {
        for (rule, severity) in rules {
            if severity_is_enabled(severity) && !config_rule_is_certified(rule) {
                return Err(format!(
                    "rule '{rule}' is outside the certified WebAssembly rule profile"
                ));
            }
        }
    }
    Ok(())
}

fn parse_config(config_json: &str, config_path: Option<&str>) -> Result<Oxlintrc, String> {
    let mut json = config_json.to_string();
    // Oxlint accepts JSON-with-comments in every JSON configuration file, including
    // the conventional `.oxlintrc.json` name. Keep this aligned with
    // `Oxlintrc::from_file` instead of inferring behavior from the extension.
    json_strip_comments::strip(&mut json)
        .map_err(|error| format!("Failed to parse JSON configuration: {error:?}"))?;
    let json = serde_json::from_str::<serde_json::Value>(&json)
        .map_err(|error| format!("Failed to parse oxlint configuration: {error}"))?;
    validate_certified_config(&json)?;
    let mut config = Oxlintrc::deserialize(&json)
        .map_err(|error| format!("Failed to parse oxlint configuration: {error:?}"))?;
    if let Some(config_path) = config_path {
        config.path = PathBuf::from(config_path);
        let Some(config_dir) = config.path.parent().map(Path::to_path_buf) else {
            return Err("configuration path has no parent directory".to_string());
        };
        config.set_config_dir(&config_dir);
    }
    Ok(config)
}

fn lint(request: LintRequest) -> LintResponse {
    if request.source.len() > u32::MAX as usize {
        return error_response("source exceeds the Oxlint 32-bit span limit");
    }

    let path = Path::new(&request.path);
    let diagnostic_cwd = request
        .ignore_root
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    let source_type = match SourceType::from_path(path) {
        Ok(source_type) => source_type,
        Err(error) => return error_response(error.to_string()),
    };
    let mut external_plugins = ExternalPluginStore::default();
    let mut config_ignore_patterns = Vec::new();
    let builder = if let Some(config_json) = request.config_json.as_deref() {
        let config = match parse_config(config_json, request.config_path.as_deref()) {
            Ok(config) => config,
            Err(error) => return error_response(error),
        };
        if config
            .external_plugins
            .as_ref()
            .is_some_and(|plugins| !plugins.is_empty())
        {
            return error_response(
                "JavaScript plugins are not supported by the WebAssembly engine",
            );
        }
        if !config.extends.is_empty() || !config.extends_configs.is_empty() {
            return error_response(
                "extended configuration must be resolved before entering the WebAssembly engine",
            );
        }
        config_ignore_patterns.clone_from(&config.ignore_patterns);
        match ConfigStoreBuilder::from_oxlintrc(false, config, None, &mut external_plugins, None) {
            Ok(builder) => builder,
            Err(error) => return error_response(error.to_string()),
        }
    } else {
        ConfigStoreBuilder::default()
    };
    let config = match builder.build(&mut external_plugins) {
        Ok(config) => config,
        Err(error) => return error_response(error.to_string()),
    };

    let mut ignore_patterns = request.ignore_patterns;
    ignore_patterns.extend(config_ignore_patterns);
    if !ignore_patterns.is_empty() {
        let Some(ignore_root) = request.ignore_root.as_deref() else {
            return error_response("ignore_root is required when ignore patterns are provided");
        };
        if LintIgnoreMatcher::new(&ignore_patterns, Path::new(ignore_root), Vec::new())
            .should_ignore(path)
        {
            return LintResponse {
                abi_version: ABI_VERSION,
                upstream_version: "1.76.0",
                upstream_commit: "65fe65d8429e1d1bdf86c517ff08bd119ee87660",
                status: "ignored",
                diagnostics: Vec::new(),
                error: None,
            };
        }
    }

    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, &request.source, source_type)
        .with_options(ParseOptions {
            parse_regular_expression: true,
            ..ParseOptions::default()
        })
        .parse();
    if !parsed.diagnostics.is_empty() {
        return diagnostic_response(
            parsed.diagnostics.to_vec(),
            &diagnostic_cwd,
            path,
            &request.source,
        );
    }

    let semantic = SemanticBuilder::new_linter()
        .with_check_syntax_error(true)
        .build(&parsed.program);
    if !semantic.diagnostics.is_empty() {
        return diagnostic_response(
            semantic.diagnostics.to_vec(),
            &diagnostic_cwd,
            path,
            &request.source,
        );
    }

    let mut diagnostics = anti_slop::lint(&semantic.semantic, &request.source);
    let module_record = Arc::new(ModuleRecord::new(
        path,
        &parsed.module_record,
        &semantic.semantic,
    ));
    let messages = Linter::new(
        LintOptions::default(),
        ConfigStore::new(config, FxHashMap::default(), external_plugins),
        None,
    )
    .run(
        path,
        vec![ContextSubHost::new(
            semantic.semantic,
            module_record,
            0,
            ContextSubHostOptions::default(),
        )],
        &allocator,
    );
    diagnostics.extend(messages.into_iter().map(|message| message.error));
    diagnostics.sort_by(|left, right| {
        let left_offset = left
            .labels
            .iter()
            .map(|label| label.offset())
            .min()
            .unwrap_or(u32::MAX);
        let right_offset = right
            .labels
            .iter()
            .map(|label| label.offset())
            .min()
            .unwrap_or(u32::MAX);
        left_offset
            .cmp(&right_offset)
            .then_with(|| left.code.to_string().cmp(&right.code.to_string()))
            .then_with(|| left.message.cmp(&right.message))
    });

    diagnostic_response(diagnostics, &diagnostic_cwd, path, &request.source)
}

fn encode_response(response: LintResponse) -> Vec<u8> {
    serde_json::to_vec(&response).unwrap_or_else(|error| {
        format!(
            "{{\"abi_version\":{ABI_VERSION},\"upstream_version\":\"1.76.0\",\"upstream_commit\":\"65fe65d8429e1d1bdf86c517ff08bd119ee87660\",\"status\":\"error\",\"diagnostics\":[],\"error\":{}}}",
            serde_json::to_string(&error.to_string()).unwrap_or_else(|_| "\"serialization failed\"".to_string())
        )
        .into_bytes()
    })
}

fn encode_rules() -> Vec<u8> {
    let table = RuleTable::new(None);
    let mut rules = table
        .sections
        .into_iter()
        .flat_map(|section| {
            let category = section.category.as_str();
            section.rows.into_iter().map(move |rule| {
                let certified = certified_rule(&rule.plugin, category, rule.is_tsgolint_rule);
                RuleInventoryItem {
                    plugin: rule.plugin,
                    name: rule.name,
                    category,
                    turned_on_by_default: rule.turned_on_by_default,
                    is_tsgolint_rule: rule.is_tsgolint_rule,
                    certified_by_friendly_adversary: certified,
                }
            })
        })
        .collect::<Vec<_>>();
    rules.extend(
        anti_slop::rule_names()
            .iter()
            .map(|name| RuleInventoryItem {
                plugin: "anti-slop".to_string(),
                name,
                category: "style",
                turned_on_by_default: true,
                is_tsgolint_rule: false,
                certified_by_friendly_adversary: true,
            }),
    );
    rules.sort_unstable_by(|left, right| {
        left.plugin
            .cmp(&right.plugin)
            .then_with(|| left.name.cmp(right.name))
    });
    let certified_count = rules
        .iter()
        .filter(|rule| rule.certified_by_friendly_adversary)
        .count();
    serde_json::to_vec(&RuleInventory {
        abi_version: ABI_VERSION,
        upstream_version: "1.76.0",
        upstream_commit: "65fe65d8429e1d1bdf86c517ff08bd119ee87660",
        total: table.total + anti_slop::rule_names().len(),
        turned_on_by_default_count: table.turned_on_by_default_count
            + anti_slop::rule_names().len(),
        certified_count,
        rules,
    })
    .unwrap_or_default()
}

fn pack_output(output: &[u8]) -> u64 {
    let Ok(layout) = Layout::array::<u8>(output.len()) else {
        return 0;
    };
    let output_pointer = unsafe { alloc(layout) };
    if output_pointer.is_null() {
        return 0;
    }
    unsafe { ptr::copy_nonoverlapping(output.as_ptr(), output_pointer, output.len()) };
    ((output.len() as u64) << 32) | output_pointer as u64
}

#[unsafe(no_mangle)]
pub extern "C" fn friendly_adversary_oxlint_abi_version() -> u32 {
    ABI_VERSION
}

#[unsafe(no_mangle)]
pub extern "C" fn friendly_adversary_oxlint_alloc(length: u32) -> u32 {
    if length == 0 {
        return 0;
    }
    let Ok(layout) = Layout::array::<u8>(length as usize) else {
        return 0;
    };
    let pointer = unsafe { alloc(layout) };
    pointer as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn friendly_adversary_oxlint_dealloc(pointer: u32, length: u32) {
    if pointer == 0 || length == 0 {
        return;
    }
    if let Ok(layout) = Layout::array::<u8>(length as usize) {
        unsafe { dealloc(pointer as *mut u8, layout) };
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn friendly_adversary_oxlint_lint(pointer: u32, length: u32) -> u64 {
    let response = if pointer == 0 && length != 0 {
        error_response("request pointer is null")
    } else {
        let input = unsafe { slice::from_raw_parts(pointer as *const u8, length as usize) };
        match serde_json::from_slice::<LintRequest>(input) {
            Ok(request) => lint(request),
            Err(error) => error_response(format!("invalid request: {error}")),
        }
    };
    pack_output(&encode_response(response))
}

#[unsafe(no_mangle)]
pub extern "C" fn friendly_adversary_oxlint_rules() -> u64 {
    pack_output(&encode_rules())
}
