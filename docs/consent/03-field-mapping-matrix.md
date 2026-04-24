# Consent form field mapping matrix

This document maps each output field in the CWT JSON to its source form field(s), broken down by which path through the form was taken.

Source: [src/service/mappers/consent-form-mapper.js](../../src/service/mappers/consent-form-mapper.js)

## Output field reference

| Output field             | Type             | Always present?            |
| ------------------------ | ---------------- | -------------------------- |
| `form_type`              | `"consent"`      | Yes                        |
| `DF_reference_number`    | string           | Yes                        |
| `broad_work_type`        | `"S28E Consent"` | Yes                        |
| `detailed_work_type`     | string           | Yes                        |
| `description`            | string           | Yes                        |
| `consulting_body_type`   | string           | Yes                        |
| `customer_name`          | string           | Yes                        |
| `customer_email_address` | string           | Yes                        |
| `SBI`                    | number           | When SBI field has a value |
| `agreement_reference`    | string           | Yes                        |
| `email_header`           | string           | Yes                        |
| `SSSI_info`              | array            | Yes (may be empty)         |

---

## form_type

Always `"consent"` (hardcoded).

## broad_work_type

Always `"S28E Consent"` (hardcoded).

## detailed_work_type

Determined by field rTreXu ("What land management scheme does this notice relate to?"). Uses `startsWith` matching for MTA (form text may be longer).

| Scheme value (rTreXu)                                           | Output value                     |
| --------------------------------------------------------------- | -------------------------------- |
| `A Countryside Stewardship Higher Tier (CSHT) agreement`        | `S28E Consent CS HT`             |
| `A Countryside Stewardship Mid Tier (CSMT) agreement extension` | `S28E Consent CS MT`             |
| `A Countryside Stewardship Capital Grants agreement`            | `S28E Consent CS Capital Grants` |
| `A Higher Level Stewardship (HLS) agreement`                    | `S28E Consent HLS extension`     |
| `A Sustainable Farming Incentive (SFI) agreement`               | `S28E Consent SFI`               |
| `A Minor and Temporary Adjustments (MTA)`                       | `S28E Consent MTA`               |
| `Other schemes`                                                 | `S28E Consent`                   |
| (not set)                                                       | `S28E Consent`                   |

## description

Built from up to two segments joined with `-` (space-dash-space): the primary segment (scheme and/or activities) and SSSI names. Falls back to `"S28E Consent"` when no segments are available.

Format: `"{scheme and/or activities} - {SSSI names}"`

### Primary segment (scheme and/or activities)

Scheme and activities are independent: both are included when both are present, joined with `, ` (scheme first, then the activities). Single SSSI path takes precedence over multiple SSSI path when collecting activities.

| Source                       | Prerequisites                                                                                    | Contribution                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- |
| Scheme                       | rTreXu ("What land management scheme does this notice relate to?") selected                      | Full scheme text                    |
| Single SSSI ORNEC activities | Repeater iTBHrY ("Operations requiring Natural England consent"), hqsZMS ("Which activity?")     | Unique activity values comma-joined |
| Multi SSSI ORNEC activities  | Otherwise repeater cwZgSE ("Site name and operations requiring Natural England consent"), BscJLV | Unique activity values comma-joined |
| Fallback                     | No scheme and no activities                                                                      | Empty                               |

### SSSI names segment

Collected from: hozdvW (single SSSI) > cwZgSE repeater [rWrBOK] (multiple ORNEC, unique) > gWZwzI repeater [gVlMxz] (multiple scheme). Parsed from "ID---Name" format and comma-joined.

## consulting_body_type

Mapped from KTObNK ("What type of customer are you?") via `customerTypeMap`.

| KTObNK value                                                                              | Output value    |
| ----------------------------------------------------------------------------------------- | --------------- |
| `An owner of land within a SSSI`                                                          | `Landowner`     |
| `An occupier of land within a SSSI`                                                       | `Land occupier` |
| `Someone with permission to work on behalf of an owner or occupier of land within a SSSI` | `Consultant`    |
| `Somebody else`                                                                           | `Other`         |
| (not set)                                                                                 | Empty string    |

**Note:** The consent form does not have `consulting_body` or `is_contractor_working_for_public_body` fields in its output, unlike the advice and assent forms.

## customer_name

Concatenation of htlAAq ("What is your first name?") and pPocjH ("What is your last name?"), joined with a space and trimmed.

## customer_email_address

Always from field skdDtj ("What's your email address?").

## SBI

Single Business Identifier, converted to a number. Uses rkIHYS ("What is the Single Business Identifier (SBI) number of where the activities will take place?", mandatory SBI page, page 15) as primary, falling back to VLUhzR ("Single business identifier (SBI)", landowner/occupier address details page, page 39).

