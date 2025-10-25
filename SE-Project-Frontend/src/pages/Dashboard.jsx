import './Dashboard.css'; // Import dashboard specific styles
import '../pages/EmotionStyles.css'; // Import general emotion styles
import '../pages/EmotionProfile.css'; // Import emotion profile styles
import { useEffect, useState } from 'react'; // React hooks
import { useNavigate } from 'react-router-dom'; // Hook for navigation
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label, // Unused import
  PieChart, Pie, Sector // Recharts components for data visualization
} from "recharts";
import JournalPopup from '../components/JournalPopup'; // Component for journal entry modal


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // API endpoint base URL

// Helper function to get mood emoji based on score
const getMoodEmoji = (mood) => {
  if (mood <= 2) return '😞';
  if (mood <= 4) return '😟';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '😊';
  return '😁';
};

// Map of emotion names to corresponding emojis
const emotionEmojis = {
  happiness: "😄",
  love: "❤️",
  neutral: "😐",
  anger: "😠",
  sadness: "😢",
  fear: "😨",
  disgust: "🤢",
  confusion: "😕",
  shame: "😳",
  surprise: "😲",
  desire: "🔥",
  guilt: "😔",
  sarcasm: "😏",
};

export default function Dashboard() {
  const navigate = useNavigate();
  // State for aggregated user journal data/stats
  const [userData, setUserData] = useState(null);
  // State for the currently logged-in user object
  const [user, setUser] = useState(null);
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false); // Toggle journal entry popup
  const [activeIndex, setActiveIndex] = useState(null); // State for active slice in PieChart
  // State for PieChart dimensions, adjusts on resize
  const [pieRadius, setPieRadius] = useState({ inner: 80, outer: 120 });


  // Effect to handle screen resize and adjust PieChart radii for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // increase radii on mobile for a larger pie
        setPieRadius({ inner: 56, outer: 120 });
      } else {
        setPieRadius({ inner: 80, outer: 120 });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call on mount

    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);


  // PieChart hover handlers
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Custom rendering function for the active (hovered/clicked) PieChart slice
  const renderActiveShape = (props) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      midAngle,
      percent,
      payload,
      fill,
    } = props;

    const name = payload?.name || '';
    const percentText = `${(percent * 100).toFixed(1)}%`;

    // position the label on the semicircle base (a bit below the pie center)
    const labelY = cy + Math.max(outerRadius * 0.2, 18);

    return (
      <g>
        {/* draw a slightly larger highlighted sector */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius="50%"
        />

        {/* pill style label centered on base using foreignObject for HTML styling */}
        <foreignObject x={cx - 140} y={cy} width={280} height={40} style={{ overflow: 'visible' }}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
              {`${name} — ${percentText}`}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  // Effect to check for stored user/token on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/'); // Redirect if not logged in
    }
  }, [navigate]);

  // Helper to determine the best display name for the user
  const getDisplayName = (u) => {
    if (!u) return '';
    if (u.name) return u.name;
    if (u.username) return u.username;
    // Extract name from email if available
    if (u.email) return (typeof u.email === 'string' && u.email.includes('@')) ? u.email.split('@')[0] : u.email;
  };

  // Main function to fetch all user journal and stats data
  const fetchUserStats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch journals from API
      const res = await fetch(`${API_URL}/api/users/journals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user journals');
      const data = await res.json();

      // Process journal entries
      const entries = (data.journalEntries || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

      const scores = entries.slice(-7).map(e => ({ date: e.date, mood: { score: (e.moodScore != null ? e.moodScore : 5) } })); // Last 7 days mood scores

      // Get emotions for the latest entry for Today's Emotions chart
      const latest = (data.journalEntries || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0]; // Latest entry
      let todayScore = {};
      if (latest && latest.emotions && typeof latest.emotions === 'object') {
        const entries = Object.entries(latest.emotions || {}).map(([k, v]) => ({ name: k, value: v }));
        const top5 = entries.sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 emotions
        todayScore = top5.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.value }), {});
      }

      // Map entries to simplified format for journal list
      const mappedEntries = entries.map(e => ({
        id: e._id || e.id,
        title: e.title,
        date: e.date,
        excerpt: e.content ? (e.content.length > 140 ? e.content.substring(0, 140) + '...' : e.content) : '',
        mood: { score: e.moodScore != null ? e.moodScore : 5 }
      }));

      // Check if today's entry is complete
      const todayIso = new Date().toISOString().split('T')[0];
      const hasTodayEntryWithSleep = entries.some(e => {
        const eDate = new Date(e.date).toISOString().split('T')[0];
        return eDate === todayIso && e.sleepQuality != null;
      });

      // Compile all data into userData state
      const newUserData = {
        streak: 0, // Placeholder for streak logic
        sleep: { hours: data.sleepAvg != null ? Number(data.sleepAvg) : null, quality: data.sleepAvg != null ? Number(data.sleepAvg) : null },
        scores,
        todayScore,
        journalEntries: mappedEntries,
        hasTodayEntryWithSleep
      };

      setUserData(newUserData);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Set empty state on error
      setUserData({ streak: 0, sleep: { hours: null }, scores: [], todayScore: {}, journalEntries: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch stats once user is loaded
  useEffect(() => {
    if (user) fetchUserStats();
  }, [user]);

  // Effect to listen for custom event to refetch data after journal update
  useEffect(() => {
    const onJournalUpdated = () => {
      if (user) fetchUserStats();
    };
    window.addEventListener('journal:updated', onJournalUpdated);
    return () => window.removeEventListener('journal:updated', onJournalUpdated);
  }, [user]);

  // Handler for submitting the journal entry form
  const handleJournalSubmit = (journalData) => {
    const submit = async () => {
      try {
        const token = localStorage.getItem('token');
        // API call to save new journal entry
        const res = await fetch(`${API_URL}/api/users/journal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(journalData)
        });
        if (!res.ok) throw new Error('Failed to save journal');
        const d = await res.json();
        console.log('Journal entry saved:', d);
        setShowPopup(false); // Close popup
        try { window.dispatchEvent(new Event('journal:updated')); } catch (e) { } // Dispatch custom event to trigger data refetch
      } catch (err) {
        console.error('Error saving journal entry:', err);
      }
    };
    submit();
  };

  // Helper to get BarChart color based on mood score (1-10)
  const getMoodColor = (mood) => {
    if (!mood) return '#f0f0f0';
    if (mood <= 2) return "#e74c3c"; // Red
    if (mood <= 4) return "#e67e22"; // Orange
    if (mood <= 6) return "#f1c40f"; // Yellow
    if (mood <= 8) return "#2ecc71"; // Light Green
    return "#27ae60"; // Dark Green
  };

  // Helper to get PieChart color based on emotion and score intensity
  const getEmotionColor = (emotion, score) => {
    const emotionColorMap = {
      surprise: '255, 165, 0',     // Orange
      happiness: '255, 215, 0',    // Gold
      love: '255, 105, 180',       // HotPink
      anger: '220, 20, 60',        // Crimson
      fear: '139, 0, 0',           // DarkRed
      confusion: '123, 104, 238',  // MediumSlateBlue
      neutral: '176, 196, 222',    // LightSteelBlue
      desire: '255, 140, 0',       // DarkOrange
      shame: '128, 0, 128',        // Purple
      disgust: '128, 128, 0',      // Olive
      sadness: '70, 130, 180',     // SteelBlue
      guilt: '119, 136, 153',      // LightSlateGray
      sarcasm: '100, 100, 100',    // Gray
      default: '200, 200, 200'
    };

    const baseColor = emotionColorMap[emotion] || emotionColorMap.default;
    const intensity = Math.min(score * 1.5, 1); // Adjust opacity based on score
    const color = `rgba(${baseColor}, ${intensity})`;
    return color;
  };

  // Helper to format emotion keys (e.g., "area_of_expertise" to "Area Of Expertise")
  const getEmotionLabel = (emotion) => {
    return emotion.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Custom tooltip for the BarChart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.mood !== null && data.mood !== undefined) {
        return (
          <div className="custom-tooltip">
            {/* Display day, emoji, and score */}
            <p>{`${label} : ${getMoodEmoji(data.mood)} ${data.mood}/10`}</p>
          </div>
        );
      }
    }
    return null;
  };

  // Function to generate the last 7 days data structure for the BarChart
  const processScoresForChart = (scores) => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i); // Go back i days
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }), // e.g., "Fri"
        date: d,
        mood: 0 // Default mood score
      });
    }

    if (!scores) return days;

    // Map scores to dates for quick lookup
    const scoresByDate = scores.reduce((acc, score) => {
      const scoreDate = new Date(score.date).toISOString().split('T')[0];
      acc[scoreDate] = score;
      return acc;
    }, {});

    // Merge daily scores into the 7-day structure
    return days.map(dayObj => {
      const scoreDate = dayObj.date.toISOString().split('T')[0];
      const scoreData = scoresByDate[scoreDate];
      return scoreData ? { ...dayObj, mood: scoreData.mood.score } : dayObj;
    });
  };

  // BarChart data source
  const chartData = processScoresForChart(userData?.scores);

  // PieChart data source: top emotions from the latest entry
  const pieChartData = userData?.todayScore ? Object.entries(userData.todayScore)
    .filter(([_emotion, score]) => score > 0.01) // Filter out negligible scores
    .map(([emotion, score]) => ({ name: getEmotionLabel(emotion), emotion: String(emotion), value: score }))
    : [];

  return (
    <main className="dashboard-main">
      {/* Render journal popup if showPopup is true */}
      {showPopup && <JournalPopup onClose={() => setShowPopup(false)} onSubmit={handleJournalSubmit} />}
      <div className="dashboard-grid">
        {/* Welcome Card */}
        <div className="welcome-card card">
          <div className="welcome-content">
            <h2>Hi {getDisplayName(user)},</h2>
            <p>Ready to continue your wellness journey?</p>
            <br />
            {/* Conditional rendering for today's check-in button */}
            {userData?.hasTodayEntryWithSleep ? (
              <div className="checkin-complete">
                <p>You already completed today's check-in. Great job! ✅</p>
                <small>We've recorded your sleep for today. You can view it below.</small>
              </div>
            ) : (
              <>
                <br />
                <button onClick={() => setShowPopup(true)}><b>Start Today's Check-in</b></button>
              </>
            )}
          </div>
        </div>
        {/* Progress Overview Card */}
        <div className="progress-card card">
          <h3>Progress Overview</h3>
          <br />
          <div className="progress-overview-content">
            {/* Conditional rendering for charts/no data message */}
            {(!userData || !userData.journalEntries || userData.journalEntries.length === 0) ? (
              <div className="no-data-message">
                <p>No journal entries yet — let's get started!</p>
                <p>Try completing today's check-in to track your mood and sleep. Your entries will appear here and inform your weekly progress.</p>
              </div>
            ) : (
              <div className="charts-container">
                {/* Weekly Mood Scores Bar Chart */}
                <div className="chart">
                  <h4>Weekly Scores</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ bottom: 20, top: 40 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="mood" type='natural' radius={[50, 50, 0, 0]} activeBar={{ radius: [50, 50, 0, 0], fillOpacity: 0.9 }}>
                        {/* Custom cell colors based on mood score */}
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Today's Emotions Pie Chart (Semicircle) */}
                <div className="chart">
                  <h4>Today's Emotions</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 40, right: 50, bottom: 40, left: 50 }}>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx={"50%"}
                        cy={"80%"} // Positioning for semicircle chart
                        isAnimationActive={false}
                        innerRadius={pieRadius.inner} // Dynamic radius
                        outerRadius={pieRadius.outer} // Dynamic radius
                        cornerRadius={8}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape} // Custom active shape renderer
                        startAngle={180} // Start at 180 degrees
                        endAngle={0} // End at 0 degrees (creates semicircle)
                        paddingAngle={5}
                        labelLine={true}
                        label={({ payload }) => {
                          // Display emoji label on each slice
                          const emoKey = (payload && payload.emotion) ? String(payload.emotion).toLowerCase() : (payload && payload.name ? payload.name.toLowerCase() : '');
                          return emotionEmojis[emoKey] || '';
                        }}
                        onMouseEnter={onPieEnter} // Hover handler
                        onMouseLeave={onPieLeave} // Leave handler
                        onClick={(_, index) => setActiveIndex(index)} // Click handler
                      >
                        {/* Custom cell colors based on emotion and score */}
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getEmotionColor(entry.name.toLowerCase(), entry.value)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {/* Average Sleep Score Section */}
            <div className="chart">
              <h4>Average Sleep Score</h4>
              <img src='../assets/sleep.svg' style={{width: 256}}></img> {/* Sleep icon */}

              {userData?.sleep?.hours != null ? (
                  <p className="sleep-hours" style={{fontFamily: "var(--font-calm)" , fontSize: "2.5rem" , fontWeight: 900 , color: "var(--primary-color)"}}>{userData.sleep.hours.toFixed(1)}</p>
                ) : (
                  <div className="sleep-empty">
                    <p className="sleep-placeholder">No sleep data yet</p>
                    <small>Complete today's check-in to record your sleep and get personalized insights.</small>
                  </div>
                )}

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
