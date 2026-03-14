import { expect } from "@playwright/test";
import { test } from "./fixtures";

/**
 * Assent Form – auto-fill scripts for all main pathways.
 *
 * Form URL: http://localhost:3009/form/assent/before-you-start
 *
 * Current form flow (after selecting "Notice for SSSI assent"):
 *   1. Effects on European sites (Yes/No)
 *   2. [If Yes] European site name → HRA screening sub-flow
 *   3. Damage to SSSI features (Yes/No – must be Yes to proceed)
 *   4. Multiple SSSIs? → SSSI selection → scheme → dates → advice → customer → contacts
 *
 * Routes covered:
 *   1.  public-body-consultant-csht-single-sssi-no-eu
 *   2.  public-body-lpa-sfi-single-sssi-yes-eu
 *   3.  public-body-other-mta-multi-sssi-scheme
 *   4.  working-on-behalf-hls-single-sssi
 *   5.  public-body-landowner-no-scheme-multi-sssi-ornec
 */

const FORM_URL = "http://localhost:3009/form/assent/before-you-start";
const PDF_PATH = "/Users/aaron/Temp/pdf_for_upload_test.pdf";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function startForm(page: import("@playwright/test").Page) {
  await page.goto(FORM_URL);
  await page.getByRole("button", { name: "Continue" }).click();

  // First page selects assent notice type
  await page
    .getByRole("radio", { name: "Notice for SSSI assent" })
    .check();
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
 * Fill the shared contact details pages.
 *   first name, last name → phone → email → address
 */
async function fillContactDetails(
  page: import("@playwright/test").Page,
  firstName: string,
  lastName: string
) {
  await page
    .getByRole("textbox", { name: "What is your first name?" })
    .fill(firstName);
  await page
    .getByRole("textbox", { name: "What is your first name?" })
    .press("Tab");
  await page
    .getByRole("textbox", { name: "What is your last name?" })
    .fill(lastName);
  await page.getByRole("button", { name: "Continue" }).click();

  // Phone number
  await page
    .getByRole("textbox", { name: "What is your contact number?" })
    .fill("07777777777");
  await page.getByRole("button", { name: "Continue" }).click();

  // Email
  await page
    .getByRole("textbox", { name: "What is your email address?" })
    .fill(`${firstName.toLowerCase()}.${lastName.toLowerCase()}@do-not-resolve-for-testing.com`);
  await page.getByRole("button", { name: "Continue" }).click();

  // Address
  await page.getByRole("textbox", { name: "Address line 1" }).fill("1 Way");
  await page.getByRole("textbox", { name: "Address line 1" }).press("Tab");
  await page
    .getByRole("textbox", { name: "Address line 2 (optional)" })
    .press("Tab");
  await page.getByRole("textbox", { name: "Town or city" }).fill("York");
  await page.getByRole("textbox", { name: "Town or city" }).press("Tab");
  await page.getByRole("textbox", { name: "County (optional)" }).press("Tab");
  await page.getByRole("textbox", { name: "Postcode" }).fill("YO1 2ND");
  await page.getByRole("button", { name: "Continue" }).click();
}

/**
 * Fill the scheme date fields (start and end dates).
 */
async function fillSchemeDates(
  page: import("@playwright/test").Page,
  startDay: string,
  startMonth: string,
  startYear: string,
  endDay: string,
  endMonth: string,
  endYear: string
) {
  await page
    .getByRole("group", {
      name: "When does the land management agreement start?",
    })
    .getByLabel("Day")
    .fill(startDay);
  await page
    .getByRole("group", {
      name: "When does the land management agreement start?",
    })
    .getByLabel("Month")
    .fill(startMonth);
  await page
    .getByRole("group", {
      name: "When does the land management agreement start?",
    })
    .getByLabel("Year")
    .fill(startYear);
  await page
    .getByRole("group", {
      name: "When does the land management scheme end?",
    })
    .getByLabel("Day")
    .fill(endDay);
  await page
    .getByRole("group", {
      name: "When does the land management scheme end?",
    })
    .getByLabel("Month")
    .fill(endMonth);
  await page
    .getByRole("group", {
      name: "When does the land management scheme end?",
    })
    .getByLabel("Year")
    .fill(endYear);
  await page.getByRole("button", { name: "Continue" }).click();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Assent Form", () => {
  // ── Route 1: A public body → Consultant → CSHT → Single SSSI → No EU ──
  test("public-body-consultant-csht-single-sssi-no-eu", async ({ page }) => {
    await startForm(page);

    // Effects on European sites – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Damage to SSSI features – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Are you planning to carry out activities on more than one SSSI? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name – autocomplete
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Are activities part of a land management scheme?
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Land management scheme – CSHT
    await page
      .getByRole("radio", {
        name: "A Countryside Stewardship Higher Tier (CSHT) agreement",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // CS agreement reference
    await page
      .getByRole("textbox", { name: "What's your Countryside" })
      .fill("CS12345");
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload document
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme dates
    // "Do you have a land management scheme agreement start and end date?" → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillSchemeDates(page, "3", "3", "2027", "4", "4", "2030");

    // Have you received advice? – No
    await page.getByText("No, I have not received advice").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Customer type – A public body
    await page.getByText("A public body", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body category – Consultant
    await page.getByRole("radio", { name: "Consultant" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body selection – autocomplete
    await fillAutocomplete(page, "ar", "Amphibian and Reptile");
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Alice", "Chambers");

    // Submit
    await page.getByRole("button", { name: "Accept and submit" }).click();
  });

  // ── Route 2: A public body → LPA → SFI → Single SSSI → Yes EU ──
  test("public-body-lpa-sfi-single-sssi-yes-eu", async ({ page }) => {
    await startForm(page);

    // Effects on European sites – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // European site name – autocomplete
    await fillAutocomplete(page, "arun", "Arun Valley SPA");
    await page.getByRole("button", { name: "Continue" }).click();

    // "You have added 1 answer" – Continue (don't add another)
    await page.getByRole("button", { name: "Continue" }).click();

    // Habitats regulation assessment required – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // HRA outcome – screening concludes significant effects
    await page
      .locator(".govuk-radios__input")
      .first()
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Appropriate Assessment may be required – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Damage to SSSI features – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme – Yes
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Land management scheme – SFI
    await page
      .getByRole("radio", {
        name: "A Sustainable Farming Incentive (SFI) agreement",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SFI agreement reference
    await page
      .getByRole("textbox", { name: "What's your Sustainable Farming" })
      .fill("SFI7890");
    await page.getByRole("button", { name: "Continue" }).click();

    // Activities requiring Natural England's assent (ORNEC – single SSSI)
    await page
      .getByRole("textbox", {
        name: "What activity is planned to be carried out?",
      })
      .fill("Grazing");
    await page.getByRole("textbox", { name: "Easting" }).fill("510000");
    await page.getByRole("textbox", { name: "Northing" }).fill("180000");
    await page
      .getByRole("textbox", {
        name: "How do you plan to carry out this activity?",
      })
      .fill("Controlled grazing of livestock on designated areas");
    await page.getByRole("button", { name: "Continue" }).click();

    // Repeater summary – Continue (don't add another)
    await page.getByRole("button", { name: "Continue" }).click();

    // Accessing and working on the SSSI
    await page.getByRole("radio", { name: "On foot" }).check();
    await page
      .getByRole("group", { name: "Will you use existing access points?" })
      .getByRole("radio", { name: "Yes" })
      .check();
    await page
      .getByRole("group", { name: "Do you plan to use any machinery?" })
      .getByRole("radio", { name: "No" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // When the planned activities will take place
    await page
      .getByRole("group", { name: "When will the planned activities start?" })
      .getByLabel("Day")
      .fill("1");
    await page
      .getByRole("group", { name: "When will the planned activities start?" })
      .getByLabel("Month")
      .fill("6");
    await page
      .getByRole("group", { name: "When will the planned activities start?" })
      .getByLabel("Year")
      .fill("2027");
    await page
      .getByRole("group", {
        name: "When will the planned activities finish?",
      })
      .getByLabel("Day")
      .fill("30");
    await page
      .getByRole("group", {
        name: "When will the planned activities finish?",
      })
      .getByLabel("Month")
      .fill("6");
    await page
      .getByRole("group", {
        name: "When will the planned activities finish?",
      })
      .getByLabel("Year")
      .fill("2027");
    await page
      .getByRole("textbox", {
        name: "Could anything delay or change when you will carry out your activities?",
      })
      .fill("No anticipated delays");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    // Have you received advice? – No
    await page.getByText("No, I have not received advice").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Customer type – A public body
    await page.getByText("A public body", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body category – Local planning authority
    await page
      .getByRole("radio", { name: "Local planning authority" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Local authority – autocomplete
    await fillAutocomplete(page, "York", "City of York Council");
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Ben", "Hopkins");

    await page.getByRole("button", { name: "Accept and submit" }).click();
  });

  // ── Route 3: A public body → Other → MTA → Multiple SSSIs (scheme) ──
  test("public-body-other-mta-multi-sssi-scheme", async ({ page }) => {
    await startForm(page);

    // Effects on European sites – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Damage to SSSI features – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme? – Yes
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Land management scheme – MTA
    await page
      .getByRole("radio", {
        name: /Minor and Temporary Adjustments \(MTA\)/,
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple sites repeater – first site
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Add another? – No
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload MTA form
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme dates
    // "Do you have a land management scheme agreement start and end date?" → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillSchemeDates(page, "1", "1", "2027", "31", "12", "2029");

    // Have you received advice? – No
    await page.getByText("No, I have not received advice").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Customer type – A public body
    await page.getByText("A public body", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body category – Other
    await page.getByRole("radio", { name: "Other" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Which public body are you representing? – select "Other"
    await fillAutocomplete(page, "Other", "Other");
    await page.getByRole("button", { name: "Continue" }).click();

    // Name of public body – free text
    await page
      .getByRole("textbox")
      .fill("Tidal Flood Management Authority");
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Carla", "Evans");

    await page.getByRole("button", { name: "Accept and submit" }).click();
  });

  // ── Route 4: Somebody working on behalf → HLS → Single SSSI ──
  test("working-on-behalf-hls-single-sssi", async ({ page }) => {
    await startForm(page);

    // Effects on European sites – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Damage to SSSI features – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme – Yes
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Land management scheme – HLS
    await page
      .getByRole("radio", {
        name: "A Higher Level Stewardship (HLS) agreement",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // HLS agreement reference
    await page
      .getByRole("textbox", { name: "What is your Higher Level" })
      .fill("45678");
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme dates
    // "Do you have a land management scheme agreement start and end date?" → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillSchemeDates(page, "10", "5", "2027", "10", "5", "2032");

    // Have you received advice? – No
    await page.getByText("No, I have not received advice").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Customer type – Somebody working on behalf of a public body
    await page
      .getByText("Somebody working on behalf of a public body")
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Confirmation of appointment to act – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Organisation name – autocomplete
    await fillAutocomplete(page, "amp", /Amphibian and Reptile/i);
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body category – Consultant
    await page.getByRole("radio", { name: "Consultant" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body selection
    await fillAutocomplete(page, "ar", "Amphibian and Reptile");
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body contact email
    await page
      .getByRole("textbox", {
        name: "Provide a contact email address for the public body",
      })
      .fill("pb-contact@do-not-resolve-for-testing.com");
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Diana", "Park");

    await page.getByRole("button", { name: "Accept and submit" }).click();
  });

  // ── Route 5: A public body → Landowner → No scheme → Multiple SSSIs (ORNEC) ──
  test("public-body-landowner-no-scheme-multi-sssi-ornec", async ({ page }) => {
    await startForm(page);

    // Effects on European sites – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Damage to SSSI features – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme question – No
    await page
      .getByText(
        "No, the planned activities are not part of a scheme or permission"
      )
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // ORNEC repeater – site name and activities (QxIzSB)
    await page
      .getByRole("textbox", {
        name: "What activity is planned to be carried out?",
      })
      .fill("Reed cutting");
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("textbox", { name: "Easting" }).fill("556300");
    await page.getByRole("textbox", { name: "Northing" }).fill("270500");
    await page
      .getByRole("textbox", {
        name: "How do you plan to carry out this activity on this site?",
      })
      .fill("Annual reed management programme");
    await page.getByRole("button", { name: "Continue" }).click();

    // Repeater summary – Continue (don't add another)
    await page.getByRole("button", { name: "Continue" }).click();

    // Accessing and working on sites repeater
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("radio", { name: "On foot" }).check();
    await page
      .getByRole("group", { name: "Will you use existing access points?" })
      .getByRole("radio", { name: "Yes" })
      .check();
    await page
      .getByRole("group", { name: "Do you plan to use any machinery?" })
      .getByRole("radio", { name: "No" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Accessing repeater summary – Continue
    await page.getByRole("button", { name: "Continue" }).click();

    // When the planned activities will take place
    await page
      .getByRole("group", { name: "When will the planned activities start?" })
      .getByLabel("Day")
      .fill("1");
    await page
      .getByRole("group", { name: "When will the planned activities start?" })
      .getByLabel("Month")
      .fill("7");
    await page
      .getByRole("group", { name: "When will the planned activities start?" })
      .getByLabel("Year")
      .fill("2027");
    await page
      .getByRole("group", {
        name: "When will the planned activities finish?",
      })
      .getByLabel("Day")
      .fill("31");
    await page
      .getByRole("group", {
        name: "When will the planned activities finish?",
      })
      .getByLabel("Month")
      .fill("7");
    await page
      .getByRole("group", {
        name: "When will the planned activities finish?",
      })
      .getByLabel("Year")
      .fill("2027");
    await page
      .getByRole("textbox", {
        name: "Could anything delay or change when you will carry out your activities?",
      })
      .fill("No anticipated delays");
    await page.getByRole("button", { name: "Continue" }).click();

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    // Have you received advice? – No
    await page.getByText("No, I have not received advice").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Customer type – A public body
    await page.getByText("A public body", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body category – Landowner
    await page.getByRole("radio", { name: "Landowner" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Public body selection – autocomplete
    await fillAutocomplete(page, "amp", /Amphibian and Reptile/i);
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Edward", "Hayes");

    await page.getByRole("button", { name: "Accept and submit" }).click();
  });
});
