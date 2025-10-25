import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip, // Tooltip for displaying data on hover
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer, // Makes chart adapt to container size
  Cell, // Used to customize individual bar colors
  Label,
  RadarChart // Component for the radar chart
} from "recharts";
import './MentalHealthChart.css'


export default function MentalHealthChart() {
  const [data, setData] = useState([]); // State to hold chart data

  // Fetch JSON data from server
  useEffect(() => {
    fetch("./mental_health_db.json") // API endpoint for data
      .then((res) => res.json())
      .then((json) => setData(json)) // Set fetched data
      .catch((err) => console.error("Error fetching data:", err));
  }, []); // Runs once on mount

  // Function to decide color based on mood score
  const getMoodColor = (mood) => {
    if (mood <= 3) return "#e74c3c"; // Red for low score
    if (mood <= 6) return "#f39c12"; // Orange/Yellow for medium score
    return "#27ae60"; // Green for high score
  };


  // Function to show appropriate emoji
  const getMoodEmoji = (mood) => {
    if (mood <= 2) return "😢";
    if (mood <= 4) return "😟";
    if (mood <= 6) return "😐";
    if (mood <= 8) return "😊";
    return "😄";
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const mood = payload[0].value;
      return (
        <div
          style={{
            background: "white",
            border: "1px solid #ccc",
            padding: "5px 10px",
            borderRadius: "16px",
          }}
        >
          <p><strong>{label}</strong></p>
          <p style={{ fontSize: "1.5rem" }}>{getMoodEmoji(mood)}</p> {/* Show emoji in tooltip */}
        </div>
      );
    }
    return null;
  };


  return (
    <div
      className="tracker-chart regular_text"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <div style={{ flex: 1, height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%"> {/* Ensures chart responsiveness */}

          <BarChart data={data} margin={{ bottom: 40, top: 40 }} > {/* Main bar chart component */}
            {/* <CartesianGrid strokeDasharray="3 3" /> */}


            {/* Add interval={0} to tick if you don't want values to hide on resize */}
            <XAxis dataKey="day" tick={{ angle: 0, textAnchor: "end" }} > {/* X-axis for days */}

              <Label value='Day' offset={-15} position="insideBottom" /> {/* Label for X-axis */}
            </XAxis>


            <YAxis
              domain={[0, 10]} // Fixed Y-axis scale 0 to 10
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            // interval={0}
            >
              <Label value='Score' offset={10} position='insideLeft' angle={-90} /> {/* Label for Y-axis */}

            </YAxis>


            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.06)", radius: 10 }} /> {/* Use custom tooltip */}



            <Bar dataKey="mood" type='natural' radius={[50, 50, 0, 0]} activeBar={{ radius: [50, 50, 0, 0], fillOpacity: 0.9 }} > {/* Mood data bars */}
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} /> // Color each bar dynamically
              ))}
            </Bar>

          </BarChart>


          <RadarChart data={data} margin={{ bottom: 40, top: 40 }}> {/* Placeholder/Example Radar Chart (likely uses different data structure) */}
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 150]} />
            <Radar name="Today's Score" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Legend />
          </RadarChart>

        </ResponsiveContainer>
      </div>
    </div>
  );
}
