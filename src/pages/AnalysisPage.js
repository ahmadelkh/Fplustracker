import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebaseConfig";
import { collection, doc, setDoc, getDocs, getDoc } from "firebase/firestore";
import SalesAnalysis from "../components/SalesAnalysis";
import "../styles/Analysis.css";

const Analysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDate, setUploadDate] = useState("");
  const [historyDates, setHistoryDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [startDate, setStartDate] = useState(""); // 🔹 Start date for range filter
  const [endDate, setEndDate] = useState(""); // 🔹 End date for range filter

  useEffect(() => {
    const fetchHistoryDates = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "salesHistory"));
        setHistoryDates(querySnapshot.docs.map((doc) => doc.id));
      } catch (error) {
        console.error("🔥 Error fetching history:", error);
      }
    };
    fetchHistoryDates();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = (e) => {
        const binaryData = e.target.result;
        const workbook = XLSX.read(binaryData, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (uploadDate) {
          saveToFirestore(sheetData, uploadDate);
        } else {
          alert("⚠️ Please enter a date before uploading the file.");
        }
      };
    }
  };

  const saveToFirestore = async (sheetData, date) => {
    try {
      await setDoc(doc(db, "salesHistory", date), { data: sheetData });
      setHistoryDates((prev) => [...prev, date]);
      alert("✅ Data successfully uploaded!");
    } catch (error) {
      console.error("🔥 Error saving data:", error);
    }
  };

  const handleDateSelection = async (event) => {
    const selected = event.target.value;
    setSelectedDate(selected);

    if (selected) {
      try {
        const docRef = doc(db, "salesHistory", selected);
        const docSnap = await getDoc(docRef);
        setAnalysisData(docSnap.exists() ? docSnap.data().data : null);
      } catch (error) {
        console.error("🔥 Error fetching analysis data:", error);
      }
    }
  };

  // 📌 Fetch & Sum Data from ALL Dates
  const fetchAllSalesData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "salesHistory"));
      let allData = [];
      let latestAvailable = {}; // Stores the latest available stock per CODE
      let firstAvailable = {}; // Stores the first available stock per CODE
      let salesDays = {}; // Tracks how many days each item was sold
  
      querySnapshot.forEach((doc) => {
        const docDate = doc.id;
        const sales = doc.data().data.map(item => ({
          ...item,
          date: docDate, // Attach date to each sale
        }));
        allData = [...allData, ...sales];
      });
  
      // 🔹 Sort data chronologically (earliest to latest)
      allData.sort((a, b) => a.date.localeCompare(b.date));
  
      // 🔹 Count how many different days each item was sold
      allData.forEach(item => {
        if (!salesDays[item.CODE]) salesDays[item.CODE] = new Set();
        salesDays[item.CODE].add(item.date);
      });
  
      // 🔹 Identify single-day and multi-day sales
      let soldOnMultipleDays = new Set();
      Object.keys(salesDays).forEach(code => {
        if (salesDays[code].size > 1) soldOnMultipleDays.add(code);
      });
  
      // 🔹 Process each item to determine the correct available stock
      allData.forEach(item => {
        const code = item.CODE;
  
        // 🔹 Keep track of the first available stock seen
        if (!(code in firstAvailable)) firstAvailable[code] = item.available;
  
        // 🔹 Update the latest available stock for multi-day items
        latestAvailable[code] = item.available;
      });
  
      // 🔹 Attach the correct available stock per item
      const mergedData = allData.map(item => ({
        ...item,
        available: soldOnMultipleDays.has(item.CODE) 
          ? latestAvailable[item.CODE]  // 🔹 Use last day's available stock
          : firstAvailable[item.CODE],  // 🔹 Use single day's stock
      }));
  
      setAnalysisData(mergedData);
    } catch (error) {
      console.error("🔥 Error fetching all sales data:", error);
    }
  };
  
  
  

  // 📌 Fetch Data Between Two Dates
  const fetchSalesByDateRange = async () => {
    if (!startDate || !endDate) {
      alert("⚠️ Please select both start and end dates.");
      return;
    }
  
    try {
      const querySnapshot = await getDocs(collection(db, "salesHistory"));
      let filteredData = [];
      let latestAvailable = {};
      let firstAvailable = {};
      let salesDays = {};
  
      querySnapshot.forEach((doc) => {
        const docDate = doc.id;
        if (docDate >= startDate && docDate <= endDate) {
          const sales = doc.data().data.map(item => ({
            ...item,
            date: docDate,
          }));
          filteredData = [...filteredData, ...sales];
        }
      });
  
      // 🔹 Sort by date (earliest to latest)
      filteredData.sort((a, b) => a.date.localeCompare(b.date));
  
      // 🔹 Count how many different days each item was sold
      filteredData.forEach(item => {
        if (!salesDays[item.CODE]) salesDays[item.CODE] = new Set();
        salesDays[item.CODE].add(item.date);
      });
  
      // 🔹 Identify items sold on multiple days
      let soldOnMultipleDays = new Set();
      Object.keys(salesDays).forEach(code => {
        if (salesDays[code].size > 1) soldOnMultipleDays.add(code);
      });
  
      // 🔹 Process each item
      filteredData.forEach(item => {
        const code = item.CODE;
  
        // 🔹 Keep the first recorded available stock
        if (!(code in firstAvailable)) firstAvailable[code] = item.available;
  
        // 🔹 Update the latest available stock for multi-day items
        latestAvailable[code] = item.available;
      });
  
      // 🔹 Attach the correct available stock per item
      const mergedData = filteredData.map(item => ({
        ...item,
        available: soldOnMultipleDays.has(item.CODE) 
          ? latestAvailable[item.CODE]  // 🔹 Use last day's available stock
          : firstAvailable[item.CODE],  // 🔹 Use single day's stock
      }));
  
      setAnalysisData(mergedData);
    } catch (error) {
      console.error("🔥 Error fetching data by date range:", error);
    }
  };
  
  
  
  

  return (
    <div className="analysis-container">
      <h1>📊 Sales Analysis</h1>

      {/* 📂 File Upload with Date Input */}
      <div className="upload-container">
        <label className="upload-btn">
          Upload Excel File
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </label>

        <input
          type="date"
          className="date-input"
          value={uploadDate}
          onChange={(e) => setUploadDate(e.target.value)}
        />

        {selectedFile && <p className="file-name">📂 File Uploaded: {selectedFile.name}</p>}
      </div>

      {/* 📅 Select Date from History */}
      <div className="history-container">
        <h3>📅 View Past Analysis</h3>
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

      {/* 🔹 ALL Sales Data Button */}
      <button className="all-sales-btn" onClick={fetchAllSalesData}>📊 View ALL Sales Data</button>

      {/* 🔹 Date Range Filter */}
      <div className="date-range-filter">
        <h3>📅 Filter by Date Range</h3>
        <input
          type="date"
          className="date-input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="date-input"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="filter-btn" onClick={fetchSalesByDateRange}>🔍 Filter Sales</button>
      </div>

      {/* ✅ Show Analysis Results */}
      {analysisData ? (
        <SalesAnalysis salesData={analysisData} />
      ) : selectedDate ? (
        <p className="no-data">❌ No data available for {selectedDate}</p>
      ) : (
        <p className="no-data">📌 Select a date or use filters to view analysis.</p>
      )}
    </div>
  );
};

export default Analysis;
