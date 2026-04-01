# Assent form: user types and purpose

## What is S28H assent?

Section 28H of the Wildlife and Countryside Act 1981 requires **public bodies** (known as Section 28G authorities) to formally notify Natural England before carrying out operations likely to damage a Site of Special Scientific Interest (SSSI). The assent form — titled "Give notice and get assent for a planned activity on or near a SSSI" — is the mechanism for submitting this notice.

Unlike S28E **consent** (which applies to private landowners and occupiers), S28H **assent** applies exclusively to public bodies and those acting on their behalf. The distinction reflects the different legal obligations placed on public vs private parties when managing SSSI land.

**Key legal requirements:**

- Public bodies must give Natural England **28 days' notice** before starting operations
- Natural England has **28 days** to respond (the form states a 4-month processing target)
- If Natural England does not assent, the public body must not proceed unless it can demonstrate overriding public interest

---

## User types

The assent form has only **2 top-level user categories**, determined by field `KTObNK` ("What type of customer are you?"). This is far simpler than the advice form (9 categories) or the consent form (4 categories), because the form is restricted to public sector use.

### 1. A public body

_"Also known as a Section 28G authority. For example, a government agency, local authority, or 'statutory undertaker' such as a water company."_

| Attribute  | Detail                                               |
| ---------- | ---------------------------------------------------- |
| Statutory? | Yes — always a government or quasi-governmental body |
| Role       | Direct submitter of the assent notice                |
| Output     | `is_contractor_working_for_public_body: "No"`        |

Public bodies are further classified into **8 sub-categories** via field `vUHwan` ("Which category best describes the public body you're representing?"):

#### Government Agency

A direct government body carrying out operations that may affect SSSIs.

| Attribute      | Detail                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Examples       | Environment Agency, Natural England, Forestry Commission, Highways England                                   |
| Purpose        | Submit formal S28H notice for government-led operations (flood defences, infrastructure, habitat management) |
| Outcome        | Receive Natural England's assent (or refusal) before proceeding with planned operations                      |
| Body selection | Chosen from an autocomplete list of public bodies                                                            |
| Output         | `consulting_body_type: "Government Agency"`, `public_body_type: "Government Agency"`                         |

#### Local Planning Authority

A council or national park authority whose planning-related works may affect SSSIs.

| Attribute      | Detail                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Examples       | County councils, district councils, national park authorities                                                               |
| Purpose        | Submit S28H notice for council-led works (road building, public realm improvements, development on council-owned SSSI land) |
| Outcome        | Assent from Natural England before proceeding                                                                               |
| Body selection | Chosen from a fixed list of local authorities (same list as advice form — 327 entries)                                      |
| Output         | `consulting_body_type: "Local Planning Authority"`, `public_body_type: "Local Planning Authority"`                          |

**Note:** The capitalisation differs between the form input (`Local planning authority`) and the output value (`Local Planning Authority`).

#### Harbour Authority

A port or harbour management body whose operations may affect coastal or estuarine SSSIs.

| Attribute      | Detail                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose        | Submit S28H notice for harbour-related operations (dredging, sea wall construction, navigation channel works) near protected coastal sites |
| Body selection | Chosen from an autocomplete list                                                                                                           |
| Output         | `consulting_body_type: "Harbour authority"`, `public_body_type: "Harbour authority"`                                                       |

#### Utility Provider

A utility company (water, electricity, gas, telecoms) whose infrastructure works may affect SSSIs. These are "statutory undertakers" under the Act.

| Attribute      | Detail                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Purpose        | Submit S28H notice for infrastructure works (pipe laying, cable routing, maintenance) on or near SSSIs |
| Body selection | Chosen from an autocomplete list                                                                       |
| Output         | `consulting_body_type: "Utility Provider"`, `public_body_type: "Utility Provider"`                     |

**Note:** The capitalisation differs between the form input (`Utility provider`) and the output value (`Utility Provider`).

#### Landowner

A public body that owns SSSI land (e.g. Ministry of Defence, Crown Estate, local authority landholdings).

