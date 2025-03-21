import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import "../styles/ProcurementPage.css";

const ProcurementPage = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("lowStock");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLowStockItems = useCallback(async () => {
    try {
      const inventorySnapshot = await getDocs(collection(db, "MP"));
      let lowStock = [];

      inventorySnapshot.docs.forEach((categoryDoc) => {
        const categoryData = categoryDoc.data();
        if (categoryData.Items) {
          categoryData.Items.forEach((item) => {
            const minThreshold = getThreshold(item.Code);
            if (item.Quantity < minThreshold) {
              lowStock.push({ ...item, category: categoryDoc.id, minThreshold });
            }
          });
        }
      });

      setLowStockItems(lowStock);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "PurchaseOrders"));
      setPurchaseOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    }
  }, []);

  useEffect(() => {
    fetchLowStockItems();
    fetchPurchaseOrders();
  }, [fetchLowStockItems, fetchPurchaseOrders]);

  const getThreshold = (code) => {
    const thresholds = {
      "WOODBLOCKS": 20,
      "VISSES": 100,
      "NAILS": 500,
      "PAINT": 5
    };
    return thresholds[code] || 10;
  };

  const updatePODate = async (poId, newDate) => {
    try {
      const poRef = doc(db, "PurchaseOrders", poId);
      await updateDoc(poRef, { newExpectedDate: newDate });
      fetchPurchaseOrders();
    } catch (error) {
      console.error("Error updating PO:", error);
    }
  };

  return (
    <div className="procurement-container">
      <h1>📦 Procurement Management</h1>

      {/* 🔄 Tabs for Switching Between Sections */}
      <div className="tab-buttons">
        <button onClick={() => setActiveTab("lowStock")} className={activeTab === "lowStock" ? "active" : ""}>
          🔔 Low Stock Alerts
        </button>
        <button onClick={() => setActiveTab("purchaseOrders")} className={activeTab === "purchaseOrders" ? "active" : ""}>
          📦 PO Tracking
        </button>
      </div>

      {/* 🔔 Low Stock Alerts Page */}
      {activeTab === "lowStock" && (
        <section className="low-stock-section">
          <h2>⚠️ Low Stock Alerts</h2>
          <div className="filter-container">
            <input
              type="text"
              placeholder="Search by Code or Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {lowStockItems.length === 0 ? (
            <p className="no-data">All items are sufficiently stocked.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Item Code</th>
                    <th>Stock</th>
                    <th>Min Required</th>
                    <th>Restocking Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.filter(item => 
                    item.Code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((item, index) => (
                    <tr key={index} className={item.Quantity === 0 ? "urgent-alert" : "low-stock-row"}>
                      <td>{item.category}</td>
                      <td>{item.Code}</td>
                      <td>{item.Quantity} pcs</td>
                      <td>{item.minThreshold} pcs</td>
                      <td className="alert">⚠️ Needs Restocking</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 📦 Purchase Order Tracking Page */}
      {activeTab === "purchaseOrders" && (
        <section className="po-tracking-section">
          <h2>📋 Purchase Order Tracking</h2>
          {purchaseOrders.length === 0 ? (
            <p className="no-data">No active purchase orders.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Item</th>
                    <th>Start Date</th>
                    <th>Estimated Arrival</th>
                    <th>Update Arrival</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>{po.poNumber}</td>
                      <td>{po.item}</td>
                      <td>{new Date(po.startDate).toLocaleDateString()}</td>
                      <td>{po.newExpectedDate ? new Date(po.newExpectedDate).toLocaleDateString() : "Pending"}</td>
                      <td>
                        <input
                          type="date"
                          onChange={(e) => updatePODate(po.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ProcurementPage;
