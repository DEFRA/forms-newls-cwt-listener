# Output Mapping

This document describes how the `description` and `email_header` output properties are generated for each of the three forms (Advice, Assent, Consent).

The `email_header` property uses identical source data and precedence to the `description` property. The only difference is that `email_header` is truncated to a maximum of **255 characters** (`EMAIL_HEADER_MAX_LENGTH`). When truncation is required:

- If multiple names need to fit, `fitNames()` progressively drops trailing names and appends `" (+N more)"`.
- If a single segment still overflows, it is truncated and suffixed with `"..."`.

Source files:

- `src/service/mappers/advice-form-mapper.js`
- `src/service/mappers/assent-form-mapper.js`
- `src/service/mappers/consent-form-mapper.js`
- `src/service/mappers/helpers.js` (shared `fitNames`, `parseName`, `EMAIL_HEADER_MAX_LENGTH`)

---

## Advice form

### `description`

Format: `[detailed_work_type] - [activities] - [site names]` (activities and site names each omitted when not present). When neither activities nor site names apply and the general-topic path was chosen with `xzEslQ = "Something else"`, the `QmIGor` free-text question is appended instead.

`detailed_work_type` is itself derived with its own precedence (NVRbCy → YOwPAJ → xzEslQ). The `detailed_work_type` table is included below for completeness.

#### Derivation of `detailed_work_type` (feeds the description prefix)

| Precedence | Prerequisites                                                                                                            | Driving question(s)                                                   | Resulting `detailed_work_type`                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------ |
| 1          | `NVRbCy = "Habitats Regulations Assessment (HRA) advice"`                                                                | **NVRbCy** — "What type of advice are you requesting?"                | `Standalone HRA Reg 63`                                |
| 1          | `NVRbCy = "Section 28i SSSI advice (statutory consultation, not including HRA)"`                                         | **NVRbCy** — "What type of advice are you requesting?"                | `S28i Advice`                                          |
| 2          | `NVRbCy` missing or `"Something else"`; `YOwPAJ = "Habitats Regulations Assessment (HRA) advice"`                        | **YOwPAJ** — "Tell us which type of advice you are requesting"        | `Standalone HRA Reg 63`                                |
| 2          | `NVRbCy` missing or `"Something else"`; `YOwPAJ = "Section 28i SSSI advice (statutory consultation, not including HRA)"` | **YOwPAJ** — "Tell us which type of advice you are requesting"        | `S28i Advice`                                          |
| 3          | Neither NVRbCy nor YOwPAJ resolve (i.e. `"Something else"` / missing); `xzEslQ` present                                  | **xzEslQ** — "Which topic fits the nature of your question the best?" | Lookup in `generalTopicToDetailedWorkType` (see below) |
| 4          | Fallback when nothing else matches                                                                                       | —                                                                     | `SSSI - Other`                                         |

`generalTopicToDetailedWorkType` mapping (xzEslQ → detailed_work_type):

| xzEslQ value                                                                                      | detailed_work_type                  |
| ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `I am a SSSI landowner or land occupier and I would like advice before applying for SSSI consent` | `SSSI - Pre Consent advice`         |
| `I represent a public body and I would like advice before applying for SSSI assent`               | `SSSI - Pre Assent advice`          |
| `I would like to report potentially damaging activity on or near a protected site`                | `SSSI - Regulation and Enforcement` |
| `I would like to submit or request surveys or information about the condition of SSSIs`           | `SSSI - Site visits/surveys`        |
| `I have a question about Natural England managed National Nature Reserves (NNRs)`                 | `SSSI - Other`                      |
| `I have a question about designating a Local Nature Reserve (LNR)`                                | `LNRs`                              |
| `I have a question about flying drones on or near a protected site`                               | `SSSI - Other`                      |
| `I have a question about designating or de-designating SSSIs`                                     | `SSSI - Other`                      |
| `I have a question about the sale of SSSI land`                                                   | `SSSI - Other`                      |
| `Something else`                                                                                  | `SSSI - Other`                      |

#### Activities segment

