# Advice form field mapping matrix

This document maps each output field in the CWT JSON to its source form field(s), broken down by which path through the form was taken.

Source: [src/service/mappers/advice-form-mapper.js](../../src/service/mappers/advice-form-mapper.js)

## Output field reference

| Output field                            | Type             | Always present?       |
| --------------------------------------- | ---------------- | --------------------- |
| `form_type`                             | `"advice"`       | Yes                   |
| `broad_work_type`                       | string           | Yes                   |
| `detailed_work_type`                    | string           | Yes                   |
| `description`                           | string           | Yes                   |
| `consulting_body_type`                  | string           | Yes                   |
| `consulting_body`                       | string           | Yes                   |
| `customer_name`                         | string           | Yes                   |
| `customer_email_address`                | string           | Yes                   |
| `email_header`                          | string           | Yes                   |
| `is_contractor_working_for_public_body` | `"Yes"` / `"No"` | Yes                   |
| `public_body_type`                      | string           | When contractor = Yes |
| `public_body`                           | string           | When contractor = Yes |
| `is_there_a_european_site`              | `"Yes"` / `"No"` | Yes                   |
| `SSSI_info`                             | array            | Yes (may be empty)    |
| `euro_site_info`                        | array            | Yes (may be empty)    |

---

## broad_work_type

Determined by field precedence: NVRbCy ("Advice type", FC path) > YOwPAJ ("Advice type", S28G path) > xzEslQ ("Topic of query", general topics).

| Path           | Source field              | Field value             | Output value            |
| -------------- | ------------------------- | ----------------------- | ----------------------- |
| FC path        | NVRbCy ("Advice type")    | `HRA advice`            | `Standalone HRA Reg 63` |
| FC path        | NVRbCy ("Advice type")    | `S28I SSSI advice`      | `S28i Advice`           |
| FC path        | NVRbCy ("Advice type")    | `Something else`        | `Other casework`        |
| S28G path      | YOwPAJ ("Advice type")    | `Standalone HRA advice` | `Standalone HRA Reg 63` |
| S28G path      | YOwPAJ ("Advice type")    | `S28i SSSI advice`      | `S28i Advice`           |
| S28G path      | YOwPAJ ("Advice type")    | `Something else`        | `Other casework`        |
| General topics | xzEslQ ("Topic of query") | (any value)             | `Other casework`        |

## detailed_work_type

Same precedence as `broad_work_type`, but with finer granularity for general topics.

| Path           | Source field              | Field value                            | Output value                               |
| -------------- | ------------------------- | -------------------------------------- | ------------------------------------------ |
| FC path        | NVRbCy ("Advice type")    | `HRA advice`                           | `Standalone HRA Reg 63`                    |
| FC path        | NVRbCy ("Advice type")    | `S28I SSSI advice`                     | `S28i Advice`                              |
| FC path        | NVRbCy ("Advice type")    | `Something else`                       | Falls through to xzEslQ ("Topic of query") |
| S28G path      | YOwPAJ ("Advice type")    | `Standalone HRA advice`                | `Standalone HRA Reg 63`                    |
| S28G path      | YOwPAJ ("Advice type")    | `S28i SSSI advice`                     | `S28i Advice`                              |
| S28G path      | YOwPAJ ("Advice type")    | `Something else`                       | Falls through to xzEslQ ("Topic of query") |
| General topics | xzEslQ ("Topic of query") | Pre-consent advice (SSSI landowner)    | `SSSI - Pre Consent advice`                |
| General topics | xzEslQ ("Topic of query") | Pre-assent advice (public body)        | `SSSI - Pre Assent advice`                 |
| General topics | xzEslQ ("Topic of query") | Report potentially damaging activity   | `SSSI - Site visits/surveys`               |
| General topics | xzEslQ ("Topic of query") | Submit/request surveys or SSSI info    | `SSSI - Regulation and Enforcement`        |
| General topics | xzEslQ ("Topic of query") | Question about NNRs                    | `SSSI - Other`                             |
| General topics | xzEslQ ("Topic of query") | Designating a Local Nature Reserve     | `LNRs`                                     |
| General topics | xzEslQ ("Topic of query") | Flying drones on/near a protected site | `SSSI - Other`                             |
| General topics | xzEslQ ("Topic of query") | Designating or de-designating SSSIs    | `SSSI - Other`                             |
| General topics | xzEslQ ("Topic of query") | Sale of SSSI land                      | `SSSI - Other`                             |
| General topics | xzEslQ ("Topic of query") | Something else                         | `SSSI - Other`                             |
| (none set)     | -                         | -                                      | `SSSI - Other`                             |

