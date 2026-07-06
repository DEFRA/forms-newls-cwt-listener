# Mapping file format

A mapping file is a JSON document named `*.mapping.json` in the `mappings/`
directory (configurable with `MAPPINGS_DIR`). One mapping file describes how
submissions of one or more forms are transformed into an output payload and
where that payload is sent.

## Top-level structure

```jsonc
{
  "id": "consent-to-cwt", // unique mapping identifier
  "name": "SSSI consent form to CWT submission",
  "version": 1, // mapping file format version
  "formIds": ["69a1a64c093ab56d4fa9f339"], // forms this mapping applies to
  "outputSchema": "./output-schemas/cwt-consent.schema.json", // relative path
  "destination": { "type": "rest", "name": "universityApi" },
  "conditions": {
    /* named conditions, referenced with { "ref": "name" } */
  },
  "definitions": {
    /* named value expressions, referenced with { "type": "ref", "name": "name" } */
  },
  "rules": [
    /* the mapping rules, evaluated in order */
  ]
}
```

- `formIds` — a form id may only be claimed by one mapping file; the registry
  refuses to start otherwise.
- `outputSchema` — see [03-output-schemas.md](03-output-schemas.md).
- `destination` — resolved by `destinations.js`. Currently only
  `{ "type": "rest", "name": "universityApi" }` exists (the CWT REST API,
  configured via `UNIVERSITY_API_URL`/`UNIVERSITY_API_KEY`). New destinations
  are registered in code once and then available to every mapping file.

## Rules

```jsonc
{
  "id": "agreement-reference.hls", // unique within the file
  "description": "HLS schemes use the HLS reference number", // optional
  "target": "agreement_reference", // output property produced
  "when": {
    /* optional condition */
  },
  "value": {
    /* value expression */
  }
}
```

**Evaluation order matters.** Rules are evaluated top to bottom. For each
`target` the first rule whose `when` passes (or that has no `when`) and whose
value resolves to a defined value wins. Express an `if / else if / else`
chain as consecutive rules for the same target, ending with an unconditional
fallback rule.

A rule **falls through** (the next rule for the target is tried) when its
value resolves to `undefined` — typically an unanswered question without a
`default`. If every rule for a target falls through, the property is omitted
from the payload (used for optional outputs such as `SBI`).

## Question and repeater references

Every reference carries the machine id **and** a human-readable `text`
placeholder:

```json
{
  "id": "rTreXu",
  "text": "What land management scheme does this notice relate to?"
}
```

The engine only uses `id`; `text` keeps the file readable and is checked
against the form definition by the gap-detection tool, which reports drift.
Repeater references use the repeater name from the form definition's
RepeatPageController page; the special id `"*"` means "the combined entries of
every repeater" .

## Conditions

Conditions appear in a rule's `when`, in `conditional` value expressions and
in the named `conditions` map.

### Question conditions

```jsonc
{
  "question": { "id": "rTreXu", "text": "…" },
  "operator": "equals", // see table
  "value": "Other schemes" // or "values": [...] for "in"
}
```

| Operator                       | True when the answer…                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `equals` / `notEquals`         | strictly equals / does not equal `value`                                                  |
| `in`                           | is one of `values`                                                                        |
| `startsWith`                   | is a string starting with `value`                                                         |
| `isAnswered` / `isNotAnswered` | is / is not present (empty string, empty array, null and undefined count as not answered) |
| `isTruthy` / `isFalsy`         | is truthy / falsy (for yes-no booleans; an unanswered question is falsy)                  |

### Repeater conditions

```jsonc
{
  "repeater": { "id": "aQYWxD", "text": "European site affected" },
  "operator": "hasAnswer", // hasEntries | isEmpty | hasAnswer
  "questionId": "IzQfir", // required for hasAnswer
  "questionText": "What is the name of the European site?"
}
```

### Combinators

```jsonc
{ "all": [ … ] }   // every nested condition is true
{ "any": [ … ] }   // at least one nested condition is true
{ "not": { … } }   // the nested condition is false
{ "ref": "isHraPath" } // a condition from the file's "conditions" map
```

