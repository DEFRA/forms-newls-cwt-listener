import { expect } from "@playwright/test";
import { test } from "./fixtures";

/**
 * Advice Form – auto-fill scripts for all main pathways.
 *
 * Form URL: http://localhost:3009/form/advice/before-you-start
 *
 * Routes covered:
 *   1.  consultant-ga-fc-hra              – Consultant → Gov agency → Forestry Commission → HRA
 *   2.  consultant-ga-fc-s28i-woodland    – Consultant → Gov agency → Forestry Commission → S28I (woodland Yes)
 *   3.  consultant-ga-fc-something-else   – Consultant → Gov agency → Forestry Commission → Something else → General question
 *   4.  gov-agency-ea-hra                 – Government Agency → Environment Agency → HRA (S28G path)
 *   5.  gov-agency-ea-s28i               – Government Agency → Environment Agency → S28I (S28G path)
 *   6.  gov-agency-other-agency           – Government Agency → Other government agency → General question
 *   7.  harbour-authority-s28g-hra        – Harbour authority → S28G HRA advice
 *   8.  landowner-general-question        – Landowner → Something else topic → General question (with doc upload)
 *   9.  member-of-public-damage-report    – Member of public → Damage reporting path
 *  10.  member-of-public-drone            – Member of public → Drone flying path
 *  11.  other-category-other-org          – Other → Other org name → Landowner → General question
 *  12.  lpa-s28g-pre-assent              – Local Planning Authority → S28G → Something else → Pre-assent advice
 */

const FORM_URL = "http://localhost:3009/form/advice/before-you-start";
const PDF_PATH = "/Users/aaron/Temp/pdf_for_upload_test.pdf";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function startForm(page: import("@playwright/test").Page) {
  await page.goto(FORM_URL);
  await page.getByRole("button", { name: "Continue" }).click();
}

/** File-upload helper – must use this pattern, not the Playwright-recorded default. */
async function uploadFile(page: import("@playwright/test").Page) {
  await page.locator('input[type="file"]').setInputFiles(PDF_PATH);
  await page.getByRole("button", { name: "Upload file" }).click();
  const uploadedTag = page.locator("strong.govuk-tag--green", {
    hasText: "Uploaded",
  });
  await expect(uploadedTag).toBeVisible();
}

/**
 * Autocomplete helper – targets the visible input overlay rather than the
 * hidden <select>, which getByRole("combobox") can incorrectly resolve to.
 */
async function fillAutocomplete(
  page: import("@playwright/test").Page,
  searchText: string,
  optionName: string | RegExp
) {
  const input = page.locator("input.autocomplete__input");
  await expect(input).toBeVisible();
  await input.fill(searchText);
  await page.getByRole("option", { name: optionName }).click();
}

/**
 * Fill the shared contact details pages (full name, contact number, email).
 * Email IS mandatory on the contact details page.
 * The OPTIONAL email is on the check-your-answers / summary page – that one is left blank.
 */
