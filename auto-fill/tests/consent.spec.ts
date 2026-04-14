import { expect } from "@playwright/test";
import { test } from "./fixtures";

/**
 * Consent Form – auto-fill scripts for all main pathways.
 *
 * Form URL: http://localhost:3009/form/consent/before-you-start
 *
 * Two main flow patterns exist depending on scheme type:
 *   A) CSHT/HLS (recognised schemes): coords → upload scheme docs → scheme dates → advice → contacts
 *   B) Other schemes: scheme details → operations repeater → gaining access → activity dates → advice → contacts
 *
 * Routes covered:
 *   1.  owner-other-single-sssi           – Owner → Other schemes → Single SSSI (flow B)
 *   2.  occupier-csht-single-sssi         – Occupier → CSHT → Single SSSI (flow A)
 *   3.  permission-other-multi-sssi       – Someone with permission → Other schemes → Multiple SSSIs (flow B)
 *   4.  somebody-else-hls-multi-sssi      – Somebody else → HLS → Multiple SSSIs (flow A)
 *   5.  owner-other-permission-single-sssi – Owner → Other permission → Single SSSI (flow B)
 */

const FORM_URL = "http://localhost:3009/form/consent/before-you-start";
const PDF_PATH = "/Users/aaron/Temp/pdf_for_upload_test.pdf";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function startForm(page: import("@playwright/test").Page) {
  await page.goto(FORM_URL);
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByRole("radio", { name: "Notice for SSSI consent", exact: true })
    .check();
  await page.getByRole("button", { name: "Continue" }).click();
}

/**
 * Fill a GOV.UK accessible autocomplete field.
 * Targets the visible <input class="autocomplete__input"> overlay
 * rather than the hidden <select> that getByRole("combobox") resolves to.
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

/** File-upload helper. */
async function uploadFile(page: import("@playwright/test").Page) {
  await page.locator('input[type="file"]').setInputFiles(PDF_PATH);
  await page.getByRole("button", { name: "Upload file" }).click();
  const uploadedTag = page.locator("strong.govuk-tag--green", {
    hasText: "Uploaded",
  });
  await expect(uploadedTag).toBeVisible();
}

/**
 * Fill the Operations repeater page (single SSSI, flow B).
 * Fills one entry then clicks Continue past repeater summary.
 */
async function fillOperationsSingleSSSI(
  page: import("@playwright/test").Page,
  activity: string,
  easting: string,
  northing: string,
  method: string
) {
  await page.locator("select").first().selectOption({ label: activity });
  await page.getByRole("textbox", { name: "Easting" }).fill(easting);
  await page.getByRole("textbox", { name: "Northing" }).fill(northing);
  await page
    .getByRole("textbox", {
      name: "How do you plan to carry out this activity?",
    })
    .fill(method);
  await page.getByRole("button", { name: "Continue" }).click();
  // Continue past repeater summary ("You have added 1 answer")
  await page.getByRole("button", { name: "Continue" }).click();
}

/**
 * Fill the Site name and operations repeater page (multiple SSSIs, flow B).
 */
