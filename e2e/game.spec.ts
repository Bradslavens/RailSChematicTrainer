import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers.js";

test("playing Name It records progress and updates XP", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);

  // XP on the home stats bar before playing.
  const xpBefore = await page.getByText(/\d+ \/ \d+ XP/).textContent();

  // Start a Name It round.
  await page.getByRole("link", { name: /^Play →$/ }).first().click(); // first game card = Pin Drop
  await expect(page).toHaveURL(/\/play\/pin-drop$/);
  await page.goBack();

  await page.goto("/play/name-it");
  await page.getByRole("button", { name: /start round/i }).click();

  // Answer the first question by clicking any choice, then confirm feedback appears.
  const firstChoice = page.locator("button.choice").first();
  await expect(firstChoice).toBeVisible();
  await firstChoice.click();
  await expect(page.locator(".choice.is-correct")).toBeVisible();
  await expect(page.getByRole("button", { name: /Next|See results/i })).toBeVisible();

  // Back home, XP should have increased.
  await page.goto("/");
  const xpAfter = await page.getByText(/\d+ \/ \d+ XP/).textContent();
  expect(xpAfter).not.toBe(xpBefore);
});

test("admin can see the seeded schematic in the admin area", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await page.goto("/admin");
  await expect(page.getByText(/La Mesa Branch/i)).toBeVisible();
});

test("the schematic viewer toggles labels", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await page.goto("/schematics");
  await page.getByRole("link", { name: /La Mesa Branch/i }).click();

  // Blank by default: the SVG has no label text yet.
  await expect(page.locator("svg.schematic")).toBeVisible();
  await expect(page.locator("text=E18LA")).toHaveCount(0);

  await page.getByRole("button", { name: /show labels/i }).click();
  await expect(page.locator("svg.schematic >> text=E18LA")).toBeVisible();
});
