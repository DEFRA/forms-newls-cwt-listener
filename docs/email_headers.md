# Email Header Rules

## All Forms

- **Max length:** 255 characters (hard cut-off)
- **Format:** Segments joined with `-` separator
- **Truncation:** When site names exceed available space, names are dropped from the end with `(+N more)` appended. If even a single name doesn't fit, it's truncated with `...`

## Advice Form (`advice-form-mapper.js`)

| Priority   | Segment              | Source                                                                                                                   |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1 (prefix) | `detailed_work_type` | Always present (e.g., "Standalone HRA Reg 63", "S28i Advice", "LNRs", "SSSI - Other")                                    |
| 2          | Activities           | Path-specific free text: `mtiMfk` (drone path), `nJVeix` (HRA / S28i path), `YhWlKB` (damage path). Omitted when absent. |
| 3          | European site names  | HRA path: parsed from `TJuSNf` repeater `rtuWky` field                                                                   |
| 3          | SSSI names           | S28I path: parsed from repeater entries with `Avdzxa` field                                                              |
| 3          | Damaged SSSI name    | Damage reporting path: parsed from `MoCXGK` field                                                                        |
| 3          | Drone SSSI name      | Drone flying path: parsed from `PxvdiH` field                                                                            |

When no activity or site names are present and `xzEslQ = "Something else"`, `QmIGor` ("What is your question?") is appended instead.

**Truncation:** If the activity text is too long to leave room for site names, the activity is truncated with `"..."` to make space for the first site name.

### Examples

- `Standalone HRA Reg 63 - Residential development of 200 units - Arun Valley Ramsar, Abberton Reservoir Ramsar`
- `S28i Advice - Flood defence works - Abbey Wood SSSI`
- `SSSI - Regulation and Enforcement - Unauthorised tree felling - Damage Reporting SSSI`
- `SSSI - Other - Photography and wildlife observation - Aqualate Mere SSSI`
- `SSSI - Other` (general topics, no activity or sites)

## Consent Form (`consent-form-mapper.js`)

The primary segment is `[scheme and/or activities]` — both are included when both are present, with the scheme listed first.

| Priority       | Segment                | Source                                                                                                                                                           |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (primary)    | Land management scheme | `rTreXu` — when present, listed first. When `rTreXu = "Other schemes"`, replaced with the answer to `aIixRu` ("What is the name of the land management scheme?") |
| 1 (primary)    | All unique activities  | `iTBHrY.hqsZMS` (single SSSI) or `cwZgSE.BscJLV` (multi SSSI); appended after the scheme when both are present                                                   |
| 2              | SSSI names             | `hozdvW` (single), `cwZgSE.rWrBOK` (multi), or `gWZwzI.gVlMxz` (scheme multi)                                                                                    |
| Final fallback | `S28E Consent`         | When nothing else available                                                                                                                                      |

### Examples

- `Grazing, Fencing - Test SSSI`
- `Tree removal, Drainage - Test SSSI A, Test SSSI B`
- `A Countryside Stewardship Higher Tier (CSHT) agreement - SSSI One, SSSI Two`
- `A Countryside Stewardship Higher Tier (CSHT) agreement, Grazing - SSSI One, SSSI Two` (scheme + activities)
- `Landscape Recovery, Grazing - Test SSSI` (`Other schemes` selected, `aIixRu = "Landscape Recovery"`)
- `S28E Consent`

## Assent Form (`assent-form-mapper.js`)

The primary segment is `[scheme and/or activities]` — both are included when both are present, with the scheme listed first.

| Priority       | Segment                | Source                                                                                                                                                           |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (primary)    | Land management scheme | `rTreXu` — when present, listed first. When `rTreXu = "Other schemes"`, replaced with the answer to `aIixRu` ("What is the name of the land management scheme?") |
| 1 (primary)    | All unique activities  | `gzSkgC.lGsnXi` (single SSSI) or `QxIzSB.iNDqRN` (multi SSSI); appended after the scheme when both are present                                                   |
| 2              | SSSI names             | `gVlMxz` (single), `hhGvmX.flbYHq` (scheme multi), or `QxIzSB.wRGnMW` (ORNEC multi)                                                                              |
| 3              | European site names    | `aQYWxD.IzQfir`                                                                                                                                                  |
| Final fallback | `S28H Assent`          | When nothing else available                                                                                                                                      |

### Examples

- `Grazing, Fencing - Test SSSI`
- `Tree removal, Drainage - Test SSSI A, Test SSSI B`
- `Grazing - Test SSSI - Arun Valley Ramsar`
- `A Higher Level Stewardship (HLS) agreement - SSSI One, SSSI Two`
- `A Higher Level Stewardship (HLS) agreement, Grazing - SSSI One, SSSI Two` (scheme + activities)
- `Landscape Recovery, Grazing - Test SSSI` (`Other schemes` selected, `aIixRu = "Landscape Recovery"`)
- `S28H Assent`

## Shared Helpers (`helpers.js`)

- **`parseName(value)`** — Extracts the display name from `ID---Name` format (e.g., `"1005725---Popehouse Moor SSSI"` → `"Popehouse Moor SSSI"`)
- **`fitNames(names, maxLength)`** — Fits a list of names into available space with `(+N more)` truncation
- **`EMAIL_HEADER_MAX_LENGTH`** — Constant `255`
