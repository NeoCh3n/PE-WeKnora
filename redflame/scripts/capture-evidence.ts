import { chromium } from "@playwright/test";
import path from "node:path";

async function main() {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(process.env.REDFLAME_URL || "http://127.0.0.1:3100");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Accept evidence" }).click();
  await page.getByTestId("resolution-receipt").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(process.cwd(), "docs", "resolution-receipt.png"), fullPage: true });
  await browser.close();
  console.log("Captured docs/resolution-receipt.png");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
