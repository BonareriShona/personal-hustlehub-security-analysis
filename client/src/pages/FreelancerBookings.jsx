import { useEffect, useState } from "react";
import {
    getIncomeSummary,
    getReceivedBookings
} from "../services/bookingService";

function FreelancerBookings() {
    const [bookings, setBookings] = useState([]);
    const [income, setIncome] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [bookingData, incomeData] = await Promise.all([
                    getReceivedBookings(),
                    getIncomeSummary()
                ]);

                setBookings(bookingData.bookings || []);
                setIncome(incomeData.income);
            } catch (requestError) {
                setError(
                    requestError.message ||
                    "Your bookings could not be loaded."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    if (isLoading) {
        return (
            <main className="gig-page">
                <section className="gig-form-container">
                    <h1>Bookings &amp; Income</h1>
                    <p>Loading...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>Bookings &amp; Income</h1>

                <p>Bookings on your gigs and what you have earned.</p>

                {error && (
                    <div className="message error-message" role="alert">
                        {error}
                    </div>
                )}

                {income && (
                    <article className="gig-card">
                        <h2>Total income</h2>

                        <p>
                            <strong>
                                R{Number(income.totalIncome).toFixed(2)}
                            </strong>{" "}
                            from {income.transactionCount} booking
                            {income.transactionCount === 1 ? "" : "s"}
                        </p>
                    </article>
                )}

                {!error && bookings.length === 0 && (
                    <p>No one has booked your gigs yet.</p>
                )}

                {bookings.length > 0 && (
                    <div className="gig-list">
                        {bookings.map((booking) => (
                            <article
                                className="gig-card"
                                key={booking._id}
                            >
                                <h2>{booking.gigTitle}</h2>

                                <p>
                                    <strong>Amount:</strong>{" "}
                                    R{Number(booking.price).toFixed(2)}
                                </p>

                                <p>
                                    <strong>Transaction:</strong>{" "}
                                    {booking.transactionReference}
                                </p>

                                {booking.notes && (
                                    <p>
                                        <strong>Client notes:</strong>{" "}
                                        {booking.notes}
                                    </p>
                                )}

                                <p>
                                    <strong>Booked:</strong>{" "}
                                    {new Date(
                                        booking.createdAt
                                    ).toLocaleString()}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default FreelancerBookings;
