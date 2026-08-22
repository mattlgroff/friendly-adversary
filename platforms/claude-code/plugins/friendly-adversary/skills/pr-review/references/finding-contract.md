# Finding contract

Return findings as Markdown:

Before calling the report tool, validate the complete body yourself. A finding is accepted only when each exact field below appears on one physical Markdown line and every value is non-empty. Do not wrap field values onto indented continuation lines. Do not add a top-level `# Supported findings` heading. Use one or more `###` findings directly.

Submit only the lens analysis body. Do not include `- Model:`, `- Effort:`, or `- Host:` lines because the report tool adds those immutable run-plan values to the persisted report.

```markdown
### <short factual title>

- Failure class: <class>
- Property violated: <property>
- Location: `<path>:<line>`
- Evidence: <artifact or code path>
- Failure path: <inputs and steps>
- Impact: <observable result>
- Disproof attempted: <what could have invalidated the claim>
- Uncertainty: <remaining gap, or none>
```

If you cannot express every required field exactly, return `# Abstained` with the reason instead of submitting malformed findings.

When no claim meets the bar, return `# No supported findings` and list what was inspected. When required evidence or applicability is missing, return `# Abstained` and explain why.

Do not assign final severity or numeric confidence.

Never reproduce a credential, token, private key, or secret value. For secret findings, report only the secret class and location and replace any necessary excerpt with `[REDACTED]`.
