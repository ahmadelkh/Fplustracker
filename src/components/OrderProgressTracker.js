import React, { useEffect, useState } from "react";
import "../styles/OrderProgressTracker.css";


const OrderProgressTracker = ({ steps }) => {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (steps.length > 0) {
      const completedSteps = steps.filter(step => step.status === "Done").length;
      const totalSteps = steps.length;
      const percentage = Math.round((completedSteps / totalSteps) * 100);
      setProgressPercentage(percentage);

      // ✅ Play Sound Effect when a step is completed
   

      // ✅ Show Fireworks when 100% done
      if (percentage === 100) {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 3000);
      }
    }
  }, [steps]);

  return (
    <div className="progress-wrapper">
      <div className="progress-container">
        {steps.map((step, index) => (
          <div key={index} className={`progress-step ${step.status.toLowerCase()} animate-step`}>
            <div className="progress-icon">
              {step.status === "Done" ? "✅" : "⚪"}
            </div>
            <span className="progress-label">{step.stepName}</span>
            <span className="progress-timestamp">
              {step.timerEnd ? new Date(step.timerEnd).toLocaleString() : "Not Completed"}
            </span>
          </div>
        ))}
      </div>

      {/* 🔄 Animated Progress Bar */}
      <div className="progress-bar-container">
        <div
          className={`progress-bar ${progressPercentage === 100 ? "completed" : ""}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* 📊 Percentage Completion */}
      <p className="progress-percentage">Progress: {progressPercentage}%</p>

      {/* 🎉 Fireworks Animation */}
      {showFireworks && <div className="fireworks"></div>}
    </div>
  ); 
};

export default OrderProgressTracker;
