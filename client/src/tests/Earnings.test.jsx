import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Earnings from "../pages/Earnings";
import { getIncomeSummary } from "../services/transactionService";

vi.mock("../services/transactionService", () => ({ getIncomeSummary: vi.fn() }));

function sampleIncome(overrides = {}) {
    return {
        taxYear: 2027,
        taxPeriod: { startDate: "2026-03-01", endDate: "2027-02-28", timezone: "Africa/Johannesburg" },
        totalIncome: 120000,
        transactionCount: 2,
        estimatedTax: 3780,
        estimatedNet: 116220,
        estimatedTaxRate: .0315,
        taxBeforeRebate: 21600,
        primaryRebate: 17820,
        rebateUsed: 17820,
        breakdown: [{ from: 0, to: 245100, taxableAmount: 120000, rate: .18, tax: 21600 }],
        monthlyIncome: [
            { month: "2026-03", totalIncome: 40000, transactionCount: 1 },
            { month: "2026-04", totalIncome: 80000, transactionCount: 1 },
            ...["05", "06", "07", "08", "09", "10", "11", "12"].map((month) => ({ month: `2026-${month}`, totalIncome: 0, transactionCount: 0 })),
            ...["01", "02"].map((month) => ({ month: `2027-${month}`, totalIncome: 0, transactionCount: 0 }))
        ],
        recentTransactions: [{ _id: "tx-1", gigTitle: "Website design", amount: 80000, createdAt: "2026-04-10T12:00:00Z" }],
        assumptions: { rulesUrl: "https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/" },
        ...overrides
    };
}

describe("Freelancer financial dashboard", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it("loads server-calculated income, tax and net amounts with the current tax period", async () => {
        getIncomeSummary.mockResolvedValue({ income: sampleIncome() });
        render(<Earnings />);
        expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
        expect(await screen.findByRole("heading", { name: "Financial insights" })).toBeInTheDocument();
        const cards = screen.getByRole("region", { name: "Financial summary" });
        expect(within(cards).getByText("Total recorded income")).toBeInTheDocument();
        expect(within(cards).getByText("Estimated income tax")).toBeInTheDocument();
        expect(within(cards).getByText("Income after estimated tax")).toBeInTheDocument();
        expect(within(cards).getByText(/120\s*000\.00/)).toBeInTheDocument();
        expect(within(cards).getByText(/3\s*780\.00/)).toBeInTheDocument();
        expect(within(cards).getByText(/116\s*220\.00/)).toBeInTheDocument();
        expect(screen.getByText("2026-03-01 to 2027-02-28")).toBeInTheDocument();
        expect(screen.getByText("Website design")).toBeInTheDocument();
        expect(screen.getByRole("list", { name: "Monthly income chart" })).toBeInTheDocument();
        expect(screen.getAllByRole("listitem", { name: /transactions/ })).toHaveLength(12);
        expect(getIncomeSummary).toHaveBeenCalledTimes(1);
    });

    it("shows the rebate and real tax bracket formula, not a hard-coded 18% total", async () => {
        getIncomeSummary.mockResolvedValue({ income: sampleIncome() });
        render(<Earnings />);
        await screen.findByRole("heading", { name: "How the estimate works" });
        expect(screen.getByText(/Effective estimate: 3\.2%/)).toBeInTheDocument();
        expect(screen.getByText(/primary annual rebate/i)).toBeInTheDocument();
        fireEvent.click(screen.getByText("View the tax bracket calculation"));
        expect(screen.getAllByRole("table")[1]).toHaveTextContent(/18\.0%/);
    });

    it("shows a clear empty state and zero figures for a new freelancer", async () => {
        getIncomeSummary.mockResolvedValue({ income: sampleIncome({
            totalIncome: 0, estimatedTax: 0, estimatedNet: 0,
            estimatedTaxRate: 0, transactionCount: 0, breakdown: [],
            monthlyIncome: sampleIncome().monthlyIncome.map((row) => ({ ...row, totalIncome: 0, transactionCount: 0 })),
            recentTransactions: []
        }) });
        render(<Earnings />);
        expect(await screen.findByText("No completed transactions in this tax year.")).toBeInTheDocument();
        expect(screen.getByText("No transactions have been recorded for this tax year.")).toBeInTheDocument();
    });

    it("displays API denial instead of private information", async () => {
        getIncomeSummary.mockRejectedValue(new Error("You are not authorised to access this resource."));
        render(<Earnings />);
        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/not authorised/);
        expect(screen.queryByText("Total recorded income")).not.toBeInTheDocument();
    });

    it("can refresh and show new totals after another transaction", async () => {
        getIncomeSummary
            .mockResolvedValueOnce({ income: sampleIncome() })
            .mockResolvedValueOnce({ income: sampleIncome({ totalIncome: 200000, estimatedTax: 18180, estimatedNet: 181820 }) });
        render(<Earnings />);
        await screen.findAllByText(/120\s*000\.00/);
        fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
        await waitFor(() => expect(screen.getAllByText(/200\s*000\.00/)[0]).toBeInTheDocument());
        expect(getIncomeSummary).toHaveBeenCalledTimes(2);
    });
});

