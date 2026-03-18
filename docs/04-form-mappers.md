# Form mappers

Each supported form type has a dedicated mapper that transforms raw submission data into a structured output format for the downstream API.

## How routing works

The submission handler in [src/service/submission-handler.js](../src/service/submission-handler.js) routes each submission to the correct mapper by matching the `formId` from the message metadata against the configured form IDs:

| Form type | Config variable   | Mapper file                                                                                 |
| --------- | ----------------- | ------------------------------------------------------------------------------------------- |
| Advice    | `ADVICE_FORM_ID`  | [src/service/mappers/advice-form-mapper.js](../src/service/mappers/advice-form-mapper.js)   |
| Assent    | `ASSENT_FORM_ID`  | [src/service/mappers/assent-form-mapper.js](../src/service/mappers/assent-form-mapper.js)   |
| Consent   | `CONSENT_FORM_ID` | [src/service/mappers/consent-form-mapper.js](../src/service/mappers/consent-form-mapper.js) |

If a submission's form ID does not match any configured ID, the ID is logged as info, but otherwise the form is ignored and deleted from the queue.

## Advice form mapper

Handles requests for Natural England advice on proposed works near protected sites.

### Key transformation logic

- **Work type** is determined by a field precedence hierarchy. The mapper checks multiple conditional paths to determine the `broad_work_type` and `detailed_work_type`
- **Consulting body** is mapped from conditional fields based on the entity type (landowner, consultant, government agency, etc.)
- **SSSI and European site info** are extracted from repeater sections with coordinates formatted as `"easting,northing"`
- **Public body fields** are conditionally included based on whether the applicant is a contractor working for a public body

### Output fields

`form_type`, `DF_reference_number`, `broad_work_type`, `detailed_work_type`, `description`, `consulting_body_type`, `consulting_body`, `customer_name`, `customer_email_address`, `email_header`, `is_contractor_working_for_public_body`, `public_body_type`, `public_body`, `is_there_a_european_site`, `SSSI_info`, `euro_site_info`

## Assent form mapper

Handles S28H assent applications for works under agri-environment agreements (e.g. Countryside Stewardship, SFI).

### Key transformation logic

- **Detailed work type** is determined by the selected agreement scheme (CSHT, CSMT, HLS, SFI, MTA)
- **Agreement reference** is extracted from scheme-dependent fields
- **Description** is pulled from activity repeater sections
- **SSSI info** handles both single and multiple SSSI paths, extracting coordinates from the appropriate repeater sections

### Output fields

`form_type`, `DF_reference_number`, `broad_work_type`, `detailed_work_type`, `description`, `customer_name`, `customer_email_address`, `email_header`, `agreement_reference`, `SSSI_info`

## Consent form mapper

Handles S28E consent applications for works by land owners/occupiers on SSSIs.

### Key transformation logic

- **Detailed work type** is scheme-dependent, similar to the assent mapper
- **Description** combines SSSI names with ORNEC (activity classification) descriptions
- **SBI** (Single Business Identifier) is optionally included as a number
- **SSSI info** uniquely includes an `ornec` field for each SSSI, grouping coordinates by SSSI name
- **Email header** uses the first activity name from the submission

### Output fields

`form_type`, `DF_reference_number`, `broad_work_type`, `detailed_work_type`, `description`, `customer_name`, `customer_email_address`, `email_header`, `SBI`, `agreement_reference`, `SSSI_info`

## Helper functions

Shared utilities in [src/service/mappers/helpers.js](../src/service/mappers/helpers.js):

- `formatCoordinates({ easting, northing })` - Formats a coordinate pair as `"easting,northing"`
- `joinCoordinates(strings[])` - Joins multiple coordinate strings with semicolons

## Adding a new form mapper

To add support for a new form type:

1. Create a new mapper file in `src/service/mappers/` that exports a function accepting the submission message and returning the transformed output
2. Add the form ID to the configuration in `src/config.js`
3. Add a routing case in `src/service/submission-handler.js` that calls the new mapper
4. Add the corresponding form definition JSON to `form-definitions/` for reference
