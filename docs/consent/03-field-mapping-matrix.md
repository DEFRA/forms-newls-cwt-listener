# Consent form field mapping matrix

This document maps each output field in the CWT JSON to its source form field(s), broken down by which path through the form was taken.

Source: [mappings/consent-cwt.mapping.json](../../mappings/consent-cwt.mapping.json)

## Output field reference

| Output field               | Type             | Always present?                 |
| -------------------------- | ---------------- | ------------------------------- |
| `form_type`                | `"consent"`      | Yes                             |
| `DF_reference_number`      | string           | Yes                             |
| `broad_work_type`          | `"S28E Consent"` | Yes                             |
| `detailed_work_type`       | string           | Yes                             |
| `description`              | string           | Yes                             |
| `consulting_body_type`     | string           | Yes                             |
| `represented_body_type`    | string           | When an owner/occupier is named |
| `represented_body_name`    | string           | When an owner/occupier is named |
| `customer_name`            | string           | Yes                             |
| `customer_email_address`   | string           | Yes                             |
| `SBI`                      | number           | When SBI field has a value      |
| `agreement_reference`      | string           | Yes                             |
| `email_header`             | string           | Yes                             |
| `SSSI_info`                | array            | Yes (may be empty)              |
| `is_there_a_european_site` | `"Yes"` / `""`   | Yes                             |
| `euro_site_info`           | array            | Yes (may be empty)              |

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

Built from up to three segments joined with `-` (space-dash-space): the primary segment (scheme and/or activities), SSSI names and European site names. Falls back to `"S28E Consent"` when no segments are available.

Format: `"{scheme and/or activities} - {SSSI names} - {European site names}"`

### Primary segment (scheme and/or activities)

Scheme and activities are independent: both are included when both are present, joined with `, ` (scheme first, then the activities). The "activities" contribution is resolved as the first populated of: single-SSSI ORNEC activities, multi-SSSI ORNEC activities, then (on the SFI route only) the SFI action codes.

| Source                          | Prerequisites                                                                                                                                                                                      | Contribution                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Scheme                          | rTreXu ("What land management scheme does this notice relate to?") selected, value ≠ `Other schemes`                                                                                               | Full scheme text                                                                        |
| Scheme (Other schemes)          | rTreXu = `Other schemes` and aIixRu ("What is the name of the land management scheme?") provided                                                                                                   | Free-text scheme name from aIixRu (replaces the literal `Other schemes` in the segment) |
| Scheme (Other schemes) fallback | rTreXu = `Other schemes` and aIixRu blank                                                                                                                                                          | Literal text `Other schemes`                                                            |
| Permission (another permission) | VacBun ("What is the name of the permission?") provided — the "…or another permission?" branch, where no land management scheme is selected (mutually exclusive with the rTreXu/aIixRu rows above) | Permission name from VacBun                                                             |
| Single SSSI ORNEC activities    | Repeater iTBHrY ("Operations requiring Natural England consent"), hqsZMS ("Which activity?")                                                                                                       | Unique activity values comma-joined                                                     |
| Multi SSSI ORNEC activities     | Otherwise repeater cwZgSE ("Site name and operations requiring Natural England consent"), BscJLV                                                                                                   | Unique activity values comma-joined                                                     |
| SFI action codes                | Otherwise rTreXu starts with SFI and qocAEz ("Which SFI action codes…") selected (ORNEC repeaters empty)                                                                                           | Selected action codes comma-joined                                                      |
| Fallback                        | No scheme and no activities                                                                                                                                                                        | Empty                                                                                   |

### SSSI names segment

Collected from: hozdvW (single SSSI) > cwZgSE repeater [rWrBOK] (multiple ORNEC, unique) > gWZwzI repeater [gVlMxz] (multiple scheme). Parsed from "ID---Name" format and comma-joined.

### European site names segment

Collected from repeater hwaByT ("European site"), question FqfxKM ("What is the name of the European site?"). Parsed from "ID---Name" format via `parseName` (id stripped) and comma-joined. Omitted when no European site is present.

## consulting_body_type

Mapped from KTObNK ("What type of customer are you?") via `customerTypeMap`.

