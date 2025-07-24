import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import "../styles/OrderTracking.css";
import { useNavigate } from "react-router-dom";
import OrderProgressTracker from "../components/OrderProgressTracker";

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [receivedDateFilter, setReceivedDateFilter] = useState("");
  const [productionDateFilter, setProductionDateFilter] = useState("");
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const orderList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: determineOrderStatus(data.steps || []),
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
  }, [fetchOrders]);

  const filterOrdersByCode = (query) => {
    setSearchQuery(query);
    const filtered = orders.filter((order) =>
      order.id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const updateTaskStatus = async (orderId, stepIndex) => {
    if (userRole !== "manager") return;
    try {
      const orderRef = doc(db, "orders", orderId);
      const updatedSteps = [...selectedOrder.steps];
      updatedSteps[stepIndex].status = "Done";
      await updateDoc(orderRef, { steps: updatedSteps });
      fetchOrders();
      setSelectedOrder({ ...selectedOrder, steps: updatedSteps });
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

  const getRowHighlightClass = (deliveryDate, status) => {
    if (status === "Done") return ""; // Don't show red if order is complete
    if (!deliveryDate) return "";

    const delivery = new Date(deliveryDate);
    const today = new Date();
    const deliveryMidnight = new Date(delivery.getFullYear(), delivery.getMonth(), delivery.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = deliveryMidnight.getTime() - todayMidnight.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return "highlight-red";
    if (diffDays <= 3) return "highlight-orange";
    return "";
  };

  const applyFilters = (ordersList) => {
    return ordersList
      .filter(order => {
        if (!statusFilter) return true;

        if (statusFilter === "Pending Delivery") {
          return order.steps?.some(step =>
            step.stepName.toLowerCase().includes("delivered") &&
            step.status !== "Done"
          );
        }

        if (statusFilter === "Pending Installation") {
          return order.steps?.some(step =>
            step.stepName.toLowerCase().includes("installed") &&
            step.status !== "Done"
          );
        }

        if (statusFilter === "Pending Red Flag") {
          return getRowHighlightClass(order.deliveryDate, order.status) === "highlight-red";
        }

        return order.status === statusFilter;
      })
      .filter(order => order.id.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(order => !receivedDateFilter || (
        order.receivedDate &&
        new Date(order.receivedDate).toDateString() === new Date(receivedDateFilter).toDateString()
      ))
      .filter(order => !productionDateFilter || (
        order.productionStartDate &&
        new Date(order.productionStartDate).toDateString() === new Date(productionDateFilter).toDateString()
      ))
      .filter(order => !deliveryDateFilter || (
        order.deliveryDate &&
        new Date(order.deliveryDate).toDateString() === new Date(deliveryDateFilter).toDateString()
      ));
  };

  const filtered = applyFilters(filteredOrders);

  return (
    <div className="order-tracking-container">
      <button
       onClick={() => {
    document.body.classList.toggle("light-mode");
                       }}
            className="mode-toggle-btn"
          >
             🌓 Toggle Mode
       </button>

      <h1>Order Tracking</h1>

      <div className="filter-container">
        <div className="filter-group">
          <label>Search by Order ID</label>
          <input
            type="text"
            placeholder="Order ID"
            value={searchQuery}
            onChange={(e) => filterOrdersByCode(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="filter-group">
          <label>Received Date</label>
          <input
            type="date"
            value={receivedDateFilter}
            onChange={(e) => setReceivedDateFilter(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="filter-group">
          <label>Production Start Date</label>
          <input
            type="date"
            value={productionDateFilter}
            onChange={(e) => setProductionDateFilter(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="filter-group">
          <label>Delivery Date</label>
          <input
            type="date"
            value={deliveryDateFilter}
            onChange={(e) => setDeliveryDateFilter(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="filter-group">
          <label>Order Filter</label>
          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Pending Delivery">Pending Delivery</option>
            <option value="Pending Installation">Pending Installation</option>
            <option value="Pending Red Flag">All Pending (Red Flag)</option>
          </select>
        </div>

        <div className="filter-group" style={{ alignSelf: "flex-end" }}>
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("");
              setReceivedDateFilter("");
              setProductionDateFilter("");
              setDeliveryDateFilter("");
              setFilteredOrders(orders);
            }}
          >
            🔄 Clear Filters
          </button>
        </div>
      </div>

      {userRole === "manager" && (
        <div style={{ textAlign: "right", marginBottom: "15px" }}>
          <button className="add-order-btn" onClick={() => navigate("/add-order")}>
            ➕ Add New Order
          </button>
        </div>
      )}

      {!selectedOrder ? (
        <table className="order-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Received Date</th>
              <th>Production Start</th>
              <th>Delivery Date</th>
              <th>Predicted Completion</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`clickable ${getRowHighlightClass(order.deliveryDate, order.status)}`}
                >
                  <td data-label="Order ID">
                    {order.id}
                    {getRowHighlightClass(order.deliveryDate, order.status) === "highlight-red" && (
                      <span style={{ marginLeft: "6px", color: "orange" }}>⚠️</span>
                    )}
                  </td>
                  <td data-label="Received Date">{order.receivedDate ? new Date(order.receivedDate).toLocaleDateString() : "N/A"}</td>
                  <td data-label="Production Start">{order.productionStartDate ? new Date(order.productionStartDate).toLocaleDateString() : "N/A"}</td>
                  <td data-label="Delivery Date">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A"}</td>
                  <td data-label="Predicted Completion">{order.predictedDate ? new Date(order.predictedDate).toLocaleDateString() : "N/A"}</td>
                  <td data-label="Status" className={`status ${order.status.toLowerCase()}`}>{order.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <div className="order-details">
          <h2>Order: {selectedOrder.id}</h2>
          <p><strong>Received Date:</strong> {selectedOrder.receivedDate ? new Date(selectedOrder.receivedDate).toLocaleString() : "N/A"}</p>
          <p><strong>Production Start:</strong> {selectedOrder.productionStartDate ? new Date(selectedOrder.productionStartDate).toLocaleString() : "N/A"}</p>
          <p><strong>Delivery Date:</strong> {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleString() : "N/A"}</p>
          <p><strong>Predicted Completion:</strong> {selectedOrder.predictedDate ? new Date(selectedOrder.predictedDate).toLocaleString() : "N/A"}</p>

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
    </div>
  );
};

export default OrderTracking;
