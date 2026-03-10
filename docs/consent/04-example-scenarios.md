# Consent form example scenarios

Each example shows the form submission data (input) and the expected CWT output (result). These can be used as test fixtures.

---

## Example 1: Landowner with CSHT scheme, single SSSI with ORNEC activities

**Scenario:** A SSSI landowner applying for consent under a Countryside Stewardship Higher Tier agreement, with two planned activities on a single SSSI.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "An owner of land within a SSSI",
      "rTreXu": "A Countryside Stewardship Higher Tier (CSHT) agreement",
      "WZJDQG": "CS-2024-00789",
      "oflKhi": "123456789",
      "hozdvW": "North Meadow & Clattinger Farm SSSI",
      "lmqMaY": false,
      "htlAAq": "Robert",
      "pPocjH": "Farmer",
      "skdDtj": "robert.farmer@email.com"
    },
    "repeaters": {
      "iTBHrY": [
        {
          "hqsZMS": "Grazing",
          "QKdhfh": { "easting": 409500, "northing": 194200 }
        },
        {
          "hqsZMS": "Hay cutting",
          "QKdhfh": { "easting": 409600, "northing": 194300 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "consent",
  "broad_work_type": "S28E Consent",
  "detailed_work_type": "S28E Consent CS HT",
  "description": "North Meadow & Clattinger Farm SSSI - Grazing, Hay cutting",
  "consulting_body_type": "Landowner",
  "customer_name": "Robert Farmer",
  "customer_email_address": "robert.farmer@email.com",
  "SBI": 123456789,
  "agreement_reference": "CS-2024-00789",
  "email_header": "Grazing",
  "SSSI_info": [
    {
      "SSSI_id": "North Meadow & Clattinger Farm SSSI",
      "coordinates": "409500,194200;409600,194300",
      "ornec": "Grazing, Hay cutting"
    }
  ]
}
```

---

## Example 2: Land occupier with HLS scheme, single SSSI (scheme coordinates)

**Scenario:** A land occupier applying for consent under an HLS agreement with a single SSSI using the scheme coordinate path (no ORNEC repeater).

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "An occupier of land within a SSSI",
      "rTreXu": "A Higher Level Stewardship (HLS) agreement",
      "OFiizI": "HLS-AG-55678",
      "oflKhi": "987654321",
      "hozdvW": "Thursley Common SSSI",
      "lmqMaY": false,
      "JPohUD": { "easting": 490200, "northing": 139800 },
      "htlAAq": "Margaret",
      "pPocjH": "Hill",
      "skdDtj": "margaret.hill@email.com"
    },
    "repeaters": {}
  }
}
```

### Expected output

```json
{
  "form_type": "consent",
  "broad_work_type": "S28E Consent",
  "detailed_work_type": "S28E Consent HLS extension",
  "description": "Thursley Common SSSI",
  "consulting_body_type": "Land occupier",
  "customer_name": "Margaret Hill",
  "customer_email_address": "margaret.hill@email.com",
  "SBI": 987654321,
  "agreement_reference": "HLS-AG-55678",
  "email_header": "A Higher Level Stewardship (HLS) agreement",
  "SSSI_info": [
    {
      "SSSI_id": "Thursley Common SSSI",
      "coordinates": "490200,139800",
      "ornec": ""
    }
  ]
}
```

---

## Example 3: Consultant, no scheme, single SSSI with ORNEC activities

**Scenario:** A consultant working on behalf of an owner/occupier, no land management scheme, single SSSI with ORNEC activities.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "Someone with permission to work on behalf of an owner or occupier",
      "hozdvW": "Epping Forest SSSI",
      "lmqMaY": false,
      "htlAAq": "Emma",
      "pPocjH": "Ecology",
      "skdDtj": "emma@ecologyconsulting.co.uk"
    },
    "repeaters": {
      "iTBHrY": [
        {
          "hqsZMS": "Tree surgery",
          "QKdhfh": { "easting": 541200, "northing": 198400 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "consent",
  "broad_work_type": "S28E Consent",
  "detailed_work_type": "S28E Consent",
  "description": "Epping Forest SSSI - Tree surgery",
  "consulting_body_type": "Consultant",
  "customer_name": "Emma Ecology",
  "customer_email_address": "emma@ecologyconsulting.co.uk",
  "agreement_reference": "",
  "email_header": "Tree surgery",
  "SSSI_info": [
    {
      "SSSI_id": "Epping Forest SSSI",
      "coordinates": "541200,198400",
      "ornec": "Tree surgery"
    }
  ]
}
```

---

## Example 4: Landowner, SFI scheme, multiple SSSIs with ORNEC activities

**Scenario:** A SSSI landowner with an SFI agreement, multiple SSSIs with different activities grouped by SSSI.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "An owner of land within a SSSI",
      "rTreXu": "A Sustainable Farming Incentive (SFI) agreement",
      "niVAkO": "SFI-2025-00123",
      "VLUhzR": "111222333",
      "lmqMaY": true,
      "htlAAq": "William",
      "pPocjH": "Meadows",
      "skdDtj": "william.meadows@email.com"
    },
    "repeaters": {
      "cwZgSE": [
        {
          "rWrBOK": "Wicken Fen SSSI",
          "BscJLV": "Grazing",
          "gjWdrc": { "easting": 556300, "northing": 270500 }
        },
        {
          "rWrBOK": "Wicken Fen SSSI",
          "BscJLV": "Fencing",
          "gjWdrc": { "easting": 556400, "northing": 270600 }
        },
        {
          "rWrBOK": "Hatfield Forest SSSI",
          "BscJLV": "Drainage",
          "gjWdrc": { "easting": 554000, "northing": 220000 }
        }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "consent",
  "broad_work_type": "S28E Consent",
  "detailed_work_type": "S28E Consent SFI",
  "description": "Wicken Fen SSSI - Grazing, Fencing; Hatfield Forest SSSI - Drainage",
  "consulting_body_type": "Landowner",
  "customer_name": "William Meadows",
  "customer_email_address": "william.meadows@email.com",
  "SBI": 111222333,
  "agreement_reference": "SFI-2025-00123",
  "email_header": "Grazing",
  "SSSI_info": [
    {
      "SSSI_id": "Wicken Fen SSSI",
      "coordinates": "556300,270500;556400,270600",
      "ornec": "Grazing, Fencing"
    },
    {
      "SSSI_id": "Hatfield Forest SSSI",
      "coordinates": "554000,220000",
      "ornec": "Drainage"
    }
  ]
}
```

---

## Example 5: Other user, CSMT scheme, multiple SSSIs (scheme path)

**Scenario:** A "Somebody else" user with a CSMT agreement extension, multiple SSSIs via the scheme repeater (no ORNEC activities).

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "Somebody else",
      "rTreXu": "A Countryside Stewardship Mid Tier (CSMT) agreement extension",
      "WZJDQG": "CS-MT-99876",
      "oflKhi": "444555666",
      "lmqMaY": true,
      "htlAAq": "Peter",
      "pPocjH": "Stone",
      "skdDtj": "peter.stone@email.com"
    },
    "repeaters": {
      "gWZwzI": [
        { "gVlMxz": "Chobham Common SSSI" },
        { "gVlMxz": "Horsell Common SSSI" }
      ]
    }
  }
}
```

### Expected output

```json
{
  "form_type": "consent",
  "broad_work_type": "S28E Consent",
  "detailed_work_type": "S28E Consent CS MT",
  "description": "Chobham Common SSSI; Horsell Common SSSI",
  "consulting_body_type": "Other",
  "customer_name": "Peter Stone",
  "customer_email_address": "peter.stone@email.com",
  "SBI": 444555666,
  "agreement_reference": "CS-MT-99876",
  "email_header": "A Countryside Stewardship Mid Tier (CSMT) agreement extension",
  "SSSI_info": [
    { "SSSI_id": "Chobham Common SSSI", "coordinates": "", "ornec": "" },
    { "SSSI_id": "Horsell Common SSSI", "coordinates": "", "ornec": "" }
  ]
}
```

---

## Example 6: Landowner with other permission, single SSSI

**Scenario:** A landowner without a land management scheme but with a named permission (VacBun), single SSSI without ORNEC activities.

### Input

```json
{
  "data": {
    "main": {
      "KTObNK": "An owner of land within a SSSI",
      "VacBun": "Planning Permission PP/2025/0042",
      "oflKhi": "777888999",
      "hozdvW": "Castle Hill SSSI",
      "lmqMaY": false,
      "htlAAq": "Catherine",
      "pPocjH": "Ward",
      "skdDtj": "catherine.ward@email.com"
    },
    "repeaters": {}
  }
}
```

### Expected output

```json
{
  "form_type": "consent",
  "broad_work_type": "S28E Consent",
  "detailed_work_type": "S28E Consent",
  "description": "Castle Hill SSSI",
  "consulting_body_type": "Landowner",
  "customer_name": "Catherine Ward",
  "customer_email_address": "catherine.ward@email.com",
  "SBI": 777888999,
  "agreement_reference": "Planning Permission PP/2025/0042",
  "email_header": "",
  "SSSI_info": [
    { "SSSI_id": "Castle Hill SSSI", "coordinates": "", "ornec": "" }
  ]
}
```

---

## Scenario coverage summary

| #   | Identity type | Scheme           | SSSI path                   | Key features tested                                                                             |
| --- | ------------- | ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Landowner     | CSHT             | Single SSSI (ORNEC)         | CS agreement ref, SBI (oflKhi), ORNEC activities with coordinates, email_header from ORNEC      |
| 2   | Land occupier | HLS              | Single SSSI (scheme)        | HLS ref, scheme coordinates (JPohUD), email_header fallback to scheme, no ORNEC                 |
| 3   | Consultant    | None             | Single SSSI (ORNEC)         | No scheme, no SBI, ORNEC activity, default detailed_work_type                                   |
| 4   | Landowner     | SFI              | Multiple SSSIs (ORNEC)      | SFI ref, SBI (VLUhzR fallback), multi SSSI grouped by name, coordinates + ORNECs per SSSI       |
| 5   | Other         | CSMT             | Multiple SSSIs (scheme)     | Scheme repeater (no coordinates/ORNECs), email_header from scheme, description semicolon-joined |
| 6   | Landowner     | Other permission | Single SSSI (no activities) | VacBun agreement ref, no ORNEC, empty email_header, empty coordinates                           |
