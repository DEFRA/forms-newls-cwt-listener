import { test as base } from "@playwright/test";

/**
 * Extended test fixture that captures the full page HTML on failure.
 * This outputs the DOM to the console (useful for agentic debugging)
 * and attaches it to the test report.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      const pageHtml = await page
        .content()
        .catch(() => "<could not retrieve page HTML>");
      console.log(
        `\n--- Page HTML on failure (${testInfo.title}) ---\n${pageHtml}\n---`
      );
      await testInfo.attach("page-html-on-failure", {
        body: pageHtml,
        contentType: "text/html",
      });
    }
  },
});
