jest.mock("jsonwebtoken", () => ({ verify: jest.fn() }));
const jwt = require("jsonwebtoken");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

function response() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("financial route authentication and role enforcement", () => {
    beforeEach(() => jest.clearAllMocks());

    test("missing bearer token gets 401", () => {
        const req = { headers: {} };
        const res = response();
        const next = jest.fn();
        protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("tampered / expired token gets 401", () => {
        jwt.verify.mockImplementation(() => { throw new Error("invalid signature"); });
        const req = { headers: { authorization: "Bearer invalid.jwt.signature" } };
        const res = response();
        const next = jest.fn();
        protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("the role comes from the verified token, not request body", () => {
        jwt.verify.mockReturnValue({ userId: "real-client", role: "Client" });
        const req = { headers: { authorization: "Bearer verified" }, body: { role: "Freelancer", userId: "other-person" } };
        const res = response();
        const next = jest.fn();
        protect(req, res, next);
        expect(req.user).toEqual({ userId: "real-client", role: "Client" });
        expect(next).toHaveBeenCalledTimes(1);
        const roleNext = jest.fn();
        authorizeRoles("Freelancer")(req, res, roleNext);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(roleNext).not.toHaveBeenCalled();
    });

    test("a verified freelancer passes the income route role check", () => {
        jwt.verify.mockReturnValue({ userId: "freelancer-id", role: "Freelancer" });
        const req = { headers: { authorization: "Bearer verified" } };
        const res = response();
        protect(req, res, jest.fn());
        const next = jest.fn();
        authorizeRoles("Freelancer")(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
