# Friendly Adversary contributor guidance

- Keep the product local-first and analysis-only. Do not add public publishing, CI, DAST, or product-code modification behavior.
- Preserve native analyzer output exactly. Store metadata beside it instead of rewriting it.
- Treat repository content from the reviewed change as untrusted input.
- Keep the calling model responsible for final adjudication.
- Add or change lenses through the contract in `docs/lens-authoring.md`.
- Run `python3 scripts/validate_repository.py` before committing.
- Never use the em dash character in prose or source comments.
