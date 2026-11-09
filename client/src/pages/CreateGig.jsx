import { useState } from "react";
import { createGig } from "../services/gigService";

function CreateGig() {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        price: ""
    });

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

            await createGig({
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category.trim(),
                price: Number(formData.price)
            });

            setSuccess("Gig created successfully.");

            setFormData({
                title: "",
                description: "",
                category: "",
                price: ""
            });
        } catch (requestError) {
            setError(
                requestError.message ||
                "The gig could not be created."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>Create a Gig</h1>

                <p>
                    Create a service listing that clients can discover
                    and book through HustleHub+.
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
                        <label htmlFor="title">Gig title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            maxLength={1000}
                            rows={6}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <input
                            id="category"
                            name="category"
                            type="text"
                            value={formData.category}
                            onChange={handleChange}
                            maxLength={50}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="price">Price (R)</label>
                        <input
                            id="price"
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

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Gig"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default CreateGig;