## Value expressions

Every expression is an object with a `type`, plus two optional fields
available on all types:

- `transforms` — a pipeline of named transforms applied to the resolved value
  (see below)
- `default` — returned **instead** when the raw value resolves to empty
  (undefined, null, `""`, `[]`). Defaults are used as-is, untransformed.

### `literal`

```json
{ "type": "literal", "value": "S28E Consent" }
```

### `meta` — submission metadata

```json
{ "type": "meta", "path": "referenceNumber" }
```

Dot-path read relative to the message `meta` object.

### `answer` — a question answer

```jsonc
{
  "type": "answer",
  "question": { "id": "skdDtj", "text": "What's your email address?" },
  "default": ""
}
```

Inside an `arrayFromRepeater` item the current repeater entry is read first,
falling back to the main answers; set `"scope": "main"` or `"scope": "item"`
to force one source (e.g. consent's shared `JPohUD` coordinates are read with
`"scope": "main"` inside item rules).

### `output` — a previously computed output property

```json
{ "type": "output", "target": "detailed_work_type" }
```

Lets later rules reuse earlier results (e.g. `description` embeds
`detailed_work_type`). The referenced target's rules must appear earlier in
the file.

### `ref` — a named definition

```json
{ "type": "ref", "name": "sssiNames" }
```

Resolves the expression declared under that name in the file's `definitions`
map. Use for any value needed by more than one rule.

### `lookup` — map a value through a table

```jsonc
{
  "type": "lookup",
  "input": { "type": "answer", "question": { "id": "rTreXu", "text": "…" } },
  "match": "startsWith", // optional; default exact key match
  "table": {
    "A Higher Level Stewardship (HLS) agreement": "S28E Consent HLS extension"
  },
  "passthrough": true, // optional: unmapped values resolve to the input itself
  "required": true // optional: unmapped values throw instead of falling through
}
```

An empty input or an unmapped value (without `passthrough`/`required`)
resolves to `undefined`, so the rule falls through to the next rule for the
target.

### `firstAnswered` — coalesce

```jsonc
{
  "type": "firstAnswered",
  "values": [
    { "type": "answer", "question": { "id": "rkIHYS", "text": "…" } },
    { "type": "answer", "question": { "id": "VLUhzR", "text": "…" } }
  ],
  "transforms": ["toNumber"]
}
```

Resolves to the first non-empty nested value.

### `concat` — join parts into a string

```jsonc
{
  "type": "concat",
  "separator": " ",
  "skipEmpty": true, // default true
  "parts": [
    { "type": "answer", "question": { "id": "htlAAq", "text": "…" } },
    { "type": "answer", "question": { "id": "pPocjH", "text": "…" } }
  ]
}
```

Parts that resolve to arrays are flattened into the part list before joining.
Always resolves to a string (possibly `""`), so a `concat` rule never falls
through.

### `conditional` — switch inside a value

```jsonc
{
  "type": "conditional",
  "cases": [{ "when": { … }, "value": { … } }],
  "else": { … } // optional
}
```

Prefer multiple rules per target for top-level branching; use `conditional`
inside `definitions` and array items.

### `collect` — gather one answer across repeater entries

```jsonc
{
  "type": "collect",
  "repeater": {
    "id": "iTBHrY",
    "text": "Operations requiring Natural England consent"
  },
  "question": {
    "id": "hqsZMS",
    "text": "Which activity do you plan to carry out?"
  },
  "unique": true, // optional de-duplication
  "transforms": ["formatCoordinates", { "name": "join", "separator": ";" }]
}
```

Resolves to an array (empty answers are skipped); add a `join` transform to
produce a string.

### `object` and `array` — fixed structures

```jsonc
{
  "type": "array",
  "items": [
    {
      "type": "object",
      "properties": {
        "SSSI_id": {
          "type": "answer",
          "question": { "id": "hozdvW", "text": "…" },
          "transforms": ["parseSssiId"]
        },
        "coordinates": { "type": "literal", "value": "" }
      }
    }
  ]
}
```

