import React, { useState } from "react";
import Header from "../components/Header";
import {
  searchInventory,
  getDiscountByBrand,
  saveQuotation,
} from "../services/api";
import "./Crud.css";

const emptyCustomer = { name: "", phone: "", category: "" };
const emptyProduct = {
  productId: "",
  productName: "",
  mrp: 0,
  make: "",
  discount: 0,
  quantity: 1,
  finalPrice: 0,
};

export default function Quotations() {
  const [customer, setCustomer] = useState(emptyCustomer);
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(emptyProduct);
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  // search-as-you-type
  const handleProductSearch = async (e) => {
    const value = e.target.value;
    setCurrentProduct({ ...currentProduct, productId: value });

    if (value.length > 0) {
      try {
        const res = await searchInventory(value);
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectProduct = (item) => {
    setCurrentProduct({
      ...currentProduct,
      productId: item.productId,
      productName: item.productName,
      mrp: item.mrp,
      make: item.make,
    });
    setSearchResults([]);
  };

  const addProduct = async () => {
    const product = currentProduct;
    let discountPercent = 0;

    try {
      const discountRes = await getDiscountByBrand(product.make);
      if (discountRes.data) {
        const categoryKey = `category_${customer.category}`;
        discountPercent = discountRes.data[categoryKey] || 0;
      }
    } catch {
      discountPercent = 0;
    }

    const unitPrice = product.mrp - (product.mrp * discountPercent) / 100;
    const finalPrice = unitPrice * product.quantity;

    setProducts([
      ...products,
      { ...product, discount: discountPercent, finalPrice },
    ]);

    setCurrentProduct(emptyProduct);
  };

  // allow manual discount update
  const updateProductDiscount = (index, newDiscount) => {
    const updatedProducts = [...products];
    const p = updatedProducts[index];
    p.discount = newDiscount;
    const unitPrice = p.mrp - (p.mrp * newDiscount) / 100;
    p.finalPrice = unitPrice * p.quantity;
    setProducts(updatedProducts);
  };

  // allow manual quantity update
  const updateProductQuantity = (index, newQty) => {
    const updatedProducts = [...products];
    const p = updatedProducts[index];
    p.quantity = newQty;
    const unitPrice = p.mrp - (p.mrp * p.discount) / 100;
    p.finalPrice = unitPrice * newQty;
    setProducts(updatedProducts);
  };

  const saveQuotationData = async () => {
    try {
      const quotation = {
        customerName: customer.name,
        contactNo: customer.phone,
        category: customer.category,
        products,
      };
      await saveQuotation(quotation);
      setMessage("Quotation saved successfully.");
      setCustomer(emptyCustomer);
      setProducts([]);
    } catch {
      setError("Failed to save quotation.");
    }
  };

  const overallTotal = products.reduce((sum, p) => {
    const unitPrice = p.mrp - (p.mrp * p.discount) / 100;
    return sum + unitPrice * p.quantity;
  }, 0);

  return (
    <div className="crud-page">
      <Header />
      <div className="crud-content">
        <h2>Create Quotation</h2>

        {message && <div className="crud-success">{message}</div>}
        {error && <div className="crud-error">{error}</div>}

        {/* Customer Info */}
        <div className="crud-form">
          <input name="name" placeholder="Customer Name" value={customer.name} onChange={handleCustomerChange} required />
          <input name="phone" placeholder="Phone Number" value={customer.phone} onChange={handleCustomerChange} required />
          <select name="category" value={customer.category} onChange={handleCustomerChange} required>
            <option value="">Select Category</option>
            <option value="A">Category A</option>
            <option value="B">Category B</option>
            <option value="C">Category C</option>
            <option value="D">Category D</option>
            <option value="E">Category E</option>
          </select>
        </div>

        {/* Product Search */}
        <h3>Add Products</h3>
        <div className="crud-form" style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 3, position: "relative" }}>
            <input
              name="productId"
              placeholder="Enter Product ID or Name"
              value={currentProduct.productId}
              onChange={handleProductSearch}
              required
              style={{ width: "100%" }}
            />
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map((item) => (
                  <li key={item.productId} onClick={() => selectProduct(item)}>
                    {item.productId} - {item.productName} (MRP: {item.mrp})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <input
              name="quantity"
              type="number"
              placeholder="Qty"
              value={currentProduct.quantity}
              onChange={(e) =>
                setCurrentProduct({ ...currentProduct, quantity: e.target.value })
              }
              required
              style={{ width: "100%" }}
            />
          </div>
          <button className="crud-btn" onClick={addProduct}>Add Product</button>
        </div>

        {/* Products Table */}
        <h3>Quotation Products</h3>
        <table className="crud-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Name</th>
              <th className="no-print">MRP</th>
              <th className="no-print">Discount %</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="7" className="crud-empty">No products added.</td></tr>
            ) : (
              products.map((p, idx) => {
                const unitPrice = p.mrp - (p.mrp * p.discount) / 100;
                const total = unitPrice * p.quantity;
                return (
                  <tr key={idx}>
                    <td>{p.productId}</td>
                    <td>{p.productName}</td>
                    <td className="no-print">{p.mrp}</td>
                    <td className="no-print">
                      <input
                        type="number"
                        value={p.discount}
                        onChange={(e) => updateProductDiscount(idx, parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={p.quantity}
                        onChange={(e) => updateProductQuantity(idx, parseInt(e.target.value))}
                      />
                    </td>
                    <td>{unitPrice.toFixed(2)}</td>
                    <td>{total.toFixed(2)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Overall Total */}
        <h3>Total Invoice Amount: {overallTotal.toFixed(2)}</h3>

        <div className="crud-form-actions">
          <button className="crud-btn primary" onClick={saveQuotationData}>
            Save Quotation
          </button>
          <button className="crud-btn" onClick={() => window.print()}>
            Print Quotation
          </button>
        </div>
      </div>
    </div>
  );
}
