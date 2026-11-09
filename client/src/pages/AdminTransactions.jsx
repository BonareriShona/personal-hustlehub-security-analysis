import { useEffect, useState } from "react";
import { getAllTransactions } from "../services/transactionService";

/*
 * Administrative overview of every transaction on the platform.
 *
 * The menu entry that leads here is only shown to Admins, but that is a
 * convenience rather than a control. The endpoint itself is restricted by
 * authorizeRoles("Admin") on the server, so a Client or Freelancer calling
 * it directly receives 403 regardless of what the interface shows.
 */
function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await getAllTransactions();

                if (active) {
                    setTransactions(data.transactions || []);
                }
            } catch (error) {
                if (active) {
                    setStatus(error.message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    function currency(value) {
        return `R ${Number(value || 0).toFixed(2)}`;
    }

    const total = transactions.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    if (loading) {
        return (
            <main className="gig-page">
                <section className="gig-form-container">
                    <p>Loading transactions...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>All Transactions</h1>

                {status && <p>{status}</p>}

                <p>
                    {transactions.length} transaction
                    {transactions.length === 1 ? "" : "s"} totalling{" "}
                    <strong>{currency(total)}</strong>
                </p>

                {transactions.length > 0 ? (
                    <ul>
                        {transactions.map((item) => (
                            <li key={item._id}>
                                {item.gigTitle || "Gig"} — {currency(item.amount)}{" "}
                                ({new Date(item.createdAt).toLocaleDateString()})
                                {item.reference ? ` · ${item.reference}` : ""}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No transactions have been recorded yet.</p>
                )}
            </section>
        </main>
    );
}

export default AdminTransactions;
