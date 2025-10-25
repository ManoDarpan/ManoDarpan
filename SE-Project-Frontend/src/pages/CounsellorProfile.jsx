import React, { useEffect, useState } from "react";
import "./CounsellorProfile.css"; // Import styles
import { useNavigate } from "react-router-dom"; // Hook for navigation
import { FaUserEdit, FaSave, FaTimes } from "react-icons/fa"; // Icon imports
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function CounsellorProfile() {
  // State for profile data
  const [counsellor, setCounsellor] = useState(null);
  // Editable fields state, initialized to empty strings
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");
  // UI state
  const [message, setMessage] = useState(""); // Feedback message (success/error)
  const [editing, setEditing] = useState(false); // Toggle edit mode
  const [loading, setLoading] = useState(false); // Loading state for save operation
  const navigate = useNavigate(); // Hook to redirect user

  // Effect to fetch counsellor profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        // Redirect if no token is found
        if (!token) {
          navigate("/");
          return;
        }

        // API call to fetch profile data
        const res = await fetch(`${API_URL}/api/counsellors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Redirect on failed fetch
        if (!res.ok) {
          navigate("/");
          return;
        }

        const data = await res.json();
        if (data.counsellor) {
          setCounsellor(data.counsellor);
          // Initialize editable state fields with current profile data
          setExpertise(data.counsellor.areaOfExpertise || "");
          setExperience(
            data.counsellor.yearsOfExperience
              ? String(data.counsellor.yearsOfExperience) // Convert number to string for input field
              : ""
          );
        }
      } catch (err) {
        console.error(err);
        navigate("/"); // Catchall redirect on error
      }
    };

    fetchProfile();
  }, [navigate]); // Dependency array includes navigate

  // Function to save profile changes
  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      // API call to update profile data
      const res = await fetch(`${API_URL}/api/counsellors/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          areaOfExpertise: expertise,
          yearsOfExperience: Number(experience), // Ensure experience is sent as a number
        }),
      });

      const data = await res.json();

      if (res.ok && data.counsellor) {
        setCounsellor(data.counsellor); // Update profile with saved data
        setEditing(false); // Exit edit mode
        setMessage("Profile updated successfully!"); // Success feedback
      } else {
        setMessage(data.message || "Failed to update profile"); // Error feedback
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Function to cancel editing and revert changes
  const handleCancel = () => {
    setEditing(false);
    // Revert editable state fields to the current counsellor object values
    setExpertise(counsellor.areaOfExpertise || "");
    setExperience(
      counsellor.yearsOfExperience
        ? String(counsellor.yearsOfExperience)
        : ""
    );
    setMessage(""); // Clear feedback message
  };

  // Show loading state while profile data is being fetched
  if (!counsellor) return <div className="loading">Loading profile...</div>;

  return (
    <div className="counsellor-profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img src={(counsellor.profilePic) || '/assets/male.svg'} alt="avatar" className="profile-avatar" />
          <div className="profile-info">
            <h2>{counsellor.name || "Counsellor"}</h2>
            <p>{counsellor.email}</p>
          </div>
          {!editing ? (
            // Edit button visible when not editing
            <button className="edit-btn" onClick={() => setEditing(true)}>
              <FaUserEdit /> Edit Profile
            </button>
          ) : (
            // Save and Cancel buttons visible when editing
            <div className="editing-controls">
              <button className="save-btn" onClick={handleSave} disabled={loading}>
                <FaSave /> {loading ? "Saving..." : "Save"}
              </button>
              <button className="cancel-btn" onClick={handleCancel} disabled={loading}>
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </div>

        {message && <div className="profile-message">{message}</div>} {/* Display feedback message */}

        <div className="profile-body">
          <div className="profile-section">
            <h3>About Me</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>{counsellor.name}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{counsellor.email}</p>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Professional Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Area of Expertise</label>
                {editing ? (
                  // Editable input field
                  <input
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g. Anxiety, Depression"
                  />
                ) : (
                  // Read-only display
                  <p>{expertise || "Not specified"}</p>
                )}
              </div>
              <div className="info-item">
                <label>Years of Experience</label>
                {editing ? (
                  // Editable input field (type number)
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5"
                  />
                ) : (
                  // Read-only display
                  <p>{experience || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