async function fillOperationsMultiSSSI(
  page: import("@playwright/test").Page,
  activity: string,
  sssiSearch: string,
  sssiOption: string | RegExp,
  easting: string,
  northing: string,
  method: string,
  addAnother = false
) {
  await page.locator("select").first().selectOption({ label: activity });
  await fillAutocomplete(page, sssiSearch, sssiOption);
  await page.getByRole("textbox", { name: "Easting" }).fill(easting);
  await page.getByRole("textbox", { name: "Northing" }).fill(northing);
  await page
    .getByRole("textbox", {
      name: /How do you plan to carry out this activity/,
    })
    .fill(method);
  await page.getByRole("button", { name: "Continue" }).click();
  // Repeater summary – add another or continue
  if (addAnother) {
    await page.getByRole("button", { name: "Add another" }).click();
  } else {
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

/**
 * Fill the Gaining access page (single SSSI, flow B).
 */
async function fillGainingAccess(page: import("@playwright/test").Page) {
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
}

/**
 * Fill the Accessing and working on sites repeater (multi-SSSI, flow B).
 */
async function fillAccessMultiSSSI(
  page: import("@playwright/test").Page,
  sssiSearch: string,
  sssiOption: string | RegExp,
  addAnother = false
) {
  await fillAutocomplete(page, sssiSearch, sssiOption);
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
  // Repeater summary – add another or continue
  if (addAnother) {
    await page.getByRole("button", { name: "Add another" }).click();
  } else {
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

/** Fill activity dates - start and finish (flow B). */
async function fillActivityDates(page: import("@playwright/test").Page) {
  await page
    .getByRole("group", { name: /start/ })
    .getByLabel("Day")
    .fill("1");
  await page
    .getByRole("group", { name: /start/ })
    .getByLabel("Month")
    .fill("6");
  await page
    .getByRole("group", { name: /start/ })
    .getByLabel("Year")
    .fill("2027");
  await page
    .getByRole("group", { name: /finish/ })
    .getByLabel("Day")
    .fill("1");
  await page
    .getByRole("group", { name: /finish/ })
    .getByLabel("Month")
    .fill("12");
  await page
    .getByRole("group", { name: /finish/ })
    .getByLabel("Year")
    .fill("2027");
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Fill scheme agreement dates (flow A). */
async function fillSchemeDates(page: import("@playwright/test").Page) {
  await page
    .getByRole("group", {
      name: "When does the land management scheme agreement start?",
    })
    .getByLabel("Day")
    .fill("1");
  await page
    .getByRole("group", {
      name: "When does the land management scheme agreement start?",
    })
    .getByLabel("Month")
    .fill("3");
  await page
    .getByRole("group", {
      name: "When does the land management scheme agreement start?",
    })
    .getByLabel("Year")
    .fill("2027");
  await page
    .getByRole("group", {
      name: "When does the land management scheme agreement end?",
    })
    .getByLabel("Day")
    .fill("1");
  await page
    .getByRole("group", {
      name: "When does the land management scheme agreement end?",
    })
    .getByLabel("Month")
    .fill("3");
  await page
    .getByRole("group", {
      name: "When does the land management scheme agreement end?",
    })
    .getByLabel("Year")
    .fill("2030");
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Fill advice details page (when "Yes" is selected for advice question). */
async function fillAdviceDetails(page: import("@playwright/test").Page) {
  await page
    .getByRole("textbox", { name: /name of the person/ })
    .fill("John Smith");
  await page
    .getByRole("textbox", { name: /name of the team/ })
    .fill("Wildlife Team");
  await page.getByLabel("Month").fill("3");
  await page.getByLabel("Year").fill("2026");
  await page
    .getByRole("textbox", { name: /reference number/ })
    .fill("ADV-12345");
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Fill the shared contact details pages: name → phone → email → address. */
async function fillContactDetails(
  page: import("@playwright/test").Page,
  firstName: string,
  lastName: string
) {
  await page
    .getByRole("textbox", { name: "What is your first name?" })
    .fill(firstName);
  await page
    .getByRole("textbox", { name: "What is your last name?" })
    .fill(lastName);
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByRole("textbox", { name: "What's your phone number?" })
    .fill("07777777777");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByRole("textbox", { name: "What's your email address?" })
    .fill(
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@do-not-resolve-for-testing.com`
    );
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByRole("textbox", { name: "Address line 1" })
    .fill("1 Way");
  await page
    .getByRole("textbox", { name: "Town or city" })
    .fill("York");
  await page
    .getByRole("textbox", { name: "Postcode" })
    .fill("YO1 2ND");
  await page.getByRole("button", { name: "Continue" }).click();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Consent Form", () => {
  // ── Route 1: Owner → Other schemes → Single SSSI (flow B) ──
  test("owner-other-single-sssi", async ({ page }) => {
    await startForm(page);

    // Customer type – owner
    await page
      .getByRole("radio", { name: "An owner of land within a SSSI" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme? – Yes, land management scheme
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme type – Other schemes
    await page.getByText("Other schemes").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // SBI of where the activities will take place
    await page
      .getByRole("textbox", { name: /Single Business Identifier/ })
      .fill("123456789");
    await page.getByRole("button", { name: "Continue" }).click();

    // Other land management scheme details
    await page
      .getByRole("textbox", {
        name: "What is the name of the land management scheme?",
      })
      .fill("ORNEC Scheme");
    await page
      .getByRole("textbox", { name: /scheme reference/ })
      .fill("ORN1234");
    await page.getByRole("button", { name: "Continue" }).click();

    // Operations repeater (single SSSI)
    await fillOperationsSingleSSSI(
      page,
      "Cultivation",
      "512000",
      "108000",
      "Ploughing field margins"
    );

    // Gaining access
    await fillGainingAccess(page);

    // Activity dates
    await fillActivityDates(page);

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    // Advice – No
    await page
      .getByRole("radio", { name: "No, I have not received advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Anna", "Foster");

    // Declaration and submit
    await page
      .getByRole("checkbox", { name: "I understand and agree" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 2: Occupier → CSHT → Single SSSI (flow A) ──
  test("occupier-csht-single-sssi", async ({ page }) => {
    await startForm(page);

    // Customer type – occupier
    await page
      .getByRole("radio", { name: "An occupier of land within a SSSI" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme? – Yes, land management scheme
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme type – CSHT
    await page
      .getByText(
        "A Countryside Stewardship Higher Tier (CSHT) agreement"
      )
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // SBI of where the activities will take place
    await page
      .getByRole("textbox", { name: /Single Business Identifier/ })
      .fill("123456789");
    await page.getByRole("button", { name: "Continue" }).click();

    // CS agreement reference
    await page
      .getByRole("textbox", { name: "What's your Countryside" })
      .fill("CS12345");
    await page.getByRole("button", { name: "Continue" }).click();

    // Where are activities? (coordinates)
    await page.getByRole("textbox", { name: "Easting" }).fill("512050");
    await page.getByRole("textbox", { name: "Northing" }).fill("108050");
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload scheme agreement docs (required)
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Do you have scheme dates? → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme dates
    await fillSchemeDates(page);

    // Advice – Yes, paid
    await page
      .getByRole("radio", { name: "Yes, I have received paid advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Advice details
    await fillAdviceDetails(page);

    await fillContactDetails(page, "Brian", "Cole");

    // Declaration and submit
    await page
      .getByRole("checkbox", { name: "I understand and agree" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 3: Someone with permission → Other schemes → Multiple SSSIs (flow B) ──
  test("permission-other-multi-sssi", async ({ page }) => {
    await startForm(page);

    // Customer type – permission
    await page
      .getByRole("radio", {
        name: "Someone with permission to work on behalf of an owner or occupier",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // "Do you have the permission?" → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Land owner or occupier details
    await page
      .getByRole("radio", { name: "Landowner", exact: true })
      .check();
    await page.getByRole("textbox", { name: "First name" }).fill("Jane");
    await page.getByRole("textbox", { name: "Last name" }).fill("Doe");
    await page
      .getByRole("textbox", { name: "Email address" })
      .fill("jane@test.com");
    await page
      .getByRole("textbox", { name: "Phone number" })
      .fill("07777777777");
    await page
      .getByRole("textbox", { name: "Address line 1" })
      .fill("1 Way");
    await page
      .getByRole("textbox", { name: "Town or city" })
      .fill("York");
    await page
      .getByRole("textbox", { name: "Postcode" })
      .fill("YO1 2ND");
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme? – Yes, land management scheme
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme type – Other schemes (comes BEFORE SSSI repeater for multi-SSSI)
    await page.getByText("Other schemes").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // SBI of where the activities will take place
    await page
      .getByRole("textbox", { name: /Single Business Identifier/ })
      .fill("123456789");
    await page.getByRole("button", { name: "Continue" }).click();

    // Other scheme details
    await page
      .getByRole("textbox", {
        name: "What is the name of the land management scheme?",
      })
      .fill("ORNEC Scheme");
    await page
      .getByRole("textbox", { name: /scheme reference/ })
      .fill("ORN5678");
    await page.getByRole("button", { name: "Continue" }).click();

    // Site name and operations repeater (multi-SSSI) – first site
    await fillOperationsMultiSSSI(
      page,
      "Grazing",
      "arun",
      "Arun Banks SSSI",
      "513000",
      "109000",
      "Sheep grazing on chalk grassland",
      true
    );

    // Site name and operations repeater – second site
    await fillOperationsMultiSSSI(
      page,
      "Cultivation",
      "ash",
      "Ashdown Forest SSSI",
      "543200",
      "132400",
      "Ploughing field margins on heathland"
    );

    // Accessing and working on sites repeater (multi-SSSI) – first site
    await fillAccessMultiSSSI(page, "arun", "Arun Banks SSSI", true);

    // Accessing – second site
    await fillAccessMultiSSSI(page, "ash", "Ashdown Forest SSSI");

    // Activity dates
    await fillActivityDates(page);

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    // Advice – No
    await page
      .getByRole("radio", { name: "No, I have not received advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Chloe", "Edwards");

    // Declaration and submit
    await page
      .getByRole("checkbox", { name: "I understand and agree" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 4: Somebody else → HLS → Multiple SSSIs (flow A) ──
  test("somebody-else-hls-multi-sssi", async ({ page }) => {
    await startForm(page);

    // Customer type – somebody else
    await page.getByRole("radio", { name: "Somebody else" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // "Do you know the owner or occupier's details?" → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // "Do you have the permission?" → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Proof of permission upload
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Land owner or occupier details
    await page
      .getByRole("radio", { name: "Landowner", exact: true })
      .check();
    await page.getByRole("textbox", { name: "First name" }).fill("Jane");
    await page.getByRole("textbox", { name: "Last name" }).fill("Doe");
    await page
      .getByRole("textbox", { name: "Email address" })
      .fill("jane@test.com");
    await page
      .getByRole("textbox", { name: "Phone number" })
      .fill("07777777777");
    await page
      .getByRole("textbox", { name: "Address line 1" })
      .fill("1 Way");
    await page
      .getByRole("textbox", { name: "Town or city" })
      .fill("York");
    await page
      .getByRole("textbox", { name: "Postcode" })
      .fill("YO1 2ND");
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme? – Yes, land management scheme
    await page
      .getByRole("radio", {
        name: "Yes, the planned activities are part of a land management scheme",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme type – HLS
    await page
      .getByRole("radio", {
        name: "A Higher Level Stewardship (HLS) agreement",
      })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SBI of where the activities will take place
    await page
      .getByRole("textbox", { name: /Single Business Identifier/ })
      .fill("123456789");
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI repeater – first site (comes after scheme type for multi-SSSI)
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();
    // Add another SSSI
    await page.getByRole("button", { name: "Add another" }).click();

    // SSSI repeater – second site
    await fillAutocomplete(page, "ash", "Ashdown Forest SSSI");
    await page.getByRole("button", { name: "Continue" }).click();
    // No more to add
    await page.getByRole("button", { name: "Continue" }).click();

    // HLS agreement reference
    await page
      .getByRole("textbox", { name: "What's your Higher Level" })
      .fill("1234567");
    await page.getByRole("button", { name: "Continue" }).click();

    // Where are activities? (coordinates)
    await page.getByRole("textbox", { name: "Easting" }).fill("514000");
    await page.getByRole("textbox", { name: "Northing" }).fill("110000");
    await page.getByRole("button", { name: "Continue" }).click();

    // Upload scheme agreement docs (required)
    await uploadFile(page);
    await page.getByRole("button", { name: "Continue" }).click();

    // Do you have scheme dates? → Yes
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme dates
    await fillSchemeDates(page);

    // Advice – Yes, free
    await page
      .getByRole("radio", { name: "Yes, I have received free advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Advice details
    await fillAdviceDetails(page);

    await fillContactDetails(page, "Daniel", "Hughes");

    // Declaration and submit
    await page
      .getByRole("checkbox", { name: "I understand and agree" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
  });

  // ── Route 5: Owner → Other permission → Single SSSI (flow B) ──
  test("owner-other-permission-single-sssi", async ({ page }) => {
    await startForm(page);

    // Customer type – owner
    await page
      .getByRole("radio", { name: "An owner of land within a SSSI" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Multiple SSSIs? – No
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    // SSSI name
    await fillAutocomplete(page, "arun", "Arun Banks SSSI");
    await page.getByRole("button", { name: "Continue" }).click();

    // Scheme question – another permission
    await page
      .getByText(
        "Yes, the planned activities are part of another permission"
      )
      .click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Other related permission – name and reference
    await page
      .getByRole("textbox", { name: "What is the name of the permission?" })
      .fill("Planning Permission PP/2025/0042");
    await page
      .getByRole("textbox", { name: /reference number/ })
      .fill("REF-98765");
    await page.getByRole("button", { name: "Continue" }).click();

    // Operations repeater (single SSSI)
    await fillOperationsSingleSSSI(
      page,
      "Tree or woodland management and alterations to tree or woodland management",
      "537100",
      "108900",
      "Removal of dead trees in designated area"
    );

    // Gaining access
    await fillGainingAccess(page);

    // Activity dates
    await fillActivityDates(page);

    // Supporting documents (optional) – skip
    await page.getByRole("button", { name: "Continue" }).click();

    // Advice – No
    await page
      .getByRole("radio", { name: "No, I have not received advice" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();

    await fillContactDetails(page, "Emily", "Ward");

    // Declaration and submit
    await page
      .getByRole("checkbox", { name: "I understand and agree" })
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
  });
});
