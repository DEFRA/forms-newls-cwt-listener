# Rule-based mapping engine (prototype)

A configurable, form-agnostic alternative to the legacy hardcoded mappers in
`src/service/mappers/`. Mapping behaviour is declared in human-readable JSON
mapping files instead of code, so it can be reviewed, validated, diffed and
eventually edited through a GUI.

| Document                                               | Contents                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [01-overview.md](01-overview.md)                       | Why the engine exists, architecture, engine modes, rollout plan               |
| [02-mapping-file-format.md](02-mapping-file-format.md) | Full mapping file reference: rules, conditions, value expressions, transforms |
| [03-output-schemas.md](03-output-schemas.md)           | Declaring the required output structure                                       |
| [04-dual-run-comparison.md](04-dual-run-comparison.md) | Running legacy and rules mapping side by side and storing both payloads       |
| [05-gap-detection.md](05-gap-detection.md)             | The mapping gap detection tool                                                |
| [06-known-differences.md](06-known-differences.md)     | Intentional behavioural differences from the legacy mappers                   |

## Quick start

```bash
# Run everything through the legacy mappers (default, production behaviour)
MAPPING_ENGINE_MODE=legacy npm run dev

# Dual-run: transmit the legacy payload, store both payloads for comparison
MAPPING_ENGINE_MODE=both npm run dev

# Rules only: map and transmit using the JSON mapping files
MAPPING_ENGINE_MODE=rules npm run dev

# Check a mapping file for gaps against its form definition
npm run mapping:gaps -- --mapping mappings/advice-cwt.mapping.json --form form-definitions/advice.json

# Check all three mappings
npm run mapping:gaps:all
```

## Key locations

| Path                                              | Contents                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `mappings/*.mapping.json`                         | One mapping file per form (advice, assent, consent)                              |
| `mappings/output-schemas/*.schema.json`           | Output structure definitions with required/optional flags                        |
| `src/service/rule-mapping/`                       | The engine: conditions, value resolution, transforms, registry, comparison store |
| `scripts/detect-mapping-gaps.js`                  | Gap detection CLI                                                                |
| `src/service/rule-mapping/mapping-parity.test.js` | Parity tests proving the mapping files reproduce the legacy output               |
