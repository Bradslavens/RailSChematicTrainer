import { test, expect } from "@playwright/test";
import { login, ADMIN } from "./helpers.js";

test("a new user can sign up and lands on the home screen", async ({ page }) => {
  const email = `e2e+${Date.now()}@test.dev`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: email })).toBeVisible();
});

test("an existing admin can log in", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page.getByRole("heading", { name: ADMIN.email })).toBeVisible();
  await expect(page.getByRole("link", { name: /open admin/i })).toBeVisible();
});

test("protected routes redirect to login when signed out", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(page).toHaveURL(/\/login$/);
});
