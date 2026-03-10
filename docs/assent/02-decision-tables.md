# Assent form decision tables

This document enumerates every routing scenario through the assent form. Each row represents a unique path that leads to a submission being mapped and sent to CWT.

## Decision table: Applicant identity

Every submission includes an applicant identity. The identity determines which fields are collected and how `consulting_body_type` and `consulting_body` are resolved.

| #   | Customer type (KTObNK)                      | Public body category (vUHwan) | Organisation (ueDuNl) | Other org (Xszriq) | Local authority (XAZlxH) | Public body (cfPoiN) | Other public body (FyLHmN) | Effective type                |
| --- | ------------------------------------------- | ----------------------------- | --------------------- | ------------------ | ------------------------ | -------------------- | -------------------------- | ----------------------------- |
| 1   | A public body                               | Consultant                    | -                     | -                  | -                        | {selected body}      | -                          | Public body: Consultant       |
| 2   | A public body                               | Government agency             | -                     | -                  | -                        | {selected body}      | -                          | Public body: Gov agency       |
| 3   | A public body                               | Harbour authority             | -                     | -                  | -                        | {selected body}      | -                          | Public body: Harbour          |
| 4   | A public body                               | Landowner                     | -                     | -                  | -                        | {selected body}      | -                          | Public body: Landowner        |
| 5   | A public body                               | Land occupier                 | -                     | -                  | -                        | {selected body}      | -                          | Public body: Land occupier    |
| 6   | A public body                               | Local planning authority      | -                     | -                  | {selected LA}            | -                    | -                          | Public body: LPA              |
| 7   | A public body                               | Utility provider              | -                     | -                  | -                        | {selected body}      | -                          | Public body: Utility          |
| 8   | A public body                               | Other                         | -                     | -                  | -                        | -                    | {free text}                | Public body: Other            |
| 9   | A public body                               | (any except LPA/Other)        | -                     | -                  | -                        | Other                | -                          | Public body: Other via cfPoiN |
| 10  | Somebody working on behalf of a public body | -                             | {selected org}        | -                  | -                        | -                    | -                          | Contractor: named org         |
| 11  | Somebody working on behalf of a public body | -                             | Other                 | {free text}        | -                        | -                    | -                          | Contractor: other org         |

## Decision table: Land management scheme

The scheme determines the `detailed_work_type` and which agreement reference field is used.

| #   | Scheme (rTreXu)                                               | detailed_work_type              | Agreement ref field                                                                |
| --- | ------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| S1  | A Countryside Stewardship Higher Tier (CSHT) agreement        | `S28H Assent CS HT`             | WZJDQG ("What's your Countryside Stewardship Scheme agreement reference number?")  |
| S2  | A Countryside Stewardship Mid Tier (CSMT) agreement extension | `S28H Assent CS MT`             | WZJDQG ("What's your Countryside Stewardship Scheme agreement reference number?")  |
| S3  | A Countryside Stewardship Capital Grants agreement            | `S28H Assent CS Capital Grants` | WZJDQG ("What's your Countryside Stewardship Scheme agreement reference number?")  |
| S4  | A Higher Level Stewardship (HLS) agreement                    | `S28H Assent HLS extension`     | OFiizI ("What is your Higher Level Stewardship (HLS) agreement reference number?") |
| S5  | A Sustainable Farming Incentive (SFI) agreement               | `S28H Assent SFI`               | niVAkO ("What's your Sustainable Farming Incentive (SFI) agreement number?")       |
| S6  | A Minor and Temporary Adjustments (MTA)                       | `S28H Assent MTA`               | (none)                                                                             |
| S7  | Other schemes                                                 | `S28H Assent`                   | (none)                                                                             |
| S8  | (not set)                                                     | `S28H Assent`                   | (none)                                                                             |

## Decision table: SSSI path routing

| #   | Multiple SSSIs? (ASataH) | Repeater used                                                        | SSSI name field                                                                           | Coordinates field                                                    | Activity field                                         |
| --- | ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| P1  | No / not set             | gzSkgC ("Activities requiring Natural England's assent")             | gVlMxz ("What is the name of the SSSI where you plan to carry out activities?") from main | uqfCOY ("Where do you plan to carry out this activity?")             | lGsnXi ("What activity is planned to be carried out?") |
| P2  | Yes (scheme path)        | hhGvmX ("Sites where you plan to carry out activities")              | flbYHq ("What is the name of the SSSI where activities are planned?")                     | (none)                                                               | (none)                                                 |
| P3  | Yes (ORNEC path)         | QxIzSB ("Site name and activities requiring Natural England assent") | wRGnMW ("What is the name of the SSSI where you plan to carry out this activity?")        | KnBNzJ ("Where on the SSSI do you plan to carry out this activity?") | iNDqRN ("What activity is planned to be carried out?") |

## Decision table: European site

| #   | Could affect European site? (XydYUD) | Euro site repeater (aQYWxD)                                       | Result                                                         |
| --- | ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| E1  | Yes                                  | IzQfir ("What is the name of the European site?") entries present | `is_there_a_european_site` = `"Yes"`, euro_site_info populated |
| E2  | No / not set                         | -                                                                 | `is_there_a_european_site` = `"No"`, euro_site_info empty      |

## Complete submission scenarios

Combining the above tables, these are the main scenarios that result in a CWT submission:

| Scenario                                       | Identity  | Scheme | SSSI path | Description                                                   |
| ---------------------------------------------- | --------- | ------ | --------- | ------------------------------------------------------------- |
| Public body, CSHT, single SSSI                 | Row 1-9   | S1     | P1        | Public body with CS HT scheme, single SSSI with activities    |
| Public body, HLS, multiple SSSIs (scheme)      | Row 1-9   | S4     | P2        | Public body with HLS scheme, multiple SSSIs (scheme repeater) |
| Contractor, SFI, single SSSI                   | Row 10-11 | S5     | P1        | Contractor with SFI scheme, single SSSI                       |
| Public body, no scheme, multiple SSSIs (ORNEC) | Row 1-9   | S8     | P3        | Public body with no scheme, multiple SSSIs (ORNEC repeater)   |
| Public body, MTA, single SSSI, European site   | Row 1-9   | S6     | P1        | Public body with MTA, single SSSI, affects European site      |
| Contractor, other scheme, multiple SSSIs       | Row 10-11 | S7     | P2/P3     | Contractor with other scheme, multiple SSSIs                  |
