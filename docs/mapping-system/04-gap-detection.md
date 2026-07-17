# Gap detection

The gap-detection tool cross-checks three artefacts:

1. the **mapping file** (`mappings/*.mapping.json`)
2. the **form definition** it maps (`form-definitions/*.json`)
3. the **output schema** it must satisfy (resolved from the mapping file's
   `outputSchema` property)

and reports where the required output structure may not be produced for some
combination of answers, or where the mapping has drifted from the form.

## Usage

```bash
# One mapping
npm run mapping:gaps -- --mapping mappings/advice-cwt.mapping.json --form form-definitions/advice.json

# All three mappings
npm run mapping:gaps:all

# Treat warnings as failures (e.g. in CI)
npm run mapping:gaps -- --mapping … --form … --strict
```

Exit codes: `0` no errors (warnings allowed unless `--strict`), `1` errors
found (or warnings with `--strict`), `2` usage error.

The analysis logic lives in `src/service/rule-mapping/gap-analysis.js` so it
can also be reused programmatically (e.g. by a future mapping GUI or a CI
check).

## Checks

| Code                          | Severity | Meaning                                                                                                                                                                           |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unknown-question`            | error    | The mapping references a question id that does not exist anywhere in the form definition                                                                                          |
| `unknown-repeater`            | error    | The mapping references a repeater id that is not a RepeatPageController page in the form                                                                                          |
| `question-text-drift`         | warning  | The mapping's human-readable `text` placeholder no longer matches the question title in the form — the form may have changed since the mapping was written                        |
| `unmatchable-condition-value` | warning  | A condition compares a list-based question (radios, autocomplete, …) with a value that is not one of its selectable options, so it can never match                                |
| `stale-lookup-key`            | warning  | A lookup table key matches no selectable option of its input question                                                                                                             |
| `unmapped-answer-option`      | warning  | A selectable answer option is not covered by a lookup table (and the lookup has no `passthrough`), so submissions choosing it fall through                                        |
| `missing-target`              | error    | A required output property has no rules at all                                                                                                                                    |
| `expansion-target-only`       | error    | A required output property is only produced by the mapping's `expand` targets — so it is missing whenever the expanded repeater has no entries and the base payload is sent as-is |
| `no-guaranteed-rule`          | warning  | A required output property has only conditional rules, or an unconditional rule whose value can resolve to nothing — the property may be omitted for some answer combinations     |
| `missing-item-property`       | error    | An array-building rule does not produce a required item property declared by the output schema                                                                                    |
| `const-mismatch`              | error    | An unconditional literal rule sets a different value than the output schema's declared `const`                                                                                    |

## How required-output coverage is decided

A required property is considered guaranteed when at least one of its rules
has **no condition** and a **total** value — an expression that always
resolves to something:

- `literal`, `meta`, `concat`, `object`, `array`, `arrayFromRepeater`,
  `collect`, `joinSegments` are always total
- `answer`, `firstAnswered` and `lookup` are total only with a `default`
  (or `passthrough` semantics)
- `conditional` is total only when its `else` is total
- `ref` inherits totality from its definition

This is a conservative static check: it cannot follow the form's page
branching, so a set of conditional rules that genuinely covers every form
path is still reported as `no-guaranteed-rule`. The fix is normally to end
each target's rules with an unconditional fallback rule, which is also the
clearest way to read the mapping.

An `expand` target does **not** count towards coverage. Expansion overlays only
exist when the expanded repeater has entries; with none, the base payload is
sent as it stands, so a property produced solely by the expansion would simply
be absent. A required expansion target therefore also needs an ordinary
fallback rule, and gap detection reports `expansion-target-only` when it has
none. The tool checks the expansion's question, repeater and `text` references
too, so drift there is caught like anywhere else.

## Interpreting the current warnings

Running the tool against the advice mapping reports several
`unmatchable-condition-value` warnings (e.g. comparing `PBmxNM` with
`"Government Agency"` when the form option is `"Government agency"`). These are
defensive comparisons that check both spellings; the warnings document that one
spelling can never occur with the current form definition and can be removed
once the form definition is confirmed stable.