## email_header

Always set to the same value as `detailed_work_type`.

## description

Built from path-dependent parts joined with `-`.

| Path           | Parts (in order)                                                                                                                                                | Source fields                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HRA path       | HRA stage (lowercased, prefixed "Advice on "), European site names (comma-separated), question (if present), proposed activities, damaging activity description | emlmbt ("Type of HRA advice"), repeater TJuSNf ("European site")[rtuWky ("EU site name")], QmIGor ("What is your question?"), nJVeix ("Activity details"), YhWlKB ("Description of damage") |
| S28I SSSI path | SSSI names (comma-separated), question, proposed activities, damaging activity description                                                                      | repeater[Avdzxa ("SSSI site name")], QmIGor ("What is your question?"), nJVeix ("Activity details"), YhWlKB ("Description of damage")                                                       |
| General topics | Topic text, question, proposed activities, damaging activity description                                                                                        | xzEslQ ("Topic of query"), QmIGor ("What is your question?"), nJVeix ("Activity details"), YhWlKB ("Description of damage")                                                                 |

**Notes:**

- The trailing fields (QmIGor ("What is your question?"), nJVeix ("Activity details"), YhWlKB ("Description of damage")) are only appended if they have a value. Which ones are present depends on the sub-path (e.g. QmIGor is from the general question path, nJVeix from the proposed activities text field, YhWlKB from the damage reporting path).
- Parts are joined with `-` (space-dash-space).

## consulting_body_type

Direct mapping from the applicant category (teEzOl ("Representation category")).

| Category value      | Output value               |
| ------------------- | -------------------------- |
| `Consultant`        | `Consultant`               |
| `Government Agency` | `Government Agency`        |
| `Harbour authority` | `Harbour Authority`        |
| `Landowner`         | `Landowner`                |
| `Land occupier`     | `Land occupier`            |
| `Member of public`  | `Member of public`         |
| `Other`             | `Other`                    |
| `Regional body`     | `Local Planning Authority` |
| `Utility provider`  | `Utility Provider`         |

**Note:** The mapping changes case for Harbour Authority and Utility Provider.

## consulting_body

Resolved from multiple conditional fields. The "effective type" is either PBmxNM ("Working on behalf of", when working on behalf) or teEzOl ("Representation category", direct).

| Effective type                                                     | Condition                                              | Source field                       | Output value                               |
| ------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------- | ------------------------------------------ |
| Government Agency / Government agency                              | PvUZyQ ("Government agency") = Forestry Commission     | PvUZyQ ("Government agency")       | `Forestry Commission`                      |
| Government Agency / Government agency                              | PvUZyQ ("Government agency") = Environment Agency      | PvUZyQ ("Government agency")       | `Environment Agency`                       |
| Government Agency / Government agency                              | PvUZyQ ("Government agency") = Other government agency | hOsLRu ("Which government agency") | Free text value                            |
| Local Planning Authority / Regional body                           | -                                                      | YouDQP ("Local authority")         | Selected local authority name              |
| Harbour authority / Utility provider / Public body or organisation | HiTHQX ("Public body") != Other                        | HiTHQX ("Public body")             | Selected public body name                  |
| Harbour authority / Utility provider / Public body or organisation | HiTHQX ("Public body") = Other                         | OYxtmu ("Public body name")        | Free text value                            |
| Landowner                                                          | -                                                      | -                                  | `Landowner`                                |
| Land occupier                                                      | -                                                      | -                                  | `Land occupier`                            |
| None of the above                                                  | -                                                      | -                                  | `None of the above`                        |
| Consultant (with PBmxNM ("Working on behalf of"))                  | -                                                      | (recurse via PBmxNM)               | Resolved from "working on behalf of" chain |
| Other (with PBmxNM ("Working on behalf of"))                       | -                                                      | (recurse via PBmxNM)               | Resolved from "working on behalf of" chain |

