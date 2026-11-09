const { validateRegistration } = require("../middleware/validateAuth");

/*
 * Unit tests for registration input validation.
 *
 * The role test matters most: public registration must never accept the
 * Admin role, or any user could grant themselves administrative access.
 */

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function validUser() {
    return {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
        role: "Client"
    };
}

describe("validateRegistration", () => {
    test("accepts a valid Client registration", () => {
        const req = { body: validUser() };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test("accepts a valid Freelancer registration", () => {
        const req = { body: { ...validUser(), role: "Freelancer" } };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test("rejects the Admin role through public registration", () => {
        const req = { body: { ...validUser(), role: "Admin" } };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test("rejects a password with no uppercase letter", () => {
        const req = { body: { ...validUser(), password: "password123" } };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("rejects a password with no digit", () => {
        const req = { body: { ...validUser(), password: "PasswordOnly" } };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("rejects a malformed email address", () => {
        const req = { body: { ...validUser(), email: "not-an-email" } };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("normalises the email to lowercase so duplicates cannot differ by case", () => {
        const req = { body: { ...validUser(), email: "  Test@Example.COM  " } };
        const res = mockRes();
        const next = jest.fn();

        validateRegistration(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.body.email).toBe("test@example.com");
    });
});
