// Dependency-free controller smoke tests that load real controller code with a
// minimal Transaction stand-in. They do not replace real Mongo integration.
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const originalLoad = Module._load;
const model = { aggregate: async () => [], find: () => {} };
const jwt = { verify: () => ({ userId: 'freelancer-A', role: 'Freelancer' }) };
Module._load = function (id, parent, isMain) {
    if (id === '../models/Transaction' && parent?.filename?.replace(/\\/g, '/')?.endsWith('/controllers/transactionController.js')) return model;
    if (id === 'jsonwebtoken' && parent?.filename?.replace(/\\/g, '/')?.endsWith('/middleware/authMiddleware.js')) return jwt;
    return originalLoad.apply(this, arguments);
};
const { getIncomeSummary } = require('../controllers/transactionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
Module._load = originalLoad;

function resObj() {
    return { code: null, payload: null, status(code) { this.code = code; return this; }, json(payload) { this.payload = payload; return this; } };
}
function recent(items) {
    const chain = { sort() { return this; }, limit() { return this; }, select() { return this; }, async lean() { return items; } };
    return chain;
}

test('2027 financial aggregation ignores an attacker-supplied userId and filters only Completed', async () => {
    let match = null, secondFilter = null;
    model.aggregate = async (pipeline) => {
        match = pipeline[0].$match;
        return [{ totals: [{ totalIncome: 120000, transactionCount: 2 }], monthly: [
            { _id: '2026-03', totalIncome: 20000, transactionCount: 1 },
            { _id: '2026-11', totalIncome: 100000, transactionCount: 1 }
        ] }];
    };
    model.find = (filter) => { secondFilter = filter; return recent([{ _id: 'a', amount: 100000 }]); };
    const res = resObj();
    let err = null;
    await getIncomeSummary({ user: { userId: 'freelancer-A' }, query: { userId: 'freelancer-B' } }, res, e => { err = e; });
    assert.equal(err, null);
    assert.equal(res.code, 200);
    assert.equal(match.freelancer, 'freelancer-A');
    assert.equal(match.status, 'Completed');
    assert.equal(secondFilter, match);
    assert.equal(res.payload.income.totalIncome, 120000);
    assert.equal(res.payload.income.estimatedTax, 3780);
    assert.equal(res.payload.income.estimatedNet, 116220);
    assert.equal(res.payload.income.monthlyIncome.length, 12);
    assert.equal(res.payload.income.monthlyIncome[8].month, '2026-11');
    assert.equal(res.payload.income.recentTransactions.length, 1);
});

test('zero income returns empty chart and safe zero results', async () => {
    model.aggregate = async () => [{ totals: [], monthly: [] }];
    model.find = () => recent([]);
    const res = resObj();
    await getIncomeSummary({ user: { userId: 'freelancer-A' } }, res, e => { throw e; });
    assert.equal(res.code, 200);
    assert.equal(res.payload.income.estimatedTax, 0);
    assert.equal(res.payload.income.monthlyIncome.filter(item => item.totalIncome !== 0).length, 0);
});

test('real auth middleware returns 401 missing JWT, 403 client JWT, 200 freelancer route pass', () => {
    let req = { headers: {} }, res = resObj(), passed = false;
    protect(req, res, () => { passed = true; });
    assert.equal(res.code, 401);
    assert.equal(passed, false);

    jwt.verify = () => ({ userId: 'client', role: 'Client' });
    req = { headers: { authorization: 'Bearer test' }, body: { role: 'Freelancer' } };
    res = resObj();
    protect(req, res, () => {});
    authorizeRoles('Freelancer')(req, res, () => { passed = true; });
    assert.equal(res.code, 403);
    assert.equal(passed, false);
    assert.equal(req.user.userId, 'client');

    jwt.verify = () => ({ userId: 'freelancer-A', role: 'Freelancer' });
    req = { headers: { authorization: 'Bearer test' } };
    res = resObj();
    protect(req, res, () => {});
    authorizeRoles('Freelancer')(req, res, () => { passed = true; });
    assert.equal(passed, true);
    assert.equal(res.code, null);
});

