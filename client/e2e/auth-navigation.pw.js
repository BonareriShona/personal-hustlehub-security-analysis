
import { test, expect } from "@playwright/test";

test("displays login and allows navigation to registration", async ({ page }) => {
    await page.goto("/");

    await expect(
        page.getByRole("heading", { name: "Log In" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Register" }).click();

    await expect(
        page.getByRole("heading", { name: "Register" })
    ).toBeVisible();

    await expect(
        page.getByLabel("Confirm password")
    ).toBeVisible();
});

test("rejects an empty login form", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Log In" }).click();

    await expect(
        page.getByRole("alert")
    ).toContainText("Please enter a valid email address.");
});
