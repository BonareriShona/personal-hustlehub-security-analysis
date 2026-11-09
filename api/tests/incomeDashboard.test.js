jest.mock("../models/Transaction", () => ({
    aggregate: jest.fn(),
    find: jest.fn()
}));

const Transaction = require("../models/Transaction");
const { getIncomeSummary } = require("../controllers/transactionController");

function mockResponse() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

function mockRecent(records) {
    const chain = {
        sort: jest.fn(), limit: jest.fn(), select: jest.fn(), lean: jest.fn()
    };
    chain.sort.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    chain.lean.mockResolvedValue(records);
    Transaction.find.mockReturnValue(chain);
    return chain;
}

describe("private freelancer financial dashboard", () => {
    beforeEach(() => jest.clearAllMocks());

    test("only queries the verified JWT owner; forged query userId is ignored", async () => {
        Transaction.aggregate.mockResolvedValue([{ totals: [{ totalIncome: 120000, transactionCount: 3 }], monthly: [
            { _id: "2026-03", totalIncome: 20000, transactionCount: 1 },
            { _id: "2026-11", totalIncome: 100000, transactionCount: 2 }
        ] }]);
        const recent = [{ _id: "txn1", gigTitle: "Design", amount: 20000, createdAt: new Date() }];
        const chain = mockRecent(recent);
        const req = { user: { userId: "freelancer-A", role: "Freelancer" }, query: { userId: "freelancer-B" } };
        const res = mockResponse();
        const next = jest.fn();

        await getIncomeSummary(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(Transaction.aggregate).toHaveBeenCalledTimes(1);
        const pipeline = Transaction.aggregate.mock.calls[0][0];
        expect(pipeline[0].$match.freelancer).toBe("freelancer-A");
        expect(pipeline[0].$match.status).toBe("Completed");
        expect(pipeline[0].$match.createdAt.$gte).toBeInstanceOf(Date);
        expect(pipeline[0].$match.createdAt.$lt).toBeInstanceOf(Date);
        expect(JSON.stringify(pipeline)).not.toContain("freelancer-B");
        expect(Transaction.find).toHaveBeenCalledWith(pipeline[0].$match);
        expect(chain.select).toHaveBeenCalledWith("gigTitle amount reference createdAt");

        const body = res.json.mock.calls[0][0];
        expect(body.income.totalIncome).toBe(120000);
        expect(body.income.estimatedTax).toBe(3780);
        expect(body.income.estimatedNet).toBe(116220);
        expect(body.income.transactionCount).toBe(3);
        expect(body.income.monthlyIncome).toHaveLength(12);
        expect(body.income.monthlyIncome[0]).toEqual({ month: "2026-03", totalIncome: 20000, transactionCount: 1 });
        expect(body.income.monthlyIncome[8]).toEqual({ month: "2026-11", totalIncome: 100000, transactionCount: 2 });
        expect(body.income.monthlyIncome[11].month).toBe("2027-02");
        expect(body.income.recentTransactions).toEqual(recent);
    });

    test("returns zeroes and a valid twelve-month chart for no income", async () => {
        Transaction.aggregate.mockResolvedValue([{ totals: [], monthly: [] }]);
        mockRecent([]);
        const res = mockResponse();
        await getIncomeSummary({ user: { userId: "empty" } }, res, jest.fn());
        const result = res.json.mock.calls[0][0].income;
        expect(result.totalIncome).toBe(0);
        expect(result.estimatedTax).toBe(0);
        expect(result.estimatedNet).toBe(0);
        expect(result.monthlyIncome.every((item) => item.totalIncome === 0)).toBe(true);
        expect(result.recentTransactions).toEqual([]);
    });

    test("propagates database errors through Express error middleware", async () => {
        const failure = new Error("database offline");
        Transaction.aggregate.mockRejectedValue(failure);
        const res = mockResponse();
        const next = jest.fn();
        await getIncomeSummary({ user: { userId: "freelancer" } }, res, next);
        expect(next).toHaveBeenCalledWith(failure);
        expect(res.json).not.toHaveBeenCalled();
    });
});