Used for single-item arrays (e.g. the advice damage-report `SSSI_info`).
Object properties resolving to `undefined` are omitted from the item.

### `arrayFromRepeater` — one item per entry or group

```jsonc
{
  "type": "arrayFromRepeater",
  "repeater": { "id": "cwZgSE", "text": "…" },
  "filterAnswered": "rWrBOK", // skip entries missing this answer
  "groupBy": { "id": "rWrBOK", "text": "…" }, // optional grouping
  "item": {
    "SSSI_id": {
      "type": "answer",
      "question": { "id": "rWrBOK", "text": "…" },
      "transforms": ["parseSssiId"]
    },
    "coordinates": {
      "type": "answer",
      "question": { "id": "gjWdrc", "text": "…" },
      "transforms": ["formatCoordinates"],
      "aggregate": { "join": ";" }, // how grouped entries combine
      "default": ""
    }
  }
}
```

Without `groupBy`, each (filtered) entry produces one item. With `groupBy`,
entries sharing the grouped answer produce one item; each item property
declares how the group combines via `aggregate`: `"first"` (default) or
`{ "join": "<separator>" }`.

### `joinSegments` — assemble headed descriptions

```jsonc
{
  "type": "joinSegments",
  "separator": " - ",
  "maxLength": 254, // optional length budget
  "fallback": "S28E Consent", // used when every segment is empty
  "segments": [
    { "value": { "type": "ref", "name": "primarySegment" } },
    { "value": { "type": "ref", "name": "sssiNames" }, "overflow": "fitNames" }
  ]
}
```

Empty segments are dropped. Without `maxLength` segments are joined in full
(array segments join with `", "`). With `maxLength`, segments marked
`"overflow": "fitNames"` are fitted into the remaining space using the
`First Name, Second Name (+N more)` convention; if the joined result still
exceeds the budget it is truncated with `...`. Used for `description`
(unlimited) and `email_header` (254 characters).

## Transforms

A transform is either a name or an object with a `name` and options. Scalar
transforms apply element-wise to arrays.

| Transform                                                    | Effect                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `parseName`                                                  | `"11004---Arun Valley"` → `"Arun Valley"`                             |
| `parseSssiId`                                                | `"1001001---Pewsey Downs"` → `1001001` (throws when unparsable)       |
| `parseEuroSiteId`                                            | `"7---Arun Valley Ramsar"` → `7` (throws without the `---` separator) |
| `formatCoordinates`                                          | `{ easting, northing }` → `"easting,northing"`                        |
| `toNumber`                                                   | `Number(value)`                                                       |
| `trim`                                                       | trims whitespace                                                      |
| `{ "name": "truncate", "maxLength": 255, "ellipsis": true }` | truncates, appending `...` unless `ellipsis` is `false`               |
| `{ "name": "join", "separator": ";" }`                       | joins an array into a string                                          |
| `{ "name": "fitNames", "maxLength": 100 }`                   | fits names into a budget with `(+N more)`                             |
| `{ "name": "first" }`                                        | first element of an array                                             |

The parsing primitives live in `src/service/rule-mapping/helpers.js` and are
shared by the transform pipeline and the value resolver.

## Worked example

"If the scheme question (`rTreXu`) is an HLS agreement, map the output field
`agreement_reference` to the HLS reference answer (`OFiizI`), defaulting to an
empty string":

```json
{
  "id": "agreement-reference.hls",
  "target": "agreement_reference",
  "when": {
    "question": {
      "id": "rTreXu",
      "text": "What land management scheme does this notice relate to?"
    },
    "operator": "startsWith",
    "value": "A Higher Level Stewardship (HLS) agreement"
  },
  "value": {
    "type": "answer",
    "question": {
      "id": "OFiizI",
      "text": "What's your Higher Level Stewardship agreement reference number?"
    },
    "default": ""
  }
}
```
