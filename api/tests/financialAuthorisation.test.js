
jest.mock("jsonwebtoken", () => ({ verify: jest.fn() }));

const jwt = require("jsonwebtoken");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Valid MongoDB ObjectId values for test users.
// These are fictional identifiers, not real user records.
const CLIENT_ID = "507f1f77bcf86cd799439011";
const FREELANCER_ID = "507f191e810c19729de860ea";

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
        jwt.verify.mockImplementation(() => {
            throw new Error("invalid signature");
        });

        const req = {
            headers: {
                authorization: "Bearer invalid.jwt.signature"
            }
        };

        const res = response();
        const next = jest.fn();

        protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("the role comes from the verified token, not request body", () => {
        jwt.verify.mockReturnValue({
            userId: CLIENT_ID,
            role: "Client"
        });

        const req = {
            headers: {
                authorization: "Bearer verified"
            },
            body: {
                role: "Freelancer",
                userId: "other-person"
            }
        };

        const res = response();
        const next = jest.fn();

        protect(req, res, next);

        expect(req.user).toEqual({
            userId: CLIENT_ID,
            role: "Client"
        });

        expect(next).toHaveBeenCalledTimes(1);

        const roleNext = jest.fn();

        authorizeRoles("Freelancer")(req, res, roleNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(roleNext).not.toHaveBeenCalled();
    });

    test("a verified freelancer passes the income route role check", () => {
        jwt.verify.mockReturnValue({
            userId: FREELANCER_ID,
            role: "Freelancer"
        });

        const req = {
            headers: {
                authorization: "Bearer verified"
            }
        };

        const res = response();
        const authNext = jest.fn();

        protect(req, res, authNext);

        expect(authNext).toHaveBeenCalledTimes(1);

        const next = jest.fn();

        authorizeRoles("Freelancer")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("rejects a JWT containing a MongoDB operator object", () => {
        jwt.verify.mockReturnValue({
            userId: { $ne: null },
            role: "Client"
        });

        const req = {
            headers: {
                authorization: "Bearer verified"
            }
        };

        const res = response();
        const next = jest.fn();

        protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(req.user).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
    });

    test("rejects a JWT containing an unexpected role", () => {
        jwt.verify.mockReturnValue({
            userId: CLIENT_ID,
            role: "SuperAdmin"
        });

        const req = {
            headers: {
                authorization: "Bearer verified"
            }
        };

        const res = response();
        const next = jest.fn();

        protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(req.user).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
    });
});
