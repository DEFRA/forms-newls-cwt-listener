# Advice form: user types and purpose

## What is S28I advice?

Section 28I of the Wildlife and Countryside Act 1981 requires certain public bodies (known as **Section 28G authorities**) to consult Natural England before carrying out operations likely to damage a Site of Special Scientific Interest (SSSI). The advice form is the mechanism through which these bodies — and members of the public — can request guidance from Natural England.

The form handles three distinct types of request:

| Request type                                     | Legal basis                                           | Who can request it                       |
| ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------- |
| **HRA advice** (Habitats Regulations Assessment) | Conservation of Habitats and Species Regulations 2017 | Statutory bodies only                    |
| **S28I SSSI advice**                             | Section 28I, Wildlife and Countryside Act 1981        | Statutory bodies only                    |
| **General advice**                               | No specific statutory requirement                     | Anyone (including members of the public) |

The form's primary purpose is to enable Natural England to provide expert advice on whether proposed works will impact protected sites, and if so, what conditions or modifications are needed.

---

## User types

The form's first question — "Which category best describes who is making this application?" (field `teEzOl`) — determines the applicant category. There are **9 primary user types**, split into statutory and non-statutory groups.

### Statutory / government user types

These users have access to the **S28I SSSI advice** and **HRA advice** paths, as they are (or represent) Section 28G authorities with a legal duty to consult Natural England.

#### Government Agency

A direct government body requesting advice on operations that may affect protected sites.

| Attribute       | Detail                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?      | Yes                                                                                                                                                                                                                                                             |
| Sub-types       | Forestry Commission (FC), Environment Agency (EA), other government agencies                                                                                                                                                                                    |
| Purpose         | Obtain formal S28I or HRA advice before proceeding with government-led operations (e.g. flood defences, forestry felling licences, infrastructure works)                                                                                                        |
| Outcome         | Receive Natural England's statutory consultation response, allowing the agency to proceed, modify, or withdraw its proposed operations                                                                                                                          |
| Special routing | **Forestry Commission** has a dedicated path with FC-specific questions (e.g. whether operations involve woodland management via field `tCRMKI`), ability to upload notice of operations documents, and a distinct `detailed_work_type` for woodland management |
| Output fields   | `consulting_body_type: "Government Agency"`, `consulting_body: "Forestry Commission"` or `"Environment Agency"` or free text                                                                                                                                    |

#### Local Planning Authority

A council or national park authority seeking advice on planning proposals that may affect SSSIs or European sites. Displayed as "Regional body" in some form contexts.

| Attribute     | Detail                                                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?    | Yes                                                                                                                                                                               |
| Selection     | Chosen from a fixed list of 327 local authorities                                                                                                                                 |
| Purpose       | Obtain S28I or HRA advice for planning applications near or within protected sites (e.g. residential developments within a Special Protection Area impact zone)                   |
| Outcome       | Receive statutory advice that informs the planning decision — may result in conditions on planning permission, requirement for ecological mitigation, or recommendation to refuse |
| Output fields | `consulting_body_type: "Local Planning Authority"`, `consulting_body: "[selected LA name]"`                                                                                       |

#### Harbour Authority

A port or harbour management body whose operations may affect coastal or estuarine SSSIs.

| Attribute     | Detail                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?    | Yes                                                                                                                                   |
| Purpose       | Obtain S28I or HRA advice for harbour-related activities (e.g. dredging, sea defences, navigation works) near protected coastal sites |
| Outcome       | Receive formal advice on whether harbour operations can proceed without damage to protected features                                  |
| Output fields | `consulting_body_type: "Harbour Authority"`, `public_body_type: "Harbour authority"`                                                  |

#### Utility Provider

A utility company (water, electricity, gas, telecoms) whose infrastructure works may affect protected sites. These are "statutory undertakers" under the Act.

| Attribute     | Detail                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?    | Yes (statutory undertaker)                                                                                                                  |
| Purpose       | Obtain S28I or HRA advice before carrying out infrastructure works (e.g. laying pipes, erecting pylons, maintenance works) on or near SSSIs |
| Outcome       | Receive formal advice allowing utility works to proceed with appropriate mitigation measures                                                |
| Output fields | `consulting_body_type: "Utility Provider"`, `public_body_type: "Utility provider"`                                                          |

### Non-statutory user types

These users can only access the **general advice** path. They cannot request formal S28I SSSI or HRA advice, as they are not Section 28G authorities.

#### Landowner

A private owner of land within or adjacent to a SSSI.

| Attribute         | Detail                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Statutory?        | No                                                                                                                                                                                                     |
| Purpose           | Seek **pre-consent advice** before formally applying for SSSI consent (S28E). Understand whether proposed activities require consent, what information will be needed, and what conditions might apply |
| Outcome           | Informal guidance from Natural England that helps the landowner prepare a complete and well-informed consent application                                                                               |
| Typical use cases | Installing drainage, construction works, agricultural changes, vegetation clearance                                                                                                                    |
| Output fields     | `consulting_body_type: "Landowner"`, `detailed_work_type: "SSSI - Pre Consent advice"`                                                                                                                 |

#### Land Occupier

A farmer, tenant, or other person occupying (but not owning) land within or adjacent to a SSSI.

| Attribute         | Detail                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Statutory?        | No                                                                                         |
| Purpose           | Same as landowner — seek pre-consent advice before applying for SSSI consent               |
| Outcome           | Guidance on consent requirements for proposed activities on occupied SSSI land             |
| Typical use cases | Agricultural operations, grazing changes, land management modifications                    |
| Output fields     | `consulting_body_type: "Land occupier"`, `detailed_work_type: "SSSI - Pre Consent advice"` |

#### Member of Public