| Condition                                                                                                       | Source field | Output value     |
| --------------------------------------------------------------------------------------------------------------- | ------------ | ---------------- |
| rkIHYS ("What is the Single Business Identifier (SBI) number of where the activities will take place?") present | rkIHYS       | `Number(rkIHYS)` |
| VLUhzR ("Single business identifier (SBI)", address details page) present                                       | VLUhzR       | `Number(VLUhzR)` |
| Neither present                                                                                                 | -            | `undefined`      |

## agreement_reference

Determined by the land management scheme selection (rTreXu), with a fallback to the "other permission" path.

| Condition                                                                                  | Source field                                                                | Output value               |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------- |
| rTreXu starts with CSHT / CSMT / CS Capital Grants                                         | WZJDQG ("What's your Countryside Stewardship agreement reference number?")  | Free text reference number |
| rTreXu starts with HLS agreement                                                           | OFiizI ("What's your Higher Level Stewardship agreement reference number?") | Free text reference number |
| rTreXu starts with SFI agreement                                                           | niVAkO ("What's your Sustainable Farming Incentive agreement number?")      | Free text reference number |
| rTreXu not present or other scheme, VacBun ("What is the name of the permission?") present | VacBun ("What is the name of the permission?")                              | Permission name            |
| None of the above                                                                          | -                                                                           | Empty string               |

## email_header

Uses the same segments as `description` (scheme and/or activities, plus SSSI names) but truncated to 255 characters. Falls back to `"S28E Consent"` when no segments are available.

Format: `"{scheme and/or activities} - {SSSI names}"` (truncated to 255 characters using the `fitNames` helper, which progressively drops names and appends "(+N more)" when truncation is needed).

| Condition                                             | Output value                                               |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| Scheme present and activities present                 | Scheme text, then activities comma-joined, plus SSSI names |
| Activities present (from iTBHrY or cwZgSE), no scheme | All unique activities comma-joined, plus SSSI names        |
| No activities, scheme present (rTreXu)                | Full scheme text, plus SSSI names                          |
| No activities, no scheme, SSSI names present          | SSSI names only                                            |
| No activities, no scheme, no SSSI names               | `"S28E Consent"`                                           |

## SSSI_info

Array of `{ SSSI_id, coordinates, ornec }` objects. The path is determined by lmqMaY ("Are you planning to carry out activities on more than one SSSI?").

**Note:** The consent form includes an `ornec` field in each SSSI_info entry, unlike the advice form.

### Single SSSI path (lmqMaY = false or not set)

SSSI ID from hozdvW ("What is the name of the SSSI where you plan to carry out activities?") in main. All SSSI_id values are parsed as integers from the string form field value. An error is thrown if a non-empty value cannot be parsed.

#### Non-scheme path (repeater iTBHrY present)

| Field         | Source                                                                                                                         | Description                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?")                                                | Parsed as integer from string value                                       |
| `coordinates` | QKdhfh ("Where do you plan to carry out this activity?") from repeater iTBHrY ("Operations requiring Natural England consent") | Formatted as `"<easting>,<northing>"`, multiple entries joined with `";"` |
| `ornec`       | hqsZMS ("Which activity do you plan to carry out?") from repeater iTBHrY                                                       | Activity names comma-joined                                               |

#### Scheme path (no repeater, JPohUD present)

| Field         | Source                                                                          | Description                           |
| ------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") | Parsed as integer from string value   |
| `coordinates` | JPohUD ("Where are the activities taking place?") from main                     | Formatted as `"<easting>,<northing>"` |
| `ornec`       | -                                                                               | Empty string                          |

#### Fallback (no repeater, no JPohUD)

| Field         | Source                                                                          | Description                         |
| ------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") | Parsed as integer from string value |
| `coordinates` | -                                                                               | Empty string                        |
| `ornec`       | -                                                                               | Empty string                        |

### Multiple SSSI path (lmqMaY = true)

#### Non-scheme path (repeater cwZgSE present)

| Field         | Source                                                                                                                                                                 | Description                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SSSI_id`     | rWrBOK ("What is the name of the SSSI where you plan to carry out this activity?") from repeater cwZgSE ("Site name and operations requiring Natural England consent") | Parsed as integer from string value (grouped by unique value)                           |
| `coordinates` | gjWdrc ("Where on the SSSI do you plan to carry out this activity?") from repeater cwZgSE                                                                              | Formatted as `"<easting>,<northing>"`, multiple entries for same SSSI joined with `";"` |
| `ornec`       | BscJLV ("Which activity do you plan to carry out?") from repeater cwZgSE                                                                                               | Activity names comma-joined per SSSI                                                    |

#### Scheme path (repeater gWZwzI)

| Field         | Source                                                                                                                                      | Description                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SSSI_id`     | gVlMxz ("What is the name of the SSSI where activities are planned?") from repeater gWZwzI ("Sites where you plan to carry out activities") | Parsed as integer from string value                                           |
| `coordinates` | JPohUD ("Where are the activities taking place?") from main                                                                                 | Formatted as `"<easting>,<northing>"`, shared across all SSSIs on scheme path |
| `ornec`       | -                                                                                                                                           | Empty string                                                                  |

