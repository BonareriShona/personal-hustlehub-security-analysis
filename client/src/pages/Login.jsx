import { useState } from "react";
import { loginUser } from "../services/authService";

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Login({ onLogin, onSwitchToRegister, notice }) {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
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

        if (!isValidEmail(formData.email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (formData.password.length === 0) {
            setError("Please enter your password.");
            return;
        }

        try {
            setIsSubmitting(true);

            const session = await loginUser({
                email: formData.email.trim(),
                password: formData.password
            });

            onLogin(session);
        } catch (requestError) {
            // The server gives the same message for an unknown email and a
            // wrong password, and this page shows it unchanged.
            setError(
                requestError.message ||
                "Login failed. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="gig-page">
            <section className="gig-form-container">
                <h1>Log In</h1>

                {notice && (
                    <div className="message success-message" role="status">
                        {notice}
                    </div>
                )}

                {error && (
                    <div className="message error-message" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
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
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <p>
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={onSwitchToRegister}>
                        Register
                    </button>
                </p>
            </section>
        </main>
    );
}

export default Login;
