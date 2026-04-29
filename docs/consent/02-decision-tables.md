# Consent form decision tables

This document enumerates every routing scenario through the consent form. Each row represents a unique path that leads to a submission being mapped and sent to CWT.

## Decision table: Applicant identity

The consent form has a simpler identity model than the assent form. The customer type maps directly to `consulting_body_type`.

| #   | Customer type (KTObNK)                                                  | Output consulting_body_type |
| --- | ----------------------------------------------------------------------- | --------------------------- |
| 1   | An owner of land within a SSSI                                          | `Landowner`                 |
| 2   | An occupier of land within a SSSI                                       | `Land occupier`             |
| 3   | Someone working on behalf of an owner or occupier of land within a SSSI | `Consultant`                |
| 4   | Somebody else                                                           | `Other`                     |

## Decision table: Land management scheme

The scheme determines the `detailed_work_type` and which agreement reference field is used.

| #   | Scheme (rTreXu)                                               | detailed_work_type               | Agreement ref field                                                         |
| --- | ------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| S1  | A Countryside Stewardship Higher Tier (CSHT) agreement        | `S28E Consent CS HT`             | WZJDQG ("What's your Countryside Stewardship agreement reference number?")  |
| S2  | A Countryside Stewardship Mid Tier (CSMT) agreement extension | `S28E Consent CS MT`             | WZJDQG ("What's your Countryside Stewardship agreement reference number?")  |
| S3  | A Countryside Stewardship Capital Grants agreement            | `S28E Consent CS Capital Grants` | WZJDQG ("What's your Countryside Stewardship agreement reference number?")  |
| S4  | A Higher Level Stewardship (HLS) agreement                    | `S28E Consent HLS extension`     | OFiizI ("What's your Higher Level Stewardship agreement reference number?") |
| S5  | A Sustainable Farming Incentive (SFI) agreement               | `S28E Consent SFI`               | niVAkO ("What's your Sustainable Farming Incentive agreement number?")      |
| S6  | A Minor and Temporary Adjustments (MTA)                       | `S28E Consent MTA`               | (none)                                                                      |
| S7  | Other schemes                                                 | `S28E Consent`                   | (none)                                                                      |
| S8  | (not set)                                                     | `S28E Consent`                   | (none)                                                                      |

## Decision table: SSSI path routing

| #   | Multiple SSSIs? (lmqMaY)  | Repeater used                                                         | SSSI name field                                                                           | Coordinates field                                                     | Activity field                                      |
| --- | ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| P1a | No / not set (non-scheme) | iTBHrY ("Operations requiring Natural England consent")               | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") from main | QKdhfh ("Where do you plan to carry out this activity?") per activity | hqsZMS ("Which activity do you plan to carry out?") |
| P1b | No / not set (scheme)     | (none)                                                                | hozdvW ("What is the name of the SSSI where you plan to carry out activities?") from main | JPohUD ("Where are the activities taking place?") from main           | (none)                                              |
| P2a | Yes (non-scheme)          | cwZgSE ("Site name and operations requiring Natural England consent") | rWrBOK ("What is the name of the SSSI where you plan to carry out this activity?")        | gjWdrc ("Where on the SSSI do you plan to carry out this activity?")  | BscJLV ("Which activity do you plan to carry out?") |
| P2b | Yes (scheme)              | gWZwzI ("Sites where you plan to carry out activities")               | gVlMxz ("What is the name of the SSSI where activities are planned?")                     | (none)                                                                | (none)                                              |

## Decision table: email_header

Uses the same segments as `description` (scheme and/or activities, plus SSSI names) but truncated to 255 characters. Falls back to `"S28E Consent"`.

| #   | Condition                                             | Output                                                     |
| --- | ----------------------------------------------------- | ---------------------------------------------------------- |
| H1  | Scheme present and activities present                 | Scheme text, then activities comma-joined, plus SSSI names |
| H2  | Activities present (from iTBHrY or cwZgSE), no scheme | All unique activities comma-joined, plus SSSI names        |
| H3  | No activities, scheme present (rTreXu)                | Full scheme text, plus SSSI names                          |
| H4  | No activities, no scheme, SSSI names present          | SSSI names only                                            |
| H5  | No activities, no scheme, no SSSI names               | `"S28E Consent"`                                           |

## Complete submission scenarios

Combining the above tables, these are the main scenarios that result in a CWT submission:

| Scenario                                       | Identity | Scheme | SSSI path | Description                                                           |
| ---------------------------------------------- | -------- | ------ | --------- | --------------------------------------------------------------------- |
| Landowner, CSHT, single SSSI with ORNECs       | Row 1    | S1     | P1a       | Landowner with CS HT scheme, single SSSI with ORNEC activities        |
| Landowner, CSHT, single SSSI (scheme coords)   | Row 1    | S1     | P1b       | Landowner with CS HT scheme, single SSSI with scheme coordinates only |
| Occupier, HLS, multiple SSSIs (scheme)         | Row 2    | S4     | P2b       | Land occupier with HLS scheme, multiple SSSIs (scheme repeater)       |
| Consultant, no scheme, single SSSI with ORNECs | Row 3    | S8     | P1a       | Consultant without scheme, single SSSI with ORNEC activities          |
| Other, SFI, multiple SSSIs with ORNECs         | Row 4    | S5     | P2a       | Other user with SFI scheme, multiple SSSIs with ORNEC activities      |
| Landowner, other permission, single SSSI       | Row 1    | S8     | P1b       | Landowner with named permission, single SSSI (no agreement reference) |
