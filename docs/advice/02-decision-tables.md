# Advice form decision tables

This document enumerates every routing scenario through the advice form. Each row represents a unique path that leads to a submission being mapped and sent to CWT.

## Decision table: Applicant identity

Every submission includes an applicant identity. The identity determines which questions are asked and how `consulting_body_type` and `consulting_body` are resolved.

| #   | Category (teEzOl)   | Working on behalf of (PBmxNM) | Agency (PvUZyQ)         | Other agency (hOsLRu) | Local authority (YouDQP) | Public body (HiTHQX) | Other public body (OYxtmu) | Effective type                     |
| --- | ------------------- | ----------------------------- | ----------------------- | --------------------- | ------------------------ | -------------------- | -------------------------- | ---------------------------------- |
| 1   | Government Agency   | -                             | Forestry Commission     | -                     | -                        | -                    | -                          | FC direct                          |
| 2   | Government Agency   | -                             | Environment Agency      | -                     | -                        | -                    | -                          | EA direct                          |
| 3   | Government Agency   | -                             | Other government agency | {free text}           | -                        | -                    | -                          | Other gov direct                   |
| 4   | Regional body (LPA) | -                             | -                       | -                     | {selected LA}            | -                    | -                          | LPA direct                         |
| 5   | Harbour authority   | -                             | -                       | -                     | -                        | {selected body}      | -                          | Public body direct                 |
| 6   | Harbour authority   | -                             | -                       | -                     | -                        | Other                | {free text}                | Public body (other) direct         |
| 7   | Utility provider    | -                             | -                       | -                     | -                        | {selected body}      | -                          | Public body direct                 |
| 8   | Utility provider    | -                             | -                       | -                     | -                        | Other                | {free text}                | Public body (other) direct         |
| 9   | Landowner           | -                             | -                       | -                     | -                        | -                    | -                          | Non-S28G                           |
| 10  | Land occupier       | -                             | -                       | -                     | -                        | -                    | -                          | Non-S28G                           |
| 11  | Member of public    | -                             | -                       | -                     | -                        | -                    | -                          | Non-S28G                           |
| 12  | Consultant          | Government agency             | Forestry Commission     | -                     | -                        | -                    | -                          | FC via consultant                  |
| 13  | Consultant          | Government agency             | Environment Agency      | -                     | -                        | -                    | -                          | EA via consultant                  |
| 14  | Consultant          | Government agency             | Other government agency | {free text}           | -                        | -                    | -                          | Other gov via consultant           |
| 15  | Consultant          | Local Planning Authority      | -                       | -                     | {selected LA}            | -                    | -                          | LPA via consultant                 |
| 16  | Consultant          | Public body or organisation   | -                       | -                     | -                        | {selected body}      | -                          | Public body via consultant         |
| 17  | Consultant          | Public body or organisation   | -                       | -                     | -                        | Other                | {free text}                | Public body (other) via consultant |
| 18  | Consultant          | Landowner                     | -                       | -                     | -                        | -                    | -                          | Non-S28G via consultant            |
| 19  | Consultant          | Land occupier                 | -                       | -                     | -                        | -                    | -                          | Non-S28G via consultant            |
| 20  | Consultant          | None of the above             | -                       | -                     | -                        | -                    | -                          | Non-S28G via consultant            |
| 21  | Other               | Government agency             | Forestry Commission     | -                     | -                        | -                    | -                          | FC via other                       |
| 22  | Other               | Government agency             | Environment Agency      | -                     | -                        | -                    | -                          | EA via other                       |
| 23  | Other               | Government agency             | Other government agency | {free text}           | -                        | -                    | -                          | Other gov via other                |
| 24  | Other               | Local Planning Authority      | -                       | -                     | {selected LA}            | -                    | -                          | LPA via other                      |
| 25  | Other               | Public body or organisation   | -                       | -                     | -                        | {selected body}      | -                          | Public body via other              |
| 26  | Other               | Public body or organisation   | -                       | -                     | -                        | Other                | {free text}                | Public body (other) via other      |
| 27  | Other               | Landowner                     | -                       | -                     | -                        | -                    | -                          | Non-S28G via other                 |
| 28  | Other               | Land occupier                 | -                       | -                     | -                        | -                    | -                          | Non-S28G via other                 |
| 29  | Other               | None of the above             | -                       | -                     | -                        | -                    | -                          | Non-S28G via other                 |

