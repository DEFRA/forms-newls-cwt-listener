# Consent form: user types and purpose

## What is S28E consent?

Section 28E of the Wildlife and Countryside Act 1981 requires **owners and occupiers** of land within a Site of Special Scientific Interest (SSSI) to obtain Natural England's consent before carrying out operations likely to damage the site. The consent form is the mechanism for submitting this application.

Unlike S28H **assent** (which applies to public bodies), S28E **consent** applies to **private individuals** — landowners, tenant farmers, and those acting on their behalf. The distinction reflects the different legal obligations: public bodies must give notice and seek assent; private parties must apply for and obtain consent.

**Key legal requirements:**

- Owners and occupiers must **not** carry out operations listed on the SSSI's ORNEC (Operations Requiring Natural England's Consent) list without first obtaining consent
- Natural England has **4 months** to respond to a consent application
- If consent is refused and the owner/occupier suffers financial loss, they may be entitled to compensation
- Carrying out operations without consent is a criminal offence

---

## User types

The consent form has **4 user categories**, determined by field `KTObNK` ("What type of customer are you?"). All are private/non-statutory — there are no public body options, as those are handled by the assent form.

### 1. An owner of land within a SSSI (Landowner)

| Attribute  | Detail                              |
| ---------- | ----------------------------------- |
| Statutory? | No — private individual or entity   |
| Output     | `consulting_body_type: "Landowner"` |

**Who they are:** The legal owner of land that falls within the boundary of a designated SSSI. This could be an individual, a family, a farming partnership, a trust, or a corporate entity that holds the freehold.

**Purpose:** Apply for formal consent to carry out specific operations on their SSSI land. As the owner, they have a direct legal obligation under S28E not to carry out listed operations without Natural England's written consent.

**Typical scenarios:**

- A farmer wanting to change grazing practices, install drainage, or apply pesticides on SSSI grassland
- A landowner planning tree felling or woodland management within a SSSI woodland
- An estate owner proposing construction, track building, or earthworks on SSSI land
- A landowner entering a new agri-environment scheme that involves changes to land management on SSSI land

**What they provide:**

- Single Business Identifier (SBI) — their farming business number (usually present, as most SSSI landowners are registered with RPA)
- SSSI name and location details
- ORNEC activities or scheme details
- Agreement reference (if part of a land management scheme)

---

### 2. An occupier of land within a SSSI (Land Occupier)

| Attribute  | Detail                                  |
| ---------- | --------------------------------------- |
| Statutory? | No — private individual or entity       |
| Output     | `consulting_body_type: "Land occupier"` |

**Who they are:** Someone who occupies SSSI land under a tenancy, lease, or other arrangement but does not own it. Typically a tenant farmer, a grazing licensee, or an organisation managing land on behalf of the owner.

**Purpose:** Apply for consent to carry out operations on SSSI land they occupy. Under S28E, occupiers have the same obligation as owners — they must not carry out listed operations without consent, even though they don't own the land.

**Typical scenarios:**

- A tenant farmer wanting to plough, re-seed, or change agricultural practices on SSSI land
- A grazing licensee proposing changes to stocking levels or grazing periods
- A land management organisation (e.g. wildlife trust managing a reserve under lease) planning habitat works

**Key distinction from landowner:** The occupier may need to coordinate with the landowner, as both have obligations. However, the consent form does not enforce this — it treats owners and occupiers identically in terms of data collection.

**What they provide:** Same as landowner — SBI, SSSI details, activities, scheme references.

---

### 3. Someone working on behalf of an owner or occupier of land within a SSSI (Consultant)

| Attribute  | Detail                               |
| ---------- | ------------------------------------ |
| Statutory? | No — private professional            |
| Output     | `consulting_body_type: "Consultant"` |

**Who they are:** An environmental consultant, agricultural advisor, or other professional who has been given permission by the landowner or occupier to submit the consent application on their behalf. They add technical expertise to the application.

**Purpose:** Submit a consent application on behalf of their client (the landowner or occupier). The consultant prepares the technical details — identifying the correct ORNEC activities, providing accurate grid references, and ensuring the application is complete.

**Typical scenarios:**

- An ecological consultant preparing a consent application for a landowner who wants to manage woodland within a SSSI
- An agricultural advisor submitting consent for a farmer entering a Countryside Stewardship scheme that involves changes to SSSI land management
- A land agent managing multiple SSSI properties and submitting consent applications across several sites

**Permission requirement:** The form requires consultants to confirm they have permission from the owner/occupier and may require them to upload proof of permission.

