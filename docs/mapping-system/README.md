# Rule-based mapping engine

A configurable, form-agnostic mapping engine. Mapping behaviour is declared in
human-readable JSON mapping files instead of code, so it can be reviewed,
validated, diffed and eventually edited through a GUI.

| Document                                               | Contents                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [01-overview.md](01-overview.md)                       | Why the engine exists, architecture, how a submission is mapped                                  |
| [02-mapping-file-format.md](02-mapping-file-format.md) | Full mapping file reference: rules, conditions, value expressions, transforms, payload expansion |
| [03-output-schemas.md](03-output-schemas.md)           | Declaring the required output structure                                                          |
| [05-gap-detection.md](04-gap-detection.md)             | The mapping gap detection tool                                                                   |

## Quick start

```bash
# Run the service (maps and transmits using the JSON mapping files)
npm run dev

# Check a mapping file for gaps against its form definition
npm run mapping:gaps -- --mapping mappings/advice-cwt.mapping.json --form form-definitions/advice.json

# Check all three mappings
npm run mapping:gaps:all
```

## Key locations

| Path                                    | Contents                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `mappings/*.mapping.json`               | One mapping file per form (advice, assent, consent)                     |
| `mappings/output-schemas/*.schema.json` | Output structure definitions with required/optional flags               |
| `src/service/rule-mapping/`             | The engine: conditions, value resolution, transforms, registry, helpers |
| `scripts/detect-mapping-gaps.js`        | Gap detection CLI                                                       |