| Precedence | Prerequisites                                                          | Driving question                                                     | Result                       |
| ---------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| 1          | `mtiMfk` present (drone flying path)                                   | **mtiMfk** — "Tell us more about the proposed drone flying activity" | The free-text value verbatim |
| 2          | `mtiMfk` absent; `nJVeix` present (S28i / general SSSI path)           | **nJVeix** — "Tell us about the proposed activities"                 | The free-text value verbatim |
| 3          | `mtiMfk` and `nJVeix` absent; `YhWlKB` present (damage reporting path) | **YhWlKB** — "Give a description of the damaging activity"           | The free-text value verbatim |
| 4          | None present                                                           | —                                                                    | No activities segment        |

Only one of these fields will be present in any given submission (they are path-specific).

#### Site-name segment

| Precedence                       | Prerequisites                                                                                                          | Driving question(s)                                                                           | Segment appended                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1 (HRA path)                     | `NVRbCy = "Habitats Regulations Assessment (HRA) advice"` OR `YOwPAJ = "Habitats Regulations Assessment (HRA) advice"` | **TJuSNf** repeater (`rtuWky` — "What is the name of the European site?")                     | Comma-separated European site names (`parseName` strips `ID---` prefix) |
| 2 (S28i SSSI path)               | `NVRbCy = "Section 28i SSSI advice…"` OR `YOwPAJ = "Section 28i SSSI advice…"`                                         | All repeaters' `Avdzxa` — "What is the name of SSSI where the activities will cause impacts?" | Comma-separated SSSI names                                              |
| 3 (Damage-report path)           | Neither HRA nor S28i path; `MoCXGK` present                                                                            | **MoCXGK** — "What is the name of the SSSI that you would like to report damage for?"         | Single SSSI name                                                        |
| 4 (Drone path)                   | Neither HRA/S28i/damage path; `PxvdiH` present                                                                         | **PxvdiH** — "What is the name of the SSSI?"                                                  | Single SSSI name                                                        |
| 5 (General-topic free-text path) | No site names AND no activities AND `xzEslQ = "Something else"` AND `QmIGor` present                                   | **QmIGor** — "What is your question?"                                                         | The free-text question (replaces the site-name suffix)                  |
| 6 (General-topic default)        | No site names and not the free-text path                                                                               | —                                                                                             | No suffix                                                               |

### `email_header`

Same data and precedence as `description`. Differences:

- Capped at **255 chars**.
- For the activities segment: if `detailed_work_type + activities` leaves insufficient room for site names, the activity text is truncated with `"..."` to make space for the first site name.
- For site-name suffixes, `fitNames()` trims trailing names and adds `" (+N more)"`.
- For the free-text (`QmIGor`) suffix (no activities or site names), the whole string is truncated with `"..."` if too long.
- If even `detailed_work_type` alone exceeds 255 chars, it is truncated with `"..."`.

---

## Assent form

### `description`

Format: `[activities and/or scheme] - [SSSI names] - [European site names]`. Empty segments are omitted. Fallback when all segments are empty: `S28H Assent`.

#### Primary segment (activities and/or scheme)

Activities and scheme are independent: both are included when both are present. The segment is built by joining (with `, `) the activities list (if any) followed by the scheme text (if selected).

| Source       | Prerequisites                                          | Driving question(s)                                                                                                                        | Contribution                     |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Activities 1 | Single-SSSI path: repeater `gzSkgC` populated          | **lGsnXi** — "What activity is planned to be carried out?" (repeater `gzSkgC` "Activities requiring Natural England's assent")             | Unique activities joined by `, ` |
| Activities 2 | Otherwise multi-SSSI path: repeater `QxIzSB` populated | **iNDqRN** — "What activity is planned to be carried out?" (repeater `QxIzSB` "Site name and activities requiring Natural England assent") | Unique activities joined by `, ` |
| Scheme       | `rTreXu` selected                                      | **rTreXu** — "What land management scheme does this notice relate to?"                                                                     | The scheme text verbatim         |
| Fallback     | No activities and no scheme                            | —                                                                                                                                          | Empty                            |

#### SSSI-names segment

| Precedence | Prerequisites                                                    | Driving question(s)                                                                                        | Result                            |
| ---------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1          | `gVlMxz` present (single SSSI path)                              | **gVlMxz** — "What is the name of the SSSI where you plan to carry out activities?"                        | One SSSI name (after `parseName`) |
| 2          | `gVlMxz` missing; repeater `hhGvmX` populated                    | **flbYHq** — "What is the name of the SSSI where activities are planned?" (repeater `hhGvmX`)              | All parsed SSSI names             |
| 3          | `gVlMxz` missing and `hhGvmX` empty; repeater `QxIzSB` populated | **wRGnMW** — "What is the name of the SSSI where you plan to carry out this activity?" (repeater `QxIzSB`) | Unique parsed SSSI names          |
| 4          | None present                                                     | —                                                                                                          | Empty                             |