---

## Empty value analysis

This section identifies all scenarios where output fields sent to the University of Southampton API contain empty or missing values.

### Fields that are always populated

| Field                    | Guarantee                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `form_type`              | Hardcoded `"consent"`                                                                                        |
| `broad_work_type`        | Hardcoded `"S28E Consent"`                                                                                   |
| `detailed_work_type`     | Always resolves (defaults to `"S28E Consent"`)                                                               |
| `description`            | Always resolves — contains activities/scheme and SSSI names when available, falls back to `"S28E Consent"`   |
| `consulting_body_type`   | KTObNK ("What type of customer are you?") is the first mandatory question                                    |
| `customer_name`          | htlAAq ("What is your first name?") and pPocjH ("What is your last name?") are mandatory fields on all paths |
| `customer_email_address` | skdDtj ("What's your email address?") is a mandatory field on all paths                                      |

### Fields that may be empty strings or undefined

| Field                 | Condition producing empty/undefined value                                                                                                                                                                                                                                                  | Realistic scenario?                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `SBI`                 | Neither rkIHYS ("What is the Single Business Identifier (SBI) number of where the activities will take place?") nor VLUhzR ("Single business identifier (SBI)", address details page) present — field is `undefined` (omitted from output)                                                 | **Expected** — some customer types (e.g. Consultant, Somebody else) may not have SBI shown. See Example 3 |
| `agreement_reference` | No scheme selected AND no VacBun ("What is the name of the permission?") permission name                                                                                                                                                                                                   | **Expected** — users without a scheme or other permission get empty reference. See Example 3              |
| `email_header`        | No ORNEC activities — iTBHrY ("Operations requiring Natural England consent") / cwZgSE ("Site name and operations requiring Natural England consent") empty — AND no land management scheme rTreXu ("What land management scheme does this notice relate to?") not set — AND no SSSI names | Falls back to `"S28E Consent"` rather than empty string. See Example 6                                    |

### Fields with empty sub-properties in SSSI_info entries

| Field in SSSI_info | Condition producing empty value                                                                                                                            | Realistic scenario?                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `coordinates`      | Single SSSI without scheme coordinates JPohUD ("Where are the activities taking place?") and without ORNEC repeater entries                                | **Expected** — single SSSI fallback path has no coordinates. See Example 6       |
| `ornec`            | Single SSSI scheme path (no ORNEC repeater); multi SSSI scheme path via gWZwzI ("Sites where you plan to carry out activities"); single SSSI fallback path | **Expected** — scheme paths don't collect ORNEC activities. See Examples 2, 5, 6 |

### Key empty value scenarios by form path

| Path                                                                           | `SBI`       | `agreement_reference` | `email_header`                 | `coordinates` (in SSSI_info)                             | `ornec` (in SSSI_info) | Notes                                                                    |
| ------------------------------------------------------------------------------ | ----------- | --------------------- | ------------------------------ | -------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| Landowner, CS scheme, single SSSI with ORNECs                                  | SBI number  | CS reference          | Activities + SSSI              | ORNEC coords                                             | Activity names         | All fields populated                                                     |
| Land occupier, HLS, single SSSI (scheme coords)                                | SBI number  | HLS reference         | Scheme + SSSI                  | JPohUD ("Where are the activities taking place?") coords | `""` empty             | **ornec empty** — scheme path has no ORNEC activities                    |
| Consultant, no scheme, single SSSI with ORNECs                                 | `undefined` | `""` empty            | Activities + SSSI              | ORNEC coords                                             | Activity names         | **SBI undefined, agreement_reference empty** — consultant without scheme |
| Landowner, SFI, multiple SSSIs with ORNECs                                     | SBI number  | SFI reference         | Activities + SSSIs             | Per-SSSI coords                                          | Per-SSSI activities    | All fields populated                                                     |
| Other, CSMT, multiple SSSIs (scheme)                                           | SBI number  | CS reference          | Scheme + SSSIs                 | JPohUD ("Where are the activities taking place?") coords | `""` empty             | **ornec empty** — scheme multi-SSSI path has no ORNEC activities         |
| Landowner, other permission via VacBun ("What is the name of the permission?") | SBI number  | VacBun text           | SSSI names or `"S28E Consent"` | `""` empty                                               | `""` empty             | **coordinates, ornec empty** — no ORNECs, no scheme, no coords           |
| Somebody else, no scheme, no ORNECs                                            | May be set  | `""` empty            | SSSI names or `"S28E Consent"` | `""` empty                                               | `""` empty             | **Most optional fields empty** — no scheme, no ORNECs, no coordinates    |
