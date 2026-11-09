const API_URL = "https://localhost:4000/api/auth";

/*
 * Sends a JSON POST request to an authentication endpoint and turns
 * failures into errors that are safe to show in the interface.
 * error.details holds the individual validation messages from the server.
 */
async function postAuth(path, body) {
    let response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    } catch {
        throw new Error(
            "Could not reach the server. Please try again."
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an unexpected response.");
    }

    if (!response.ok) {
        const error = new Error(
            data.message || "The request could not be completed."
        );

        error.details = Array.isArray(data.errors)
            ? data.errors.map((item) => item.message)
            : [];

        throw error;
    }

    return data;
}

/*
 * Reads the payload of a JWT. This is only used to show the right menu
 * and to notice expiry. The server still verifies every token and enforces
 * every role, so changing anything in the browser grants no access.
 */
function decodeToken(token) {
    try {
        const payload = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeToken(token);

    if (!payload || typeof payload.exp !== "number") {
        return true;
    }

    return payload.exp * 1000 <= Date.now();
}

export function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
}

/*
 * Returns { token, user: { name, role } } for a valid, unexpired session,
 * or null. The role comes from the token, not from anything editable.
 */
export function getSession() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        return null;
    }

    if (isTokenExpired(token)) {
        logout();
        return null;
    }

    const payload = decodeToken(token);

    return {
        token,
        user: {
            name: sessionStorage.getItem("userName") || "User",
            role: payload.role
        }
    };
}

export async function registerUser({ name, email, password, role }) {
    return postAuth("/register", { name, email, password, role });
}

/*
 * Logs in, stores the token under the same "token" key the gig and
 * booking services already read, and returns the new session.
 */
export async function loginUser({ email, password }) {
    const data = await postAuth("/login", { email, password });

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("userName", data.user.name);

    return getSession();
}

