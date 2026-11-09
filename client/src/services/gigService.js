const API_BASE_URL = "https://localhost:4000/api/gigs";

/*
 * Returns the authentication headers required by
 * protected Gig Management endpoints.
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
    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "The request could not be completed."
        );
    }

    return data;
}

/*
 * Retrieve all gigs.
 * This endpoint is available for browsing.
 */
export async function getGigs() {
    const response = await fetch(API_BASE_URL);

    return handleResponse(response);
}

/*
 * Retrieve gigs belonging to the authenticated freelancer.
 */
export async function getMyGigs() {
    const response = await fetch(`${API_BASE_URL}/mine`, {
        method: "GET",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

/*
 * Create a new gig.
 */
export async function createGig(gigData) {
    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(gigData)
    });

    return handleResponse(response);
}

/*
 * Update an existing gig.
 */
export async function updateGig(gigId, gigData) {
    const response = await fetch(`${API_BASE_URL}/${gigId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(gigData)
    });

    return handleResponse(response);
}

/*
 * Delete an existing gig.
 */
export async function deleteGig(gigId) {
    const response = await fetch(`${API_BASE_URL}/${gigId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response);
}