Any individual citizen with questions or concerns about protected sites.

| Attribute        | Detail                                                                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?       | No                                                                                                                                                                                                                                              |
| Purpose          | Ask general questions, report concerns, or request information about protected sites                                                                                                                                                            |
| Outcome          | Varies widely depending on the topic selected                                                                                                                                                                                                   |
| Available topics | National Nature Reserve enquiries, reporting potentially damaging activity (with evidence upload), reporting illegal activity, drone flying applications (unique to this user type), general SSSI enquiries (designations, land sales, surveys) |
| Special access   | Only members of the public can submit **drone flying applications** — all other user types are shown an information page instead                                                                                                                |
| Output fields    | `consulting_body_type: "Member of public"`, various `detailed_work_type` values                                                                                                                                                                 |

### Mixed user types (statutory or non-statutory depending on who they represent)

#### Consultant

An environmental or planning consultant acting on behalf of another party.

| Attribute                                   | Detail                                                                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Statutory?                                  | Depends on who they represent                                                                                                                                               |
| Purpose                                     | Submit advice requests on behalf of their client, adding technical expertise to the application                                                                             |
| Working for a statutory body                | Gets access to S28I and HRA paths. Output: `is_contractor_working_for_public_body: "Yes"`, `consulting_body_type: "Consultant"`, `consulting_body: "[client organisation]"` |
| Working for a landowner / land occupier     | Gets general advice path only. Output: `is_contractor_working_for_public_body: "No"`                                                                                        |
| Working independently ("None of the above") | Gets general advice path only                                                                                                                                               |
| Typical use cases                           | Environmental consultant submitting HRA screening on behalf of an LPA; agricultural consultant seeking pre-consent advice on behalf of a landowner                          |

#### Other

A catch-all category for applicants that don't fit the above categories.

| Attribute  | Detail                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Statutory? | Depends on who they represent                                                               |
| Purpose    | Same routing as Consultant — can work on behalf of statutory or non-statutory parties       |
| Routing    | Identical to Consultant: selects who they work for, which determines available advice paths |

---

## Purpose summary by advice type

### HRA advice (statutory bodies only)

Habitats Regulations Assessment advice is sought when a plan or project may affect a **European protected site** (Special Area of Conservation, Special Protection Area, or Ramsar site). The form collects:

- Whether the request is at the **screening stage** (determining if assessment is needed) or the **appropriate assessment stage** (full ecological impact evaluation)
- European site names and details
- SSSI information (European sites often overlap with SSSIs)

**Outcome:** Natural England provides statutory advice on whether the proposal is likely to have a significant effect on the European site and, if so, what mitigation or alternative approaches are needed. This advice directly informs the competent authority's decision on whether to authorise the plan or project.

### S28I SSSI advice (statutory bodies only)

Formal consultation under Section 28I for operations likely to damage a SSSI. The form collects:

- SSSI names and locations
- Proposed activity descriptions and ORNEC (Operations Requiring Natural England's Consent) details
- Start and end dates for proposed activities (collected for S28G bodies)
- Grid references / coordinates

**Outcome:** Natural England provides formal advice on whether the proposed operations would damage the SSSI's special interest features. The statutory body must take this advice into account — though unlike consent, they are not legally required to obtain Natural England's agreement before proceeding. However, they must give Natural England 28 days' notice.

### General advice (all user types)

An informal consultation covering a wide range of topics. The form branches into different sub-paths based on the selected topic:

| Topic                            | Purpose                                                      | Available to                                    |
| -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Pre-consent advice               | Guidance before submitting a formal S28E consent application | Landowners, Land occupiers, Consultants, Others |
| National Nature Reserve enquiry  | Information about NNR access, management, events             | All non-statutory types                         |
| Damage reporting (with evidence) | Report potentially damaging activity on a SSSI               | All non-statutory types                         |
| Illegal activity reporting       | Report suspected criminal activity on protected sites        | All non-statutory types                         |
| Drone flying                     | Apply for drone flight permission over SSSI / NNR            | Member of public only                           |
| Site visits and surveys          | Request access or guidance for scientific surveys            | All non-statutory types                         |
| General SSSI enquiries           | Questions about designations, boundaries, land sales         | All non-statutory types                         |

**Outcome:** Informal guidance, information, or acknowledgement of report. No statutory obligation on either party.

---

## Routing overview

```
Applicant category (teEzOl)
│
├─ Government Agency / LPA / Harbour / Utility
│  └─ "What type of advice do you need?"
│     ├─ HRA advice → HRA path (European sites)
│     ├─ S28I SSSI advice → S28I path (SSSI operations)
│     └─ Something else → General topics
│
├─ Consultant / Other
│  └─ "Who are you working on behalf of?"
│     ├─ Statutory body → Same as Government Agency path above
│     └─ Landowner / Land occupier / None → General topics
│
├─ Landowner / Land occupier
│  └─ General topics (no S28I/HRA option)
│
└─ Member of public
   └─ General topics (with drone flying option)
```

---

## Key distinctions from other forms

| Aspect           | Advice form                          | Consent form (S28E)                             | Assent form (S28H)                              |
| ---------------- | ------------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| Legal mechanism  | Consultation / guidance request      | Formal consent application                      | Formal assent notice                            |
| Who uses it      | Anyone (statutory and non-statutory) | Private landowners and occupiers                | Public bodies (S28G authorities)                |
| Binding outcome? | No — advice is advisory              | Yes — consent must be granted before proceeding | Yes — assent must be obtained before proceeding |
| User type count  | 9 primary categories                 | 4 categories                                    | 2 categories                                    |
| SSSI mandatory?  | Not always (depends on topic)        | Always                                          | Always                                          |
