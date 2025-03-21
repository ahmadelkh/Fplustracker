import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Firestore config
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import "../styles/InventoryListPage.css"; // Add CSS styles

const InventoryListPage = () => {
  const { category } = useParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  useEffect(() => {
    fetchInventory(category);
  }, [category]);

  const fetchInventory = async (category) => {
    try {
      const categoryDoc = doc(db, "MP", category);
      const snapshot = await getDoc(categoryDoc);
      if (!snapshot.exists()) {
        console.log("No items found in this category.");
        return;
      }
      const data = snapshot.data();
      setItems(data.Items || []);
      setFilteredItems(data.Items || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const filterItems = () => {
    const query = searchQuery.toLowerCase();
    const minQty = parseFloat(minQuantity) || 0;
    const maxQty = parseFloat(maxQuantity) || Infinity;

    const newFilteredItems = items.map((item) => {
      const quantity = parseFloat(item.Quantity) || 0;
      const lowStock = quantity < 10;

      return {
        ...item,
        lowStock: lowStock,
      };
    }).filter((item) => {
      return (
        (item.Code.toLowerCase().includes(query) || item.Description.toLowerCase().includes(query)) &&
        item.Quantity >= minQty &&
        item.Quantity <= maxQty
      );
    });

    setFilteredItems(newFilteredItems);
  };

  return (
    <div className="inventory-container">
      <h1>Inventory: {category}</h1>

      {/* 🔍 Search & Filter Options */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by Code or Description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min Quantity"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Quantity"
          value={maxQuantity}
          onChange={(e) => setMaxQuantity(e.target.value)}
        />
        <button className="search-button" onClick={filterItems}>Search</button>
      </div>

      {/* 📋 Inventory List */}
      <div className="inventory-list">
        {filteredItems.length === 0 ? (
          <p>No items found.</p>
        ) : (
          filteredItems.map((item, index) => (
            <div key={index} className={`inventory-item ${item.lowStock ? "low-stock" : ""}`}>
              <p className="code"><strong>Code:</strong> {item.Code}</p>
              <p className="description"><strong>Description:</strong> {item.Description}</p>
              <p className="quantity"><strong>Quantity:</strong> {item.Quantity}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryListPage;
