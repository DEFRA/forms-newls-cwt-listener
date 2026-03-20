# Email Header Rules

## All Forms

- **Max length:** 255 characters (hard cut-off)
- **Format:** Segments joined with `-` separator
- **Truncation:** When site names exceed available space, names are dropped from the end with `(+N more)` appended. If even a single name doesn't fit, it's truncated with `...`

## Advice Form (`advice-form-mapper.js`)

| Priority   | Segment              | Source                                                                                |
| ---------- | -------------------- | ------------------------------------------------------------------------------------- |
| 1 (prefix) | `detailed_work_type` | Always present (e.g., "Standalone HRA Reg 63", "S28i Advice", "LNRs", "SSSI - Other") |
| 2          | European site names  | HRA path: parsed from `TJuSNf` repeater `rtuWky` field                                |
| 2          | SSSI names           | S28I path: parsed from repeater entries with `Avdzxa` field                           |
| 2          | Damaged SSSI name    | Damage reporting path: parsed from `MoCXGK` field                                     |

### Examples

- `Standalone HRA Reg 63 - Arun Valley Ramsar, Abberton Reservoir Ramsar`
- `S28i Advice - Abbey Wood SSSI`
- `SSSI - Site visits/surveys - Damage Reporting SSSI`
- `SSSI - Other` (general topics, no sites)

## Consent Form (`consent-form-mapper.js`)

| Priority       | Segment                | Source                                                                        |
| -------------- | ---------------------- | ----------------------------------------------------------------------------- |
| 1 (primary)    | All unique activities  | `iTBHrY.hqsZMS` (single SSSI) or `cwZgSE.BscJLV` (multi SSSI)                 |
| 1 (fallback)   | Land management scheme | `rTreXu` (when no activities)                                                 |
| 2              | SSSI names             | `hozdvW` (single), `cwZgSE.rWrBOK` (multi), or `gWZwzI.gVlMxz` (scheme multi) |
| Final fallback | `S28E Consent`         | When nothing else available                                                   |

### Examples

- `Grazing, Fencing - Test SSSI`
- `Tree removal, Drainage - Test SSSI A, Test SSSI B`
- `A Countryside Stewardship Higher Tier (CSHT) agreement - SSSI One, SSSI Two`
- `S28E Consent`

## Assent Form (`assent-form-mapper.js`)

| Priority       | Segment                | Source                                                                              |
| -------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| 1 (primary)    | All unique activities  | `gzSkgC.lGsnXi` (single SSSI) or `QxIzSB.iNDqRN` (multi SSSI)                       |
| 1 (fallback)   | Land management scheme | `rTreXu` (when no activities)                                                       |
| 2              | SSSI names             | `gVlMxz` (single), `hhGvmX.flbYHq` (scheme multi), or `QxIzSB.wRGnMW` (ORNEC multi) |
| 3              | European site names    | `aQYWxD.IzQfir`                                                                     |
| Final fallback | `S28H Assent`          | When nothing else available                                                         |

### Examples

- `Grazing, Fencing - Test SSSI`
- `Tree removal, Drainage - Test SSSI A, Test SSSI B`
- `Grazing - Test SSSI - Arun Valley Ramsar`
- `A Higher Level Stewardship (HLS) agreement - SSSI One, SSSI Two`
- `S28H Assent`

## Shared Helpers (`helpers.js`)

- **`parseName(value)`** — Extracts the display name from `ID---Name` format (e.g., `"1005725---Popehouse Moor SSSI"` → `"Popehouse Moor SSSI"`)
- **`fitNames(names, maxLength)`** — Fits a list of names into available space with `(+N more)` truncation
- **`EMAIL_HEADER_MAX_LENGTH`** — Constant `255`