| Attribute                     | Detail                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose                       | Submit S28H notice for land management operations on publicly-owned SSSI land                                                                                      |
| Distinction from consent form | On the consent form, "Landowner" means a private individual. On the assent form, it refers to a public body that owns land — the public body is the S28G authority |
| Body selection                | Chosen from an autocomplete list                                                                                                                                   |
| Output                        | `consulting_body_type: "Landowner"`, `public_body_type: "Landowner"`                                                                                               |

#### Land Occupier

A public body that occupies (but does not own) SSSI land.

| Attribute      | Detail                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| Purpose        | Submit S28H notice for operations on SSSI land occupied by the public body   |
| Body selection | Chosen from an autocomplete list                                             |
| Output         | `consulting_body_type: "Land occupier"`, `public_body_type: "Land occupier"` |

#### Consultant

A consultant acting as the applicant on behalf of a public body, where the consultant is itself classed as a public body (e.g. a government-contracted environmental consultancy).

| Attribute      | Detail                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------ |
| Purpose        | Submit S28H notice as a public body consultant (distinct from the "contractor" path below) |
| Body selection | Chosen from an autocomplete list                                                           |
| Output         | `consulting_body_type: "Consultant"`, `public_body_type: "Consultant"`                     |

#### Other

A catch-all for public bodies that don't fit the above categories (e.g. NHS trusts, educational institutions with SSSI land).

| Attribute      | Detail                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| Purpose        | Submit S28H notice for any public sector entity not covered by the named categories |
| Body selection | Free text entry — the user types the organisation name                              |
| Output         | `consulting_body_type: "Other"`, `public_body_type: "Other"`                        |

---

### 2. An organisation working on behalf of a public body

_"For example, a contractor or an organisation."_

| Attribute   | Detail                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?  | No — a private entity acting as an agent for a statutory body                                                                               |
| Role        | Submits the assent notice on behalf of a public body                                                                                        |
| Requirement | Must confirm they have been **officially appointed** by the public body to act on their behalf. May be asked to provide proof of permission |
| Output      | `is_contractor_working_for_public_body: "Yes"`                                                                                              |

#### How contractors differ from public bodies in the output

Contractors answer the same public body category question (vUHwan) and public body selection as public bodies. The key differences are:

| Field                                   | Public body value                          | Contractor value                                           |
| --------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `consulting_body_type`                  | Body category (e.g. `"Government Agency"`) | Body category (same — vUHwan is shown on both paths)       |
| `consulting_body`                       | Organisation name (from public body field) | Contractor's own organisation name (from ueDuNl or Xszriq) |
| `public_body_type`                      | Body category                              | Body category (same as consulting_body_type)               |
| `public_body`                           | Organisation name                          | Selected/entered public body name                          |
| `is_contractor_working_for_public_body` | `"No"`                                     | `"Yes"`                                                    |

The contractor selects their own organisation from an autocomplete list (or chooses "Other" and enters a free text name), then also selects the public body category and the public body they are acting on behalf of. The contractor's organisation is captured in `consulting_body`, while the public body they represent is captured in `public_body`.

---

## Purpose of the form

All users of the assent form — whether public bodies or their contractors — are achieving the same outcome:

**Formally notifying Natural England of planned activities on or near a SSSI and requesting assent to proceed.**

The form captures:

1. **Who** is submitting (public body type and identity, or contractor details)
2. **What scheme** the activities relate to (land management scheme selection)
3. **Where** the activities will take place (SSSI names, coordinates)
4. **What** activities are planned (ORNEC activities or scheme-based descriptions)
5. **Whether** European sites may be affected (HRA consideration)
6. **Contact details** for correspondence

### What happens after submission

Natural England reviews the notice and either:

- **Grants assent** — the public body may proceed with operations
- **Grants assent with conditions** — the public body may proceed subject to modifications (e.g. seasonal restrictions, buffer zones)
- **Refuses assent** — the public body must not proceed unless it can demonstrate that the operation is necessary for overriding public interest, in which case it must give Natural England a further 28 days' notice

---

