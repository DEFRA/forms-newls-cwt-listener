# Form mapping

Each supported form type is transformed into a structured output payload for the
downstream API by the **rule-based mapping engine**. Mapping behaviour is
declared in JSON mapping files rather than in code, so adding or changing a
mapping means editing a file, not writing a mapper.

See the [rule-based mapping engine documentation](prototype/README.md) for the
full reference.

## How routing works

The submission handler in [src/service/submission-handler.js](../src/service/submission-handler.js)
loads the mapping files from the `mappings/` directory and selects the mapping
whose `formIds` list contains the `formId` from the message metadata:

| Form type | Mapping file                                                              |
| --------- | ------------------------------------------------------------------------- |
| Advice    | [mappings/advice-cwt.mapping.json](../mappings/advice-cwt.mapping.json)   |
| Assent    | [mappings/assent-cwt.mapping.json](../mappings/assent-cwt.mapping.json)   |
| Consent   | [mappings/consent-cwt.mapping.json](../mappings/consent-cwt.mapping.json) |

If a submission's form ID does not appear in any mapping file, the ID is logged
as info, but otherwise the form is ignored and deleted from the queue.

## Per-form mapping reference

The detailed field-by-field mapping for each form is documented alongside its
mapping file:

- **Advice** — [field mapping matrix](advice/03-field-mapping-matrix.md)
- **Assent** — [field mapping matrix](assent/03-field-mapping-matrix.md)
- **Consent** — [field mapping matrix](consent/03-field-mapping-matrix.md)

Each mapping pairs with an output schema in
[mappings/output-schemas/](../mappings/output-schemas/) that declares the
required and optional output fields. The `npm run mapping:gaps` tool
cross-checks a mapping against its form definition and output schema (see
[gap detection](prototype/04-gap-detection.md)).

## Adding a new form

To add support for a new form type:

1. Add the form definition JSON to `form-definitions/` for reference.
2. Add an output schema to `mappings/output-schemas/`.
3. Create a `*.mapping.json` file in `mappings/` that lists the form's id in
   `formIds`, names its `destination`, and declares the mapping rules (see the
   [mapping file format](prototype/02-mapping-file-format.md)).
4. Run `npm run mapping:gaps` to confirm the mapping covers the form.

No engine code changes are required.
