import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebaseConfig"; // Firestore config
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import "../styles/OrderTracking.css";
import { useNavigate } from "react-router-dom";
import OrderProgressTracker from "../components/OrderProgressTracker"; // ✅ Import Progress Tracker



const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // New state for filtering by status
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // ✅ Wrap fetchOrders inside useCallback to avoid infinite loops
  const fetchOrders = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const orderList = querySnapshot.docs.map((doc) => {
        const orderData = doc.data();
        return {
          id: doc.id,
          ...orderData,
          status: determineOrderStatus(orderData.steps || []),
        };
      });
      setOrders(orderList);
      setFilteredOrders(orderList);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, []);

  const determineOrderStatus = (steps) => {
    if (!steps || steps.length === 0) return "Pending";
    if (steps.every((step) => step.status === "Done")) return "Done";
    return steps.some((step) => step.status === "Pending" || step.status === "In Progress")
      ? "In Progress"
      : "Pending";
  };

  const checkUserRole = () => {
    const storedUsername = localStorage.getItem("username");
    setUserRole(storedUsername === "manager" ? "manager" : "client");
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserRole(null);
    navigate("/login");
  };

  useEffect(() => {
    fetchOrders();
    checkUserRole();
  }, [fetchOrders]); // ✅ Now fetchOrders is included safely

  const filterOrdersByCode = (query) => {
    setSearchQuery(query);
    setFilteredOrders(
      orders.filter((order) => order.id.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const filterOrdersByDate = async (date) => {
    setSearchDate(date);
    try {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "orders"),
        where("activeDate", ">=", startOfDay.toISOString()),
        where("activeDate", "<", endOfDay.toISOString())
      );
      const querySnapshot = await getDocs(q);
      setFilteredOrders(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error filtering orders by date:", error);
    }
  };

  const updateTaskStatus = async (orderId, stepIndex) => {
    if (userRole !== "manager") return;
    try {
      const orderRef = doc(db, "orders", orderId);
      const updatedSteps = [...selectedOrder.steps];
      updatedSteps[stepIndex].status = "Done";

      await updateDoc(orderRef, { steps: updatedSteps });
      fetchOrders();
      setSelectedOrder({ ...selectedOrder, steps: updatedSteps, status: determineOrderStatus(updatedSteps) });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const deleteOrder = async (orderId) => {
    if (userRole !== "manager") return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setSelectedOrder(null);
      fetchOrders();
      alert("Order deleted successfully");
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  return (
    <div className="order-tracking-container">
      <h1>Order Tracking</h1>

      <input
        type="text"
        placeholder="Search by Order ID"
        value={searchQuery}
        onChange={(e) => filterOrdersByCode(e.target.value)}
        className="search-bar"
      />

      <input
        type="date"
        value={searchDate}
        onChange={(e) => filterOrdersByDate(e.target.value)}
        className="search-bar"
      />

<div className="filter-container">


  <select
    className="status-filter"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">All</option>
    <option value="In Progress">In Progress</option>
    <option value="Done">Done</option>
  </select>
</div>


      {!selectedOrder ? (
        <table className="order-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Predicted Completion Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders
              .filter(order => !statusFilter || order.status === statusFilter) // Apply status filter
              .map((order) => (
            
                <tr key={order.id} onClick={() => setSelectedOrder(order)} className="clickable">
                  <td>{order.id}</td>
                  <td>{order.predictedDate ? new Date(order.predictedDate).toLocaleDateString() : "N/A"}</td>
                  <td className={`status ${order.status.toLowerCase()}`}>{order.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-results">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <div className="order-details">
          <h2>Order: {selectedOrder.id}</h2>
          <p>Predicted Completion: {selectedOrder.predictedDate ? new Date(selectedOrder.predictedDate).toLocaleString() : "N/A"}</p>

          <h3>Tasks:</h3>
          <ul>
            {selectedOrder.steps.map((step, index) => (
              <li key={index} className={`step ${step.status.toLowerCase()}`}>
                <div className="task-info">
                  <span>{step.stepName} - {step.status}</span>
                  <span className="task-time">End Time: {step.timerEnd ? new Date(step.timerEnd).toLocaleString() : "N/A"}</span>
                </div>
                {userRole === "manager" && step.status !== "Done" && (
                  <div className="done-container">
                    <button className="action-btn done" onClick={() => updateTaskStatus(selectedOrder.id, index)}>✅</button>
                    <span>Mark as Done</span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <OrderProgressTracker steps={selectedOrder.steps} />


          
          {userRole === "manager" && (
            <button className="action-btn delete" onClick={() => deleteOrder(selectedOrder.id)}>❌ Delete</button>
          )}
          
          <button className="back-btn" onClick={() => setSelectedOrder(null)}>Back to Orders</button>
        </div>
      )}
      
      {userRole && (
        <div className="footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