## Land management schemes

The form collects which government farming/environmental scheme the activities relate to. This determines:

- Which agreement reference number is collected
- The `detailed_work_type` classification sent to the downstream API
- Whether the SSSI data collection follows the "scheme path" (bulk site listing) or the "ORNEC path" (detailed per-activity coordinates)

| Scheme                                            | Output type                     | Agreement reference? | Context                                                                   |
| ------------------------------------------------- | ------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| Countryside Stewardship Higher Tier (CSHT)        | `S28H Assent CS HT`             | Yes (CS reference)   | Premium conservation agreements — complex habitat management              |
| Countryside Stewardship Mid Tier (CSMT) extension | `S28H Assent CS MT`             | Yes (CS reference)   | Mid-level environmental stewardship extensions                            |
| CS Capital Grants                                 | `S28H Assent CS Capital Grants` | Yes (CS reference)   | One-off capital investments (e.g. fencing, hedging, water infrastructure) |
| Higher Level Stewardship (HLS)                    | `S28H Assent HLS extension`     | Yes (HLS reference)  | Legacy scheme being phased out — extensions to existing agreements        |
| Sustainable Farming Incentive (SFI)               | `S28H Assent SFI`               | Yes (SFI reference)  | Newer standardised environmental payment scheme                           |
| Minor and Temporary Adjustments (MTA)             | `S28H Assent MTA`               | No                   | Small modifications to existing CS/ES agreements                          |
| Other schemes / not specified                     | `S28H Assent`                   | No                   | Activities not linked to a named scheme                                   |

All schemes are administered by the Rural Payments Agency (RPA).

---

## European site consideration

The form asks whether planned activities could affect a **European site** (Special Area of Conservation, Special Protection Area, or Ramsar site). If yes, the applicant provides European site names via a repeater. This triggers Habitats Regulations Assessment (HRA) considerations alongside the S28H assent process.

European sites often overlap geographically with SSSIs, so an activity affecting a SSSI may simultaneously affect a European site, requiring dual assessment.

---

## SSSI and activity data collection

The form collects SSSI information differently depending on the number of sites and whether activities are scheme-based or ORNEC-based:

| Path                              | SSSI data                                         | Activity data                            | Coordinates                                  |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------- | -------------------------------------------- |
| Single SSSI with ORNEC activities | SSSI name from main form                          | Activities with per-activity coordinates | Yes (easting/northing per activity)          |
| Multiple SSSIs, scheme path       | SSSI names from repeater                          | No activity details collected            | No                                           |
| Multiple SSSIs, ORNEC path        | SSSI names from repeater (grouped by unique name) | Activities per SSSI with coordinates     | Yes (easting/northing per activity per SSSI) |

**ORNEC activities** (Operations Requiring Natural England's Consent) are the specific listed operations for each SSSI that require formal notification. These include activities like grazing, drainage, tree felling, and habitat modification. On scheme-based paths, ORNEC activities are not collected because the scheme agreement already defines the permitted operations.

---

## Key distinctions from other forms

| Aspect                  | Assent form (S28H)                                                               | Consent form (S28E)                                               | Advice form                     |
| ----------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------- |
| Legal mechanism         | Formal notice from public body                                                   | Formal consent application from private party                     | Consultation / guidance request |
| Who uses it             | Public bodies and their contractors (2 categories)                               | Private landowners, occupiers, consultants, others (4 categories) | Anyone (9 categories)           |
| Binding outcome?        | Yes — assent required before proceeding                                          | Yes — consent required before proceeding                          | No — advisory only              |
| SBI collected?          | No                                                                               | Yes (when available)                                              | No                              |
| European site question? | Yes                                                                              | No                                                                | Yes (HRA path)                  |
| Public body fields?     | Yes (`public_body_type`, `public_body`, `is_contractor_working_for_public_body`) | No                                                                | Yes                             |
| ORNEC in SSSI_info?     | No (`SSSI_id` and `coordinates` only)                                            | Yes (`SSSI_id`, `coordinates`, and `ornec`)                       | No                              |
