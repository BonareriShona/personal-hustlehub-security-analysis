const {
    TAX_YEAR, getSouthAfricanTaxYear, getTaxYearPeriod, estimateTax
} = require("../services/taxEstimator");

describe("South African individual tax estimate (2026/27)", () => {
    test("recognises Johannesburg tax-year boundary rather than UTC midnight", () => {
        expect(getSouthAfricanTaxYear(new Date("2026-02-28T21:59:59Z"))).toBe(2026);
        expect(getSouthAfricanTaxYear(new Date("2026-02-28T22:00:00Z"))).toBe(2027);
        expect(getSouthAfricanTaxYear(new Date("2027-02-28T21:59:59Z"))).toBe(2027);
        expect(getSouthAfricanTaxYear(new Date("2027-02-28T22:00:00Z"))).toBe(2028);
    });

    test("uses inclusive/exclusive SAST date boundaries", () => {
        const p = getTaxYearPeriod();
        expect(TAX_YEAR).toBe(2027);
        expect(p.start.toISOString()).toBe("2026-02-28T22:00:00.000Z");
        expect(p.endExclusive.toISOString()).toBe("2027-02-28T22:00:00.000Z");
    });

    test.each([
        [0, 0],
        [95000, 0],
        [99000, 0],
        [100000, 180],
        [245100, 26298],
        [383100, 62178],
        [530200, 107779],
        [695800, 167395],
        [887000, 241963],
        [1878600, 648519],
        [1878601, 648519.45]
    ])("tax on R%s is R%s after primary rebate", (income, expected) => {
        expect(estimateTax(income).estimatedTax).toBe(expected);
    });

    test("breakdown is additive and net is income less estimated tax", () => {
        const estimate = estimateTax(400000);
        const sum = estimate.breakdown.reduce((acc, row) => acc + row.tax, 0);
        expect(estimate.taxBeforeRebate).toBeCloseTo(sum, 2);
        expect(estimate.estimatedTax).toBeCloseTo(estimate.taxBeforeRebate - 17820, 2);
        expect(estimate.estimatedNet).toBeCloseTo(400000 - estimate.estimatedTax, 2);
        expect(estimate.marginalTaxRate).toBe(.31);
        expect(estimate.estimatedTaxRate).toBeCloseTo(estimate.estimatedTax / 400000, 9);
    });

    test("keeps cents and never produces negative tax or net income", () => {
        expect(estimateTax(99000.01).estimatedTax).toBe(0);
        expect(estimateTax(99000.1).estimatedTax).toBe(.02);
        expect(estimateTax(.01).estimatedNet).toBe(.01);
    });

    test.each([-1, NaN, Infinity, "500", {}, null])("rejects malformed income: %s", (value) => {
        expect(() => estimateTax(value)).toThrow(RangeError);
    });

    test("does not silently calculate using stale rates after 2026/27", () => {
        expect(() => estimateTax(50000, 2028)).toThrow(/2026\/27/);
        expect(() => getTaxYearPeriod(2026)).toThrow(RangeError);
    });
});
