# Form Changes

## 2026-07-06 - Mon (DF-1016: 'another permission' branch carried through)

Mapper-only changes (no form-definition edits) that read the "…or another permission?" branch (`yWeYpc`) fields, which the mappings previously ignored. Committed as work items W11 and W12. Both apply to **Consent and Assent** identically.

### Consent & Assent

- **W11 — Permission name opens description/email_header.** The scheme/permission label that starts the `description` and `email_header` primary segment (`schemeLabel`) was sourced only from the land-management-scheme fields (`rTreXu`/`aIixRu`). On the "…or another permission?" branch the permission name is captured in a distinct field, `VacBun` ("What is the name of the permission?"), which no rule read — so those submissions opened with an empty label. A new `schemeLabel` case reads `VacBun` when it is answered. The branch is mutually exclusive with the land-management-scheme fields, so first-match ordering leaves the scheme and empty paths unchanged.
- **W12 — agreement_reference from the permission reference.** The `agreement-reference.fallback` rule fell back to `WtpFqT` ("What is the scheme reference number?"), which only exists on the land-management-scheme branch, so `agreement_reference` came out empty on the another-permission branch. The fallback is now `firstAnswered[WtpFqT, Uureah]` with an empty default, where `Uureah` is the permission's own reference number (consent: "Give the reference number for this permission if available"; assent: "What is the reference number for this permission?"). `WtpFqT` is listed first so the scheme path is unchanged; both-empty still yields `""`.

## 2026-07-03 - Fri (DF-1016: consent SFI ORNEC from action codes)

Mapper-only change (no form-definition edits). Committed as work item W6. This was previously parked as "spec pending"; the 11-June requirement (`_tasks/001/more-changes.md`) resolved both open questions — the source is the page-20 action-code checkboxes (`qocAEz`), and the output follows the old ORNEC treatment (selected values comma-joined, feeding the same CWT fields).

### Consent

- **W6 — SFI route: ORNEC from the page-20 action codes.** On the Sustainable Farming Incentive route, the consent codes are no longer taken from an activity — they now come from `qocAEz` ("Which SFI action codes involve operations that need Natural England consent?"), the multi-select on page 20. Previously the SFI route was treated as a generic scheme path, so every `SSSI_info[].ornec` was `""`.
  - New condition `isSfiScheme` (`rTreXu` starts with `"A Sustainable Farming Incentive (SFI) agreement"`).
  - Two new SSSI_info rules placed **above** the generic scheme rules so they win for SFI: `sssi-info.single-sfi` (single SSSI) and `sssi-info.multiple-sfi` (multiple SSSIs, one entry per `gWZwzI` site). Both source `ornec` from `qocAEz`, the selected action codes comma-joined; `coordinates` and `SSSI_id` are unchanged from the scheme path. `qocAEz` is a single form-level field, so on a multi-SSSI submission the same action-code list is applied to every site (there is no per-SSSI action-code capture).
  - The action codes also flow to `description` and `email_header` "alike the ORNECs did": the `activities` definition now falls through to `qocAEz` (guarded by `isSfiScheme`) when the non-scheme ORNEC repeaters are empty, so the primary segment reads `"{scheme}, {action codes}"` on the SFI route.
  - Non-SFI routes are unaffected: `ornec` stays `""` on other scheme paths, and the `isSfiScheme` guard on the `activities` fall-through keeps action codes out of non-SFI descriptions even if the field were ever populated off-route.

## 2026-07-03 - Fri (DF-1016: advice topic-question work types)

Advice form definition updated to version 1197 (two new topic options on the "Which topic fits the nature of your question the best?" page), plus the matching mapper change. Committed as work item W13.

### Advice

- **W13 — Two new page-16 topic options → work types.** The topic question `xzEslQ` ("Which topic fits the nature of your question the best?") gained two options, both routed through the generic "what is your question?" pages:
  - "I have a question about Sustainable Farming Incentive (SFI) and SSSIs" → `broad_work_type` = `Other casework`, `detailed_work_type` = `SFI - Technical query`.
  - "I have a question about other land management schemes and SSSIs" → `broad_work_type` = `Other casework`, `detailed_work_type` = `SSSI - Other`.

  `broad_work_type` needed no change — all general topics already resolve to `Other casework` via `broad-work-type.fallback`. Only two entries were added to the `detailed-work-type.general-topic` lookup table (keyed on `xzEslQ`). Output values follow the existing `<Category> - <Descriptor>` house style rather than the raw ticket wording ("SFI technical query" / "SSSI other").

## 2026-07-03 - Fri (DF-1016: form → CWT mapping updates, continued)

Mapper-only change (no form-definition edits). Committed as work item W5.

### Advice

- **W5 — Topic-question SSSI path.** The "Which topic fits the nature of your question the best?" route now carries its SSSI details through to `SSSI_info`. New rule `sssi-info.question-topic-advice` (guarded on `bjblyN` being answered, placed before the `[]` fallback) emits one entry with `SSSI_id` from `bjblyN` ("Which SSSI does your question relate to?", via `parseSssiId`) and `coordinates` from `uhYhpV` ("Where does your question relate?", via `formatCoordinates`). Coordinates are included whenever `uhYhpV` is populated, independent of the `hYybKm` ("Do you know the location…?") Yes/No answer. This route is mutually exclusive with the S28i (`Avdzxa`) path, so first-match-wins rule ordering keeps the two independent.

## 2026-07-02 - Thu (DF-1016: form → CWT mapping updates)

Mapper-only changes (no form-definition edits) that carry more of the submitted data through to the CWT payload. Implemented as work items W1–W4 and W1b, each committed separately.

### Consent

