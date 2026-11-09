const API_URL = "https://localhost:4000/api";

/*
 * Returns the authentication headers required by
 * protected booking and transaction endpoints.
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
        // Includes the rate limiter's message when a 429 is returned.
        throw new Error(
            data.message || "The request could not be completed."
        );
    }

    return data;
}

/*
 * Client books a gig. The server confirms it (simulated payment)
 * and records the transaction in the same request.
 */
export async function createBooking(gigId, notes) {
    const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ gigId, notes })
    });

    return handleResponse(response);
}

/*
 * Bookings made by the authenticated client.
 */
export async function getMyBookings() {
    const response = await fetch(`${API_URL}/bookings/mine`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

/*
 * Bookings placed on the authenticated freelancer's gigs.
 */
export async function getReceivedBookings() {
    const response = await fetch(`${API_URL}/bookings/received`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

/*
 * Freelancer income summary built from transaction records.
 */
export async function getIncomeSummary() {
    const response = await fetch(`${API_URL}/transactions/income`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

