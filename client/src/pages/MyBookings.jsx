import { useEffect, useState } from "react";
import { getMyBookings } from "../services/bookingService";

function formatDate(value) {
    return new Date(value).toLocaleString();
}

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadBookings() {
            try {
                const data = await getMyBookings();

                setBookings(data.bookings || []);
            } catch (requestError) {
                setError(
                    requestError.message ||
                    "Your bookings could not be loaded."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadBookings();
    }, []);

    if (isLoading) {
        return (
            <main className="gig-page">
                <section className="gig-form-container">
                    <h1>My Bookings</h1>
                    <p>Loading your bookings...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>My Bookings</h1>

                <p>The services you have booked and their transactions.</p>

                {error && (
                    <div className="message error-message" role="alert">
                        {error}
                    </div>
                )}

                {!error && bookings.length === 0 && (
                    <p>You have not booked any gigs yet.</p>
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
                                    <strong>Status:</strong>{" "}
                                    {booking.status}
                                </p>

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
                                        <strong>Notes:</strong>{" "}
                                        {booking.notes}
                                    </p>
                                )}

                                <p>
                                    <strong>Booked:</strong>{" "}
                                    {formatDate(booking.createdAt)}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default MyBookings;
