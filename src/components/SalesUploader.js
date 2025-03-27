import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../firebaseConfig"; // Firestore config
import { collection, doc, setDoc } from "firebase/firestore";
import "../styles/Analysis.css";

const SalesUploader = ({ setSalesData }) => {
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (e) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });
      const sheetName = workbook.SheetNames[0]; // Get first sheet
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // ✅ Filter Important Data
      const filteredData = sheetData.map((item) => ({
        CODE: item.CODE || "Unknown",
        SOLD: item.SOLD || 0,
        AVAILABLE: item.available || 0,
      }));

      setSalesData(filteredData);
      await saveToFirestore(filteredData);
    };
  };

  // ✅ Function to Save Data with Date as Document ID
  const saveToFirestore = async (data) => {
    try {
      const today = new Date().toISOString().split("T")[0]; // "2025-03-24"
      const salesRef = doc(collection(db, "sales_data"), today); // Use date as document ID

      let salesRecord = {};
      data.forEach((item) => {
        salesRecord[item.CODE] = {
          CODE: item.CODE,
          SOLD: item.SOLD,
          AVAILABLE: item.AVAILABLE,
        };
      });

      await setDoc(salesRef, salesRecord, { merge: true }); // ✅ Merge to avoid data loss
      console.log("✅ Sales data stored successfully:", salesRecord);
    } catch (error) {
      console.error("🔥 Error saving sales data:", error);
    }
  };

  return (
    <div className="upload-container">
      <label className="upload-btn">
        📂 Upload Excel File
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} hidden />
      </label>
      {fileName && <p>✅ File Uploaded: {fileName}</p>}
    </div>
  );
};

export default SalesUploader;
