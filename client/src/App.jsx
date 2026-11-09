import { useEffect, useState } from "react";
import "./App.css";
import CreateGig from "./pages/CreateGig";
import MyGigs from "./pages/MyGigs";
import BrowseGigs from "./pages/BrowseGigs";
import MyBookings from "./pages/MyBookings";
import FreelancerBookings from "./pages/FreelancerBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Earnings from "./pages/Earnings";
import AdminTransactions from "./pages/AdminTransactions";
import {
    getSession,
    isTokenExpired,
    logout
} from "./services/authService";

/*
 * Role-based navigation. This only decides what each role SEES.
 * The API enforces what each role can DO, so these menus are a
 * convenience and not a security boundary.
 */
const MENUS = {
    Client: [
        { page: "browse", label: "Browse Gigs" },
        { page: "bookings", label: "My Bookings" }
    ],
    Freelancer: [
        { page: "create", label: "Create Gig" },
        { page: "gigs", label: "My Gigs" },
        { page: "income", label: "Bookings" },
        { page: "earnings", label: "Earnings" }
    ],
    Admin: [
        { page: "transactions", label: "All Transactions" }
    ]
};

const DEFAULT_PAGE = {
    Client: "browse",
    Freelancer: "create",
    Admin: "transactions"
};

function App() {
    const [session, setSession] = useState(() => getSession());
    const [authView, setAuthView] = useState("login");
    const [currentPage, setCurrentPage] = useState(() => {
        const existing = getSession();

        return existing ? DEFAULT_PAGE[existing.user.role] : "none";
    });
    const [notice, setNotice] = useState("");

    // Tokens expire (1 hour by default). Check regularly so the user is
    // returned to the login screen instead of seeing confusing API errors.
    useEffect(() => {
        if (!session) {
            return undefined;
        }

        const timer = setInterval(() => {
            if (isTokenExpired(session.token)) {
                logout();
                setSession(null);
                setAuthView("login");
                setNotice("Your session has expired. Please log in again.");
            }
        }, 30000);

        return () => clearInterval(timer);
    }, [session]);

    function handleLogin(newSession) {
        setNotice("");
        setSession(newSession);
        setCurrentPage(DEFAULT_PAGE[newSession.user.role]);
    }

    function handleLogout() {
        logout();
        setSession(null);
        setAuthView("login");
        setNotice("You have been logged out.");
    }

    if (!session) {
        return (
            <div className="app">
                <header className="app-header">
                    <div className="brand">
                        <h2>HustleHub+</h2>
                        <span>Freelance Marketplace</span>
                    </div>
                </header>

                {authView === "login" ? (
                    <Login
                        notice={notice}
                        onLogin={handleLogin}
                        onSwitchToRegister={() => {
                            setNotice("");
                            setAuthView("register");
                        }}
                    />
                ) : (
                    <Register
                        onRegistered={() => {
                            setNotice(
                                "Account created. You can now log in."
                            );
                            setAuthView("login");
                        }}
                        onSwitchToLogin={() => {
                            setNotice("");
                            setAuthView("login");
                        }}
                    />
                )}
            </div>
        );
    }

    const { role, name } = session.user;
    const menu = MENUS[role] || [];

    function renderPage() {
        // A page is only rendered if it belongs to this user's menu.
        const allowed = menu.some((item) => item.page === currentPage);

        if (!allowed) {
            return (
                <main className="gig-page">
                    <section className="gig-form-container">
                        <h1>Welcome, {name}</h1>
                        <p>
                            There is nothing to show for the {role} role in
                            this interface.
                        </p>
                    </section>
                </main>
            );
        }

        switch (currentPage) {
            case "browse":
                return <BrowseGigs />;
            case "bookings":
                return <MyBookings />;
            case "create":
                return <CreateGig />;
            case "gigs":
                return <MyGigs />;
            case "income":
                return <FreelancerBookings />;
            case "earnings":
                return <Earnings />;
            case "transactions":
                return <AdminTransactions />;
            default:
                return null;
        }
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="brand">
                    <h2>HustleHub+</h2>
                    <span>
                        {name} ({role})
                    </span>
                </div>

                <nav className="dashboard-nav">
                    {menu.map((item) => (
                        <button
                            key={item.page}
                            type="button"
                            onClick={() => setCurrentPage(item.page)}
                        >
                            {item.label}
                        </button>
                    ))}

                    <button type="button" onClick={handleLogout}>
                        Log Out
                    </button>
                </nav>
            </header>

            {renderPage()}
        </div>
    );
}

export default App;


