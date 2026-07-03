# Form Changes

## 2026-07-03 - Fri (DF-1016: form → CWT mapping updates, continued)

Mapper-only change (no form-definition edits). Committed as work item W5.

### Advice

- **W5 — Topic-question SSSI path.** The "Which topic fits the nature of your question the best?" route now carries its SSSI details through to `SSSI_info`. New rule `sssi-info.question-topic-advice` (guarded on `bjblyN` being answered, placed before the `[]` fallback) emits one entry with `SSSI_id` from `bjblyN` ("Which SSSI does your question relate to?", via `parseSssiId`) and `coordinates` from `uhYhpV` ("Where does your question relate?", via `formatCoordinates`). Coordinates are included whenever `uhYhpV` is populated, independent of the `hYybKm` ("Do you know the location…?") Yes/No answer. This route is mutually exclusive with the S28i (`Avdzxa`) path, so first-match-wins rule ordering keeps the two independent.

## 2026-07-02 - Thu (DF-1016: form → CWT mapping updates)

Mapper-only changes (no form-definition edits) that carry more of the submitted data through to the CWT payload. Implemented as work items W1–W4 and W1b, each committed separately.

### Consent

- **W1 — European site capture.** New output fields `is_there_a_european_site` (`"Yes"` when a site is given, otherwise `""`) and `euro_site_info` (`[{ european_site_id }]`), sourced from the `hwaByT` "European site" repeater / `FqfxKM` field (ids via `parseEuroSiteId`). Mirrors the Assent form.
- **W1b — European site names in the readable output.** The European site names now also appear in `description` (unlimited) and `email_header` (fitted within 255 characters), parsed from the same `hwaByT` / `FqfxKM` field via `parseName`. Description format is now `[scheme and/or activities] - [SSSI names] - [European site names]`.

### Assent

- **W2 — SBI fallback.** The `SBI` output falls back to the address-details SBI question (`IOetrS`) when the main SBI question (`ylXSKE`) is blank (`firstAnswered`); omitted when neither is provided.
- **W3 — Marine Conservation Zone name.** When the MCZ question (`eaYOCX`) is answered and a zone name is given (`pwSMNt`), the MCZ name is appended to `description` and `email_header` (the latter fitted within 255 characters), parsed via `parseName`. Description format is now `… - [SSSI names] - [European site names] - [MCZ name]`.

### Advice

- **W4 — Marine Conservation Zone name.** On the activity/sites path, when the MCZ question (`ezHrva`) is answered and a zone name is given (`joWQbp`), the MCZ name is appended to `description` and `email_header` (fitted within 255 characters), parsed via `parseName`. Description format on that path is now `[detailed_work_type] - [activities] - [site names] - [MCZ name]`. Not applied on the "Something else" free-text or fallback paths.

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
