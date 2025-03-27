import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const SalesAnalysis = ({ salesData }) => {
  const [topSelling, setTopSelling] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [categorySales, setCategorySales] = useState({});

  const [inventoryTurnover, setInventoryTurnover] = useState([]);
  const [salesRatio, setSalesRatio] = useState([]);

  useEffect(() => {
    if (salesData) {
      console.log("🔥 Received Sales Data:", salesData);
      processAnalysis(salesData);
    }
  }, [salesData]);

  const processAnalysis = (data) => {
    let history = {};
    let categoryWiseSales = {};
    let revenue = 0;

    const reorderPeriod = 1; // 🔹 Days required to restock
    const safetyStock = 5;   // 🔹 Extra buffer stock

    data.forEach((item) => {
      if (!history[item.CODE]) {
        history[item.CODE] = {
          totalSold: 0,
          available: item.available || 0,
          category: item.CATEGORY || "Unknown",
          price: item.PRICE || 0,
          dailySales: [],
        };
      }
      history[item.CODE].totalSold += item.SOLD;
      history[item.CODE].dailySales.push(item.SOLD);
      revenue += item.SOLD * history[item.CODE].price;

      if (!categoryWiseSales[item.CATEGORY]) {
        categoryWiseSales[item.CATEGORY] = 0;
      }
      categoryWiseSales[item.CATEGORY] += item.SOLD;
    });

    
    setCategorySales(categoryWiseSales);

    setTopSelling(
      Object.keys(history)
        .map((code) => ({ CODE: code, totalSold: history[code].totalSold }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5)
    );

    // 🔹 Min Stock Calculation Based on Formula
    setLowStock(
      Object.keys(history)
        .map((code) => {
          const totalSold = history[code].totalSold;
          const daysRecorded = history[code].dailySales.length || 1; // Prevent division by zero
          const avgDailySales = totalSold / daysRecorded; // 🔹 SOLD / Number of Days
          const minStock = Math.ceil((avgDailySales * reorderPeriod) + safetyStock); // 🔹 Apply formula

          return {
            CODE: code,
            available: history[code].available,
            minStock: minStock, // 🔹 Updated min stock calculation
          };
        })
        .filter((item) => item.available < item.minStock)
    );

    // 🔹 Inventory Turnover Rate Calculation
    setInventoryTurnover(
      Object.keys(history)
        .map((code) => ({
          CODE: code,
          turnoverRate: history[code].available > 0
            ? (history[code].totalSold / history[code].available).toFixed(2)
            : 0,
        }))
        .sort((a, b) => b.turnoverRate - a.turnoverRate)
        .slice(0, 5)
    );

    // 🔹 Sales Ratio Calculation
    const totalSales = data.reduce((sum, item) => sum + item.SOLD, 0);
    setSalesRatio(
      Object.keys(history)
        .map((code) => ({
          CODE: code,
          ratio: totalSales > 0
            ? ((history[code].totalSold / totalSales) * 100).toFixed(2)
            : 0,
        }))
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 5)
    );
  };

  return (
    <div>
  

      <h2>🔥 Top Selling Products</h2>
      <div className="chart-container">
        <Bar
          data={{
            labels: topSelling.map((item) => item.CODE),
            datasets: [{ label: "Units Sold", data: topSelling.map((item) => item.totalSold), backgroundColor: "blue" }],
          }}
          options={{ maintainAspectRatio: false }}
        />
      </div>

      <h2>⚠️ Low Stock Products</h2>
      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Available</th>
              <th>Min Stock</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((item) => (
              <tr key={item.CODE}>
                <td>{item.CODE}</td>
                <td className="low-stock">{item.available}</td>
                <td>{item.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>📊 Inventory Turnover Rate</h2>
      <div className="chart-container">
        <Bar
          data={{
            labels: inventoryTurnover.map((item) => item.CODE),
            datasets: [
              {
                label: "Turnover Rate",
                data: inventoryTurnover.map((item) => item.turnoverRate),
                backgroundColor: "orange",
              },
            ],
          }}
          options={{ maintainAspectRatio: false }}
        />
      </div>

      <h2>📊 Sales Ratio Analysis</h2>
      <div className="chart-container">
        <Pie
          data={{
            labels: salesRatio.map((item) => item.CODE),
            datasets: [
              {
                label: "Sales Ratio (%)",
                data: salesRatio.map((item) => item.ratio),
                backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6610f2"],
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>
    </div>
  );
};

export default SalesAnalysis;
