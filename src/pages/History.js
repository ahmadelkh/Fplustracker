import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // ✅ Firestore connection
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "./Analysis.css"; // Ensure styles are included

const History = () => {
  const [historyDates, setHistoryDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [analysisData, setAnalysisData] = useState(null);

  // 📌 Fetch available dates from Firestore
  useEffect(() => {
    const fetchHistoryDates = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "salesHistory"));
        const dates = querySnapshot.docs.map((doc) => doc.id); // Extract document IDs (dates)
        setHistoryDates(dates);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    
    fetchHistoryDates();
  }, []);

  // 📌 Handle Date Selection & Fetch Analysis Data
  const handleDateSelection = async (event) => {
    const selected = event.target.value;
    setSelectedDate(selected);

    if (selected) {
      try {
        const docRef = doc(db, "salesHistory", selected);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAnalysisData(docSnap.data().data); // ✅ Get stored analysis data
        } else {
          setAnalysisData(null);
        }
      } catch (error) {
        console.error("Error fetching analysis data:", error);
      }
    }
  };

  return (
    <div className="analysis-container">
      <h1>📅 View Past Analyses</h1>

      {/* 🔽 Dropdown to Select a Date */}
      <div className="history-container">
        <select className="history-dropdown" onChange={handleDateSelection}>
          <option value="">Select Date</option>
          {historyDates.length > 0 ? (
            historyDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))
          ) : (
            <option disabled>No History Available</option>
          )}
        </select>
      </div>

      {/* 📊 Show Analysis Results */}
      {analysisData ? (
        <div>
          <h2>📝 Analysis for {selectedDate}</h2>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Sold</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.map((item) => (
                <tr key={item.CODE}>
                  <td>{item.CODE}</td>
                  <td>{item.SOLD}</td>
                  <td>{item.available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        selectedDate && <p className="no-data-message">No data available for {selectedDate}.</p>
      )}
    </div>
  );
};

export default History;
