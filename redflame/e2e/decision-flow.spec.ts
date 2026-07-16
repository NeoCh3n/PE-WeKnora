import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("accepting evidence keeps failed tests, creates a local receipt, and resets", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "FY2030 Exit EBITDA" })).toBeVisible();
  await expect(page.getByTestId("test-base_case_moic_hurdle")).toContainText("FAIL");
  await expect(page.getByTestId("test-base_case_irr_hurdle")).toContainText("FAIL");
  await expect(page.getByTestId("test-top_customer_concentration")).toContainText("UNAFFECTED");

  await page.getByRole("button", { name: "Accept evidence" }).click();
  const receipt = page.getByTestId("resolution-receipt");
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText("HOLD");
  await expect(receipt).toContainText("2 tests remain failed");
  await expect(receipt).toContainText(/not server-persisted/i);
  await expect(page.getByText("DRAFT REVISION").first()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("resolution-receipt")).toBeVisible();
  await page.getByRole("button", { name: "View revised memo" }).click();
  await expect(page.getByRole("dialog", { name: "Project Apex · IC Memo" })).toContainText("19.79% IRR");
  await page.getByRole("button", { name: "Close revised memo" }).click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByTestId("resolution-receipt")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Accept evidence" })).toBeEnabled();
});

test("ambiguous definitions block calculations and acceptance", async ({ page }) => {
  await page.getByRole("button", { name: "Ambiguous definition" }).click();
  await expect(page.getByTestId("semantic-card")).toContainText(/RECORDED EVAL FIXTURE|LIVE /);
  await expect(page.getByTestId("blocked-tests")).toContainText("RETURN TESTS BLOCKED");
  await expect(page.getByRole("button", { name: "Accept evidence" })).toBeDisabled();
  await page.getByRole("button", { name: "Investigate" }).click();
  await expect(page.getByTestId("alternate-resolution")).toContainText("Evidence routed to investigation");
});
