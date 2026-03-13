# Assent form field mapping matrix

This document maps each output field in the CWT JSON to its source form field(s), broken down by which path through the form was taken.

Source: [src/service/mappers/assent-form-mapper.js](../../src/service/mappers/assent-form-mapper.js)

## Output field reference

| Output field                            | Type             | Always present?    |
| --------------------------------------- | ---------------- | ------------------ |
| `form_type`                             | `"assent"`       | Yes                |
| `broad_work_type`                       | `"S28H Assent"`  | Yes                |
| `detailed_work_type`                    | string           | Yes                |
| `description`                           | string           | Yes                |
| `consulting_body_type`                  | string           | Yes                |
| `consulting_body`                       | string           | Yes                |
| `customer_name`                         | string           | Yes                |
| `customer_email_address`                | string           | Yes                |
| `agreement_reference`                   | string           | Yes                |
| `is_contractor_working_for_public_body` | `"Yes"` / `"No"` | Yes                |
| `public_body_type`                      | string           | Yes                |
| `public_body`                           | string           | Yes                |
| `is_there_a_european_site`              | `"Yes"` / `"No"` | Yes                |
| `SSSI_info`                             | array            | Yes (may be empty) |
| `euro_site_info`                        | array            | Yes (may be empty) |

---

## form_type

Always `"assent"` (hardcoded).

## broad_work_type

Always `"S28H Assent"` (hardcoded).

## detailed_work_type

Determined by field rTreXu ("What land management scheme does this notice relate to?"). Uses `startsWith` matching for MTA (form text may be longer).

| Scheme value (rTreXu)                                           | Output value                    |
| --------------------------------------------------------------- | ------------------------------- |
| `A Countryside Stewardship Higher Tier (CSHT) agreement`        | `S28H Assent CS HT`             |
| `A Countryside Stewardship Mid Tier (CSMT) agreement extension` | `S28H Assent CS MT`             |
| `A Countryside Stewardship Capital Grants agreement`            | `S28H Assent CS Capital Grants` |
| `A Higher Level Stewardship (HLS) agreement`                    | `S28H Assent HLS extension`     |
| `A Sustainable Farming Incentive (SFI) agreement`               | `S28H Assent SFI`               |
| `A Minor and Temporary Adjustments (MTA)`                       | `S28H Assent MTA`               |
| `Other schemes`                                                 | `S28H Assent`                   |
| (not set)                                                       | `S28H Assent`                   |

## description

Built from activity entries in repeaters. Single SSSI path takes precedence over multiple SSSI path.

| Path                  | Repeater                                                             | Activity field                                         | Format                       |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------- |
| Single SSSI           | gzSkgC ("Activities requiring Natural England's assent")             | lGsnXi ("What activity is planned to be carried out?") | Activity values comma-joined |
| Multiple SSSI (ORNEC) | QxIzSB ("Site name and activities requiring Natural England assent") | iNDqRN ("What activity is planned to be carried out?") | Activity values comma-joined |
| (no activities)       | -                                                                    | -                                                      | Empty string                 |

## consulting_body_type

Mapped from vUHwan ("Which category best describes the public body you're representing?") via `publicBodyCategoryMap`.

| vUHwan value               | Output value               |
| -------------------------- | -------------------------- |
| `Consultant`               | `Consultant`               |
| `Government agency`        | `Government Agency`        |
| `Harbour authority`        | `Harbour authority`        |
| `Landowner`                | `Landowner`                |
| `Land occupier`            | `Land occupier`            |
| `Local planning authority` | `Local Planning Authority` |
| `Utility provider`         | `Utility Provider`         |
| `Other`                    | `Other`                    |

**Note:** The mapping changes capitalisation for Government Agency, Local Planning Authority, and Utility Provider. This field is always populated — the question is shown on both public body and contractor paths (no condition in the form definition).

## consulting_body

Resolved conditionally from multiple fields based on customer type and public body category.

| Condition                                                                                                                                               | Source field                                                  | Output value                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------- |
| KTObNK ("What type of customer are you?") = `Somebody working on behalf of a public body`, ueDuNl ("What is the name of your organisation?") != `Other` | ueDuNl ("What is the name of your organisation?")             | Selected organisation name    |
| KTObNK ("What type of customer are you?") = `Somebody working on behalf of a public body`, ueDuNl ("What is the name of your organisation?") = `Other`  | Xszriq ("Other organisation name")                            | Free text organisation name   |
| vUHwan ("Which category best describes the public body you're representing?") = `Local planning authority`                                              | XAZlxH ("Which local authority are you representing?")        | Selected local authority name |
| cfPoiN ("Which public body are you representing?") != `Other`                                                                                           | cfPoiN ("Which public body are you representing?")            | Selected public body name     |
| cfPoiN ("Which public body are you representing?") = `Other`                                                                                            | FyLHmN ("Which public body are you representing?", free text) | Free text public body name    |

