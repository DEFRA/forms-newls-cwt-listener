# Output schemas

Every mapping file points at an output schema (its `outputSchema` property, a
path relative to the mapping file). The schema declares the structure the
mapping must produce, with each property marked `required` or optional. It is
the contract used by the gap-detection tool and is deliberately simple enough
to read as the specification of the target API payload.

Location: `mappings/output-schemas/*.schema.json`.

## Format

```jsonc
{
  "id": "cwt-consent",
  "description": "Output structure for consent form submissions sent to the CWT API",
  "properties": {
    "form_type": {
      "type": "string",
      "required": true,
      "const": "consent", // fixed expected value, when constant
      "description": "Constant form type identifier"
    },
    "SBI": {
      "type": "number",
      "required": false, // optional: may be omitted from the payload
      "description": "Single Business Identifier; omitted when not provided"
    },
    "SSSI_info": {
      "type": "array",
      "required": true,
      "items": {
        // schema of each array item
        "properties": {
          "SSSI_id": { "type": "number", "required": true },
          "coordinates": { "type": "string", "required": true },
          "ornec": { "type": "string", "required": true }
        }
      }
    }
  }
}
```

Property fields:

| Field         | Meaning                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `type`        | `string`, `number`, `array` or `object`                                                              |
| `required`    | `true`: the payload must contain this property. `false`: it may be omitted                           |
| `const`       | The property always has this exact value; the gap tool checks unconditional literal rules against it |
| `description` | Human-readable documentation                                                                         |
| `items`       | For arrays: a nested schema (`properties`) for each item                                             |
| `properties`  | For objects: nested property schemas                                                                 |

## How the gap tool uses required/optional

- A **required** property with no rules targeting it is an **error**.
- A required property whose rules are all conditional, or whose unconditional
  rule can fall through (an unanswered question without a `default`), is a
  **warning** — the property may be missing for some answer combinations.
- A required property of an **array item** that an array-building rule does
  not produce is an **error**.
- An **optional** property (e.g. `SBI`, which the target API allows to be
  absent) produces no findings when its rules can fall through — that is the
  intended way to omit it.

See [05-gap-detection.md](04-gap-detection.md) for the full list of checks.
