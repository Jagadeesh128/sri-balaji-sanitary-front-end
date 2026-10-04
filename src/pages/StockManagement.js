import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  getInventory,
  getInventoryById,
  addInventory,
  updateInventory,
  deleteInventory,
} from "../services/api";
import "./Crud.css";

const emptyForm = {
  productId: "",
  productName: "",
  quantity: "",
  mrp: "",
  make: "",
  buyPrice: "",
  remarks: "",
};

export default function StockManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInventory();
      setItems(res.data || []);
    } catch (err) {
      setError("Could not load stock. Ensure backend is running at http://localhost:8080.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingId) {
        await updateInventory(editingId, form);
        setMessage("Stock item updated successfully.");
      } else {
        await addInventory(form);
        setMessage("Stock item added successfully.");
      }
      resetForm();
      fetchItems();
    } catch (err) {
      setError("Failed to save stock item. Check backend connection.");
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.productId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this stock item?")) return;
    setError("");
    try {
      await deleteInventory(id);
      setMessage("Stock item deleted.");
      fetchItems();
    } catch (err) {
      setError("Failed to delete stock item.");
    }
  };

  const handleLookup = async () => {
    if (!lookupId) return;
    setError("");
    setMessage("");
    try {
      const res = await getInventoryById(lookupId);
      setForm(res.data);
      setEditingId(res.data.productId);
      setMessage(`Loaded item with ID ${lookupId} into the form.`);
    } catch (err) {
      setError(`No stock item found with ID ${lookupId}.`);
    }
  };

  return (
    <div className="crud-page">
      <Header />
      <div className="crud-content">
        <h2>Stock Management</h2>

        {message && <div className="crud-success">{message}</div>}
        {error && <div className="crud-error">{error}</div>}

        <form className="crud-form" onSubmit={handleSubmit}>
          <input
            name="productId"
            placeholder="Product ID"
            value={form.productId}
            onChange={handleChange}
            required
          />
          <input
            name="productName"
            placeholder="Product Name"
            value={form.productName}
            onChange={handleChange}
            required
          />
          <input
            name="quantity"
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            required
          />
          <input
            name="mrp"
            type="number"
            placeholder="MRP"
            value={form.mrp}
            onChange={handleChange}
            required
          />
          <input
            name="make"
            placeholder="Make"
            value={form.make}
            onChange={handleChange}
          />
          <input
            name="buyPrice"
            type="number"
            placeholder="Buy Price"
            value={form.buyPrice}
            onChange={handleChange}
          />
          <input
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleChange}
          />
          <div className="crud-form-actions">
            <button type="submit" className="crud-btn primary">
              {editingId ? "Update Stock" : "Add Stock"}
            </button>
            {editingId && (
              <button type="button" className="crud-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="crud-lookup">
          <input
            placeholder="Enter Product ID to view"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
          />
          <button className="crud-btn" onClick={handleLookup}>
            View by ID
          </button>
        </div>

        <h3>All Stock Items</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>MRP</th>
                <th>Make</th>
                <th>Buy Price</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="crud-empty">
                    No stock items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productId}</td>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.mrp}</td>
                    <td>{item.make}</td>
                    <td>{item.buyPrice}</td>
                    <td>{item.remarks}</td>
                    <td>
                      <button
                        className="crud-btn small"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="crud-btn small danger"
                        onClick={() => handleDelete(item.productId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
