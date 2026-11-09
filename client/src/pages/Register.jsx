import { useState } from "react";
import { registerUser } from "../services/authService";

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/*
 * Mirrors the server's registration rules so most mistakes are caught
 * immediately. The server still validates everything again.
 */
function validateForm(formData) {
    const name = formData.name.trim();

    if (name.length < 2 || name.length > 50) {
        return "Name must be between 2 and 50 characters.";
    }

    if (!isValidEmail(formData.email.trim())) {
        return "Please enter a valid email address.";
    }

    const { password } = formData;

    if (password.length < 8 || password.length > 72) {
        return "Password must be between 8 and 72 characters.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }

    if (password !== formData.confirmPassword) {
        return "Passwords do not match.";
    }

    if (!["Client", "Freelancer"].includes(formData.role)) {
        return "Please choose Client or Freelancer.";
    }

    return "";
}

function Register({ onRegistered, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Client"
    });

    const [error, setError] = useState("");
    const [details, setDetails] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setDetails([]);

        const validationMessage = validateForm(formData);

        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        try {
            setIsSubmitting(true);

            await registerUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role
            });

            onRegistered();
        } catch (requestError) {
            setError(
                requestError.message ||
                "Registration failed. Please try again."
            );
            setDetails(requestError.details || []);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>Register</h1>

                {error && (
                    <div className="message error-message" role="alert">
                        {error}

                        {details.length > 0 && (
                            <ul>
                                {details.map((detail) => (
                                    <li key={detail}>{detail}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            maxLength={50}
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            maxLength={72}
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <small>
                            8 to 72 characters with an uppercase letter,
                            a lowercase letter and a number.
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm password
                        </label>

                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            maxLength={72}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">I am a</label>

                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="Client">
                                Client (I want to book gigs)
                            </option>
                            <option value="Freelancer">
                                Freelancer (I want to offer gigs)
                            </option>
                        </select>
                    </div>

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Register"}
                    </button>
                </form>

                <p>
                    Already have an account?{" "}
                    <button type="button" onClick={onSwitchToLogin}>
                        Log In
                    </button>
                </p>
            </section>
        </main>
    );
}

export default Register;
