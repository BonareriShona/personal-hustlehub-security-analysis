import { useEffect, useState } from "react";
import { getIncomeSummary } from "../services/transactionService";
import "./Earnings.css";

const numberFormat = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function money(value) {
    return `R ${numberFormat.format(Number(value) || 0).replace(/,/g, " ")}`;
}

function percentage(value) {
    return `${(Math.round((Number(value) || 0) * 1000) / 10).toFixed(1)}%`;
}

function MonthlyIncomeChart({ months }) {
    const maxIncome = Math.max(0, ...months.map((month) => Number(month.totalIncome) || 0));
    return (
        <section className="finance-panel" aria-labelledby="monthly-income-heading">
            <div className="finance-panel-heading">
                <div>
                    <h2 id="monthly-income-heading">Monthly income</h2>
                    <p>Recorded transactions · March to February · ZAR</p>
                </div>
                <span className="finance-panel-label">12 months</span>
            </div>
            <figure className="finance-chart">
                <div className="finance-chart-grid" role="list" aria-label="Monthly income chart">
                    {months.map((month) => {
                        const amount = Number(month.totalIncome) || 0;
                        const height = maxIncome > 0 ? amount / maxIncome * 100 : 0;
                        const [year, monthNumber] = month.month.split("-");
                        const label = new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1))
                            .toLocaleDateString("en-ZA", { month: "short", timeZone: "UTC" });
                        return (
                            <div className="finance-chart-column" role="listitem"
                                key={month.month} aria-label={`${label} ${year}: ${money(amount)}, ${month.transactionCount} transactions`}>
                                <div className="finance-bar-track" title={`${month.month}: ${money(amount)}`}>
                                    {height > 0 && (
                                        <div className="finance-bar-fill" style={{ height: `${height}%` }} />
                                    )}
                                </div>
                                <span className="finance-chart-month" aria-hidden="true">{label}</span>
                            </div>
                        );
                    })}
                </div>
                <figcaption>
                    {maxIncome === 0
                        ? "No transactions have been recorded for this tax year."
                        : "Bars compare recorded income each month. Open the table for exact amounts."}
                </figcaption>
            </figure>
            <details className="finance-detail-toggle">
                <summary>View exact monthly figures</summary>
                <div className="finance-table-scroll">
                    <table className="finance-table">
                        <thead><tr><th scope="col">Month</th><th scope="col">Income (ZAR)</th><th scope="col">Transactions</th></tr></thead>
                        <tbody>{months.map((month) => (
                            <tr key={month.month}>
                                <th scope="row">{month.month}</th>
                                <td>{money(month.totalIncome)}</td>
                                <td>{month.transactionCount}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </details>
        </section>
    );
}

function FinancialHighlights({ income }) {
    const total = Math.max(0, Number(income.totalIncome) || 0);
    const tax = Math.max(0, Number(income.estimatedTax) || 0);
    const net = Math.max(0, Number(income.estimatedNet) || 0);
    const taxPercent = total ? Math.min(100, tax / total * 100) : 0;

    return (
        <>
            <section className="finance-kpi-grid" aria-label="Financial summary">
                <article className="finance-kpi finance-kpi-income">
                    <span className="finance-kpi-label">Total recorded income</span>
                    <strong className="finance-kpi-value">{money(total)}</strong>
                    <span className="finance-kpi-note">{income.transactionCount} completed transaction{income.transactionCount === 1 ? "" : "s"}</span>
                </article>
                <article className="finance-kpi finance-kpi-tax">
                    <span className="finance-kpi-label">Estimated income tax</span>
                    <strong className="finance-kpi-value">{money(tax)}</strong>
                    <span className="finance-kpi-note">Effective estimate: {percentage(income.estimatedTaxRate)}</span>
                </article>
                <article className="finance-kpi finance-kpi-net">
                    <span className="finance-kpi-label">Income after estimated tax</span>
                    <strong className="finance-kpi-value">{money(net)}</strong>
                    <span className="finance-kpi-note">Before expenses and other deductions</span>
                </article>
            </section>
            <section className="finance-split" aria-label="Income after estimated tax breakdown">
                <div className="finance-split-heading">
                    <span><span className="finance-legend-dot finance-dot-net" />After estimated tax</span>
                    <span><span className="finance-legend-dot finance-dot-tax" />Estimated tax</span>
                </div>
                <div className="finance-split-bar" role="img"
                    aria-label={`${money(net)} after estimated tax; ${money(tax)} estimated tax`}>
                    <div className="finance-split-tax" style={{ width: `${taxPercent}%` }} />
                </div>
            </section>
        </>
    );
}

function TaxExplanation({ income }) {
    return (
        <section className="finance-panel" aria-labelledby="tax-explanation-heading">
            <div className="finance-panel-heading">
                <div>
                    <h2 id="tax-explanation-heading">How the estimate works</h2>
                    <p>SARS individual income-tax brackets for the {income.taxYear} tax year.</p>
                </div>
                <span className="finance-panel-label">Illustrative</span>
            </div>
            <p className="finance-explainer">
                Each portion of recorded income is taxed at its applicable progressive bracket rate.
                The primary annual rebate of {money(income.primaryRebate)} is then applied, with tax never below zero.
            </p>
            <div className="finance-calc-rows">
                <span>Tax before primary rebate</span><strong>{money(income.taxBeforeRebate)}</strong>
                <span>Primary rebate applied</span><strong>− {money(income.rebateUsed)}</strong>
                <span>Estimated tax after rebate</span><strong>{money(income.estimatedTax)}</strong>
            </div>
            <details className="finance-detail-toggle">
                <summary>View the tax bracket calculation</summary>
                {income.breakdown.length ? (
                    <div className="finance-table-scroll">
                        <table className="finance-table">
                            <thead><tr><th scope="col">Bracket</th><th scope="col">Income in bracket</th><th scope="col">Rate</th><th scope="col">Tax on portion</th></tr></thead>
                            <tbody>{income.breakdown.map((tier) => (
                                <tr key={`${tier.from}-${tier.rate}`}>
                                    <th scope="row">{money(tier.from)} – {tier.to == null ? "above" : money(tier.to)}</th>
                                    <td>{money(tier.taxableAmount)}</td>
                                    <td>{percentage(tier.rate)}</td>
                                    <td>{money(tier.tax)}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : <p>No taxable recorded income yet.</p>}
            </details>
            <p className="finance-disclaimer">
                Assumptions: individual younger than 65; the primary rebate only; recorded income treated
                as taxable income. Business expenses, losses, other income, age-related rebates,
                medical credits, provisional tax payments and VAT are not included.
                HustleHub+ bookings use simulated payments. This is an indicative year-to-date
                calculation, not a final SARS tax assessment or tax advice. {" "}
                <a href={income.assumptions.rulesUrl} target="_blank" rel="noopener noreferrer">
                    SARS tax tables
                </a>.
            </p>
        </section>
    );
}

function Earnings() {
    const [income, setIncome] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        getIncomeSummary().then((data) => {
            if (active) setIncome(data.income);
        }).catch((requestError) => {
            if (active) setError(requestError.message || "Unable to load financial information.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [reloadKey]);

    function refresh() {
        setError("");
        setLoading(true);
        setReloadKey((key) => key + 1);
    }

    return (
        <main className="finance-page">
            <div className="finance-shell">
                <header className="finance-heading">
                    <div>
                        <span className="finance-eyebrow">FREELANCER FINANCES</span>
                        <h1>Financial insights</h1>
                        <p>Your private earnings and indicative tax overview.</p>
                    </div>
                    <button type="button" className="finance-refresh" onClick={refresh} disabled={loading}>
                        Refresh data
                    </button>
                </header>
                {loading && <div className="finance-panel" role="status">Loading your financial dashboard…</div>}
                {!loading && error && (
                    <div className="finance-panel finance-error" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={refresh}>Try again</button>
                    </div>
                )}
                {!loading && !error && income && (
                    <>
                        <div className="finance-tax-year-banner">
                            <span>South African tax year <strong>{income.taxYear - 1}/{String(income.taxYear).slice(2)}</strong></span>
                            <span>{income.taxPeriod.startDate} to {income.taxPeriod.endDate}</span>
                        </div>
                        <FinancialHighlights income={income} />
                        <div className="finance-content-grid">
                            <MonthlyIncomeChart months={income.monthlyIncome} />
                            <section className="finance-panel" aria-labelledby="recent-transaction-heading">
                                <div className="finance-panel-heading">
                                    <div>
                                        <h2 id="recent-transaction-heading">Recent transactions</h2>
                                        <p>Your latest five recorded earnings</p>
                                    </div>
                                </div>
                                {income.recentTransactions.length ? (
                                    <ul className="finance-transactions">
                                        {income.recentTransactions.map((item) => (
                                            <li key={item._id}>
                                                <span className="finance-transaction-title">
                                                    <strong>{item.gigTitle || "Gig"}</strong>
                                                    <small>{new Date(item.createdAt).toLocaleDateString("en-ZA")}</small>
                                                </span>
                                                <strong>{money(item.amount)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p>No completed transactions in this tax year.</p>}
                            </section>
                        </div>
                        <TaxExplanation income={income} />
                    </>
                )}
            </div>
        </main>
    );
}

export default Earnings;
