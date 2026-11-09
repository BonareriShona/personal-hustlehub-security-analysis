/**
 * South African individual income-tax illustration, 2026/27.
 * Source: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
 *
 * Intentional assumptions: natural person younger than 65; primary rebate only;
 * recorded HustleHub+ income is treated as taxable income (no deductions,
 * expenses, other income, medical credits, provisional payments or VAT).
 * This is an indicative year-to-date estimate, NOT tax advice or a filing.
 */
const TAX_YEAR = 2027; // 1 March 2026 to 28 February 2027 (South Africa)
const SOUTH_AFRICA_TIMEZONE = "Africa/Johannesburg";
const PRIMARY_REBATE_CENTS = 1782000; // R17,820
const TAX_FREE_THRESHOLD = 99000; // under 65, after primary rebate
const TAX_RULES_URL = "https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/";

// Each upper bound is inclusive. Rates are basis points to keep cents stable.
const BRACKETS = Object.freeze([
    { upper: 245100, rateBasisPoints: 1800 },
    { upper: 383100, rateBasisPoints: 2600 },
    { upper: 530200, rateBasisPoints: 3100 },
    { upper: 695800, rateBasisPoints: 3600 },
    { upper: 887000, rateBasisPoints: 3900 },
    { upper: 1878600, rateBasisPoints: 4100 },
    { upper: Infinity, rateBasisPoints: 4500 }
]);

function cents(amount) {
    if (typeof amount !== "number" || !Number.isFinite(amount) ||
        amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100) {
        throw new RangeError("Income must be a non-negative, finite amount in ZAR.");
    }
    return Math.round((amount + Number.EPSILON) * 100);
}

function rands(valueInCents) {
    return Number((valueInCents / 100).toFixed(2));
}

function getSouthAfricanTaxYear(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new RangeError("An actual date is required.");
    }
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: SOUTH_AFRICA_TIMEZONE,
        year: "numeric",
        month: "2-digit"
    }).formatToParts(date);
    const year = Number(parts.find((part) => part.type === "year").value);
    const month = Number(parts.find((part) => part.type === "month").value);
    return month >= 3 ? year + 1 : year;
}

function getTaxYearPeriod(year = TAX_YEAR) {
    if (year !== TAX_YEAR) {
        throw new RangeError("Tax rates are currently configured for the 2026/27 tax year only.");
    }
    // South Africa is permanently UTC+02:00 (no daylight saving time).
    // Boundaries represent midnight in Johannesburg, with an exclusive end.
    return {
        taxYear: year,
        start: new Date(Date.UTC(year - 1, 2, 1, -2)),
        endExclusive: new Date(Date.UTC(year, 2, 1, -2)),
        startDate: `${year - 1}-03-01`,
        endDate: `${year}-02-28`,
        timezone: SOUTH_AFRICA_TIMEZONE
    };
}

function estimateTax(totalIncome, year = TAX_YEAR) {
    getTaxYearPeriod(year);
    const incomeCents = cents(totalIncome);
    let remaining = incomeCents;
    let previousCeiling = 0;
    let taxBeforeRebateCents = 0;
    const breakdown = [];
    let marginalRate = 0;

    for (const bracket of BRACKETS) {
        if (remaining <= 0) break;
        const ceiling = Number.isFinite(bracket.upper) ? bracket.upper * 100 : Infinity;
        const taxableCents = Math.min(remaining, ceiling - previousCeiling);
        const taxCents = Math.round(taxableCents * bracket.rateBasisPoints / 10000);
        taxBeforeRebateCents += taxCents;
        breakdown.push({
            from: rands(previousCeiling),
            to: Number.isFinite(ceiling) ? rands(ceiling) : null,
            taxableAmount: rands(taxableCents),
            rate: bracket.rateBasisPoints / 10000,
            tax: rands(taxCents)
        });
        marginalRate = bracket.rateBasisPoints / 10000;
        remaining -= taxableCents;
        previousCeiling = ceiling;
    }

    const rebateUsedCents = Math.min(taxBeforeRebateCents, PRIMARY_REBATE_CENTS);
    const estimatedTaxCents = Math.max(0, taxBeforeRebateCents - PRIMARY_REBATE_CENTS);
    const netCents = Math.max(0, incomeCents - estimatedTaxCents);

    return {
        taxYear: year,
        totalIncome: rands(incomeCents),
        taxBeforeRebate: rands(taxBeforeRebateCents),
        primaryRebate: rands(PRIMARY_REBATE_CENTS),
        rebateUsed: rands(rebateUsedCents),
        estimatedTax: rands(estimatedTaxCents),
        estimatedNet: rands(netCents),
        estimatedTaxRate: incomeCents > 0 ? estimatedTaxCents / incomeCents : 0,
        marginalTaxRate: marginalRate,
        breakdown
    };
}

module.exports = {
    TAX_YEAR, TAX_RULES_URL, TAX_FREE_THRESHOLD,
    SOUTH_AFRICA_TIMEZONE, BRACKETS, PRIMARY_REBATE_CENTS,
    getSouthAfricanTaxYear, getTaxYearPeriod, estimateTax
};
