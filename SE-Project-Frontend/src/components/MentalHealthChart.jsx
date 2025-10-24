import { useEffect, useState } from "react";
import {

  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Cell,
  Label,
  RadarChart
} from "recharts";
import './MentalHealthChart.css'


export default function MentalHealthChart() {
  const [data, setData] = useState([]);

  // Fetch JSON data from server
  useEffect(() => {
    fetch("./mental_health_db.json") // replace with your API endpoint
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  // Function to decide color based on mood score
  const getMoodColor = (mood) => {
    if (mood <= 3) return "#e74c3c"; // red
    if (mood <= 6) return "#f39c12"; // orange/yellow
    return "#27ae60"; // green
  };



  const getMoodEmoji = (mood) => {
    if (mood <= 2) return "😢";
    if (mood <= 4) return "😟";
    if (mood <= 6) return "😐";
    if (mood <= 8) return "😊";
    return "😄";
  };

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
          <p style={{ fontSize: "1.5rem" }}>{getMoodEmoji(mood)}</p>
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
        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data} margin={{ bottom: 40, top: 40 }} >
            {/* <CartesianGrid strokeDasharray="3 3" /> */}


            {/* Add interval={0} to tick if you don't want values to hide on resize */}
            <XAxis dataKey="day" tick={{ angle: 0, textAnchor: "end" }} >

              <Label value='Day' offset={-15} position="insideBottom" />
            </XAxis>


            <YAxis
              domain={[0, 10]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            // interval={0}
            >
              <Label value='Score' offset={10} position='insideLeft' angle={-90} />

            </YAxis>


            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.06)", radius: 10 }} />



            <Bar dataKey="mood" type='natural' radius={[50, 50, 0, 0]} activeBar={{ radius: [50, 50, 0, 0], fillOpacity: 0.9 }} >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} />
              ))}
            </Bar>

          </BarChart>


          <RadarChart data={data} margin={{ bottom: 40, top: 40 }}>
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
