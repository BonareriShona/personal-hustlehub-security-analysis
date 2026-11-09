import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getIncomeSummary,
    getMyTransactions,
    getAllTransactions
} from "../services/transactionService.js";

/*
 * These tests cover transport and storage decisions rather than rendering.
 * They assert that the client reaches the API over HTTPS and that the bearer
 * token is read from sessionStorage, which is the storage choice documented
 * in the README. Neither claim is visible by reading a component, so without
 * these tests both would be asserted rather than demonstrated.
 */

function mockFetchOnce(body, ok = true) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok,
        json: async () => body
    });

    globalThis.fetch = fetchMock;
    return fetchMock;
}

describe("transactionService", () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    it("calls the API over HTTPS", async () => {
        sessionStorage.setItem("token", "test-token");
        const fetchMock = mockFetchOnce({ income: {} });

        await getIncomeSummary();

        const [url] = fetchMock.mock.calls[0];
        expect(url.startsWith("https://")).toBe(true);
    });

    it("sends the bearer token taken from sessionStorage", async () => {
        sessionStorage.setItem("token", "abc123");
        const fetchMock = mockFetchOnce({ transactions: [] });

        await getMyTransactions();

        const [, options] = fetchMock.mock.calls[0];
        expect(options.headers.Authorization).toBe("Bearer abc123");
    });

    it("ignores any token left in localStorage", async () => {
        localStorage.setItem("token", "stale-token");
        sessionStorage.setItem("token", "session-token");
        const fetchMock = mockFetchOnce({ income: {} });

        await getIncomeSummary();

        const [, options] = fetchMock.mock.calls[0];
        expect(options.headers.Authorization).toBe("Bearer session-token");
    });

    it("omits the Authorization header when no token is stored", async () => {
        const fetchMock = mockFetchOnce({ income: {} });

        await getIncomeSummary();

        const [, options] = fetchMock.mock.calls[0];
        expect(options.headers.Authorization).toBeUndefined();
    });

    it("requests the admin collection endpoint for all transactions", async () => {
        sessionStorage.setItem("token", "admin-token");
        const fetchMock = mockFetchOnce({ transactions: [] });

        await getAllTransactions();

        const [url] = fetchMock.mock.calls[0];
        expect(url).toBe("https://localhost:4000/api/transactions");
    });

    it("surfaces the server message when the response is rejected", async () => {
        sessionStorage.setItem("token", "client-token");
        mockFetchOnce({ message: "Access denied." }, false);

        await expect(getAllTransactions()).rejects.toThrow("Access denied.");
    });

    it("throws a safe error when the body is not valid JSON", async () => {
        sessionStorage.setItem("token", "test-token");
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => {
                throw new Error("invalid json");
            }
        });

        await expect(getIncomeSummary()).rejects.toThrow(
            "The server returned an unexpected response."
        );
    });
});