async function fillContactDetails(
  page: import("@playwright/test").Page,
  name: string,
  phone: string,
  email: string
) {
  await page
    .getByRole("textbox", { name: "What is your full name?" })
    .click();
  await page
    .getByRole("textbox", { name: "What is your full name?" })
    .fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("textbox", { name: "What is your contact number?" })
    .click();
  await page
    .getByRole("textbox", { name: "What is your contact number?" })
    .fill(phone);
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("textbox", { name: "What is your email address?" })
    .click();
  await page
    .getByRole("textbox", { name: "What is your email address?" })
    .fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Advice Form", () => {
  // ── Route 1: Consultant → Government agency → Forestry Commission → HRA ──
  test("consultant-ga-fc-hra", async ({ page }) => {
    await startForm(page);

    // Applicant category
    await page.getByRole("radio", { name: "Consultant" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Organisation name (autocomplete)
    await fillAutocomplete(page, "National", "National Trust");
    await page.getByRole("button", { name: "Continue" }).click();

    // Working on behalf of (NB: typo "Government" is in the live form)
    await page.getByRole("radio", { name: "Government agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Which government agency?
    await page.getByRole("radio", { name: "Forestry Commission" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // What type of advice? (FC path) – HRA
    await page
      .getByRole("radio", { name: "Habitats Regulations" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // HRA stage
    await page
      .getByRole("radio", { name: "Advice on screening stage" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // European site – autocomplete
    await fillAutocomplete(page, "arun", "Arun Valley SPA");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // "You have added 1 answer" – Continue (don't add another)
    await page.getByRole("button", { name: "Continue" }).click();

    // Preventing damage to SSSIs – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Proposed activities text
    await page
      .getByRole("textbox", { name: "Tell us about the proposed" })
      .click();
    await page
      .getByRole("textbox", { name: "Tell us about the proposed" })
      .fill("HRA screening stage activities description for Arun Valley SPA.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Alice Smith",
      "07700900001",
      "alice.smith@do-not-resolve-for-testing.com"
    );
    // Summary page – leave confirmation email blank, just submit
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 2: Consultant → Government agency → Forestry Commission → S28I (woodland Yes) ──
  test("consultant-ga-fc-s28i-woodland", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Consultant" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Organisation name (autocomplete)
    await fillAutocomplete(page, "National", "National Trust");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: "Government agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: "Forestry Commission" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // FC advice type – Section 28i SSSI advice
    await page
      .getByRole("radio", { name: "Section 28i SSSI advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Operations associated with woodland management? – Yes → upload supplementary docs
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload supplementary notice of operations documents
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Preventing damage to SSSIs – Yes (so we skip nature-positive outcomes)
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI affected
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // "You have added 1 answer" – Continue
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByRole("textbox", { name: "Tell us about the proposed" })
      .fill("S28I woodland management activities on Arun Banks SSSI.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Bob Jones",
      "07700900002",
      "bob.jones@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 3: Consultant → Government agency → Forestry Commission → Something else → General question ──
  test("consultant-ga-fc-something-else", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Consultant" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Organisation name (autocomplete)
    await fillAutocomplete(page, "National", "National Trust");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: "Government agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: "Forestry Commission" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // FC advice type – Something else → topic selection
    await page.getByRole("radio", { name: "Something else" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic selection – Something else → general question
    await page.getByText("Something else", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // General question – what is your question?
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .fill("What is the process for FC woodland management consent?");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload document
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // More information? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Carol White",
      "07700900003",
      "carol.white@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 4: Government Agency → Environment Agency → S28G → HRA ──
  test("gov-agency-ea-hra", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Government Agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Which government agency?
    await page.getByRole("radio", { name: "Environment Agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // S28G advice type – Habitats Regulations Assessment (HRA) advice
    await page
      .getByRole("radio", { name: "Habitats Regulations Assessment" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // HRA stage
    await page
      .getByRole("radio", {
        name: "Statutory advice on an Appropriate Assessment",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // European site
    await fillAutocomplete(page, "arun", "Arun Valley SPA");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // Add another? – No
    await page.getByRole("button", { name: "Continue" }).click();

    // Preventing damage to SSSIs – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI affected
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // Add another? – No
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByRole("textbox", { name: "Tell us about the proposed" })
      .fill("Appropriate Assessment activities near Arun Valley SPA.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "David Green",
      "07700900004",
      "david.green@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 5: Government Agency → Environment Agency → S28G → S28I ──
  test("gov-agency-ea-s28i", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Government Agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: "Environment Agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // S28G advice type – Section 28i SSSI advice
    await page
      .getByRole("radio", { name: "Section 28i SSSI advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Preventing damage to SSSIs – No → nature-positive outcomes
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Nature-positive outcomes – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI affected
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // Add another? – No
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByRole("textbox", { name: "Tell us about the proposed" })
      .fill("Nature-positive SSSI management activities near Arun Banks.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Eve Brown",
      "07700900005",
      "eve.brown@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 6: Government Agency → Other government agency → General question ──
  test("gov-agency-other-agency", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Government Agency" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Which government agency?
    await page
      .getByRole("radio", { name: "Other government agency" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Tell us which agency (free text)
    await page
      .getByRole("textbox", { name: "Tell us which government agency" })
      .fill("Natural History Museum");
    await page.getByRole("button", { name: "Continue" }).click();

    // Advice type – Something else → topic selection
    await page.getByRole("radio", { name: "Something else" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic – Something else → general question
    await page.getByText("Something else", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // What is your question?
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .fill(
        "What are the reporting requirements for our monitoring programme?"
      );
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // More information? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Additional information
    await page
      .getByRole("textbox")
      .fill(
        "We operate across 12 monitored sites in the south of England."
      );
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Frank Taylor",
      "07700900006",
      "frank.taylor@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 7: Harbour authority → S28G HRA advice ──
  test("harbour-authority-s28g-hra", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Harbour authority" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Which public body? – autocomplete
    await fillAutocomplete(page, "ab", /./);
    await page.getByRole("button", { name: "Continue" }).click();

    // S28G advice type – Habitats Regulations Assessment (HRA) advice
    await page
      .getByRole("radio", { name: "Habitats Regulations Assessment" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // HRA stage
    await page
      .getByRole("radio", { name: "Advice on screening stage" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // European site
    await fillAutocomplete(page, "arun", "Arun Valley SPA");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // Add another? – No
    await page.getByRole("button", { name: "Continue" }).click();

    // Preventing damage to SSSIs – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI affected
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("textbox", { name: "Easting" }).fill("123456");
    await page.getByRole("textbox", { name: "Northing" }).fill("654321");
    await page.getByRole("button", { name: "Continue" }).click();

    // Add another? – No
    await page.getByRole("button", { name: "Continue" }).click();

    // Dates of proposed activities (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    await page
      .getByRole("textbox", { name: "Tell us about the proposed" })
      .fill("Harbour dredging works near Arun Valley SPA.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Grace Martin",
      "07700900007",
      "grace.martin@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 8: Landowner → Something else topic → General question (with doc upload) ──
  test("landowner-general-question", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Landowner" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic selection – Something else
    await page.getByText("Something else", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // What is your question?
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .fill("I need advice on managing a hedgerow on my SSSI land.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // More information? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Henry Wilson",
      "07700900008",
      "henry.wilson@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 9: Member of public → Damage reporting path ──
  test("member-of-public-damage-report", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Member of public" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic – Report potentially damaging activity
    await page
      .getByText("I would like to report potentially damaging activity", {
        exact: false,
      })
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Do you have evidence of the damage you wish to report? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name – autocomplete
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Damage location (easting / northing)
    await page.getByRole("textbox", { name: "Easting" }).fill("512345");
    await page.getByRole("textbox", { name: "Northing" }).fill("108765");
    await page.getByRole("button", { name: "Continue" }).click();

    // When did damage occur? – date fields
    await page.getByLabel("Day").fill("5");
    await page.getByLabel("Month").fill("1");
    await page.getByLabel("Year").fill("2026");
    await page.getByRole("button", { name: "Continue" }).click();

    // Description of damage
    await page
      .getByRole("textbox")
      .fill(
        "Heavy machinery tracks visible across protected grassland area."
      );
    await page.getByRole("button", { name: "Continue" }).click();

    // Evidence upload
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Iris Clarke",
      "07700900009",
      "iris.clarke@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 10: Member of public → Drone flying path ──
  test("member-of-public-drone", async ({ page }) => {
    await startForm(page);

    await page.getByRole("radio", { name: "Member of public" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic – Flying drones on/near a protected site
    await page
      .getByText("I have a question about flying drones", { exact: false })
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Select SSSI for drone flying – autocomplete (NE-managed sites only)
    await fillAutocomplete(page, "aqua", "Aqualate Mere SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Do you know where on the SSSI the drone will fly?
    await page
      .getByRole("radio", { name: "Within the SSSI boundary" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Timing of drone flight
    await page
      .getByRole("group", { name: "When do you plan to fly the drone?" })
      .getByLabel("Day")
      .fill("10");
    await page
      .getByRole("group", { name: "When do you plan to fly the drone?" })
      .getByLabel("Month")
      .fill("4");
    await page
      .getByRole("group", { name: "When do you plan to fly the drone?" })
      .getByLabel("Year")
      .fill("2027");
    await page.getByRole("button", { name: "Continue" }).click();

    // Details of drone activity
    await page
      .getByRole("textbox")
      .fill(
        "Survey flight for academic research – University of Sussex."
      );
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Jack Davies",
      "07700900010",
      "jack.davies@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 11: Other category → Other org → Landowner → General question ──
  test("other-category-other-org-general-question", async ({ page }) => {
    await startForm(page);

    // Applicant category – Other
    await page.getByRole("radio", { name: "Other" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Organisation name – select "Other" to trigger the other-org-name page
    // Cannot use fillAutocomplete here because "Other" also partially matches
    // "Rotherham Borough Council" and "Rother District Council" in the dropdown.
    const orgInput = page.locator("input.autocomplete__input");
    await expect(orgInput).toBeVisible();
    await orgInput.fill("Other");
    await page.getByRole("option", { name: "Other", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Other organisation name (free text)
    await page
      .getByRole("textbox", { name: "Other organisation name" })
      .fill("Acme Environmental Services Ltd");
    await page.getByRole("button", { name: "Continue" }).click();

    // Who are you working on behalf of?
    await page.getByRole("radio", { name: "Landowner" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic selection – Something else → general question
    await page.getByText("Something else", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // What is your question?
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .fill(
        "What are the notification requirements for hedgerow management on SSSI land?"
      );
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // More information? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Laura Mitchell",
      "07700900012",
      "laura.mitchell@do-not-resolve-for-testing.com"
    );
    // Summary page – leave confirmation email blank, just submit
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 12: Local Planning Authority → S28G → Something else → Pre-assent advice ──
  test("lpa-s28g-pre-assent", async ({ page }) => {
    await startForm(page);

    await page
      .getByRole("radio", { name: "Local Planning Authority" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Which local authority? – autocomplete
    // Wait for autocomplete input to render (it overlays a hidden <select>)
    const laInput = page.locator(
      "input.autocomplete__input[role='combobox']"
    );
    await expect(laInput).toBeVisible();
    await laInput.click();
    await laInput.fill("York");
    await page.getByRole("option", { name: /York/i }).first().click();
    await page.getByRole("button", { name: "Continue" }).click();

    // S28G advice type – Something else
    await page.getByRole("radio", { name: "Something else" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Topic – Pre-assent advice (public body)
    await page
      .getByText(
        "I represent a public body and I would like advice before applying",
        { exact: false }
      )
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Responsibilities towards SSSIs – info page; click Continue
    await page.getByRole("button", { name: "Continue" }).click();

    // Do you need more advice? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Query relates to EU sites? – No → general question flow
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // What is your question?
    await page
      .getByRole("textbox", { name: "What is your question?" })
      .fill("Pre-assent advice on proposed development near SSSI.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // More information? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(
      page,
      "Karen Stone",
      "07700900011",
      "karen.stone@do-not-resolve-for-testing.com"
    );
    await page.getByRole("button", { name: "Submit" }).click();
  });
});