**S28G bodies** (rows 1-8, 12-17, 21-26) see the [S28G advice type page](#advice-type-routing). **Non-S28G** (rows 9-11, 18-20, 27-29) go directly to [topic selection](#topic-selection-routing). **FC direct** (row 1) and **FC via consultant/other** (rows 12, 21) see the FC-specific advice type page.

## Decision table: Advice type routing

### FC advice type (NVRbCy) - Rows 1, 12, 21 only

| #   | FC advice type   | Leads to                                           |
| --- | ---------------- | -------------------------------------------------- |
| A1  | HRA advice       | HRA path                                           |
| A2  | S28I SSSI advice | S28I SSSI path (with woodland management question) |
| A3  | Something else   | Topic selection                                    |

### S28G advice type (YOwPAJ) - All S28G bodies except FC

| #   | S28G advice type      | Leads to        |
| --- | --------------------- | --------------- |
| B1  | Standalone HRA advice | HRA path        |
| B2  | S28i SSSI advice      | S28I SSSI path  |
| B3  | Something else        | Topic selection |

### Topic selection (xzEslQ) - Non-S28G users + "Something else" from above

| #   | Topic                                 | Leads to                   | Exits form? |
| --- | ------------------------------------- | -------------------------- | ----------- |
| C1  | Pre-consent advice (SSSI landowner)   | General question path      | No          |
| C2  | Pre-assent advice (public body)       | Pre-assent advice path     | Maybe       |
| C3  | Report potentially damaging activity  | Damage reporting path      | Maybe       |
| C4  | Submit/request surveys or SSSI info   | General question path      | No          |
| C5  | Question about NNRs                   | General question path      | No          |
| C6  | Designating a Local Nature Reserve    | LNR info page              | Yes         |
| C7  | Flying drones (Member of public only) | Drone flying path          | Maybe       |
| C8  | Designating or de-designating SSSIs   | SSSI designation info page | Yes         |
| C9  | Sale of SSSI land                     | General question path      | No          |
| C10 | Something else                        | General question path      | No          |

## Decision table: Statutory advice sub-routing

These apply within the HRA and S28I paths.

### HRA / S28I SSSI damage and impact decisions

| #   | Advice path | SSSI damage? (xZiZct) | Positive impact? (lthlBG) | Result                                           |
| --- | ----------- | --------------------- | ------------------------- | ------------------------------------------------ |
| D1  | HRA         | Yes                   | n/a                       | Continues to SSSI affected + proposed activities |
| D2  | HRA         | No                    | Yes                       | Continues to SSSI affected + proposed activities |
| D3  | HRA         | No                    | No                        | Exit: "You do not need to apply for advice"      |
| D4  | S28I SSSI   | Yes                   | n/a                       | Continues to SSSI affected + proposed activities |
| D5  | S28I SSSI   | No                    | Yes                       | Continues to SSSI affected + proposed activities |
| D6  | S28I SSSI   | No                    | No                        | Exit: "You do not need to apply for advice"      |

### Proposed activities format (PkpWyY) - Statutory advice only

| #   | Format          | Shows text field (nJVeix)? | Shows upload (mSdBUD)? |
| --- | --------------- | -------------------------- | ---------------------- |
| E1  | Free text       | Yes                        | No                     |
| E2  | Document upload | No                         | Yes                    |
| E3  | Both            | Yes                        | Yes                    |

### Damage reporting sub-decisions

| #   | Evidence available? (lZPtJq) | Result                                                                |
| --- | ---------------------------- | --------------------------------------------------------------------- |
| F1  | Yes                          | Continues to SSSI name, location, dates, description, evidence upload |
| F2  | No                           | Exit: "We need more information" info page                            |

### Pre-assent advice sub-decisions

| #   | Need more advice? (vrkhAP) | Relates to EU sites? (RaeQeB) | Need even more advice? (wUBTXX) | Result                               |
| --- | -------------------------- | ----------------------------- | ------------------------------- | ------------------------------------ |
| G1  | No                         | n/a                           | n/a                             | Exit: "Thanks for using our service" |
| G2  | Yes                        | No                            | n/a                             | Continues to contact details         |
| G3  | Yes                        | Yes                           | No                              | Exit: "Thanks for using our service" |
| G4  | Yes                        | Yes                           | Yes                             | Continues to contact details         |

## Complete submission scenarios

Combining the above tables, these are all the scenarios that result in a CWT submission:

| Scenario               | Identity rows                 | Advice type | Sub-routing       | Description                                              |
| ---------------------- | ----------------------------- | ----------- | ----------------- | -------------------------------------------------------- |
| FC HRA                 | 1, 12, 21                     | A1          | D1 or D2          | FC user requesting HRA advice with SSSI impact           |
| FC S28I SSSI           | 1, 12, 21                     | A2          | D4 or D5          | FC user requesting S28I advice with SSSI impact          |
| S28G HRA               | 2-8, 13-17, 22-26             | B1          | D1 or D2          | S28G body requesting HRA advice with SSSI impact         |
| S28G S28I SSSI         | 2-8, 13-17, 22-26             | B2          | D4 or D5          | S28G body requesting S28I advice with SSSI impact        |
| General: Pre-consent   | 9-11, 18-20, 27-29 (or A3/B3) | C1          | -                 | Landowner/occupier seeking pre-consent advice            |
| General: Pre-assent    | 9-11, 18-20, 27-29 (or A3/B3) | C2          | G2 or G4          | Public body representative needing further assent advice |
| General: Damage report | 9-11, 18-20, 27-29 (or A3/B3) | C3          | F1                | Reporting SSSI damage with evidence                      |
| General: Surveys/info  | 9-11, 18-20, 27-29 (or A3/B3) | C4          | -                 | Requesting SSSI survey/condition info                    |
| General: NNRs          | 9-11, 18-20, 27-29 (or A3/B3) | C5          | -                 | Question about National Nature Reserves                  |
| General: Drones        | 11 (Member of public only)    | C7          | Permission needed | Drone flying request on SSSI                             |
| General: SSSI sale     | 9-11, 18-20, 27-29 (or A3/B3) | C9          | -                 | Question about SSSI land sale                            |
| General: Other         | 9-11, 18-20, 27-29 (or A3/B3) | C10         | -                 | Any other question                                       |
