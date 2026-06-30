# Overview

## Why

Mapping behaviour lives entirely in declarative JSON **mapping files** rather
than in code:

- the engine itself knows nothing about any specific form; adding or changing a
  mapping means editing a JSON file, not code
- the mapping is human-readable, so it can be reviewed, validated and diffed
- a specification/mapping document can be produced directly from the mapping
  files
- new forms are supported without touching the engine

## Architecture

```
SQS submission message
        │
        ▼
submission-handler ──► rules engine ──► transmit payload to the
                                        destination named in the mapping
```

Modules under `src/service/rule-mapping/`:

| Module              | Responsibility                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| `engine.js`         | Applies a mapping definition's rules to a submission message                           |
| `conditions.js`     | Evaluates rule conditions (`when`) against answers and repeaters                       |
| `values.js`         | Resolves value expressions (answers, lookups, arrays, segments, …)                     |
| `transforms.js`     | Named transform pipeline (`parseName`, `formatCoordinates`, …)                         |
| `helpers.js`        | Pure value-parsing primitives shared by the transforms and value resolver              |
| `registry.js`       | Loads, validates and indexes the mapping files by form id                              |
| `mapping-schema.js` | Joi structural validation of mapping files                                             |
| `destinations.js`   | Resolves a mapping's `destination` to a sender (currently the University/CWT REST API) |
| `gap-analysis.js`   | Cross-checks mapping + form definition + output schema (used by the CLI)               |
| `types.js`          | JSDoc type definitions for all of the above                                            |

## How a submission is mapped

1. The registry finds the mapping whose `formIds` contains the submission's
   form id.
2. Rules are evaluated in file order. For each output `target` the first rule
   whose `when` condition passes (or that has no condition) **and** whose
   value resolves to a defined value wins; later rules for that target are
   skipped. This first-match-wins ordering expresses `if/else if` chains
   declaratively.
3. A rule's value falls through (letting the next rule for the same target
   apply) when it resolves to `undefined` — e.g. an unanswered question with
   no `default`. Targets where every rule falls through are omitted from the
   payload (this is how optional outputs such as `SBI` are omitted).
4. The payload is sent to the destination named in the mapping file.

## Validation story

Two layers prove a mapping file is sound:

1. **Structural validation** — every mapping file is validated against a Joi
   schema when loaded (`mapping-schema.js`).
2. **Gap detection** — `npm run mapping:gaps` cross-checks the mapping against
   the form definition and the output schema (see
   [05-gap-detection.md](04-gap-detection.md)).

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
