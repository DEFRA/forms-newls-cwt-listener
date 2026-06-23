# Overview

## Why

The legacy mapping solution (`src/service/mappers/`) works in production but:

- it is tightly bound to the three specific forms (advice, assent, consent)
- the mapping logic is hardcoded and spread across code files
- it is difficult to maintain, read and validate
- a specification/mapping document cannot easily be produced from the code

The rule-based mapping engine addresses this by moving all mapping behaviour
into declarative JSON **mapping files**. The engine itself knows nothing about
any specific form; adding or changing a mapping means editing a JSON file, not
code. The legacy mappers remain in place and untouched; the new system runs
alongside them until it is proven sound, at which point the legacy code can be
removed.

## Architecture

```
SQS submission message
        │
        ▼
submission-handler ──── MAPPING_ENGINE_MODE ────────────────────────────┐
        │                                                               │
        │ "legacy" (default)        "both"                    "rules"   │
        ▼                             ▼                          ▼      │
legacy mappers              legacy mappers + rules engine   rules engine
        │                             │                          │
        ▼                             ▼                          ▼
   transmit payload        transmit LEGACY payload        transmit payload
                           store BOTH payloads in the     to the destination
                           comparison store (file/log)    named in the mapping
```

Modules under `src/service/rule-mapping/`:

| Module                | Responsibility                                                                         |
| --------------------- | -------------------------------------------------------------------------------------- |
| `engine.js`           | Applies a mapping definition's rules to a submission message                           |
| `conditions.js`       | Evaluates rule conditions (`when`) against answers and repeaters                       |
| `values.js`           | Resolves value expressions (answers, lookups, arrays, segments, …)                     |
| `transforms.js`       | Named transform pipeline (`parseName`, `formatCoordinates`, …)                         |
| `registry.js`         | Loads, validates and indexes the mapping files by form id                              |
| `mapping-schema.js`   | Joi structural validation of mapping files                                             |
| `destinations.js`     | Resolves a mapping's `destination` to a sender (currently the University/CWT REST API) |
| `comparison-store.js` | Persists dual-run payload pairs (file or log backend)                                  |
| `gap-analysis.js`     | Cross-checks mapping + form definition + output schema (used by the CLI)               |
| `types.js`            | JSDoc type definitions for all of the above                                            |

## Engine modes

Set with `MAPPING_ENGINE_MODE` (config `mappingEngine.mode`):

| Mode               | Transmitted payload  | Notes                                                                                                                                                     |
| ------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy` (default) | Legacy mapper output | Identical to the original behaviour; the rules engine is never invoked                                                                                    |
| `both`             | Legacy mapper output | The rules engine also runs; both payloads are stored in the comparison store. A rules-engine failure is recorded and logged but never blocks transmission |
| `rules`            | Rules engine output  | The mapping file's `destination` decides where the payload is sent                                                                                        |

## How a submission is mapped (rules mode)

1. The registry finds the mapping whose `formIds` contains the submission's
   form id.
2. Rules are evaluated in file order. For each output `target` the first rule
   whose `when` condition passes (or that has no condition) **and** whose
   value resolves to a defined value wins; later rules for that target are
   skipped. This first-match-wins ordering is how the legacy `if/else if`
   chains are expressed declaratively.
3. A rule's value falls through (letting the next rule for the same target
   apply) when it resolves to `undefined` — e.g. an unanswered question with
   no `default`. Targets where every rule falls through are omitted from the
   payload (this is how optional outputs such as `SBI` are omitted).
4. The payload is sent to the destination named in the mapping file.

## Validation story

Three layers prove a mapping file is sound:

1. **Structural validation** — every mapping file is validated against a Joi
   schema when loaded (`mapping-schema.js`).
2. **Gap detection** — `npm run mapping:gaps` cross-checks the mapping against
   the form definition and the output schema (see
   [05-gap-detection.md](05-gap-detection.md)).
3. **Parity testing + dual-run** — `mapping-parity.test.js` proves the mapping
   files reproduce the legacy output for representative submissions, and
   dual-run mode (see [04-dual-run-comparison.md](04-dual-run-comparison.md))
   does the same with real production traffic.

## Rollout plan

1. Deploy with `MAPPING_ENGINE_MODE=both`. Production behaviour is unchanged
   (the legacy payload is transmitted) while every submission also exercises
   the rules engine and stores a comparison record.
2. Review comparison records until the mismatch rate is zero over a
   satisfactory period (see [06-known-differences.md](06-known-differences.md)
   for the few intentional differences).
3. Switch to `MAPPING_ENGINE_MODE=rules`.
4. Remove the legacy mappers and the `legacy`/`both` modes. The pure helper
   functions in `src/service/mappers/helpers.js` are shared with the engine's
   transforms and should be moved into `src/service/rule-mapping/` at that
   point.

## Future GUI

The mapping file format was designed with a future drag-and-drop rule builder
in mind:

- every rule is a flat `{ id, description, target, when, value }` record
- conditions and value expressions are discriminated unions (a `type`/
  `operator` field selects the variant), which map naturally onto form
  controls and block palettes
- question references carry both the machine id and the human-readable text
- shared logic lives in named `conditions`/`definitions`, which a GUI can
  present as reusable blocks
- the output schema enumerates the targets (and their types) a rule can map to
