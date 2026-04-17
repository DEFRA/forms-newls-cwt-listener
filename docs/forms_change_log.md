# Form Changes

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
