# Payload structure

## Input: Form submission message

The service receives messages from the SQS queue in the `FormAdapterSubmissionMessage` format defined by `@defra/forms-engine-plugin`.

### Structure overview

```javascript
{
  messageId: string,          // SQS message ID
  recordCreatedAt: Date,      // When the service received the message
  meta: { ... },              // Submission metadata
  data: {                     // User's submission data
    main: { ... },            // Standard field answers
    repeaters: { ... },       // Repeatable section answers
    files: { ... }            // File upload references
  }
}
```

### Meta section

Contains form metadata and submission context.

```javascript
{
  meta: {
    schemaVersion: 1,
    timestamp: "2025-09-11T14:53:58.466Z",
    referenceNumber: "1A5-F72-704",
    formName: "Ask Natural England for advice",
    formId: "69a07d92093ab56d4fa9f325",
    formSlug: "ask-natural-england-for-advice",
    status: "live",
    isPreview: false,
    notificationEmail: "example@defra.gov.uk",
    versionMetadata: {
      versionNumber: 9,
      createdAt: "2025-09-11T14:49:39.906Z"
    }
  }
}
```

Key fields:

- **formId** - Used to route the submission to the correct form mapper
- **referenceNumber** - Unique submission identifier shown to the user
- **timestamp** - ISO 8601 submission time
- **status** - Which version of the form was submitted (`live` or `draft`)

### Data section

Contains the actual form answers.

#### Main

Single-value fields keyed by component name.

```javascript
{
  main: {
    "fFzkDs": "Aragorn",              // TextField
    "applicantEmail": "user@example.com",
    "numberOfItems": 5,               // NumberField
    "agreeToTerms": true,             // CheckboxesField
    "preferredContact": "email"       // RadiosField
  }
}
```

Component names (like `fFzkDs`) are auto-generated unique identifiers. The form mappers know which field IDs correspond to which questions for each supported form.

#### Repeaters

Repeating sections where users can add multiple entries.

```javascript
{
  repeaters: {
    "peopleLivingAtHome": [
      { "name": "Joe Bloggs", "age": "42" },
      { "name": "Jane Doe", "age": "45" }
    ]
  }
}
```

Each repeater is an array of objects with consistent field names.

#### Files

File upload metadata (references, not binary content).

```javascript
{
  files: {
    "proofOfAddress": [
      {
        "id": "dcbabeac-d828-451e-99cc-08c5e4e71e3f",
        "url": "https://forms.defra.gov.uk/file-download/dcbabeac-..."
      }
    ]
  }
}
```

---

## Output: Transformed payloads

Each form mapper produces a different output structure. All outputs are sent as JSON POST requests to the downstream API.

### Advice form output

```javascript
{
  form_type: "advice",
  DF_reference_number: "1A5-F72-704",
  broad_work_type: "Other casework",       // or "S28i Advice", "Standalone HRA Reg 63"
  detailed_work_type: "SSSI - Pre Consent advice",
  description: "Description of the proposed works",
  consulting_body_type: "Landowner",       // or "Consultant", "Government Agency", etc.
  consulting_body: "Organisation name",
  customer_name: "Full name",
  customer_email_address: "email@example.com",
  email_header: "Email subject text",
  is_contractor_working_for_public_body: "Yes",  // or "No"
  public_body_type: "Government Agency",
  public_body: "Agency name",
  is_there_a_european_site: "Yes",         // or "" (empty) when not applicable
  SSSI_info: [
    { SSSI_id: 0, coordinates: "123456,654321" }
  ],
  euro_site_info: [
    { european_site_id: 0, european_site_coordinates: "123456,654321" }
  ]
}
```

### Assent form output

```javascript
{
  form_type: "assent",
  DF_reference_number: "1A5-F72-704",
  broad_work_type: "S28H Assent",
  detailed_work_type: "S28H Assent CS HT", // or "S28H Assent CS MT", "S28H Assent HLS extension", etc.
  description: "Activities - SSSI names - Euro site names",
  consulting_body_type: "Government Agency", // or "Landowner", "Local Planning Authority", etc.
  consulting_body: "Organisation name",
  customer_name: "Full name",
  customer_email_address: "email@example.com",
  email_header: "Email subject text",
  SBI: 123456789,                          // Single Business Identifier (optional, when scheme selected)
  agreement_reference: "AG-12345",
  is_contractor_working_for_public_body: "Yes",  // or "No"
  public_body_type: "Government Agency",
  public_body: "Body name",
  is_there_a_european_site: "Yes",         // or "" (empty) when not applicable
  SSSI_info: [
    { SSSI_id: 0, coordinates: "123456,654321" }
  ],
  euro_site_info: [
    { european_site_id: 0 }
  ]
}
```

### Consent form output

```javascript
{
  form_type: "consent",
  DF_reference_number: "1A5-F72-704",
  broad_work_type: "S28E Consent",
  detailed_work_type: "S28E Consent CS HT", // or "S28E Consent CS MT", "S28E Consent HLS extension", etc.
  description: "Activities - SSSI names",
  consulting_body_type: "Landowner",       // or "Land occupier", "Consultant", "Other"
  customer_name: "Full name",
  customer_email_address: "email@example.com",
  email_header: "Activities - SSSI names", // same segments as description, truncated to 255 chars
  SBI: 123456789,                          // Single Business Identifier (optional)
  agreement_reference: "AG-12345",
  SSSI_info: [
    { SSSI_id: 0, coordinates: "123456,654321", ornec: "Activity name" }
  ]
}
```

### Common fields across all output types

| Field                    | Type   | Description                                   |
| ------------------------ | ------ | --------------------------------------------- |
| `form_type`              | string | `"advice"`, `"assent"`, or `"consent"`        |
| `DF_reference_number`    | string | Defra Forms submission reference number       |
| `customer_name`          | string | Submitter's full name                         |
| `customer_email_address` | string | Submitter's email address                     |
| `email_header`           | string | Text used as the email subject line           |
| `SSSI_info`              | array  | Array of SSSI objects with ID and coordinates |

### Coordinate format

Coordinates are formatted as `"easting,northing"` strings. Multiple coordinate pairs for the same SSSI are joined with semicolons: `"123456,654321;234567,765432"`.
