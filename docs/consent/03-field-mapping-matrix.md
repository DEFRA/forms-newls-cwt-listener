# Consent form field mapping matrix

This document maps each output field in the CWT JSON to its source form field(s), broken down by which path through the form was taken.

Source: [src/service/mappers/consent-form-mapper.js](../../src/service/mappers/consent-form-mapper.js)

## Output field reference

| Output field             | Type             | Always present?            |
| ------------------------ | ---------------- | -------------------------- |
| `form_type`              | `"consent"`      | Yes                        |
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

Built from SSSI names and ORNEC activities. Parts are joined with `; ` (semicolon-space). Within each part, SSSI name and activities are joined with `-` (space-dash-space).

| Path                                 | Source                                                                                                                                                       | Format                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single SSSI with activities          | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") from main + repeater iTBHrY ("Operations requiring Natural England consent") | `{SSSI name} - {activity1}, {activity2}`                                                                                                                                                                                                       |
| Single SSSI without activities       | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") from main                                                                    | `{SSSI name}`                                                                                                                                                                                                                                  |
| Multiple SSSIs with ORNEC activities | Repeater cwZgSE ("Site name and operations requiring Natural England consent")                                                                               | `{SSSI A} - {activities}; {SSSI B} - {activities}` (grouped by SSSI name rWrBOK ("What is the name of the SSSI where you plan to carry out this activity?"), activities from BscJLV ("Which activity do you plan to carry out?") comma-joined) |
| Multiple SSSIs (scheme path)         | Repeater gWZwzI ("Sites where you plan to carry out activities")                                                                                             | gVlMxz ("What is the name of the SSSI where activities are planned?") values joined with `; `                                                                                                                                                  |
| (none)                               | -                                                                                                                                                            | Empty string                                                                                                                                                                                                                                   |

## consulting_body_type

Mapped from KTObNK ("What type of customer are you?") via `customerTypeMap`.

| KTObNK value                                                        | Output value    |
| ------------------------------------------------------------------- | --------------- |
| `An owner of land within a SSSI`                                    | `Landowner`     |
| `An occupier of land within a SSSI`                                 | `Land occupier` |
| `Someone with permission to work on behalf of an owner or occupier` | `Consultant`    |
| `Somebody else`                                                     | `Other`         |
| (not set)                                                           | Empty string    |

**Note:** The consent form does not have `consulting_body` or `is_contractor_working_for_public_body` fields in its output, unlike the advice and assent forms.

## customer_name

Concatenation of htlAAq ("What is your first name?") and pPocjH ("What is your last name?"), joined with a space and trimmed.

## customer_email_address

Always from field skdDtj ("What's your email address?").

## SBI

Single Business Identifier, converted to a number. Uses oflKhi ("Single business identifier (SBI)") as primary, falling back to VLUhzR ("Single business identifier (SBI)", address details page).

| Condition                                           | Source field | Output value     |
| --------------------------------------------------- | ------------ | ---------------- |
| oflKhi ("Single business identifier (SBI)") present | oflKhi       | `Number(oflKhi)` |
| VLUhzR ("Single business identifier (SBI)") present | VLUhzR       | `Number(VLUhzR)` |
| Neither present                                     | -            | `undefined`      |

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

Determined by a fallback chain: first ORNEC activity > land management scheme > empty.

| Priority | Condition                                                                                                                                                      | Source             | Output value              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------- |
| 1        | Single SSSI repeater iTBHrY ("Operations requiring Natural England consent") has entries with hqsZMS ("Which activity do you plan to carry out?")              | First hqsZMS value | First ORNEC activity name |
| 2        | Multi SSSI repeater cwZgSE ("Site name and operations requiring Natural England consent") has entries with BscJLV ("Which activity do you plan to carry out?") | First BscJLV value | First ORNEC activity name |
| 3        | rTreXu ("What land management scheme does this notice relate to?") is present                                                                                  | rTreXu value       | Full scheme text          |
| 4        | None of the above                                                                                                                                              | -                  | Empty string              |

## SSSI_info

Array of `{ SSSI_id, coordinates, ornec }` objects. The path is determined by lmqMaY ("Are you planning to carry out activities on more than one SSSI?").

**Note:** The consent form includes an `ornec` field in each SSSI_info entry, unlike the advice form.

### Single SSSI path (lmqMaY = false or not set)

SSSI name from hozdvW ("What is the name of the SSSI where you plan to carry out activities?") in main.

#### Non-scheme path (repeater iTBHrY present)

| Field         | Source                                                                                                                         | Description                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?")                                                | SSSI name                                                                 |
| `coordinates` | QKdhfh ("Where do you plan to carry out this activity?") from repeater iTBHrY ("Operations requiring Natural England consent") | Formatted as `"<easting>,<northing>"`, multiple entries joined with `";"` |
| `ornec`       | hqsZMS ("Which activity do you plan to carry out?") from repeater iTBHrY                                                       | Activity names comma-joined                                               |

#### Scheme path (no repeater, JPohUD present)

| Field         | Source                                                                          | Description                           |
| ------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") | SSSI name                             |
| `coordinates` | JPohUD ("Where are the activities taking place?") from main                     | Formatted as `"<easting>,<northing>"` |
| `ornec`       | -                                                                               | Empty string                          |

#### Fallback (no repeater, no JPohUD)

| Field         | Source                                                                          | Description  |
| ------------- | ------------------------------------------------------------------------------- | ------------ |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") | SSSI name    |
| `coordinates` | -                                                                               | Empty string |
| `ornec`       | -                                                                               | Empty string |

### Multiple SSSI path (lmqMaY = true)

#### Non-scheme path (repeater cwZgSE present)

| Field         | Source                                                                                                                                                                 | Description                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SSSI_id`     | rWrBOK ("What is the name of the SSSI where you plan to carry out this activity?") from repeater cwZgSE ("Site name and operations requiring Natural England consent") | SSSI name (grouped by unique name)                                                      |
| `coordinates` | gjWdrc ("Where on the SSSI do you plan to carry out this activity?") from repeater cwZgSE                                                                              | Formatted as `"<easting>,<northing>"`, multiple entries for same SSSI joined with `";"` |
| `ornec`       | BscJLV ("Which activity do you plan to carry out?") from repeater cwZgSE                                                                                               | Activity names comma-joined per SSSI                                                    |

#### Scheme path (repeater gWZwzI)

| Field         | Source                                                                                                                                      | Description  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `SSSI_id`     | gVlMxz ("What is the name of the SSSI where activities are planned?") from repeater gWZwzI ("Sites where you plan to carry out activities") | SSSI name    |
| `coordinates` | -                                                                                                                                           | Empty string |
| `ornec`       | -                                                                                                                                           | Empty string |
