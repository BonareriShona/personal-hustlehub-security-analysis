
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    testMatch: "**/*.pw.js",

    reporter: [
        ["list"],
        ["html", { open: "never" }]
    ],

    use: {
        ...devices["Desktop Chrome"],
        baseURL: "https://127.0.0.1:5173",
        ignoreHTTPSErrors: true,
        screenshot: "only-on-failure",
        trace: "retain-on-failure"
    },

    webServer: {
        command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
        url: "https://127.0.0.1:5173",
        reuseExistingServer: true,
        ignoreHTTPSErrors: true,
        timeout: 90000
    }
});
