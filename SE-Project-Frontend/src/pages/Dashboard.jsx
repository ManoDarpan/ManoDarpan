import './Dashboard.css';
import '../pages/EmotionStyles.css';
import '../pages/EmotionProfile.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
  PieChart, Pie, Sector
} from "recharts";
import JournalPopup from '../components/JournalPopup';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getMoodEmoji = (mood) => {
  if (mood <= 2) return '😞';
  if (mood <= 4) return '😟';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '😊';
  return '😁';
};

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
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [pieRadius, setPieRadius] = useState({ inner: 80, outer: 120 });


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
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // render an active shape that also shows the emotion name and percentage on the semicircle base
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

        {/* pill style label centered on base */}
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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const getDisplayName = (u) => {
    if (!u) return '';
    if (u.name) return u.name;
    if (u.username) return u.username;
    if (u.email) return (typeof u.email === 'string' && u.email.includes('@')) ? u.email.split('@')[0] : u.email;
  };

  const fetchUserStats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/journals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user journals');
      const data = await res.json();

      const entries = (data.journalEntries || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));

      const scores = entries.slice(-7).map(e => ({ date: e.date, mood: { score: (e.moodScore != null ? e.moodScore : 5) } }));

      const latest = (data.journalEntries || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      let todayScore = {};
      if (latest && latest.emotions && typeof latest.emotions === 'object') {
        const entries = Object.entries(latest.emotions || {}).map(([k, v]) => ({ name: k, value: v }));
        const top5 = entries.sort((a, b) => b.value - a.value).slice(0, 5);
        todayScore = top5.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.value }), {});
      }

      const mappedEntries = entries.map(e => ({
        id: e._id || e.id,
        title: e.title,
        date: e.date,
        excerpt: e.content ? (e.content.length > 140 ? e.content.substring(0, 140) + '...' : e.content) : '',
        mood: { score: e.moodScore != null ? e.moodScore : 5 }
      }));

      const todayIso = new Date().toISOString().split('T')[0];
      const hasTodayEntryWithSleep = entries.some(e => {
        const eDate = new Date(e.date).toISOString().split('T')[0];
        return eDate === todayIso && e.sleepQuality != null;
      });

      const newUserData = {
        streak: 0,
        sleep: { hours: data.sleepAvg != null ? Number(data.sleepAvg) : null, quality: data.sleepAvg != null ? Number(data.sleepAvg) : null },
        scores,
        todayScore,
        journalEntries: mappedEntries,
        hasTodayEntryWithSleep
      };

      setUserData(newUserData);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setUserData({ streak: 0, sleep: { hours: null }, scores: [], todayScore: {}, journalEntries: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchUserStats();
  }, [user]);

  useEffect(() => {
    const onJournalUpdated = () => {
      if (user) fetchUserStats();
    };
    window.addEventListener('journal:updated', onJournalUpdated);
    return () => window.removeEventListener('journal:updated', onJournalUpdated);
  }, [user]);

  const handleJournalSubmit = (journalData) => {
    const submit = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/users/journal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(journalData)
        });
        if (!res.ok) throw new Error('Failed to save journal');
        const d = await res.json();
        console.log('Journal entry saved:', d);
        setShowPopup(false);
        try { window.dispatchEvent(new Event('journal:updated')); } catch (e) { }
      } catch (err) {
        console.error('Error saving journal entry:', err);
      }
    };
    submit();
  };

  const getMoodColor = (mood) => {
    if (!mood) return '#f0f0f0';
    if (mood <= 2) return "#e74c3c";
    if (mood <= 4) return "#e67e22";
    if (mood <= 6) return "#f1c40f";
    if (mood <= 8) return "#2ecc71";
    return "#27ae60";
  };

  const getEmotionColor = (emotion, score) => {
    const emotionColorMap = {
      surprise: '255, 165, 0',     // Orange
      happiness: '255, 215, 0',    // Gold
      love: '255, 105, 180',       // HotPink
      anger: '220, 20, 60',        // Crimson
      fear: '139, 0, 0',           // DarkRed
      confusion: '123, 104, 238',  // MediumSlateBlue
      neutral: '176, 196, 222',    // LightSteelBlue
      desire: '255, 140, 0',       // DarkOrange
      shame: '128, 0, 128',        // Purple
      disgust: '128, 128, 0',      // Olive
      sadness: '70, 130, 180',     // SteelBlue
      guilt: '119, 136, 153',      // LightSlateGray
      sarcasm: '100, 100, 100',    // Gray
      default: '200, 200, 200'
    };

    const baseColor = emotionColorMap[emotion] || emotionColorMap.default;
    const intensity = Math.min(score * 1.5, 1);
    const color = `rgba(${baseColor}, ${intensity})`;
    return color;
  };

  const getEmotionLabel = (emotion) => {
    return emotion.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.mood !== null && data.mood !== undefined) {
        return (
          <div className="custom-tooltip">
            <p>{`${label} : ${getMoodEmoji(data.mood)} ${data.mood}/10`}</p>
          </div>
        );
      }
    }
    return null;
  };

  const processScoresForChart = (scores) => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d,
        mood: 0
      });
    }

    if (!scores) return days;

    const scoresByDate = scores.reduce((acc, score) => {
      const scoreDate = new Date(score.date).toISOString().split('T')[0];
      acc[scoreDate] = score;
      return acc;
    }, {});

    return days.map(dayObj => {
      const scoreDate = dayObj.date.toISOString().split('T')[0];
      const scoreData = scoresByDate[scoreDate];
      return scoreData ? { ...dayObj, mood: scoreData.mood.score } : dayObj;
    });
  };

  const chartData = processScoresForChart(userData?.scores);

  const pieChartData = userData?.todayScore ? Object.entries(userData.todayScore)
    .filter(([_emotion, score]) => score > 0.01)
    .map(([emotion, score]) => ({ name: getEmotionLabel(emotion), emotion: String(emotion), value: score }))
    : [];

  return (
    <main className="dashboard-main">
      {showPopup && <JournalPopup onClose={() => setShowPopup(false)} onSubmit={handleJournalSubmit} />}
      <div className="dashboard-grid">
        <div className="welcome-card card">
          <div className="welcome-content">
            <h2>Hi {getDisplayName(user)},</h2>
            <p>Ready to continue your wellness journey?</p>
            <br />
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
        <div className="progress-card card">
          <h3>Progress Overview</h3>
          <br />
          <div className="progress-overview-content">
            {(!userData || !userData.journalEntries || userData.journalEntries.length === 0) ? (
              <div className="no-data-message">
                <p>No journal entries yet — let's get started!</p>
                <p>Try completing today's check-in to track your mood and sleep. Your entries will appear here and inform your weekly progress.</p>
              </div>
            ) : (
              <div className="charts-container">
                <div className="chart">
                  <h4>Weekly Scores</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ bottom: 20, top: 40 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="mood" type='natural' radius={[50, 50, 0, 0]} activeBar={{ radius: [50, 50, 0, 0], fillOpacity: 0.9 }}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart">
                  <h4>Today's Emotions</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 40, right: 50, bottom: 40, left: 50 }}>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx={"50%"}
                        cy={"80%"}
                        isAnimationActive={false}
                        innerRadius={pieRadius.inner}
                        outerRadius={pieRadius.outer}
                        cornerRadius={8}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        startAngle={180}
                        endAngle={0}
                        paddingAngle={5}
                        labelLine={true}
                        label={({ payload }) => {
                          const emoKey = (payload && payload.emotion) ? String(payload.emotion).toLowerCase() : (payload && payload.name ? payload.name.toLowerCase() : '');
                          return emotionEmojis[emoKey] || '';
                        }}
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        onClick={(_, index) => setActiveIndex(index)}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getEmotionColor(entry.name.toLowerCase(), entry.value)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="chart">
              <h4>Average Sleep Score</h4>
              <img src='../assets/sleep.svg' style={{width: 256}}></img>

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