| KTObNK value                                                              | Output value    |
| ------------------------------------------------------------------------- | --------------- |
| `An owner of land within a SSSI`                                          | `Landowner`     |
| `An occupier of land within a SSSI`                                       | `Land occupier` |
| `Someone working on behalf of an owner or occupier of land within a SSSI` | `Consultant`    |
| `Somebody else`                                                           | `Other`         |
| (not set)                                                                 | Empty string    |

**Note:** The consent form does not have `consulting_body` or `is_contractor_working_for_public_body` fields in its output, unlike the advice and assent forms.

## represented_body_type and represented_body_name

These describe a land owner or occupier the submitter is acting **for**, and are the only two fields that differ between the payloads of one submission — see [one submission, several payloads](#one-submission-several-payloads) below. They are separate from `consulting_body_type`, which describes the submitter themselves; the two are unrelated fields with unrelated sources, despite the similar names.

The form only collects them when the submitter is not the owner/occupier. Two answers to KTObNK ("What type of customer are you?") lead to the `/land-owner-or-occupier-details` page:

| KTObNK value                                                              | Route to owner/occupier details                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Someone working on behalf of an owner or occupier of land within a SSSI` | Directly                                                                                    |
| `Somebody else`                                                           | Via HoRNDl ("Do you know the details of the owner or occupier?") — only when answered `Yes` |
| `An owner of land within a SSSI` / `An occupier of land within a SSSI`    | Never — the submitter **is** the body, so both fields are omitted                           |

The page is a repeater (bDGQoL, "Land owner or occupier details", min 1 / max 5), so a notice can name up to five bodies.

| Output field            | Source                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `represented_body_type` | BKoVeV ("Are these the contact details of the landowner or the occupier?") — `Landowner` or `Land occupier`, used as-is |
| `represented_body_name` | qmxPye ("First name") and ajJUTo ("Last name") from the same entry, joined with a space                                 |

Entries with no answer to BKoVeV are ignored — a user can reach the page and leave it blank.

Both fields are **optional** in the output schema and no ordinary rule produces them: only the expansion does. So when no entry survives, they are absent from the payload rather than present and empty.

## One submission, several payloads

CWT models each represented body as its own submission, so the consent mapping declares an `expand` block ([format reference](../mapping-system/02-mapping-file-format.md#payload-expansion)) over the bDGQoL repeater. Every other field in this document is computed once and repeated identically across the payloads.

| Entries in bDGQoL (with BKoVeV answered)                     | Payloads sent to CWT                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 0 (owner/occupier submitting themselves, or page left blank) | 1, with both represented body fields omitted                               |
| 1                                                            | 1, with both fields populated                                              |
| _n_ (up to 5)                                                | _n_, differing only in `represented_body_type` and `represented_body_name` |

All payloads of one submission share its `DF_reference_number` — CWT handles that, and it is what identifies them as one notice.

The mapping sets `deliverySuccessMode: "all"`, so the submission counts as delivered only once every payload is accepted; if any fails the notice is redelivered, duplicating the bodies that already arrived rather than silently losing the one that did not. Each payload's send retries transient errors (5xx, 429, network) with back-off before it counts as failed.

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

Determined by the land management scheme selection (rTreXu), with a final fallback to the scheme reference number field and then the "another permission" reference number field.

Resolution order:

1. rTreXu scheme match (CS / HLS / SFI / Other schemes) — return the corresponding scheme reference field.
2. Otherwise, fall back to the first answered of WtpFqT ("What is the scheme reference number?") then Uureah ("Give the reference number for this permission if available", the "…or another permission?" branch's reference).
3. Otherwise, return an empty string.

| Condition                                                                   | Source field                                                                     | Output value                          |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| rTreXu starts with CSHT / CSMT / CS Capital Grants                          | WZJDQG ("What's your Countryside Stewardship agreement reference number?")       | Free text reference number            |
| rTreXu starts with HLS agreement                                            | OFiizI ("What's your Higher Level Stewardship agreement reference number?")      | Free text reference number            |
| rTreXu starts with SFI agreement                                            | niVAkO ("What's your Sustainable Farming Incentive agreement number?")           | Free text reference number            |
| rTreXu starts with Other schemes                                            | WtpFqT ("What is the scheme reference number?")                                  | Free text reference number (optional) |
| No scheme match, WtpFqT ("What is the scheme reference number?") present    | WtpFqT ("What is the scheme reference number?") — fallback                       | Free text reference number            |
| No scheme match, WtpFqT blank, Uureah present ("another permission" branch) | Uureah ("Give the reference number for this permission if available") — fallback | Free text reference number (optional) |
| None of the above                                                           | -                                                                                | Empty string                          |

## email_header

Uses the same segments as `description` (scheme and/or activities, SSSI names, then European site names) but truncated to 254 characters. Falls back to `"S28E Consent"` when no segments are available.

Format: `"{scheme and/or activities} - {SSSI names} - {European site names}"` (truncated to 254 characters using the `fitNames` helper, which progressively drops names and appends "(+N more)" when truncation is needed). Both the SSSI names and European site names are fitted via `fitNames` into the remaining space within the 254-character limit.

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

#### SFI scheme path (rTreXu starts with SFI, no repeater)

Evaluated **before** the generic scheme path so it wins whenever the scheme is SFI. Unlike other scheme paths, `ornec` is populated — from the page-20 SFI action codes rather than an activity.

| Field         | Source                                                                                                    | Description                           |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `SSSI_id`     | hozdvW ("What is the name of the SSSI where you plan to carry out activities?")                           | Parsed as integer from string value   |
| `coordinates` | JPohUD ("Where are the activities taking place?") from main                                               | Formatted as `"<easting>,<northing>"` |
| `ornec`       | qocAEz ("Which SFI action codes involve operations that need Natural England consent (ORNEC)?") from main | Selected action codes comma-joined    |

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

#### SFI scheme path (rTreXu starts with SFI, repeater gWZwzI)

Evaluated **before** the generic scheme path so it wins whenever the scheme is SFI. One entry per gWZwzI site; `qocAEz` is a single form-level field, so the same action-code list is applied to every SSSI.

| Field         | Source                                                                                                                                      | Description                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SSSI_id`     | gVlMxz ("What is the name of the SSSI where activities are planned?") from repeater gWZwzI ("Sites where you plan to carry out activities") | Parsed as integer from string value                                           |
| `coordinates` | JPohUD ("Where are the activities taking place?") from main                                                                                 | Formatted as `"<easting>,<northing>"`, shared across all SSSIs on scheme path |
| `ornec`       | qocAEz ("Which SFI action codes involve operations that need Natural England consent (ORNEC)?") from main                                   | Selected action codes comma-joined, same for every SSSI                       |

#### Scheme path (repeater gWZwzI)

| Field         | Source                                                                                                                                      | Description                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SSSI_id`     | gVlMxz ("What is the name of the SSSI where activities are planned?") from repeater gWZwzI ("Sites where you plan to carry out activities") | Parsed as integer from string value                                           |
| `coordinates` | JPohUD ("Where are the activities taking place?") from main                                                                                 | Formatted as `"<easting>,<northing>"`, shared across all SSSIs on scheme path |
| `ornec`       | -                                                                                                                                           | Empty string                                                                  |

## is_there_a_european_site

`"Yes"` when the European site repeater hwaByT ("European site") has an answer to FqfxKM ("What is the name of the European site?"), otherwise `""` (empty string). Always present — populated on both branches. This mirrors the Assent form.

## euro_site_info

Array of `{ european_site_id }` objects — one entry per hwaByT ("European site") repeater entry that has FqfxKM ("What is the name of the European site?") answered. Empty array (`[]`) when no European site is present. This mirrors the Assent form.

| Field              | Source                                                                                   | Description                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `european_site_id` | FqfxKM ("What is the name of the European site?") from repeater hwaByT ("European site") | Parsed as number from "ID---Name" value via `parseEuroSiteId` |

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

| Field                                             | Condition producing empty/undefined value                                                                                                                                                                                                                                                                                       | Realistic scenario?                                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SBI`                                             | Neither rkIHYS ("What is the Single Business Identifier (SBI) number of where the activities will take place?") nor VLUhzR ("Single business identifier (SBI)", address details page) present — field is `undefined` (omitted from output)                                                                                      | **Expected** — some customer types (e.g. Consultant, Somebody else) may not have SBI shown. See Example 3                                                                     |
| `agreement_reference`                             | No scheme match AND no WtpFqT ("What is the scheme reference number?") value AND no Uureah ("Give the reference number for this permission if available") value (WtpFqT is only shown on the "Other schemes" path, Uureah only on the "another permission" branch); or scheme is Other schemes and WtpFqT left blank (optional) | **Expected** — users without a scheme or reference get empty reference; both the Other-schemes and another-permission references are optional. See Example 3                  |
| `represented_body_type` / `represented_body_name` | The submitter is the owner or occupier themselves (KTObNK is `An owner…` / `An occupier…`), or is `Somebody else` who answered `No` to HoRNDl ("Do you know the details of the owner or occupier?"), so bDGQoL ("Land owner or occupier details") is never reached; or the page is reached and left blank                       | **Expected** — there is no represented body to name. Both are optional and only the expansion produces them, so they are omitted from the output and a single payload is sent |
| `email_header`                                    | No ORNEC activities — iTBHrY ("Operations requiring Natural England consent") / cwZgSE ("Site name and operations requiring Natural England consent") empty — AND no land management scheme rTreXu ("What land management scheme does this notice relate to?") not set — AND no SSSI names                                      | Falls back to `"S28E Consent"` rather than empty string. See Example 6                                                                                                        |

### Fields with empty sub-properties in SSSI_info entries

| Field in SSSI_info | Condition producing empty value                                                                                                                            | Realistic scenario?                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coordinates`      | Single SSSI without scheme coordinates JPohUD ("Where are the activities taking place?") and without ORNEC repeater entries                                | **Expected** — single SSSI fallback path has no coordinates. See Example 6                                                                                                                  |
| `ornec`            | Single SSSI scheme path (no ORNEC repeater); multi SSSI scheme path via gWZwzI ("Sites where you plan to carry out activities"); single SSSI fallback path | **Expected** — non-SFI scheme paths don't collect ORNEC activities. The SFI scheme path is the exception: it populates `ornec` from the page-20 action codes (qocAEz). See Examples 2, 5, 6 |

### Key empty value scenarios by form path

| Path                                            | `SBI`       | `agreement_reference` | `email_header`                                         | `coordinates` (in SSSI_info)                             | `ornec` (in SSSI_info)             | Notes                                                                                                                        |
| ----------------------------------------------- | ----------- | --------------------- | ------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Landowner, CS scheme, single SSSI with ORNECs   | SBI number  | CS reference          | Activities + SSSI                                      | ORNEC coords                                             | Activity names                     | All fields populated                                                                                                         |
| Land occupier, HLS, single SSSI (scheme coords) | SBI number  | HLS reference         | Scheme + SSSI                                          | JPohUD ("Where are the activities taking place?") coords | `""` empty                         | **ornec empty** — scheme path has no ORNEC activities                                                                        |
| Consultant, no scheme, single SSSI with ORNECs  | `undefined` | `""` empty            | Activities + SSSI                                      | ORNEC coords                                             | Activity names                     | **SBI undefined, agreement_reference empty** — consultant without scheme                                                     |
| Landowner, SFI, multiple SSSIs (action codes)   | SBI number  | SFI reference         | Scheme + action codes + SSSIs                          | JPohUD ("Where are the activities taking place?") coords | Action codes (same for every SSSI) | **ornec from action codes** — SFI scheme path sources ORNEC from qocAEz                                                      |
| Other, CSMT, multiple SSSIs (scheme)            | SBI number  | CS reference          | Scheme + SSSIs                                         | JPohUD ("Where are the activities taking place?") coords | `""` empty                         | **ornec empty** — non-SFI scheme multi-SSSI path has no ORNEC activities                                                     |
| Landowner, other permission (no scheme)         | SBI number  | Uureah ref or `""`    | Permission name + activities/SSSI, or `"S28E Consent"` | `""` empty or ORNEC coords                               | `""` empty or ORNEC codes          | **Permission name (VacBun) opens description/email_header; agreement_reference from Uureah (optional, empty if left blank)** |
| Somebody else, no scheme, no ORNECs             | May be set  | `""` empty            | SSSI names or `"S28E Consent"`                         | `""` empty                                               | `""` empty                         | **Most optional fields empty** — no scheme, no ORNECs, no coordinates                                                        |