## customer_name

Concatenation of htlAAq ("What is your first name?") and pPocjH ("What is your last name?"), joined with a space and trimmed.

## customer_email_address

Always from field skdDtj ("What is your email address?").

## agreement_reference

Determined by the land management scheme selection (rTreXu).

| Scheme (rTreXu)                 | Source field                                                                       | Output value               |
| ------------------------------- | ---------------------------------------------------------------------------------- | -------------------------- |
| CSHT / CSMT / CS Capital Grants | WZJDQG ("What's your Countryside Stewardship Scheme agreement reference number?")  | Free text reference number |
| HLS agreement                   | OFiizI ("What is your Higher Level Stewardship (HLS) agreement reference number?") | Free text reference number |
| SFI agreement                   | niVAkO ("What's your Sustainable Farming Incentive (SFI) agreement number?")       | Free text reference number |
| Other / MTA / not set           | -                                                                                  | Empty string               |

## is_contractor_working_for_public_body

| Condition                                                                                 | Output value |
| ----------------------------------------------------------------------------------------- | ------------ |
| KTObNK ("What type of customer are you?") = `Somebody working on behalf of a public body` | `Yes`        |
| KTObNK ("What type of customer are you?") = any other value                               | `No`         |

## public_body_type

Same mapping as `consulting_body_type` — mapped from vUHwan ("Which category best describes the public body you're representing?") via `publicBodyCategoryMap`. Always populated since vUHwan is shown on all paths.

## public_body

Resolved from vUHwan-dependent fields.

| Condition                                                                                                  | Source field                                                  | Output value                  |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------- |
| vUHwan ("Which category best describes the public body you're representing?") = `Local planning authority` | XAZlxH ("Which local authority are you representing?")        | Selected local authority name |
| vUHwan ("Which category best describes the public body you're representing?") = `Other`                    | FyLHmN ("Which public body are you representing?", free text) | Free text public body name    |
| vUHwan ("Which category best describes the public body you're representing?") = any other value            | cfPoiN ("Which public body are you representing?")            | Selected public body name     |

## is_there_a_european_site

| Condition                                                                            | Output value |
| ------------------------------------------------------------------------------------ | ------------ |
| XydYUD ("Could the planned activities affect a European site?") = `true`             | `Yes`        |
| XydYUD ("Could the planned activities affect a European site?") = `false` or not set | `No`         |

## SSSI_info

Array of `{ SSSI_id, coordinates }` objects. The path is determined by ASataH ("Are you planning to carry out activities on more than one SSSI?").

### Single SSSI path (ASataH = false or not set)

| Field         | Source                                                                                                                          | Description                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `SSSI_id`     | gVlMxz ("What is the name of the SSSI where you plan to carry out activities?") from main                                       | SSSI name                                                                 |
| `coordinates` | uqfCOY ("Where do you plan to carry out this activity?") from repeater gzSkgC ("Activities requiring Natural England's assent") | Formatted as `"<easting>,<northing>"`, multiple entries joined with `";"` |

### Multiple SSSI path - scheme (ASataH = true, repeater hhGvmX)

| Field         | Source                                                                                                                                      | Description         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `SSSI_id`     | flbYHq ("What is the name of the SSSI where activities are planned?") from repeater hhGvmX ("Sites where you plan to carry out activities") | SSSI name           |
| `coordinates` | -                                                                                                                                           | Always empty string |

### Multiple SSSI path - ORNEC (ASataH = true, repeater QxIzSB)

Only used when hhGvmX repeater has no entries.

