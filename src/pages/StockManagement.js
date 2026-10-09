import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import {
  getInventory,
  getInventoryById,
  addInventory,
  updateInventory,
  deleteInventory,
} from "../services/api";
import "./Stock.css";

const emptyForm = {
  productId: "",
  productName: "",
  quantity: "",
  mrp: "",
  make: "",
  buyPrice: "",
  remarks: "",
};

const money = (n) =>
  n === "" || n === null || n === undefined || isNaN(Number(n))
    ? "—"
    : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function StockManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInventory();
      setItems(res.data || []);
    } catch (err) {
      setError(
        "Could not load stock. Ensure backend is running at http://localhost:8080."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Auto-hide success/error messages after a few seconds
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);
    return () => clearTimeout(t);
  }, [message, error]);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(`No stock item found with ID ${lookupId}.`);
    }
  };

  // Client-side filter only; no extra API calls
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.productId, item.productName, item.make, item.remarks]
        .some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [items, search]);

  const lowStockCount = items.filter((i) => Number(i.quantity) <= 5).length;

  return (
    <div className="st-page">
      <Header />

      {/* Toast */}
      {(message || error) && (
        <div
          className={`st-toast ${error ? "st-toast-error" : "st-toast-success"}`}
          role="status"
        >
          {error || message}
        </div>
      )}

      <div className="st-screen">
        {/* Top bar */}
        <div className="st-topbar">
          <div>
            <h2>Stock Management</h2>
            <span className="st-sub">
              {items.length} item(s)
              {lowStockCount > 0 && (
                <span className="st-low"> · {lowStockCount} low stock</span>
              )}
            </span>
          </div>
          <div className="st-lookup">
            <input
              placeholder="Product ID"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
            <button className="st-btn" onClick={handleLookup}>
              View by ID
            </button>
          </div>
        </div>

        <div className="st-layout">
          {/* LEFT: form */}
          <section className="st-card">
            <header className="st-card-title">
              {editingId ? "Edit Stock Item" : "Add Stock Item"}
              {editingId && <span className="st-badge">Editing {editingId}</span>}
            </header>

            <form className="st-form" onSubmit={handleSubmit}>
              <label className="st-field">
                <span>Product ID *</span>
                <input
                  name="productId"
                  placeholder="e.g. P-1001"
                  value={form.productId}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="st-field">
                <span>Product Name *</span>
                <input
                  name="productName"
                  placeholder="e.g. Ceiling Fan 1200mm"
                  value={form.productName}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="st-row-2">
                <label className="st-field">
                  <span>Quantity *</span>
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="st-field">
                  <span>MRP (₹) *</span>
                  <input
                    name="mrp"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.mrp}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <div className="st-row-2">
                <label className="st-field">
                  <span>Make / Brand</span>
                  <input
                    name="make"
                    placeholder="e.g. Crompton"
                    value={form.make}
                    onChange={handleChange}
                  />
                </label>
                <label className="st-field">
                  <span>Buy Price (₹)</span>
                  <input
                    name="buyPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.buyPrice}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="st-field">
                <span>Remarks</span>
                <input
                  name="remarks"
                  placeholder="Optional notes"
                  value={form.remarks}
                  onChange={handleChange}
                />
              </label>

              <div className="st-form-actions">
                {editingId && (
                  <button type="button" className="st-btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="st-btn primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editingId
                    ? "Update Stock"
                    : "Add Stock"}
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT: table */}
          <section className="st-card st-card-grow">
            <header className="st-card-title">
              All Stock Items
              <input
                className="st-search"
                placeholder="Filter by ID, name, make…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </header>

            <div className="st-table-wrap">
              {loading ? (
                <div className="st-empty">Loading stock…</div>
              ) : (
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="r">Qty</th>
                      <th className="r">MRP</th>
                      <th className="r">Buy Price</th>
                      <th>Make</th>
                      <th>Remarks</th>
                      <th className="c-act">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="st-empty">
                          {items.length === 0
                            ? "No stock items yet. Add one using the form."
                            : `No items match "${search}".`}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const qty = Number(item.quantity);
                        const isLow = qty <= 5;
                        const isOut = qty <= 0;
                        return (
                          <tr
                            key={item.productId}
                            className={editingId === item.productId ? "st-row-active" : ""}
                          >
                            <td>
                              <div className="st-pname">{item.productName}</div>
                              <small className="st-pid">{item.productId}</small>
                            </td>
                            <td className="r">
                              <span
                                className={`st-qty ${
                                  isOut ? "out" : isLow ? "low" : ""
                                }`}
                              >
                                {item.quantity}
                              </span>
                            </td>
                            <td className="r">{money(item.mrp)}</td>
                            <td className="r">{money(item.buyPrice)}</td>
                            <td>{item.make || "—"}</td>
                            <td className="st-remarks">{item.remarks || "—"}</td>
                            <td className="c-act">
                              <button
                                className="st-btn small"
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </button>
                              <button
                                className="st-btn small danger"
                                onClick={() => handleDelete(item.productId)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}