## is_contractor_working_for_public_body

| Condition                                          | Output value |
| -------------------------------------------------- | ------------ |
| PBmxNM ("Working on behalf of") has a value (any)  | `Yes`        |
| PBmxNM ("Working on behalf of") is empty/undefined | `No`         |

## public_body_type

| Condition                                                                        | Source                             | Output value                      |
| -------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| PBmxNM ("Working on behalf of") = `Government agency`                            | PBmxNM ("Working on behalf of")    | `Government Agency` (capitalised) |
| PBmxNM ("Working on behalf of") = any other value                                | PBmxNM ("Working on behalf of")    | PBmxNM value as-is                |
| PBmxNM ("Working on behalf of") is empty, teEzOl ("Representation category") set | teEzOl ("Representation category") | teEzOl value as-is                |
| Neither set                                                                      | -                                  | Empty string                      |

## public_body

| Condition                                                                                        | Source field                       | Output value                   |
| ------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------ |
| PBmxNM ("Working on behalf of") = `Government agency`, PvUZyQ ("Government agency") = Other      | hOsLRu ("Which government agency") | Free text agency name          |
| PBmxNM ("Working on behalf of") = `Government agency`, PvUZyQ ("Government agency") != Other     | PvUZyQ ("Government agency")       | Selected agency name           |
| PBmxNM ("Working on behalf of") = `Local Planning Authority`                                     | YouDQP ("Local authority")         | Selected local authority       |
| PBmxNM ("Working on behalf of") = `Public body or organisation`, HiTHQX ("Public body") = Other  | OYxtmu ("Public body name")        | Free text body name            |
| PBmxNM ("Working on behalf of") = `Public body or organisation`, HiTHQX ("Public body") != Other | HiTHQX ("Public body")             | Selected public body           |
| PBmxNM ("Working on behalf of") empty, teEzOl ("Representation category") set                    | PvUZyQ ("Government agency")       | Government agency (if present) |
| PBmxNM ("Working on behalf of") empty, teEzOl ("Representation category") empty                  | -                                  | Empty string                   |

## customer_name

Always from field **hUpejP** ("Name").

## customer_email_address

Always from field **YOPYRe** ("Email address").

## is_there_a_european_site

| Condition                        | Output value |
| -------------------------------- | ------------ |
| euro_site_info array has entries | `Yes`        |
| euro_site_info array is empty    | `No`         |

## SSSI_info

Array of `{ SSSI_id, coordinates }` objects, populated from two possible sources:

| Source                              | SSSI_id field                         | Coordinates field             | When used                                               |
| ----------------------------------- | ------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| Repeater entries (S28I/HRA path)    | Avdzxa ("SSSI site name")             | NMCFES ("Activity location")  | When repeater contains entries with Avdzxa              |
| Main fields (damage reporting path) | MoCXGK ("SSSI site name with damage") | rSJTFC ("Location of damage") | When no repeater SSSI data exists AND MoCXGK is present |

Coordinates are formatted as `"<easting>,<northing>"`.

## euro_site_info

Array of `{ european_site_id, european_site_coordinates }` objects from repeater **TJuSNf** ("European site", HRA path only):

| Field                           | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| rtuWky ("EU site name")         | European site name (numeric ID from list of 419 Ramsar sites) |
| xeJYcG ("Location coordinates") | Coordinates, formatted as `"<easting>,<northing>"`            |

Only populated on the HRA advice path.
