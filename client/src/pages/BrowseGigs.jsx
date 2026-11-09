import { useEffect, useState } from "react";
import { getGigs } from "../services/gigService";
import { createBooking } from "../services/bookingService";

const MAX_NOTES_LENGTH = 500;

function BrowseGigs() {
    const [gigs, setGigs] = useState([]);
    const [selectedGig, setSelectedGig] = useState(null);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadGigs() {
            try {
                const data = await getGigs();

                setGigs(data.gigs || []);
            } catch (requestError) {
                setError(
                    requestError.message ||
                    "Gigs could not be loaded."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadGigs();
    }, []);

    function handleSelect(gig) {
        setError("");
        setSuccess("");
        setNotes("");
        setSelectedGig(gig);
    }

    async function handleBook(event) {
        event.preventDefault();

        if (notes.length > MAX_NOTES_LENGTH) {
            setError(
                `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`
            );
            return;
        }

        try {
            setIsBooking(true);
            setError("");
            setSuccess("");

            const data = await createBooking(selectedGig._id, notes);

            setSuccess(
                `"${selectedGig.title}" booked. Transaction ${data.transaction.reference} recorded.`
            );
            setSelectedGig(null);
            setNotes("");
        } catch (requestError) {
            setError(
                requestError.message ||
                "The booking could not be created."
            );
        } finally {
            setIsBooking(false);
        }
    }

    if (isLoading) {
        return (
            <main className="gig-page">
                <section className="gig-form-container">
                    <h1>Browse Gigs</h1>
                    <p>Loading gigs...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>Browse Gigs</h1>

                <p>Find a service and book it in a few clicks.</p>

                {error && (
                    <div className="message error-message" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="message success-message" role="status">
                        {success}
                    </div>
                )}

                {selectedGig && (
                    <form onSubmit={handleBook}>
                        <h2>Book: {selectedGig.title}</h2>

                        <p>
                            <strong>Price:</strong>{" "}
                            R{Number(selectedGig.price).toFixed(2)}
                        </p>

                        <p>
                            Payment is simulated. Confirming creates your
                            booking and records the transaction.
                        </p>

                        <div className="form-group">
                            <label htmlFor="notes">
                                Notes for the freelancer (optional)
                            </label>

                            <textarea
                                id="notes"
                                rows="4"
                                maxLength={MAX_NOTES_LENGTH}
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                            />
                        </div>

                        <div className="gig-actions">
                            <button type="submit" disabled={isBooking}>
                                {isBooking ? "Booking..." : "Confirm Booking"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedGig(null)}
                                disabled={isBooking}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!error && gigs.length === 0 && (
                    <p>No gigs are available right now.</p>
                )}

                {gigs.length > 0 && (
                    <div className="gig-list">
                        {gigs.map((gig) => (
                            <article className="gig-card" key={gig._id}>
                                <h2>{gig.title}</h2>

                                <p>{gig.description}</p>

                                <p>
                                    <strong>Category:</strong> {gig.category}
                                </p>

                                <p>
                                    <strong>Price:</strong>{" "}
                                    R{Number(gig.price).toFixed(2)}
                                </p>

                                <div className="gig-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(gig)}
                                    >
                                        Book
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default BrowseGigs;
