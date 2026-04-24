# Description Field Mapping

## Previous Behaviour

### Advice Form

The description was built from path-dependent fields joined with `-`:

- **HRA path:** `"Advice on [HRA stage in lowercase]"` + raw Euro site values (e.g., `"11004---Arun Valley Ramsar"`) joined by `, `
- **S28I SSSI path:** Raw SSSI values (e.g., `"1001001---Test SSSI"`) joined by `, `
- **General topics path:** The topic text from `xzEslQ`
- Additional free-text fields were appended when present: `QmIGor` ("What is your question?"), `nJVeix` ("Tell us about the proposed activities"), `YhWlKB` ("Give a description of the damaging activity")

Example: `"Advice on screening stage - UK11004---Arun Valley Ramsar"`

### Consent Form

The description was built from raw SSSI names and activities, with per-SSSI grouping:

- **Single SSSI:** `"[raw SSSI value] - [activity1], [activity2]"` or just `"[raw SSSI value]"` if no activities
- **Multi SSSI:** `"[raw SSSI A] - [activity1], [activity2]; [raw SSSI B] - [activity3]"` (activities grouped per SSSI, SSSIs separated by `; `)
- **Multi SSSI scheme path:** Raw SSSI values separated by `; `

Example: `"1001001---Test SSSI A - Grazing, Fencing; 1001002---Test SSSI B - Drainage"`

### Assent Form

The description was built from activity names or a scheme + SSSI fallback:

- **Activities present:** All activity names joined by `, ` (no SSSI names included)
- **No activities:** Scheme name + raw SSSI values joined by `, `
- **Nothing available:** Empty string `""`

Example: `"A Higher Level Stewardship (HLS) agreement, 2006159---SSSI One, 1001610---SSSI Two"`

## New Behaviour

The description now follows the same structure as the `email_header` field (see [email_headers.md](./email_headers.md)) but **without any length limit**. Site names are parsed from the `"ID---Name"` format to show only the human-readable name (e.g., `"Arun Valley Ramsar"` instead of `"11004---Arun Valley Ramsar"`). Segments are joined with `-`.

### Advice Form

**Format:** `[detailed_work_type] - [activities] - [site names]`

Activities and site names are each omitted when not present.

| Segment              | Source                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `detailed_work_type` | Always present (e.g., "Standalone HRA Reg 63", "S28i Advice", "SSSI - Other")                                                                                                        |
| Activities           | Path-specific free text — `mtiMfk` (drone path), `nJVeix` (HRA / S28i path), or `YhWlKB` (damage path). Only one is present per submission; omitted when absent.                     |
| Site names           | HRA path: Euro site names from `TJuSNf.rtuWky`; S28I path: SSSI names from `Avdzxa`; Damage path: SSSI name from `MoCXGK`; Drone path: SSSI name from `PxvdiH`. Omitted when absent. |

When neither activities nor site names are present and `xzEslQ = "Something else"`, the free-text question from `QmIGor` is appended instead.

**Examples:**

- `Standalone HRA Reg 63 - Residential development of 200 units - Arun Valley Ramsar`
- `S28i Advice - Felling of 5 hectares of conifer plantation - Test SSSI`
- `SSSI - Regulation and Enforcement - Unauthorised tree felling - Damage Reporting SSSI`
- `SSSI - Other - Photography and wildlife observation - Aqualate Mere SSSI`
- `SSSI - Other` (general topics, no activity or sites)

### Consent Form

**Format:** `[scheme and/or activities] - [SSSI names]`

| Segment    | Source                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Scheme     | `rTreXu` — when present, listed first in the primary segment                                                                              |
| Activities | All unique activities from `iTBHrY.hqsZMS` (single SSSI) or `cwZgSE.BscJLV` (multi SSSI); appended after the scheme when both are present |
| SSSI names | Parsed from `hozdvW` (single), `cwZgSE.rWrBOK` (multi), or `gWZwzI.gVlMxz` (scheme multi)                                                 |
| Fallback   | `"S28E Consent"` when nothing else is available                                                                                           |

**Examples:**

- `Grazing, Fencing - Test SSSI`
- `Grazing, Fencing, Drainage - Test SSSI A, Test SSSI B`
- `A Countryside Stewardship Higher Tier (CSHT) agreement, Grazing - SSSI One, SSSI Two` (scheme + activities)
- `A Countryside Stewardship Higher Tier (CSHT) agreement - SSSI One, SSSI Two` (scheme only)
- `Test SSSI` (SSSI name only, no activities or scheme)
- `S28E Consent`

### Assent Form

**Format:** `[scheme and/or activities] - [SSSI names] - [Euro site names]`

| Segment         | Source                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Scheme          | `rTreXu` — when present, listed first in the primary segment                                                                              |
| Activities      | All unique activities from `gzSkgC.lGsnXi` (single SSSI) or `QxIzSB.iNDqRN` (multi SSSI); appended after the scheme when both are present |
| SSSI names      | Parsed from `gVlMxz` (single), `hhGvmX.flbYHq` (scheme multi), or `QxIzSB.wRGnMW` (ORNEC multi)                                           |
| Euro site names | Parsed from `aQYWxD.IzQfir`                                                                                                               |
| Fallback        | `"S28H Assent"` when nothing else is available                                                                                            |

**Examples:**

- `Grazing, Fencing - Test SSSI`
- `Tree removal, Drainage - Test SSSI A, Test SSSI B`
- `Grazing - Test SSSI - Arun Valley Ramsar`
- `A Higher Level Stewardship (HLS) agreement, Grazing - SSSI One, SSSI Two` (scheme + activities)
- `A Higher Level Stewardship (HLS) agreement - SSSI One, SSSI Two` (scheme only)
- `S28H Assent`

## Key Changes Summary

| Aspect                    | Previous                                                                           | New                                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site names                | Raw `"ID---Name"` values                                                           | Parsed display names only                                                                                                                            |
| Structure                 | Varied per form (grouped, topic text, HRA stage, etc.)                             | Consistent across all forms: `[primary] - [SSSI names] - [Euro site names]`                                                                          |
| Activities in description | Consent: first activity or per-SSSI grouping; Assent: all activities; Advice: none | All forms include activities. Advice: path-specific free-text field as middle segment. Consent/Assent: all unique activities as the primary segment. |
| Empty fallback            | Advice/Consent: empty or partial; Assent: empty string                             | Form-specific fallback: `"SSSI - Other"` / `"S28E Consent"` / `"S28H Assent"`                                                                        |
| Max length                | No limit                                                                           | No limit (same as before)                                                                                                                            |
