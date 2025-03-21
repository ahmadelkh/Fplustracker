import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Firestore config
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/CategoryPage.css"; // Add CSS styles

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");
      const snapshot = await getDocs(collection(db, "MP"));
      if (snapshot.empty) {
        console.log("No categories found.");
        return;
      }
      const categoryList = snapshot.docs.map((doc) => doc.id);
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  return (
    <div className="category-container">
      <h1>Categories</h1>
      {categories.length === 0 ? (
        <p className="no-categories">No categories found.</p>
      ) : (
        <div className="category-grid">
          {categories.map((category, index) => (
            <div
              key={index}
              className="category-card"
              onClick={() => navigate(`/inventory/${category}`)}
            >
              <i className="fas fa-box-open"></i>
              <p>{category}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
