import { useState } from "react";
import { updateGig } from "../services/gigService";

function EditGigForm({ gig, onCancel, onUpdated }) {
    const [formData, setFormData] = useState(() => ({
        title: gig.title || "",
        description: gig.description || "",
        category: gig.category || "",
        price: gig.price ?? ""
    }));

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);


    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    }

    function validateForm() {
        if (formData.title.trim().length < 3) {
            return "Title must be at least 3 characters.";
        }

        if (formData.description.trim().length < 10) {
            return "Description must be at least 10 characters.";
        }

        if (formData.category.trim().length < 2) {
            return "Please enter a valid category.";
        }

        const price = Number(formData.price);

        if (!Number.isFinite(price) || price <= 0) {
            return "Price must be greater than zero.";
        }

        return "";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setIsSubmitting(true);

            const result = await updateGig(gig._id, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category.trim(),
                price: Number(formData.price)
            });

            setSuccess("Gig updated successfully.");

            if (onUpdated) {
                onUpdated(result.gig);
            }
        } catch (requestError) {
            setError(
                requestError.message ||
                "The gig could not be updated."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!gig) {
        return null;
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>Edit Gig</h1>

                <p>
                    Update the details of your service listing.
                </p>

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

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="edit-title">Gig title</label>
                        <input
                            id="edit-title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-description">
                            Description
                        </label>

                        <textarea
                            id="edit-description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            maxLength={1000}
                            rows={6}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-category">Category</label>
                        <input
                            id="edit-category"
                            name="category"
                            type="text"
                            value={formData.category}
                            onChange={handleChange}
                            maxLength={50}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-price">Price (R)</label>
                        <input
                            id="edit-price"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            min="0.01"
                            max="1000000"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

function EditGig({ gig, onCancel, onUpdated }) {
    if (!gig) {
        return null;
    }

    const formKey = JSON.stringify([
        gig._id,
        gig.title,
        gig.description,
        gig.category,
        gig.price
    ]);

    return (
        <EditGigForm
            key={formKey}
            gig={gig}
            onCancel={onCancel}
            onUpdated={onUpdated}
        />
    );
}

export default EditGig;