#### European-site-names segment

| Precedence | Prerequisites                                   | Driving question(s)                                                                                | Result                         |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1          | Repeater `aQYWxD` entries with `IzQfir` present | **IzQfir** — "What is the name of the European site?" (repeater `aQYWxD` "European site affected") | All parsed European site names |
| 2          | No such entries                                 | —                                                                                                  | Empty                          |

#### Fallback

| Precedence | Prerequisites                                                | Result        |
| ---------- | ------------------------------------------------------------ | ------------- |
| Final      | Primary empty AND SSSI names empty AND Euro site names empty | `S28H Assent` |

### `email_header`

Same data and precedence as `description`. Difference:

- Total length capped at **255 chars**.
- SSSI-names segment is fitted via `fitNames()`, reserving space for at least the first Euro-site name if any are present.
- Euro-site-names segment is fitted via `fitNames()` with whatever remains.
- If, after all fitting, the result still overruns 255 chars, it is truncated and suffixed with `"..."`.
- Fallback remains `S28H Assent` when all segments are empty.

---

## Consent form

### `description`

Format: `[activities and/or scheme] - [SSSI names]`. Empty segments are omitted. Fallback when both segments are empty: `S28E Consent`.

#### Primary segment (activities and/or scheme)

Activities and scheme are independent: both are included when both are present. The segment is built by joining (with `, `) the activities list (if any) followed by the scheme text (if selected).

| Source       | Prerequisites                                             | Driving question(s)                                                                                                                      | Contribution                     |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Activities 1 | Repeater `iTBHrY` populated (single-SSSI non-scheme path) | **hqsZMS** — "Which activity do you plan to carry out?" (repeater `iTBHrY` "Operations requiring Natural England consent")               | Unique activities joined by `, ` |
| Activities 2 | Otherwise repeater `cwZgSE` populated (multi-SSSI path)   | **BscJLV** — "Which activity do you plan to carry out?" (repeater `cwZgSE` "Site name and operations requiring Natural England consent") | Unique activities joined by `, ` |
| Scheme       | `rTreXu` selected                                         | **rTreXu** — "What land management scheme does this notice relate to?"                                                                   | The scheme text verbatim         |
| Fallback     | No activities and no scheme                               | —                                                                                                                                        | Empty                            |

#### SSSI-names segment

| Precedence | Prerequisites                                                                             | Driving question(s)                                                                                                                          | Result                   |
| ---------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1          | `hozdvW` present (single-SSSI path)                                                       | **hozdvW** — "What is the name of the SSSI where you plan to carry out activities?"                                                          | One parsed SSSI name     |
| 2          | `hozdvW` missing; repeater `cwZgSE` populated                                             | **rWrBOK** — "What is the name of the SSSI where you plan to carry out this activity?" (repeater `cwZgSE`)                                   | Unique parsed SSSI names |
| 3          | `hozdvW` missing and `cwZgSE` empty; repeater `gWZwzI` populated (multi-SSSI scheme path) | **gVlMxz** — "What is the name of the SSSI where activities are planned?" (repeater `gWZwzI` "Sites where you plan to carry out activities") | Parsed SSSI names        |
| 4          | None present                                                                              | —                                                                                                                                            | Empty                    |

#### Fallback

| Precedence | Prerequisites                      | Result         |
| ---------- | ---------------------------------- | -------------- |
| Final      | Primary empty AND SSSI names empty | `S28E Consent` |

### `email_header`

Same data and precedence as `description`. Differences:

- Capped at **255 chars**.
- If only the primary is present: truncated with `"..."` if too long.
- If only SSSI names are present: fitted via `fitNames()` into the full 255 chars.
- If both are present: `primary - ` is the prefix; the SSSI-names list is fitted into the remaining space via `fitNames()` (which adds `" (+N more)"` when dropping names). If nothing fits, the primary alone is truncated to 255 chars.
- Fallback remains `S28E Consent` when both segments are empty.
