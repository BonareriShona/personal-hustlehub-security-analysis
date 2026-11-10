
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const {
    TAX_YEAR,
    TAX_RULES_URL,
    TAX_FREE_THRESHOLD,
    SOUTH_AFRICA_TIMEZONE,
    getSouthAfricanTaxYear,
    getTaxYearPeriod,
    estimateTax
} = require("../services/taxEstimator");

/**
 * Validate the authenticated user identifier before database queries.
 * Returns a typed MongoDB ObjectId or null if the identity is invalid.
 */
function getAuthenticatedObjectId(req) {
    const userId = req.user?.userId;

    if (
        typeof userId !== "string" ||
        !mongoose.isObjectIdOrHexString(userId)
    ) {
        return null;
    }

    return new mongoose.Types.ObjectId(userId);
}

/*
 * Transactions are recorded by bookingController, never forged by the browser.
 * Every personal financial read obtains the owner from the verified JWT.
 */

/**
 * Retrieve transactions belonging to the authenticated user.
 * Clients see their payments; freelancers see their earnings.
 */
async function getMyTransactions(req, res, next) {
    try {
        const userId = getAuthenticatedObjectId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication identity."
            });
        }

        const role = req.user.role;

        const filter = role === "Freelancer"
    ? { freelancer: userId.toHexString() }
    : { client: userId.toHexString() };

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Server-calculated personal dashboard for the authenticated freelancer.
 *
 * Ignores req.query.userId and any client-supplied owner field.
 * Tax is estimated using completed transaction records within the
 * configured South African tax year.
 */
async function getIncomeSummary(req, res, next) {
    try {
        const year = getSouthAfricanTaxYear();

        if (year !== TAX_YEAR) {
            return res.status(503).json({
                success: false,
                message:
                    "This tax year is not configured yet. Update the SARS tax rules before estimating tax."
            });
        }

        const {
            start,
            endExclusive,
            startDate,
            endDate
        } = getTaxYearPeriod(year);

        const userId = getAuthenticatedObjectId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication identity."
            });
        }

        const filter = {
    freelancer: userId.toHexString(),
    status: "Completed",
    createdAt: {
        $gte: start,
        $lt: endExclusive
    }
};
        // Both the summary and monthly bars use the same scoped data.
        const [result] = await Transaction.aggregate([
            {
                $match: filter
            },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalIncome: { $sum: "$amount" },
                                transactionCount: { $sum: 1 }
                            }
                        }
                    ],
                    monthly: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m",
                                        date: "$createdAt",
                                        timezone: SOUTH_AFRICA_TIMEZONE
                                    }
                                },
                                totalIncome: { $sum: "$amount" },
                                transactionCount: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { _id: 1 }
                        }
                    ]
                }
            }
        ]);

        const totals = result?.totals?.[0] || {
            totalIncome: 0,
            transactionCount: 0
        };

        const tax = estimateTax(totals.totalIncome, year);

        const byMonth = new Map(
            (result?.monthly || []).map((row) => [
                row._id,
                row
            ])
        );

        const monthlyIncome = Array.from(
            { length: 12 },
            (_, i) => {
                // March through February.
                const month = (i + 2) % 12 + 1;
                const monthYear = i < 10 ? year - 1 : year;

                const key =
                    `${monthYear}-${String(month).padStart(2, "0")}`;

                const row = byMonth.get(key);

                const amount = row
                    ? Math.round(
                        (row.totalIncome + Number.EPSILON) * 100
                    ) / 100
                    : 0;

                return {
                    month: key,
                    totalIncome: amount,
                    transactionCount: row?.transactionCount || 0
                };
            }
        );

        // Return only the fields required by the income dashboard.
        const recentTransactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .select("gigTitle amount reference createdAt")
            .lean();

        return res.status(200).json({
            success: true,
            income: {
                ...tax,
                transactionCount: totals.transactionCount,
                monthlyIncome,
                recentTransactions,
                taxPeriod: {
                    startDate,
                    endDate,
                    timezone: SOUTH_AFRICA_TIMEZONE
                },
                assumptions: {
                    age: "Under 65; primary rebate only",
                    taxableIncome:
                        "Completed HustleHub+ transactions recorded in the selected South African tax year",
                    excludes:
                        "Business costs, deductions, losses, other earnings, medical credits, provisional payments and VAT",
                    simulatedPayments: true,
                    taxFreeThreshold: TAX_FREE_THRESHOLD,
                    rulesUrl: TAX_RULES_URL,
                    notice:
                        "Illustrative year-to-date estimate only, not a SARS assessment or tax advice."
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Retrieve all transactions for authorised administrators.
 * Role restrictions are enforced by transactionRoutes.js.
 */
async function getAllTransactions(req, res, next) {
    try {
        const transactions = await Transaction.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyTransactions,
    getIncomeSummary,
    getAllTransactions
};
