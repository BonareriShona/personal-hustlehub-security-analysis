
const {
    validateBooking,
    validateObjectId
} = require("../middleware/validateBooking");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("Booking NoSQL injection protection", () => {
    test("rejects a MongoDB operator object as gigId", () => {
        const req = {
            body: { gigId: { $ne: null } }
        };
        const res = mockRes();
        const next = jest.fn();

        validateBooking(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test("accepts a valid MongoDB gig ID", () => {
        const req = {
            body: { gigId: "507f1f77bcf86cd799439011" }
        };
        const res = mockRes();
        const next = jest.fn();

        validateBooking(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("rejects an invalid booking ID", () => {
        const req = {
            params: { id: { $ne: null } }
        };
        const res = mockRes();
        const next = jest.fn();

        validateObjectId(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});
