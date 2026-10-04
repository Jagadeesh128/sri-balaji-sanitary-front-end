import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  getCategories,
  getCategoryByBrand,
  saveCategory,
  deleteCategory,
} from "../services/api";
import "./Crud.css";

const emptyForm = {
  brand: "",
  buyDiscount: "",
  category_A: "",
  category_B: "",
  category_C: "",
  category_D: "",
  category_E: "",
  remarks: "",
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingBrand, setEditingBrand] = useState(null);
  const [lookupBrand, setLookupBrand] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (err) {
      setError("Could not load categories. Ensure backend is running at http://localhost:8080.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingBrand(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await saveCategory(form); // POST /discounts handles create/update
      setMessage(editingBrand ? "Category updated successfully." : "Category created successfully.");
      resetForm();
      fetchCategories();
    } catch (err) {
      setError("Failed to save category. Check backend connection.");
    }
  };

  const handleEdit = (cat) => {
    setForm(cat);
    setEditingBrand(cat.brand);
  };

  const handleDelete = async (brand) => {
    if (!window.confirm(`Delete category for brand "${brand}"?`)) return;
    setError("");
    try {
      await deleteCategory(brand);
      setMessage("Category deleted.");
      fetchCategories();
    } catch (err) {
      setError("Failed to delete category.");
    }
  };

  const handleLookup = async () => {
    if (!lookupBrand) return;
    setError("");
    setMessage("");
    try {
      const res = await getCategoryByBrand(lookupBrand);
      setForm(res.data);
      setEditingBrand(res.data.brand);
      setMessage(`Loaded category for brand "${lookupBrand}" into the form.`);
    } catch (err) {
      setError(`No category found for brand "${lookupBrand}".`);
    }
  };

  return (
    <div className="crud-page">
      <Header />
      <div className="crud-content">
        <h2>Discount Categories</h2>

        {message && <div className="crud-success">{message}</div>}
        {error && <div className="crud-error">{error}</div>}

        <form className="crud-form" onSubmit={handleSubmit}>
          <input
            name="brand"
            placeholder="Brand"
            value={form.brand}
            onChange={handleChange}
            disabled={!!editingBrand}
            required
          />
          <input
            name="buyDiscount"
            placeholder="Buy Discount"
            value={form.buyDiscount}
            onChange={handleChange}
          />
          <input
            name="category_A"
            placeholder="Category A"
            value={form.category_A}
            onChange={handleChange}
          />
          <input
            name="category_B"
            placeholder="Category B"
            value={form.category_B}
            onChange={handleChange}
          />
          <input
            name="category_C"
            placeholder="Category C"
            value={form.category_C}
            onChange={handleChange}
          />
          <input
            name="category_D"
            placeholder="Category D"
            value={form.category_D}
            onChange={handleChange}
          />
          <input
            name="category_E"
            placeholder="Category E"
            value={form.category_E}
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
              {editingBrand ? "Update Category" : "Create Category"}
            </button>
            {editingBrand && (
              <button type="button" className="crud-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="crud-lookup">
          <input
            placeholder="Enter Brand to view"
            value={lookupBrand}
            onChange={(e) => setLookupBrand(e.target.value)}
          />
          <button className="crud-btn" onClick={handleLookup}>
            View by Brand
          </button>
        </div>

        <h3>All Categories</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Buy Discount</th>
                <th>Category A</th>
                <th>Category B</th>
                <th>Category C</th>
                <th>Category D</th>
                <th>Category E</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="9" className="crud-empty">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.brand}>
                    <td>{cat.brand}</td>
                    <td>{cat.buyDiscount}</td>
                    <td>{cat.category_A}</td>
                    <td>{cat.category_B}</td>
                    <td>{cat.category_C}</td>
                    <td>{cat.category_D}</td>
                    <td>{cat.category_E}</td>
                    <td>{cat.remarks}</td>
                    <td>
                      <button
                        className="crud-btn small"
                        onClick={() => handleEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        className="crud-btn small danger"
                        onClick={() => handleDelete(cat.brand)}
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
