const validateGig = require("../middleware/validateGig");

/*
 * Unit tests for gig input validation.
 *
 * The middleware is called directly with mock request, response and next
 * objects. This tests the validation rules in isolation, without a running
 * server or database, so a failure points at the rule rather than at the
 * environment.
 */

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function validGig() {
    return {
        title: "Logo Design",
        description: "A professional logo design service for small businesses.",
        category: "Design",
        price: 500
    };
}

describe("validateGig", () => {
    test("accepts a well formed gig", () => {
        const req = { body: validGig() };
        const res = mockRes();
        const next = jest.fn();

        validateGig(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("rejects a title that is too short", () => {
        const req = { body: { ...validGig(), title: "X" } };
        const res = mockRes();
        const next = jest.fn();

        validateGig(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test("rejects a non-string title, so an object cannot be smuggled in", () => {
        const req = { body: { ...validGig(), title: { $ne: null } } };
        const res = mockRes();
        const next = jest.fn();

        validateGig(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("rejects a negative price", () => {
        const req = { body: { ...validGig(), price: -100 } };
        const res = mockRes();
        const next = jest.fn();

        validateGig(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("rejects a price above the permitted maximum", () => {
        const req = { body: { ...validGig(), price: 9999999 } };
        const res = mockRes();
        const next = jest.fn();

        validateGig(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("trims surrounding whitespace before the controller sees it", () => {
        const req = { body: { ...validGig(), title: "   Logo Design   " } };
        const res = mockRes();
        const next = jest.fn();

        validateGig(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.body.title).toBe("Logo Design");
    });


test("rejects descriptions that become too short after sanitisation", () => {
    const req = {
        body: {
            ...validGig(),
            description: "<b>abc</b>"
        }
    };

    const res = mockRes();
    const next = jest.fn();

    validateGig(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Description must be between 10 and 1000 characters."
    });
    expect(next).not.toHaveBeenCalled();
});

});
