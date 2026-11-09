const API_URL = "https://localhost:4000/api";

/*
 * Returns the authentication headers required by
 * protected transaction endpoints.
 */
function getAuthHeaders() {
    const token = sessionStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

/*
 * Converts unsuccessful API responses into errors
 * that can be displayed safely by the React interface.
 */
async function handleResponse(response) {
    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an unexpected response.");
    }

    if (!response.ok) {
        throw new Error(data.message || "The request could not be completed.");
    }

    return data;
}

/*
 * Income summary for the authenticated freelancer. The backend scopes this
 * to the user in the verified JWT, so a freelancer can only ever retrieve
 * their own figures.
 */
export async function getIncomeSummary() {
    const response = await fetch(`${API_URL}/transactions/income`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

/*
 * Full transaction history for the authenticated freelancer.
 */
export async function getMyTransactions() {
    const response = await fetch(`${API_URL}/transactions/mine`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

/*
 * Every transaction in the system. Admin only; the backend rejects any
 * other role with 403, so this is not a security boundary on its own.
 */
export async function getAllTransactions() {
    const response = await fetch(`${API_URL}/transactions`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}
