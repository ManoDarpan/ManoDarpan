import React, { useState } from 'react';
import './Admin.css'; // Component-specific styling
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Get API base URL

const Admin = () => {
    const [password, setPassword] = useState(''); // State for admin password input
    const [stats, setStats] = useState(null); // State for fetched statistics data
    const [error, setError] = useState(''); // State for error messages
    const [loading, setLoading] = useState(false); // State for loading indicator

    // Function to handle form submission (fetching stats)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form behavior
        setLoading(true); // Start loading
        setError('');
        setStats(null);

        try {
            // Send POST request with password to get stats
            const res = await fetch(`${API_URL}/api/admin/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) { // Check for HTTP errors (e.g., 401 Unauthorized)
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to fetch stats');
            }

            const data = await res.json();
            setStats(data); // Set fetched statistics
        } catch (err) {
            setError(err.message); // Display fetch error
        } finally {
            setLoading(false); // Stop loading regardless of success/failure
        }
    };

    // Function to download stats as PDF
    const downloadPDF = async () => {
        try {
            // Send POST request with password to get PDF data
            const res = await fetch(`${API_URL}/api/admin/stats/pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const blob = await res.blob(); // Get response as a Blob object
            const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
            const a = document.createElement("a"); // Create temporary anchor element
            a.href = url; // Set download link
            a.download = "admin-stats.pdf"; // Set file name
            a.click(); // Programmatically click to trigger download
            window.URL.revokeObjectURL(url); // Clean up the object URL
        } catch (err) {
            setError("Failed to download PDF"); // Display download error
        }
    };

    return (
        <div className="admin-container">
            <h1>Admin Dashboard</h1>
            {!stats ? ( // Show password form if stats haven't been fetched
                <div className="admin-login">
                    <form onSubmit={handleSubmit}> {/* Login form */}
                        <label htmlFor="password">Enter Admin Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} // Update password state
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Loading...' : 'View Stats'} {/* Loading indicator */}
                        </button>
                    </form>
                    {error && <p className="admin-error">{error}</p>} {/* Display errors */}
                </div>
            ) : ( // Show statistics and controls if stats are available
                <div className="admin-stats">
                    <h2>Platform Statistics</h2>
                    <div className="stats-grid"> {/* Grid layout for stats */}
                        <div className="stat-card"><h3>Users</h3><p>{stats.users}</p></div>
                        <div className="stat-card"><h3>Counsellors</h3><p>{stats.counsellors}</p></div>
                        <div className="stat-card"><h3>Total Journal Entries</h3><p>{stats.journalEntries}</p></div>
                        <div className="stat-card"><h3>Total Messages</h3><p>{stats.messages}</p></div>
                        <div className="stat-card"><h3>Total Requests</h3><p>{stats.requests}</p></div>
                        <div className="stat-card"> {/* Detailed conversation stats */}
                            <h3>Conversations</h3>
                            <p>Total: {stats.conversations.total}</p>
                            <p>Active: {stats.conversations.active}</p>
                            <p>Inactive: {stats.conversations.inactive}</p>
                        </div>
                    </div>

                    <button className="download-btn" onClick={downloadPDF}> {/* PDF download button */}
                        Download PDF
                    </button>

                    <button className="logout-btn" onClick={() => setStats(null)}>Logout</button> {/* Back to login view */}
                </div>
            )}
        </div>
    );
};

export default Admin;