- **W1 — European site capture.** New output fields `is_there_a_european_site` (`"Yes"` when a site is given, otherwise `""`) and `euro_site_info` (`[{ european_site_id }]`), sourced from the `hwaByT` "European site" repeater / `FqfxKM` field (ids via `parseEuroSiteId`). Mirrors the Assent form.
- **W1b — European site names in the readable output.** The European site names now also appear in `description` (unlimited) and `email_header` (fitted within 254 characters), parsed from the same `hwaByT` / `FqfxKM` field via `parseName`. Description format is now `[scheme and/or activities] - [SSSI names] - [European site names]`.

### Assent

- **W2 — SBI fallback.** The `SBI` output falls back to the address-details SBI question (`IOetrS`) when the main SBI question (`ylXSKE`) is blank (`firstAnswered`); omitted when neither is provided.
- **W3 — Marine Conservation Zone name.** When the MCZ question (`eaYOCX`) is answered and a zone name is given (`pwSMNt`), the MCZ name is appended to `description` and `email_header` (the latter fitted within 254 characters), parsed via `parseName`. Description format is now `… - [SSSI names] - [European site names] - [MCZ name]`.

### Advice

- **W4 — Marine Conservation Zone name.** On the activity/sites path, when the MCZ question (`ezHrva`) is answered and a zone name is given (`joWQbp`), the MCZ name is appended to `description` and `email_header` (fitted within 254 characters), parsed via `parseName`. Description format on that path is now `[detailed_work_type] - [activities] - [site names] - [MCZ name]`. Not applied on the "Something else" free-text or fallback paths.

## 2026-04-14 - Tue (later edit: list item value/text alignment)

Across advice, assent and consent forms, a number of list item `value` fields were aligned with their displayed `text` (for example "HRA advice" → "Habitats Regulations Assessment (HRA) advice"). This affects mapper logic wherever the submitted value was previously looked up or compared against the short form. Updated mappers and docs accordingly:

- Advice NVRbCy: "HRA advice" → "Habitats Regulations Assessment (HRA) advice"; "S28I SSSI advice" → "Section 28i SSSI advice (statutory consultation, not including HRA)"
- Advice YOwPAJ: "Standalone HRA advice" → "Habitats Regulations Assessment (HRA) advice"; "S28i SSSI advice" → "Section 28i SSSI advice (statutory consultation, not including HRA)"
- Advice xzEslQ: "I have a question about Local Nature Reserves (LNRs)" → "I have a question about designating a Local Nature Reserve (LNR)"; smart apostrophe in pre-assent topic aligned to match text ("I would like advice")
- Advice teEzOl: "Regional body" → "Local Planning Authority"
- Assent KTObNK: "An organisation working on behalf of a public body" → "Somebody working on behalf of a public body"
- Consent KTObNK: "Someone working on behalf of an owner or occupier of land within a SSSI" → "Someone with permission to work on behalf of an owner or occupier of land within a SSSI"
- Assent advice received: "Paid advice" → "Yes, I have received paid advice"; "Free advice" → "Yes, I have received non-statutory advice"; "Yes, I have received statutory sssi advice" → "Yes, I have received statutory SSSI advice"
- Consent advice received: "Paid advice" → "Yes, I have received paid advice"; "Free advice" → "Yes, I have received free advice"
- Assent HRA screening outcome: "The assessment concludes that…" → "The screening concludes that…"

## 2026-04-14 - Tue

### Consent

- Added SBI information note to the intro page
- New question on the landowner/occupier details page: "Are these the contact details of the landowner or the occupier?" (Landowner / Land occupier radios)
- Removed optional SBI text field from landowner/occupier details page
- Address fields now use postcode lookup (owner/occupier address and your address)
- New mandatory SBI page ("What is the Single Business Identifier (SBI) number of where the activities will take place?") shown when a land management scheme is selected
- Changed route logic and conditions so that activity date fields are flexible and based on the agreement type (new conditions: "I need flexible dates", "I can give dates", "Land management agreement dates")

### Assent

- New mandatory SBI page ("What is the Single Business Identifier (SBI) number of where the activities will take place?") shown when a land management scheme is selected
- Changed route logic and conditions so that activity date fields are flexible and based on the agreement type (new conditions: "I need flexible dates", "I can give dates", "Land management agreement dates")
- Address field (your address) now uses postcode lookup
- Advice received list changes:
  - "No, I have not received advice" moved to the top of the list
  - Renamed "Yes, I have received free advice" to "Yes, I have received non-statutory advice"
  - Added: "Yes, I have received statutory Habitats Regulation Assessment (HRA) advice"
  - Added: "Yes, I have received statutory SSSI advice"
- Intro page: added note "If you have a HRA, be prepared to upload this as part of your notice."
- Changed Appropriate Assessment question from "Have you completed an Appropriate Assessment?" to "Are you seeking advice now from Natural England on your Appropriate Assessment?"; updated hint to "If you have not already sought advice from Natural England, click Yes"
- New page "Habitats Regulation Assessment completed" (shown when AA advice is not needed): info note that HRA can be uploaded later, and new Yes/No question "Are you submitting a HRA with your notice?"
- Updated condition logic: "I have not completed an AA" renamed to "I have not completed an AA and not consulting"; now requires both the AA question and the HRA submission question to be false (AND coordinator)
- "Get European site advice" page: updated link formatting for HRA guidance and advice form links

### Advice

- Removed the "How would you like to provide details of the proposed activities?" page and its associated list (Free text description / Document upload / Both)
- "Tell us about the proposed activities" text area is now shown unconditionally (previously depended on the removed detail format selection); hint text updated to mention upload on next page
- Supporting documents upload is now optional (was required)
- Mapper: "Submit/request surveys or SSSI info" topic now maps to 'SSSI - Site visits/surveys' (was 'SSSI - Regulation and Enforcement')
