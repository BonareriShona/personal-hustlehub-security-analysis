import { useEffect, useState } from "react";
import { deleteGig, getMyGigs } from "../services/gigService";
import EditGig from "./EditGig";

function MyGigs() {
    const [gigs, setGigs] = useState([]);
    const [selectedGig, setSelectedGig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadGigs() {
            try {
                setError("");

                const data = await getMyGigs();

                setGigs(data.gigs || []);
            } catch (requestError) {
                setError(
                    requestError.message ||
                    "Your gigs could not be loaded."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadGigs();
    }, []);

    function handleEdit(gig) {
        setError("");
        setSuccess("");
        setSelectedGig(gig);
    }

    function handleUpdated(updatedGig) {
        setGigs((currentGigs) =>
            currentGigs.map((gig) =>
                gig._id === updatedGig._id ? updatedGig : gig
            )
        );

        setSelectedGig(null);
        setSuccess("Gig updated successfully.");
    }

    async function handleDelete(gig) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${gig.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(gig._id);
            setError("");
            setSuccess("");

            await deleteGig(gig._id);

            setGigs((currentGigs) =>
                currentGigs.filter(
                    (currentGig) => currentGig._id !== gig._id
                )
            );

            setSuccess("Gig deleted successfully.");
        } catch (requestError) {
            setError(
                requestError.message ||
                "The gig could not be deleted."
            );
        } finally {
            setDeletingId(null);
        }
    }

    if (selectedGig) {
        return (
            <EditGig
                gig={selectedGig}
                onCancel={() => setSelectedGig(null)}
                onUpdated={handleUpdated}
            />
        );
    }

    if (isLoading) {
        return (
            <main className="gig-page">
                <section className="gig-form-container">
                    <h1>My Gigs</h1>
                    <p>Loading your gigs...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>My Gigs</h1>

                <p>
                    Manage the services you have listed on HustleHub+.
                </p>

                {error && (
                    <div className="message error-message" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="message success-message"
                        role="status"
                    >
                        {success}
                    </div>
                )}

                {!error && gigs.length === 0 && (
                    <p>You have not created any gigs yet.</p>
                )}

                {gigs.length > 0 && (
                    <div className="gig-list">
                        {gigs.map((gig) => (
                            <article
                                className="gig-card"
                                key={gig._id}
                            >
                                <h2>{gig.title}</h2>

                                <p>{gig.description}</p>

                                <p>
                                    <strong>Category:</strong>{" "}
                                    {gig.category}
                                </p>

                                <p>
                                    <strong>Price:</strong>{" "}
                                    R{Number(gig.price).toFixed(2)}
                                </p>

                                <div className="gig-actions">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEdit(gig)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDelete(gig)
                                        }
                                        disabled={
                                            deletingId === gig._id
                                        }
                                    >
                                        {deletingId === gig._id
                                            ? "Deleting..."
                                            : "Delete"}
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

export default MyGigs;