**Key distinctions:**

- **SBI** is often `undefined` — consultants typically don't have their own SBI for the land
- **Agreement reference** may be empty if the consultant is not acting within a specific scheme
- The consultant's own contact details are collected (name, email), not the landowner's

---

### 4. Somebody else (Other)

| Attribute  | Detail                          |
| ---------- | ------------------------------- |
| Statutory? | No                              |
| Output     | `consulting_body_type: "Other"` |

**Who they are:** A catch-all category for applicants who don't fit the above three categories. This might include:

- Corporate entities with non-standard land arrangements (e.g. a company that manages land under a complex agreement that isn't a standard tenancy)
- Trusts or charities that manage SSSI land but don't classify themselves as owners or occupiers
- Community groups with management agreements over SSSI land
- Other parties with a legitimate interest in obtaining consent for SSSI operations

**Purpose:** Same as other categories — apply for consent to carry out operations on SSSI land.

**Key distinctions:**

- **SBI** may or may not be present, depending on whether the entity is registered with RPA
- The form treats this category identically to others in terms of data collection, but the downstream system can use the `"Other"` classification to flag unusual applicant types for review

---

## What are ORNEC activities?

ORNEC stands for **Operations Requiring Natural England's Consent**. Each SSSI has its own list of operations that, if carried out, could damage the site's special interest features. These lists are specific to each SSSI and reflect the particular habitats, species, and geological features that the designation protects.

The consent form collects ORNEC activities when the submission is not part of a land management scheme. The form presents **33 activity categories** including:

| Category                    | Examples                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Agricultural**            | Cultivation (ploughing, rotovating, re-seeding), grazing changes, stock feeding alterations, mowing/cutting     |
| **Chemical**                | Application of manure, fertilisers, lime, pesticides, herbicides, veterinary products                           |
| **Vegetation management**   | Destruction/removal of plants, trees, hedges, dead wood, moss, lichen, fungi; tree surgery, coppicing, thinning |
| **Water management**        | Draining, ditch modification, water level changes, irrigation, abstraction, fishery management                  |
| **Construction/earthworks** | Road/track construction, wall/fence building, hardstand creation, material storage                              |
| **Extraction**              | Mineral extraction, geological specimen removal, boulder/scree clearance                                        |
| **Waste/discharge**         | Dumping or spreading materials, burning                                                                         |
| **Biological**              | Release or removal of animals/plants, pest control, game management                                             |
| **Coastal/marine**          | Fishing, bait digging, sea defence works, land reclamation                                                      |
| **Recreational**            | Vehicle/craft use, activities likely to disturb protected features                                              |

When activities are collected via ORNEC, the form also collects **grid reference coordinates** (easting/northing) for each activity, pinpointing where on the SSSI the work will take place.

---

## Land management schemes

Many consent applications relate to activities carried out under government agri-environment schemes. When a scheme is selected, the form collects the agreement reference and follows a simplified data collection path (no individual ORNEC activities — the scheme agreement defines permitted operations).

| Scheme                                            | Output type                      | Agreement reference?             | Context                                                                                 |
| ------------------------------------------------- | -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| Countryside Stewardship Higher Tier (CSHT)        | `S28E Consent CS HT`             | Yes (CS reference via `WZJDQG`)  | Premium conservation agreements — complex habitat management on the most sensitive land |
| Countryside Stewardship Mid Tier (CSMT) extension | `S28E Consent CS MT`             | Yes (CS reference via `WZJDQG`)  | Mid-level environmental stewardship extensions for broader countryside improvements     |
| CS Capital Grants                                 | `S28E Consent CS Capital Grants` | Yes (CS reference via `WZJDQG`)  | One-off capital investments — fencing, hedging, water infrastructure                    |
| Higher Level Stewardship (HLS)                    | `S28E Consent HLS extension`     | Yes (HLS reference via `OFiizI`) | Legacy scheme being phased out — extensions to existing agreements                      |
| Sustainable Farming Incentive (SFI)               | `S28E Consent SFI`               | Yes (SFI reference via `niVAkO`) | Newer standardised environmental payment scheme                                         |
| Minor and Temporary Adjustments (MTA)             | `S28E Consent MTA`               | No                               | Small modifications to existing CS/ES agreements — no separate reference needed         |
| Other schemes                                     | `S28E Consent`                   | Via `VacBun` (permission name)   | Activities under a different permission (e.g. planning permission, other licence)       |
| No scheme                                         | `S28E Consent`                   | No                               | Activities not linked to any formal scheme or permission                                |

**Why schemes matter:** When a landowner/occupier enters an agri-environment scheme (e.g. Countryside Stewardship), they agree to carry out specific land management activities in return for payment. If their land includes a SSSI, those scheme activities may overlap with operations on the SSSI's ORNEC list — meaning they need S28E consent even though the activities are part of a government-funded programme.

---

## Single vs multiple SSSI submissions

The form handles both single-SSSI and multiple-SSSI submissions, with different data collection approaches:

| Path                              | When used                                 | What's collected                                    | Coordinates?                | ORNEC activities? |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------- | --------------------------- | ----------------- |
| Single SSSI + ORNEC activities    | One SSSI, no scheme, activities specified | SSSI name, per-activity coordinates, activity names | Yes (per activity)          | Yes               |
| Single SSSI + scheme coordinates  | One SSSI, scheme selected                 | SSSI name, single coordinate pair, scheme reference | Yes (single point)          | No                |
| Single SSSI fallback              | One SSSI, no scheme, no activities        | SSSI name only                                      | No                          | No                |
| Multiple SSSIs + ORNEC activities | Multiple SSSIs, no scheme                 | Per-SSSI names, activities, and coordinates         | Yes (per activity per SSSI) | Yes               |
| Multiple SSSIs + scheme           | Multiple SSSIs, scheme selected           | SSSI names only, scheme reference                   | No                          | No                |

---

## Form routing overview

```
Customer type (KTObNK)
│
├─ Landowner / Land occupier
│  └─ Continue directly to scheme selection
│
├─ Consultant / Somebody else
│  └─ Confirm permission from owner/occupier
│     └─ Upload proof of permission
│        └─ Continue to scheme selection
│
└─ All paths converge:
   │
   Land management scheme (rTreXu)
   ├─ Named scheme (CSHT/CSMT/HLS/SFI/CS Capital/MTA)
   │  └─ Collect agreement reference
   │     └─ SSSI selection
   └─ Other / no scheme
      └─ SSSI selection → ORNEC activities
         │
         Single or multiple SSSIs? (lmqMaY)
         ├─ Single SSSI
         │  ├─ Scheme path → Scheme coordinates
         │  └─ Non-scheme → ORNEC repeater (activities + coordinates)
         └─ Multiple SSSIs
            ├─ Scheme path → SSSI name repeater (names only)
            └─ Non-scheme → SSSI + activity repeater (names + activities + coordinates)
```

---

## SBI (Single Business Identifier)

The SBI is a unique number identifying a farming business registered with the Rural Payments Agency. The consent form collects it from two possible fields (`oflKhi` primary, `VLUhzR` fallback) and converts it to a number.

| User type     | SBI typically present? | Why                                                                         |
| ------------- | ---------------------- | --------------------------------------------------------------------------- |
| Landowner     | Yes                    | Most SSSI landowners are farming businesses registered with RPA             |
| Land occupier | Yes                    | Tenant farmers are usually RPA-registered                                   |
| Consultant    | Often not              | Consultants don't farm the land themselves; the SBI belongs to their client |
| Other         | Varies                 | Depends on whether the entity is an RPA-registered farming business         |

When neither SBI field has a value, the field is omitted from the output entirely (`undefined`).

---

## Key distinctions from other forms

| Aspect                     | Consent form (S28E)                                               | Assent form (S28H)                                                               | Advice form                           |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| Legal mechanism            | Formal consent application from private party                     | Formal notice from public body                                                   | Consultation / guidance request       |
| Who uses it                | Private landowners, occupiers, consultants, others (4 categories) | Public bodies and their contractors (2 categories)                               | Anyone (9 categories)                 |
| Binding outcome?           | Yes — consent required before proceeding                          | Yes — assent required before proceeding                                          | No — advisory only                    |
| SBI collected?             | Yes (when available)                                              | No                                                                               | No                                    |
| European site question?    | No                                                                | Yes                                                                              | Yes (HRA path)                        |
| Public body fields?        | No                                                                | Yes (`public_body_type`, `public_body`, `is_contractor_working_for_public_body`) | Yes                                   |
| ORNEC in SSSI_info?        | Yes (`ornec` field per entry)                                     | No                                                                               | No                                    |
| `email_header` field?      | Yes (activities + SSSI names, or scheme + SSSI names)             | Yes (activities/scheme + SSSI/Euro site names)                                   | Yes (detailed_work_type + site names) |
| Permission proof required? | Yes (for consultants and others)                                  | Yes (for contractors)                                                            | No                                    |
