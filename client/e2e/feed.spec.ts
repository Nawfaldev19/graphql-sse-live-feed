import { expect, test, type Page } from "@playwright/test";

async function enterAs(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name: `Continue as ${name}` }).click();
  await expect(page.getByRole("list", { name: "Activity, newest first" })).toBeVisible();
}

test("a member reads the feed, filters it, and marks items read", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /as it happens/ })).toBeVisible();
  await enterAs(page, "Cora Mbeki");

  await expect(page.getByRole("heading", { level: 1, name: "Riverside Makers" })).toBeVisible();
  const unread = page.locator(".unread-count");
  await expect(unread).toHaveText("3");
  await expect(page.getByRole("heading", { name: "Post an announcement" })).toHaveCount(0);

  await page.getByRole("button", { name: /^Mark read: Booked the Laser cutter/ }).click();
  await expect(unread).toHaveText("2");

  await page.getByRole("button", { name: "Announcements", exact: true }).click();
  await expect(page.getByRole("button", { name: "Announcements", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".activity")).toHaveCount(1);

  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(unread).toHaveText("0");
});

test("an announcement appears live for members of that space only", async ({ browser }) => {
  const coraPage = await (await browser.newContext()).newPage();
  const theoPage = await (await browser.newContext()).newPage();
  const benPage = await (await browser.newContext()).newPage();
  await enterAs(coraPage, "Cora Mbeki");
  await enterAs(theoPage, "Theo Marsh");
  await enterAs(benPage, "Ben Lindqvist");
  const before = Number(await coraPage.locator(".unread-count").textContent());

  await benPage.getByLabel("Message").fill("Laser cutter lens cleaned. Book away.");
  await benPage.getByRole("button", { name: "Post" }).click();
  await expect(benPage.getByText("Posted.")).toBeVisible();

  await expect(coraPage.getByText("Laser cutter lens cleaned. Book away.")).toBeVisible();
  await expect(coraPage.locator(".unread-count")).toHaveText(String(before + 1));
  await theoPage.waitForTimeout(1000);
  await expect(theoPage.getByText("Laser cutter lens cleaned. Book away.")).toHaveCount(0);
});

test("a person in two spaces switches between them", async ({ page }) => {
  await enterAs(page, "Ada Okafor");
  await page.getByLabel("Space").selectOption({ label: "Foundry Lane Workshop (member)" });

  await expect(page.getByRole("heading", { level: 1, name: "Foundry Lane Workshop" })).toBeVisible();
  await expect(page.getByText("Kiln firing on Saturday", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Post an announcement" })).toHaveCount(0);
});
