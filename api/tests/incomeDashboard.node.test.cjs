
/*
 * Dependency-free financial dashboard smoke tests.
 *
 * These tests exercise the real controller and authentication middleware
 * using a minimal Transaction model stand-in.
 *
 * They do not replace MongoDB integration tests.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

// Fictional, valid MongoDB ObjectIds used exclusively for testing.
const FREELANCER_ID = "507f191e810c19729de860ea";
const CLIENT_ID = "507f1f77bcf86cd799439011";
const ATTACKER_ID = "507f1f77bcf86cd799439012";

const originalLoad = Module._load;

const model = {
    aggregate: async () => [],
    find: () => {}
};

const jwt = {
    verify: () => ({
        userId: FREELANCER_ID,
        role: "Freelancer"
    })
};

// Replace dependencies only while loading the real controller
// and authentication middleware.
Module._load = function (id, parent, isMain) {
    const parentPath = parent?.filename?.replace(/\\/g, "/");

    if (
        id === "../models/Transaction" &&
        parentPath?.endsWith("/controllers/transactionController.js")
    ) {
        return model;
    }

    if (
        id === "jsonwebtoken" &&
        parentPath?.endsWith("/middleware/authMiddleware.js")
    ) {
        return jwt;
    }

    return originalLoad.apply(this, arguments);
};

let getIncomeSummary;
let protect;
let authorizeRoles;

try {
    ({ getIncomeSummary } = require("../controllers/transactionController"));

    ({ protect, authorizeRoles } = require("../middleware/authMiddleware"));
} finally {
    Module._load = originalLoad;
}

function resObj() {
    return {
        code: null,
        payload: null,

        status(code) {
            this.code = code;
            return this;
        },

        json(payload) {
            this.payload = payload;
            return this;
        }
    };
}

function recent(items) {
    return {
        sort() {
            return this;
        },

        limit() {
            return this;
        },

        select() {
            return this;
        },

        async lean() {
            return items;
        }
    };
}

/*
 * Test 1:
 * The authenticated freelancer must only receive their own
 * completed financial transactions.
 *
 * A forged userId supplied in the query must be ignored.
 */
test(
    "2027 financial aggregation ignores an attacker-supplied userId and filters only Completed",
    async () => {
        let match = null;
        let secondFilter = null;

        model.aggregate = async (pipeline) => {
            match = pipeline[0].$match;

            return [{
                totals: [{
                    totalIncome: 120000,
                    transactionCount: 2
                }],
                monthly: [
                    {
                        _id: "2026-03",
                        totalIncome: 20000,
                        transactionCount: 1
                    },
                    {
                        _id: "2026-11",
                        totalIncome: 100000,
                        transactionCount: 1
                    }
                ]
            }];
        };

        model.find = (filter) => {
            secondFilter = filter;

            return recent([
                {
                    _id: "a",
                    amount: 100000
                }
            ]);
        };

        const res = resObj();
        let err = null;

        await getIncomeSummary(
            {
                user: {
                    userId: FREELANCER_ID,
                    role: "Freelancer"
                },
                query: {
                    userId: ATTACKER_ID
                }
            },
            res,
            (error) => {
                err = error;
            }
        );

        assert.equal(err, null);
        assert.equal(res.code, 200);

        // Support the current controller's typed ObjectId.
        // Also accept a validated hexadecimal string if the
        // transaction filter is aligned with the String schema.
        const matchedFreelancer =
            typeof match.freelancer === "string"
                ? match.freelancer
                : match.freelancer.toHexString();

        assert.equal(matchedFreelancer, FREELANCER_ID);
        assert.notEqual(matchedFreelancer, ATTACKER_ID);

        assert.equal(match.status, "Completed");

        // Aggregation and recent transactions must be scoped
        // using the same validated ownership filter.
        assert.equal(secondFilter, match);

        assert.equal(res.payload.income.totalIncome, 120000);
        assert.equal(res.payload.income.estimatedTax, 3780);
        assert.equal(res.payload.income.estimatedNet, 116220);

        assert.equal(res.payload.income.monthlyIncome.length, 12);

        assert.equal(
            res.payload.income.monthlyIncome[8].month,
            "2026-11"
        );

        assert.equal(
            res.payload.income.recentTransactions.length,
            1
        );
    }
);

/*
 * Test 2:
 * A freelancer without completed transactions must receive
 * safe zero-income values rather than an error.
 */
test(
    "zero income returns empty chart and safe zero results",
    async () => {
        model.aggregate = async () => [{
            totals: [],
            monthly: []
        }];

        model.find = () => recent([]);

        const res = resObj();

        await getIncomeSummary(
            {
                user: {
                    userId: FREELANCER_ID,
                    role: "Freelancer"
                }
            },
            res,
            (error) => {
                throw error;
            }
        );

        assert.equal(res.code, 200);
        assert.equal(res.payload.income.totalIncome, 0);
        assert.equal(res.payload.income.estimatedTax, 0);

        assert.equal(
            res.payload.income.monthlyIncome.length,
            12
        );

        assert.equal(
            res.payload.income.monthlyIncome.filter(
                (item) => item.totalIncome !== 0
            ).length,
            0
        );

        assert.deepEqual(
            res.payload.income.recentTransactions,
            []
        );
    }
);

/*
 * Test 3:
 * The real authentication middleware must:
 *
 * 1. Reject requests without a JWT (401).
 * 2. Reject authenticated clients from freelancer routes (403).
 * 3. Allow authenticated freelancers through authorised routes.
 *
 * The request body must not override the JWT role.
 */
test(
    "real auth middleware returns 401 missing JWT, 403 client JWT, 200 freelancer route pass",
    () => {
        let req = {
            headers: {}
        };

        let res = resObj();
        let passed = false;

        // Case 1: Missing authentication token.
        protect(req, res, () => {
            passed = true;
        });

        assert.equal(res.code, 401);
        assert.equal(passed, false);

        // Case 2: Client attempts to access a Freelancer route.
        jwt.verify = () => ({
            userId: CLIENT_ID,
            role: "Client"
        });

        req = {
            headers: {
                authorization: "Bearer test"
            },
            body: {
                role: "Freelancer"
            }
        };

        res = resObj();
        passed = false;

        protect(req, res, () => {
            authorizeRoles("Freelancer")(
                req,
                res,
                () => {
                    passed = true;
                }
            );
        });

        assert.equal(res.code, 403);
        assert.equal(passed, false);
        assert.equal(req.user.userId, CLIENT_ID);
        assert.equal(req.user.role, "Client");

        // Case 3: Authenticated Freelancer is authorised.
        jwt.verify = () => ({
            userId: FREELANCER_ID,
            role: "Freelancer"
        });

        req = {
            headers: {
                authorization: "Bearer test"
            }
        };

        res = resObj();
        passed = false;

        protect(req, res, () => {
            authorizeRoles("Freelancer")(
                req,
                res,
                () => {
                    passed = true;
                }
            );
        });

        assert.equal(passed, true);
        assert.equal(res.code, null);
        assert.equal(req.user.userId, FREELANCER_ID);
        assert.equal(req.user.role, "Freelancer");
    }
);
