import React, { useEffect, useState } from "react";
import "./CounsellorProfile.css";
import { useNavigate } from "react-router-dom";
import { FaUserEdit, FaSave, FaTimes } from "react-icons/fa";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function CounsellorProfile() {
  const [counsellor, setCounsellor] = useState(null);
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const res = await fetch(`${API_URL}/api/counsellors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          navigate("/");
          return;
        }

        const data = await res.json();
        if (data.counsellor) {
          setCounsellor(data.counsellor);
          setExpertise(data.counsellor.areaOfExpertise || "");
          setExperience(
            data.counsellor.yearsOfExperience
              ? String(data.counsellor.yearsOfExperience)
              : ""
          );
        }
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(`${API_URL}/api/counsellors/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          areaOfExpertise: expertise,
          yearsOfExperience: Number(experience),
        }),
      });

      const data = await res.json();

      if (res.ok && data.counsellor) {
        setCounsellor(data.counsellor);
        setEditing(false);
        setMessage("Profile updated successfully!");
      } else {
        setMessage(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setExpertise(counsellor.areaOfExpertise || "");
    setExperience(
      counsellor.yearsOfExperience
        ? String(counsellor.yearsOfExperience)
        : ""
    );
    setMessage("");
  };

  if (!counsellor) return <div className="loading">Loading profile...</div>;

  return (
    <div className="counsellor-profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img src="/assets/male.svg" alt="avatar" className="profile-avatar" />
          <div className="profile-info">
            <h2>{counsellor.name || "Counsellor"}</h2>
            <p>{counsellor.email}</p>
          </div>
          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              <FaUserEdit /> Edit Profile
            </button>
          ) : (
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

        {message && <div className="profile-message">{message}</div>}

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
                  <input
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g. Anxiety, Depression"
                  />
                ) : (
                  <p>{expertise || "Not specified"}</p>
                )}
              </div>
              <div className="info-item">
                <label>Years of Experience</label>
                {editing ? (
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5"
                  />
                ) : (
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