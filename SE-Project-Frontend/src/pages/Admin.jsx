import React, { useState } from 'react';
import './Admin.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Admin = () => {
    const [password, setPassword] = useState('');
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStats(null);

        try {
            const res = await fetch(`${API_URL}/api/admin/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to fetch stats');
            }

            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/stats/pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "admin-stats.pdf";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError("Failed to download PDF");
        }
    };

    return (
        <div className="admin-container">
            <h1>Admin Dashboard</h1>
            {!stats ? (
                <div className="admin-login">
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="password">Enter Admin Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Loading...' : 'View Stats'}
                        </button>
                    </form>
                    {error && <p className="admin-error">{error}</p>}
                </div>
            ) : (
                <div className="admin-stats">
                    <h2>Platform Statistics</h2>
                    <div className="stats-grid">
                        <div className="stat-card"><h3>Users</h3><p>{stats.users}</p></div>
                        <div className="stat-card"><h3>Counsellors</h3><p>{stats.counsellors}</p></div>
                        <div className="stat-card"><h3>Total Journal Entries</h3><p>{stats.journalEntries}</p></div>
                        <div className="stat-card"><h3>Total Messages</h3><p>{stats.messages}</p></div>
                        <div className="stat-card"><h3>Total Requests</h3><p>{stats.requests}</p></div>
                        <div className="stat-card">
                            <h3>Conversations</h3>
                            <p>Total: {stats.conversations.total}</p>
                            <p>Active: {stats.conversations.active}</p>
                            <p>Inactive: {stats.conversations.inactive}</p>
                        </div>
                    </div>

                    <button className="download-btn" onClick={downloadPDF}>
                        Download PDF
                    </button>

                    <button className="logout-btn" onClick={() => setStats(null)}>Logout</button>
                </div>
            )}
        </div>
    );
};

export default Admin;
