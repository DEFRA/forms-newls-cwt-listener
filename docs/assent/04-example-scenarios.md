# Assent form example scenarios

Each example shows the form submission data (input) and the expected CWT output (result). These can be used as test fixtures.

---

## Example 1: Public body (Government agency) with CSHT scheme, single SSSI

**Scenario:** A government agency submitting an assent notice for a Countryside Stewardship Higher Tier agreement on a single SSSI, with two planned activities.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "A public body",
      "vUHwan": "Government agency",
      "cfPoiN": "Environment Agency",
      "rTreXu": "A Countryside Stewardship Higher Tier (CSHT) agreement",
      "WZJDQG": "CS-2024-00123",
      "ASataH": false,
      "gVlMxz": "1003015---North Meadow & Clattinger Farm SSSI",
      "XydYUD": false,
      "htlAAq": "Sarah",
      "pPocjH": "Green",
      "skdDtj": "sarah.green@environment-agency.gov.uk"
    },
    "repeaters": {
      "gzSkgC": [
        {
          "lGsnXi": "Grazing",
          "uqfCOY": { "easting": 409500, "northing": 194200 }
        },
        {
          "lGsnXi": "Hay cutting",
          "uqfCOY": { "easting": 409600, "northing": 194300 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "assent",
  "broad_work_type": "S28H Assent",
  "detailed_work_type": "S28H Assent CS HT",
  "description": "Grazing, Hay cutting - North Meadow & Clattinger Farm SSSI",
  "consulting_body_type": "Government Agency",
  "consulting_body": "Environment Agency",
  "customer_name": "Sarah Green",
  "customer_email_address": "sarah.green@environment-agency.gov.uk",
  "email_header": "Grazing, Hay cutting - North Meadow & Clattinger Farm SSSI",
  "agreement_reference": "CS-2024-00123",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Government Agency",
  "public_body": "Environment Agency",
  "is_there_a_european_site": "",
  "SSSI_info": [
    {
      "SSSI_id": 1003015,
      "coordinates": "409500,194200;409600,194300"
    }
  ],
  "euro_site_info": []
}
```

---

## Example 2: Contractor working on behalf, SFI scheme, single SSSI with European site

**Scenario:** A contractor working on behalf of a government agency submits an assent notice for an SFI agreement. The planned activities could affect a European site. The contractor also selects the public body category and the public body they represent.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "An organisation working on behalf of a public body",
      "ueDuNl": "Ecology Consulting Ltd",
      "vUHwan": "Government agency",
      "cfPoiN": "Natural England",
      "rTreXu": "A Sustainable Farming Incentive (SFI) agreement",
      "niVAkO": "SFI-2025-00456",
      "ASataH": false,
      "gVlMxz": "1001287---Pevensey Levels SSSI",
      "XydYUD": true,
      "htlAAq": "James",
      "pPocjH": "Carter",
      "skdDtj": "james.carter@ecologyconsulting.co.uk"
    },
    "repeaters": {
      "gzSkgC": [
        {
          "lGsnXi": "Drainage management",
          "uqfCOY": { "easting": 564800, "northing": 105200 }
        }
      ],
      "aQYWxD": [{ "IzQfir": "11053---Pevensey Levels Ramsar" }]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "assent",
  "broad_work_type": "S28H Assent",
  "detailed_work_type": "S28H Assent SFI",
  "description": "Drainage management - Pevensey Levels SSSI - Pevensey Levels Ramsar",
  "consulting_body_type": "Government Agency",
  "consulting_body": "Ecology Consulting Ltd",
  "customer_name": "James Carter",
  "customer_email_address": "james.carter@ecologyconsulting.co.uk",
  "email_header": "Drainage management - Pevensey Levels SSSI - Pevensey Levels Ramsar",
  "agreement_reference": "SFI-2025-00456",
  "is_contractor_working_for_public_body": "Yes",
  "public_body_type": "Government Agency",
  "public_body": "Natural England",
  "is_there_a_european_site": "Yes",
  "SSSI_info": [
    {
      "SSSI_id": 1001287,
      "coordinates": "564800,105200"
    }
  ],
  "euro_site_info": [
    {
      "european_site_id": 11053
    }
  ]
}
```

---

## Example 3: LPA public body, HLS scheme, multiple SSSIs (scheme path)

**Scenario:** A local planning authority submits an assent notice for an HLS agreement covering multiple SSSIs via the scheme repeater path.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "A public body",
      "vUHwan": "Local planning authority",
      "XAZlxH": "Surrey County Council",
      "rTreXu": "A Higher Level Stewardship (HLS) agreement",
      "OFiizI": "HLS-AG-78901",
      "ASataH": true,
      "XydYUD": false,
      "htlAAq": "Helen",
      "pPocjH": "Brooks",
      "skdDtj": "helen.brooks@surrey.gov.uk"
    },
    "repeaters": {
      "hhGvmX": [
        { "flbYHq": "1001567---Thursley Common SSSI" },
        { "flbYHq": "1000345---Chobham Common SSSI" }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "assent",
  "broad_work_type": "S28H Assent",
  "detailed_work_type": "S28H Assent HLS extension",
  "description": "A Higher Level Stewardship (HLS) agreement - Thursley Common SSSI, Chobham Common SSSI",
  "consulting_body_type": "Local Planning Authority",
  "consulting_body": "Surrey County Council",
  "customer_name": "Helen Brooks",
  "customer_email_address": "helen.brooks@surrey.gov.uk",
  "email_header": "A Higher Level Stewardship (HLS) agreement - Thursley Common SSSI, Chobham Common SSSI",
  "agreement_reference": "HLS-AG-78901",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Local Planning Authority",
  "public_body": "Surrey County Council",
  "is_there_a_european_site": "",
  "SSSI_info": [
    { "SSSI_id": 1001567, "coordinates": "" },
    { "SSSI_id": 1000345, "coordinates": "" }
  ],
  "euro_site_info": []
}
```

---

## Example 4: Public body (Landowner), no scheme, multiple SSSIs (ORNEC path)

**Scenario:** A landowner public body submits an assent notice without a specific scheme, using the ORNEC repeater for multiple SSSIs with activities and coordinates.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "A public body",
      "vUHwan": "Landowner",
      "cfPoiN": "National Trust",
      "ASataH": true,
      "XydYUD": false,
      "htlAAq": "Mark",
      "pPocjH": "Thompson",
      "skdDtj": "mark.thompson@nationaltrust.org.uk"
    },
    "repeaters": {
      "QxIzSB": [
        {
          "wRGnMW": "1000789---Wicken Fen SSSI",
          "iNDqRN": "Reed cutting",
          "KnBNzJ": { "easting": 556300, "northing": 270500 }
        },
        {
          "wRGnMW": "1000789---Wicken Fen SSSI",
          "iNDqRN": "Water level management",
          "KnBNzJ": { "easting": 556400, "northing": 270600 }
        },
        {
          "wRGnMW": "1000456---Hatfield Forest SSSI",
          "iNDqRN": "Coppicing",
          "KnBNzJ": { "easting": 554000, "northing": 220000 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "assent",
  "broad_work_type": "S28H Assent",
  "detailed_work_type": "S28H Assent",
  "description": "Reed cutting, Water level management, Coppicing - Wicken Fen SSSI, Hatfield Forest SSSI",
  "consulting_body_type": "Landowner",
  "consulting_body": "National Trust",
  "customer_name": "Mark Thompson",
  "customer_email_address": "mark.thompson@nationaltrust.org.uk",
  "email_header": "Reed cutting, Water level management, Coppicing - Wicken Fen SSSI, Hatfield Forest SSSI",
  "agreement_reference": "",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Landowner",
  "public_body": "National Trust",
  "is_there_a_european_site": "",
  "SSSI_info": [
    {
      "SSSI_id": 1000789,
      "coordinates": "556300,270500;556400,270600"
    },
    {
      "SSSI_id": 1000456,
      "coordinates": "554000,220000"
    }
  ],
  "euro_site_info": []
}
```

---

## Example 5: Contractor with "Other" organisation, MTA scheme, single SSSI

**Scenario:** A contractor working on behalf of a public body landowner, with a custom organisation name, MTA scheme, single SSSI.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "An organisation working on behalf of a public body",
      "ueDuNl": "Other",
      "Xszriq": "Regional Wildlife Trust",
      "vUHwan": "Landowner",
      "cfPoiN": "Ministry of Defence",
      "rTreXu": "A Minor and Temporary Adjustments (MTA)",
      "ASataH": false,
      "gVlMxz": "1000234---Ashdown Forest SSSI",
      "XydYUD": false,
      "htlAAq": "Lucy",
      "pPocjH": "Davies",
      "skdDtj": "lucy.davies@wildlife-trust.org.uk"
    },
    "repeaters": {
      "gzSkgC": [
        {
          "lGsnXi": "Temporary fencing installation",
          "uqfCOY": { "easting": 543200, "northing": 132800 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "assent",
  "broad_work_type": "S28H Assent",
  "detailed_work_type": "S28H Assent MTA",
  "description": "Temporary fencing installation - Ashdown Forest SSSI",
  "consulting_body_type": "Landowner",
  "consulting_body": "Regional Wildlife Trust",
  "customer_name": "Lucy Davies",
  "customer_email_address": "lucy.davies@wildlife-trust.org.uk",
  "email_header": "Temporary fencing installation - Ashdown Forest SSSI",
  "agreement_reference": "",
  "is_contractor_working_for_public_body": "Yes",
  "public_body_type": "Landowner",
  "public_body": "Ministry of Defence",
  "is_there_a_european_site": "",
  "SSSI_info": [
    {
      "SSSI_id": 1000234,
      "coordinates": "543200,132800"
    }
  ],
  "euro_site_info": []
}
```

---

## Example 6: Public body (Other category) with "Other" public body, CS Capital Grants

**Scenario:** An "Other" category public body providing a free text body name, using CS Capital Grants scheme.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "A public body",
      "vUHwan": "Other",
      "FyLHmN": "Woodland Heritage Foundation",
      "rTreXu": "A Countryside Stewardship Capital Grants agreement",
      "WZJDQG": "CS-CAP-55678",
      "ASataH": false,
      "gVlMxz": "1000456---Epping Forest SSSI",
      "XydYUD": true,
      "htlAAq": "David",
      "pPocjH": "Wilson",
      "skdDtj": "david.wilson@woodland-heritage.org.uk"
    },
    "repeaters": {
      "gzSkgC": [
        {
          "lGsnXi": "Woodland restoration",
          "uqfCOY": { "easting": 541200, "northing": 198400 }
        }
      ],
      "aQYWxD": [
        { "IzQfir": "11021---Epping Forest SAC" },
        { "IzQfir": "11033---Lee Valley Ramsar" }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "assent",
  "broad_work_type": "S28H Assent",
  "detailed_work_type": "S28H Assent CS Capital Grants",
  "description": "Woodland restoration - Epping Forest SSSI - Epping Forest SAC, Lee Valley Ramsar",
  "consulting_body_type": "Other",
  "consulting_body": "Woodland Heritage Foundation",
  "customer_name": "David Wilson",
  "customer_email_address": "david.wilson@woodland-heritage.org.uk",
  "email_header": "Woodland restoration - Epping Forest SSSI - Epping Forest SAC, Lee Valley Ramsar",
  "agreement_reference": "CS-CAP-55678",
  "is_contractor_working_for_public_body": "No",
  "public_body_type": "Other",
  "public_body": "Woodland Heritage Foundation",
  "is_there_a_european_site": "Yes",
  "SSSI_info": [
    {
      "SSSI_id": 1000456,
      "coordinates": "541200,198400"
    }
  ],
  "euro_site_info": [
    {
      "european_site_id": 11021
    },
    {
      "european_site_id": 11033
    }
  ]
}
```

---

## Scenario coverage summary

| #   | Identity type                  | Scheme            | SSSI path               | Key features tested                                                                |
| --- | ------------------------------ | ----------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| 1   | Public body: Government agency | CSHT              | Single SSSI             | CS agreement ref, activities with coordinates, consulting_body_type capitalisation |
| 2   | Contractor (named org)         | SFI               | Single SSSI             | Working on behalf chain, SFI agreement ref, European site, public body populated   |
| 3   | Public body: LPA               | HLS               | Multiple SSSIs (scheme) | Local authority consulting_body, HLS ref, scheme repeater (no coordinates)         |
| 4   | Public body: Landowner         | None              | Multiple SSSIs (ORNEC)  | ORNEC repeater grouped by SSSI, coordinates stitched per SSSI                      |
| 5   | Contractor (Other org)         | MTA               | Single SSSI             | Other organisation free text, MTA scheme, no agreement ref, public body populated  |
| 6   | Public body: Other             | CS Capital Grants | Single SSSI             | Other public body free text, Capital Grants ref, multiple European sites           |