| Field         | Source                                                                                                                                                                | Description                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SSSI_id`     | wRGnMW ("What is the name of the SSSI where you plan to carry out this activity?") from repeater QxIzSB ("Site name and activities requiring Natural England assent") | SSSI name (grouped by unique name)                                                      |
| `coordinates` | KnBNzJ ("Where on the SSSI do you plan to carry out this activity?") from repeater QxIzSB                                                                             | Formatted as `"<easting>,<northing>"`, multiple entries for same SSSI joined with `";"` |

## euro_site_info

Array of `{ european_site_id, european_site_coordinates }` objects from repeater aQYWxD ("European site affected").

| Field                       | Source                                            | Description              |
| --------------------------- | ------------------------------------------------- | ------------------------ |
| `european_site_id`          | IzQfir ("What is the name of the European site?") | European site identifier |
| `european_site_coordinates` | -                                                 | Always empty string      |

Only populated when XydYUD ("Could the planned activities affect a European site?") is true and the repeater has entries.

---

## Empty value analysis

This section identifies all scenarios where output fields sent to the University of Southampton API contain empty or missing values.

### Fields that are always populated

| Field                                   | Guarantee                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `form_type`                             | Hardcoded `"assent"`                                                                                          |
| `broad_work_type`                       | Hardcoded `"S28H Assent"`                                                                                     |
| `detailed_work_type`                    | Always resolves (defaults to `"S28H Assent"`)                                                                 |
| `consulting_body`                       | At least one source field (ueDuNl, XAZlxH, cfPoiN, or FyLHmN) is collected as a mandatory field on every path |
| `customer_name`                         | htlAAq ("What is your first name?") and pPocjH ("What is your last name?") are mandatory fields on all paths  |
| `customer_email_address`                | skdDtj ("What is your email address?") is a mandatory field on all paths                                      |
| `consulting_body_type`                  | vUHwan ("Which category best describes the public body?") is shown on all paths (no condition)                |
| `public_body_type`                      | Same as `consulting_body_type`                                                                                |
| `public_body`                           | Resolved from vUHwan-dependent fields (XAZlxH, cfPoiN, or FyLHmN) — at least one is mandatory on every path   |
| `is_contractor_working_for_public_body` | Always `"Yes"` or `"No"`                                                                                      |
| `is_there_a_european_site`              | Always `"Yes"` or `"No"`                                                                                      |

### Fields that may be empty strings

| Field                 | Condition producing empty value                                                                                                                                                       | Realistic scenario?                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`         | Neither gzSkgC ("Activities requiring Natural England's assent") nor QxIzSB ("Site name and activities requiring Natural England assent") repeaters have entries with activity fields | **Expected** — the scheme multi-SSSI path via hhGvmX ("Sites where you plan to carry out activities") has no activity fields. See Example 3 where `description` = `""` |
| `agreement_reference` | Scheme is MTA, Other, or not set — no agreement reference field is shown                                                                                                              | **Expected** — MTA and Other schemes don't require references. See Examples 4, 5                                                                                       |

### Fields that may be empty arrays

| Field            | Condition producing empty array                                                                                                                               | Realistic scenario?                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `SSSI_info`      | Single SSSI path with gVlMxz ("What is the name of the SSSI where you plan to carry out activities?") not set, or multiple SSSI path with no repeater entries | Unlikely — SSSI selection is a required step on all paths                            |
| `euro_site_info` | XydYUD ("Could the planned activities affect a European site?") = false or not set, or no European site entries in repeater aQYWxD ("European site affected") | **Expected** — many submissions don't affect European sites. See Examples 1, 3, 4, 5 |

### Key empty value scenarios by form path

| Path                                              | `description` | `consulting_body_type` | `public_body_type` | `public_body` | `agreement_reference` | Notes                                                                 |
| ------------------------------------------------- | ------------- | ---------------------- | ------------------ | ------------- | --------------------- | --------------------------------------------------------------------- |
| Public body, CS scheme, single SSSI               | Activities    | Body category          | Body category      | Body name     | CS reference          | All fields populated                                                  |
| Public body, HLS, multiple SSSIs (scheme)         | `""` empty    | Body category          | Body category      | Body name     | HLS reference         | **description empty** — scheme multi-SSSI path has no activity fields |
| Contractor, SFI, single SSSI                      | Activities    | Body category          | Body category      | Body name     | SFI reference         | Only **description** may vary                                         |
| Public body, MTA, single SSSI                     | Activities    | Body category          | Body category      | Body name     | `""` empty            | **agreement_reference empty** — MTA has no reference field            |
| Contractor, Other scheme, multiple SSSIs (scheme) | `""` empty    | Body category          | Body category      | Body name     | `""` empty            | **description and agreement_reference empty**                         |
| Public body, no scheme, multiple SSSIs (ORNEC)    | Activities    | Body category          | Body category      | Body name     | `""` empty            | Only agreement_reference is empty                                     |
