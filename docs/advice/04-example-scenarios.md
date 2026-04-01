# Advice form example scenarios

Each example shows the form submission data (input) and the expected CWT output (result). These can be used as test fixtures.

---

## Example 1: FC user requesting HRA advice

**Scenario:** A Forestry Commission employee requests HRA advice at the screening stage for a European site, with SSSI damage.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Government Agency",
      "PvUZyQ": "Forestry Commission",
      "NVRbCy": "HRA advice",
      "emlmbt": "Advice on screening stage",
      "xZiZct": true,
      "hUpejP": "Jane Smith",
      "wtXodG": "07700900123",
      "YOPYRe": "jane.smith@forestrycommission.gov.uk"
    },
    "repeaters": {
      "TJuSNf": [
        {
          "rtuWky": "UK11040---Abberton Reservoir Ramsar",
          "xeJYcG": { "easting": 496200, "northing": 218400 }
        }
      ],
      "sssi_repeater_id": [
        {
          "Avdzxa": "1003015---Abberton Reservoir SSSI",
          "NMCFES": { "easting": 496300, "northing": 218500 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Standalone HRA Reg 63",
  "detailed_work_type": "Standalone HRA Reg 63",
  "description": "Standalone HRA Reg 63 - Abberton Reservoir Ramsar",
  "consulting_body_type": "Government Agency",
  "consulting_body": "Forestry Commission",
  "customer_name": "Jane Smith",
  "customer_email_address": "jane.smith@forestrycommission.gov.uk",
  "email_header": "Standalone HRA Reg 63 - Abberton Reservoir Ramsar",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Government Agency",
  "public_body": "Forestry Commission",
  "is_there_a_european_site": "Yes",
  "SSSI_info": [
    {
      "SSSI_id": 1003015,
      "coordinates": "496300,218500"
    }
  ],
  "euro_site_info": [
    {
      "european_site_id": 11040,
      "european_site_coordinates": "496200,218400"
    }
  ]
}
```

---

## Example 2: FC user requesting S28I SSSI advice

**Scenario:** A Forestry Commission employee requests S28I SSSI advice. Woodland management operations apply. SSSI damage is reported with multiple SSSIs.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Government Agency",
      "PvUZyQ": "Forestry Commission",
      "NVRbCy": "S28I SSSI advice",
      "tCRMKI": true,
      "xZiZct": true,
      "PkpWyY": "Free Text",
      "nJVeix": "Felling of 5 hectares of conifer plantation adjacent to the SSSI boundary",
      "hUpejP": "John Forester",
      "wtXodG": "07700900456",
      "YOPYRe": "john.forester@forestrycommission.gov.uk"
    },
    "repeaters": {
      "sssi_repeater_id": [
        {
          "Avdzxa": "1002084---Charnwood Lodge SSSI",
          "NMCFES": { "easting": 446100, "northing": 313200 }
        },
        {
          "Avdzxa": "1002085---Beacon Hill SSSI",
          "NMCFES": { "easting": 451000, "northing": 314800 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "S28i Advice",
  "detailed_work_type": "S28i Advice",
  "description": "S28i Advice - Charnwood Lodge SSSI, Beacon Hill SSSI",
  "consulting_body_type": "Government Agency",
  "consulting_body": "Forestry Commission",
  "customer_name": "John Forester",
  "customer_email_address": "john.forester@forestrycommission.gov.uk",
  "email_header": "S28i Advice - Charnwood Lodge SSSI, Beacon Hill SSSI",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Government Agency",
  "public_body": "Forestry Commission",
  "is_there_a_european_site": "No",
  "SSSI_info": [
    {
      "SSSI_id": 1002084,
      "coordinates": "446100,313200"
    },
    {
      "SSSI_id": 1002085,
      "coordinates": "451000,314800"
    }
  ],
  "euro_site_info": []
}
```

---

## Example 3: LPA requesting HRA advice via S28G path

**Scenario:** A Local Planning Authority requests standalone HRA advice at the Appropriate Assessment stage, with European site data and SSSI damage.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Regional body",
      "YouDQP": "Brighton and Hove City Council",
      "YOwPAJ": "Standalone HRA advice",
      "emlmbt": "Stat advice on an Appropriate Assessment",
      "xZiZct": true,
      "PkpWyY": "Free Text",
      "nJVeix": "Residential development of 200 units within 400m of the SPA boundary",
      "hUpejP": "Sarah Planner",
      "wtXodG": "01onal234567",
      "YOPYRe": "sarah.planner@brighton-hove.gov.uk"
    },
    "repeaters": {
      "TJuSNf": [
        {
          "rtuWky": "UK11001---Arun Valley Ramsar",
          "xeJYcG": { "easting": 503200, "northing": 114600 }
        }
      ],
      "sssi_repeater_id": [
        {
          "Avdzxa": "1000236---Castle Hill SSSI",
          "NMCFES": { "easting": 537000, "northing": 108000 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Standalone HRA Reg 63",
  "detailed_work_type": "Standalone HRA Reg 63",
  "description": "Standalone HRA Reg 63 - Arun Valley Ramsar",
  "consulting_body_type": "Local Planning Authority",
  "consulting_body": "Brighton and Hove City Council",
  "customer_name": "Sarah Planner",
  "customer_email_address": "sarah.planner@brighton-hove.gov.uk",
  "email_header": "Standalone HRA Reg 63 - Arun Valley Ramsar",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Regional body",
  "public_body": "",
  "is_there_a_european_site": "Yes",
  "SSSI_info": [
    {
      "SSSI_id": 1000236,
      "coordinates": "537000,108000"
    }
  ],
  "euro_site_info": [
    {
      "european_site_id": 11001,
      "european_site_coordinates": "503200,114600"
    }
  ]
}
```

---

## Example 4: Consultant working on behalf of a government agency

**Scenario:** A consultant working on behalf of the Environment Agency requests S28i SSSI advice via the S28G path.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Consultant",
      "PBmxNM": "Government agency",
      "PvUZyQ": "Environment Agency",
      "YOwPAJ": "S28i SSSI advice",
      "xZiZct": true,
      "PkpWyY": "Both",
      "nJVeix": "Flood defence works involving bank reinforcement along 500m of river channel",
      "hUpejP": "Mike Consultant",
      "wtXodG": "07700900789",
      "YOPYRe": "mike@ecologyconsulting.co.uk"
    },
    "repeaters": {
      "sssi_repeater_id": [
        {
          "Avdzxa": "1001483---River Itchen SSSI",
          "NMCFES": { "easting": 448500, "northing": 121300 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "S28i Advice",
  "detailed_work_type": "S28i Advice",
  "description": "S28i Advice - River Itchen SSSI",
  "consulting_body_type": "Consultant",
  "consulting_body": "Environment Agency",
  "customer_name": "Mike Consultant",
  "customer_email_address": "mike@ecologyconsulting.co.uk",
  "email_header": "S28i Advice - River Itchen SSSI",
  "is_contractor_working_for_public_body": "Yes",
  "public_body_type": "Government Agency",
  "public_body": "Environment Agency",
  "is_there_a_european_site": "No",
  "SSSI_info": [
    {
      "SSSI_id": 1001483,
      "coordinates": "448500,121300"
    }
  ],
  "euro_site_info": []
}
```

---

## Example 5: Member of public - general question (NNRs)

**Scenario:** A member of the public asking about National Nature Reserves.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Member of public",
      "xzEslQ": "I have a question about Natural England managed National Nature Reserves (NNRs)",
      "QmIGor": "Is it possible to arrange a guided walk at Lindisfarne NNR for an educational group of 30 students?",
      "MiujQY": false,
      "ehAGZh": false,
      "hUpejP": "Tom Walker",
      "wtXodG": "07700900111",
      "YOPYRe": "tom.walker@email.com"
    },
    "repeaters": {}
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Other casework",
  "detailed_work_type": "SSSI - Other",
  "description": "SSSI - Other",
  "consulting_body_type": "Member of public",
  "consulting_body": "Tom Walker",
  "customer_name": "Tom Walker",
  "customer_email_address": "tom.walker@email.com",
  "email_header": "SSSI - Other",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Member of public",
  "public_body": "",
  "is_there_a_european_site": "No",
  "SSSI_info": [],
  "euro_site_info": []
}
```

---

## Example 6: Member of public - damage reporting

**Scenario:** A member of the public reporting potentially damaging activity on a SSSI, with evidence.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Member of public",
      "xzEslQ": "I would like to report potentially damaging activity on or near a protected site",
      "lZPtJq": true,
      "MoCXGK": "1000456---Epping Forest SSSI",
      "rSJTFC": { "easting": 541200, "northing": 198400 },
      "mjYtVZ": "2026-02-15",
      "UVaQES": "Ongoing over the past two weeks",
      "YhWlKB": "Unauthorised tree felling observed in the northwest section of the forest near the main footpath",
      "hUpejP": "Alice Reporter",
      "wtXodG": "07700900222",
      "YOPYRe": "alice.reporter@email.com"
    },
    "repeaters": {}
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Other casework",
  "detailed_work_type": "SSSI - Regulation and Enforcement",
  "description": "SSSI - Regulation and Enforcement - Epping Forest SSSI",
  "consulting_body_type": "Member of public",
  "consulting_body": "Alice Reporter",
  "customer_name": "Alice Reporter",
  "customer_email_address": "alice.reporter@email.com",
  "email_header": "SSSI - Regulation and Enforcement - Epping Forest SSSI",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Member of public",
  "public_body": "",
  "is_there_a_european_site": "No",
  "SSSI_info": [
    {
      "SSSI_id": 1000456,
      "coordinates": "541200,198400"
    }
  ],
  "euro_site_info": []
}
```

---

## Example 7: Landowner - pre-consent advice

**Scenario:** A SSSI landowner requesting advice before applying for consent.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Landowner",
      "xzEslQ": "I am a SSSI landowner or land occupier and I would like advice before applying for SSSI consent",
      "QmIGor": "I want to install a drainage system on my land that borders the SSSI. Will this require consent and what information do I need to provide?",
      "MiujQY": true,
      "ehAGZh": false,
      "hUpejP": "Robert Farmer",
      "wtXodG": "07700900333",
      "YOPYRe": "robert.farmer@email.com"
    },
    "repeaters": {}
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Other casework",
  "detailed_work_type": "SSSI - Pre Consent advice",
  "description": "SSSI - Pre Consent advice",
  "consulting_body_type": "Landowner",
  "consulting_body": "Robert Farmer",
  "customer_name": "Robert Farmer",
  "customer_email_address": "robert.farmer@email.com",
  "email_header": "SSSI - Pre Consent advice",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Landowner",
  "public_body": "",
  "is_there_a_european_site": "No",
  "SSSI_info": [],
  "euro_site_info": []
}
```

---

## Example 8: Consultant working on behalf of a public body (Other category)

**Scenario:** An "Other" category user working on behalf of a public body, requesting HRA advice via the S28G path.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Other",
      "PBmxNM": "Public body or organisation",
      "HiTHQX": "National Trust",
      "jYwTmN": "National Trust",
      "YOwPAJ": "Standalone HRA advice",
      "emlmbt": "Advice on screening stage",
      "xZiZct": true,
      "PkpWyY": "Upload",
      "hUpejP": "Emma Ecologist",
      "wtXodG": "07700900444",
      "YOPYRe": "emma@wildlife-consulting.co.uk"
    },
    "repeaters": {
      "TJuSNf": [
        {
          "rtuWky": "UK11049---Solent Maritime Ramsar",
          "xeJYcG": { "easting": 445000, "northing": 98000 }
        },
        {
          "rtuWky": "UK11052---Portsmouth Harbour Ramsar",
          "xeJYcG": { "easting": 462000, "northing": 105000 }
        }
      ],
      "sssi_repeater_id": [
        {
          "Avdzxa": "1001434---Solent Maritime SSSI",
          "NMCFES": { "easting": 445100, "northing": 98100 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Standalone HRA Reg 63",
  "detailed_work_type": "Standalone HRA Reg 63",
  "description": "Standalone HRA Reg 63 - Solent Maritime Ramsar, Portsmouth Harbour Ramsar",
  "consulting_body_type": "Other",
  "consulting_body": "National Trust",
  "customer_name": "Emma Ecologist",
  "customer_email_address": "emma@wildlife-consulting.co.uk",
  "email_header": "Standalone HRA Reg 63 - Solent Maritime Ramsar, Portsmouth Harbour Ramsar",
  "is_contractor_working_for_public_body": "Yes",
  "public_body_type": "Public body or organisation",
  "public_body": "National Trust",
  "is_there_a_european_site": "Yes",
  "SSSI_info": [
    {
      "SSSI_id": 1001434,
      "coordinates": "445100,98100"
    }
  ],
  "euro_site_info": [
    {
      "european_site_id": 11049,
      "european_site_coordinates": "445000,98000"
    },
    {
      "european_site_id": 11052,
      "european_site_coordinates": "462000,105000"
    }
  ]
}
```

---

## Example 9: FC user - "Something else" falling through to general topics

**Scenario:** A Forestry Commission user selects "Something else" on the FC advice type, then picks a general topic.

### Input

```json
{
  "data": {
    "main": {
      "teEzOl": "Government Agency",
      "PvUZyQ": "Forestry Commission",
      "NVRbCy": "Something else",
      "xzEslQ": "I have a question about the sale of SSSI land",
      "QmIGor": "We are considering purchasing land adjacent to an existing FC holding which includes part of a SSSI. What are the transfer obligations?",
      "MiujQY": false,
      "ehAGZh": false,
      "hUpejP": "David Woods",
      "wtXodG": "07700900555",
      "YOPYRe": "david.woods@forestrycommission.gov.uk"
    },
    "repeaters": {}
  }
}
```

### Expected output

```json
{
  "form_type": "advice",
  "broad_work_type": "Other casework",
  "detailed_work_type": "SSSI - Other",
  "description": "SSSI - Other",
  "consulting_body_type": "Government Agency",
  "consulting_body": "Forestry Commission",
  "customer_name": "David Woods",
  "customer_email_address": "david.woods@forestrycommission.gov.uk",
  "email_header": "SSSI - Other",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Government Agency",
  "public_body": "Forestry Commission",
  "is_there_a_european_site": "No",
  "SSSI_info": [],
  "euro_site_info": []
}
```

---

## Scenario coverage summary

| #   | Identity type         | Advice path                    | Key features tested                                                   |
| --- | --------------------- | ------------------------------ | --------------------------------------------------------------------- |
| 1   | FC direct             | HRA (FC)                       | European sites, SSSI repeater, HRA stage                              |
| 2   | FC direct             | S28I SSSI (FC)                 | Multiple SSSIs, woodland management, proposed activities text         |
| 3   | LPA direct            | HRA (S28G)                     | S28G advice type, LPA consulting body, Appropriate Assessment stage   |
| 4   | Consultant for EA     | S28I SSSI (S28G)               | Working on behalf chain, contractor fields, both text + upload        |
| 5   | Member of public      | General: NNRs                  | General topic path, question field, no SSSI/euro data                 |
| 6   | Member of public      | General: Damage report         | Damage-specific fields (MoCXGK, rSJTFC, YhWlKB)                       |
| 7   | Landowner             | General: Pre-consent           | Landowner identity, pre-consent topic                                 |
| 8   | Other for public body | HRA (S28G)                     | Other + PBmxNM chain, multiple European sites, public body resolution |
| 9   | FC direct             | Something else > General topic | FC fallthrough to general topics, broad/detailed work type divergence |
