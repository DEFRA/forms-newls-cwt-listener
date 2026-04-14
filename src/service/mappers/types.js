/**
 * @typedef {object} SSSIInfo
 * @property {number} SSSI_id - The numeric ID of the SSSI
 * @property {string} coordinates - Format "<easting>,<northing>" or "<e1>,<n1>;<e2>,<n2>"
 */

/**
 * @typedef {object} EuroSiteInfoId
 * @property {number} european_site_id - The European Site ID as a number (e.g. 11004)
 */

/**
 * @typedef {object} EuroSiteInfo
 * @property {number} european_site_id - The European Site ID as a number (e.g. 11004)
 * @property {string} european_site_coordinates - Format "<easting>,<northing>"
 */

/**
 * @typedef {object} ConsentSSSIInfo
 * @property {number} SSSI_id - The numeric ID of the SSSI
 * @property {string} coordinates - Format "<easting>,<northing>" or "<e1>,<n1>;<e2>,<n2>"
 * @property {string} ornec - The ORNEC activity name for this SSSI
 */

/**
 * @typedef {object} AdviceFormOutput
 * @property {'advice'} form_type
 * @property {string} DF_reference_number
 * @property {string} broad_work_type
 * @property {string} detailed_work_type
 * @property {string} description
 * @property {string} consulting_body_type
 * @property {string} consulting_body
 * @property {string} customer_name
 * @property {string} customer_email_address
 * @property {string} email_header
 * @property {'Yes' | 'No'} is_contractor_working_for_public_body
 * @property {string} [public_body_type]
 * @property {string} [public_body]
 * @property {'Yes' | 'No'} is_there_a_european_site
 * @property {SSSIInfo[]} SSSI_info
 * @property {EuroSiteInfo[]} euro_site_info
 */

/**
 * @typedef {object} AssentFormOutput
 * @property {'assent'} form_type
 * @property {string} DF_reference_number
 * @property {'S28H Assent'} broad_work_type
 * @property {string} detailed_work_type
 * @property {string} description
 * @property {string} consulting_body_type
 * @property {string} consulting_body
 * @property {string} customer_name
 * @property {string} customer_email_address
 * @property {string} email_header
 * @property {number} [SBI]
 * @property {string} [agreement_reference]
 * @property {'Yes' | 'No'} is_contractor_working_for_public_body
 * @property {string} [public_body_type]
 * @property {string} [public_body]
 * @property {'Yes' | ''} is_there_a_european_site
 * @property {SSSIInfo[]} SSSI_info
 * @property {EuroSiteInfoId[]} euro_site_info
 */

/**
 * @typedef {object} ConsentFormOutput
 * @property {'consent'} form_type
 * @property {string} DF_reference_number
 * @property {'S28E Consent'} broad_work_type
 * @property {string} detailed_work_type
 * @property {string} description
 * @property {string} consulting_body_type
 * @property {string} customer_name
 * @property {string} customer_email_address
 * @property {number} [SBI]
 * @property {string} [agreement_reference]
 * @property {string} [email_header]
 * @property {ConsentSSSIInfo[]} SSSI_info
 */

/**
 * @typedef {AdviceFormOutput | AssentFormOutput | ConsentFormOutput} TransmittableFormOutput
 */

export default {}
