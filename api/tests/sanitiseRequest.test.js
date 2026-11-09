const sanitiseRequest = require("../middleware/sanitiseRequest");

/*
 * Unit tests for request sanitisation.
 *
 * MongoDB operators arriving in a request body would otherwise be passed
 * into a query. A body of { email: { $ne: null } } would match the first
 * user in the collection, so the operator key must be removed.
 */

describe("sanitiseRequest", () => {
    test("removes nested MongoDB operator keys", () => {
        const req = { body: { email: { $ne: null }, password: "anything" }, params: {} };
        const next = jest.fn();

        sanitiseRequest(req, {}, next);

        expect(req.body.email).toEqual({});
        expect(next).toHaveBeenCalled();
    });

    test("removes top level operator keys", () => {
        const req = { body: { $where: "this.password", name: "Test" }, params: {} };
        const next = jest.fn();

        sanitiseRequest(req, {}, next);

        expect(req.body).not.toHaveProperty("$where");
        expect(req.body.name).toBe("Test");
    });

    test("removes dotted keys that could reach nested fields", () => {
        const req = { body: { "user.role": "Admin", name: "Test" }, params: {} };
        const next = jest.fn();

        sanitiseRequest(req, {}, next);

        expect(req.body).not.toHaveProperty("user.role");
    });

    test("strips null bytes from strings", () => {
        const req = { body: { name: "Test\u0000User" }, params: {} };
        const next = jest.fn();

        sanitiseRequest(req, {}, next);

        expect(req.body.name).toBe("TestUser");
    });

    test("leaves legitimate data untouched", () => {
        const req = {
            body: { name: "Test User", email: "test@example.com", price: 500 },
            params: { id: "abc123" }
        };
        const next = jest.fn();

        sanitiseRequest(req, {}, next);

        expect(req.body.name).toBe("Test User");
        expect(req.body.email).toBe("test@example.com");
        expect(req.body.price).toBe(500);
        expect(req.params.id).toBe("abc123");
    });
});
