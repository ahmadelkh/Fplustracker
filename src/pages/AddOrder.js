import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/AddOrder.css";

const predefinedSteps = [
  "DEBITAGE/COUPAGE/PVC",
  "CNC",
  "SOUDURE",
  "ASSEMBLAGE",
  "CARCASSE",
  "PEINTURE/NETOYAGE",
  "Granite",
  "GARNISSAGE/RIDEAU",
  "PRETE POUR LA LIVRAISON",
  "LIVREE",
  "INSTALLATION",
  "REPARATION/MODIFICATION",
];

// ⏱️ Working-hour-respecting logic
const calculateEndDate = (startDate, totalHours) => {
  let current = new Date(startDate);
  let hoursLeft = totalHours;

  const WORK_START_HOUR = 8;
  const WORK_END_HOUR = 17;
  const DAILY_HOURS = WORK_END_HOUR - WORK_START_HOUR;

  while (hoursLeft > 0) {
    const currentHour = current.getHours();

    if (currentHour < WORK_START_HOUR) {
      current.setHours(WORK_START_HOUR, 0, 0, 0);
    } else if (currentHour >= WORK_END_HOUR) {
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START_HOUR, 0, 0, 0);
    }

    const hoursUntilEnd = WORK_END_HOUR - current.getHours();
    const hoursToUse = Math.min(hoursUntilEnd, hoursLeft);

    current.setHours(current.getHours() + hoursToUse);
    hoursLeft -= hoursToUse;

    if (hoursLeft > 0) {
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START_HOUR, 0, 0, 0);
    }
  }

  return current;
};

const AddOrder = () => {
  const [orderCode, setOrderCode] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [productionStartDate, setProductionStartDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [selectedSteps, setSelectedSteps] = useState({});
  const navigate = useNavigate();

  const handleToggleStep = (step) => {
    setSelectedSteps((prev) => {
      const updated = { ...prev };
      if (updated.hasOwnProperty(step)) {
        delete updated[step];
      } else {
        updated[step] = 1;
      }
      return updated;
    });
  };

  const handleStepHoursChange = (step, hours) => {
    setSelectedSteps((prev) => ({
      ...prev,
      [step]: parseInt(hours) || 0,
    }));
  };

  const createOrder = async () => {
    if (!orderCode || Object.keys(selectedSteps).length === 0 || !productionStartDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const now = new Date();
    const prodStart = new Date(productionStartDate);
    let stepStartTime = new Date(prodStart);
    const steps = [];

    for (const [stepName, hours] of Object.entries(selectedSteps)) {
      const stepEndTime = calculateEndDate(stepStartTime, hours);
      steps.push({
        stepName,
        status: "Pending",
        timerEnd: stepEndTime.toISOString(),
      });
      stepStartTime = new Date(stepEndTime);
    }

    try {
      await setDoc(doc(db, "orders", orderCode), {
        steps,
        activeDate: now.toISOString(),
        predictedDate: stepStartTime.toISOString(),
        receivedDate: receivedDate ? new Date(receivedDate).toISOString() : null,
        productionStartDate: prodStart.toISOString(),
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      });
      alert("✅ Order created successfully!");
      navigate("/order-tracking");
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Failed to create order.");
    }
  };

  return (
    <div className="add-order-container">
      <h1>Add New Order</h1>

      <label className="order-label">Order Code:</label>
      <input
        type="text"
        placeholder="Order Code"
        value={orderCode}
        onChange={(e) => setOrderCode(e.target.value)}
        className="order-input"
      />

      <label className="order-label">Received Date from Sales:</label>
      <input
        type="date"
        value={receivedDate}
        onChange={(e) => setReceivedDate(e.target.value)}
        className="order-input"
      />

      <label className="order-label">Production Start Date & Time:</label>
      <input
        type="datetime-local"
        value={productionStartDate}
        onChange={(e) => setProductionStartDate(e.target.value)}
        className="order-input"
      />

      <label className="order-label">Delivery Date:</label>
      <input
        type="date"
        value={deliveryDate}
        onChange={(e) => setDeliveryDate(e.target.value)}
        className="order-input"
      />

      <h3>Select Workflow Steps</h3>
      <div className="steps-list">
        {predefinedSteps.map((step) => {
          const isSelected = selectedSteps.hasOwnProperty(step);
          return (
            <div
              key={step}
              className={`step-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleToggleStep(step)}
            >
              <span>{step}</span>
              {isSelected && (
                <input
                  type="number"
                  min="1"
                  placeholder="Hours"
                  value={selectedSteps[step] || ""}
                  onChange={(e) => handleStepHoursChange(step, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="hours-input"
                />
              )}
            </div>
          );
        })}
      </div>

      <button className="submit-btn" onClick={createOrder}>
        ➕ Create Order
      </button>
    </div>
  );
};

export default AddOrder;
