import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import {
  searchInventory,
  getDiscountByBrand,
  saveQuotation,
} from "../services/api";
import "./Quotations.css";

// Edit these to your business details (shown on printed quotation)
const COMPANY = {
  name: "Sri Balaji Sanitary & Tiles",
  address: "Opposite Republic Club, Big Mosque Strreet,Srikalahasti",
  contact: "Phone: 7330600742  ",
  Note : "This is a computer generated quotation and does not require signature.",
};

const CATEGORIES = ["A", "B", "C", "D", "E"];

const emptyCustomer = { name: "", phone: "", category: "" };
const emptyProduct = {
  productId: "",
  productName: "",
  mrp: 0,
  make: "",
  discount: 0,
  quantity: 1,
};

// ---------- helpers ----------
const round2 = (n) => Math.round(n * 100) / 100;
const unitPriceOf = (p) => p.mrp - (p.mrp * p.discount) / 100;
const lineTotalOf = (p) => round2(unitPriceOf(p) * p.quantity);
const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Quotations() {
  // ---------- state (same data as before, plus UI state) ----------
  const [customer, setCustomer] = useState(emptyCustomer);
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(emptyProduct);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }

  const searchRef = useRef(null);
  const qtyRef = useRef(null);
  const searchSeq = useRef(0);

  // ---------- validation ----------
  const isPhoneValid = /^\d{10}$/.test(customer.phone);
  const missing = [
    !customer.name.trim() && "customer name",
    !isPhoneValid && "10-digit phone",
    !customer.category && "category",
    products.length === 0 && "at least one product",
  ].filter(Boolean);
  const canSave = missing.length === 0 && !saving;

  // ---------- totals ----------
  const totals = products.reduce(
    (acc, p) => {
      acc.qty += p.quantity;
      acc.mrpTotal += p.mrp * p.quantity;
      acc.amount += lineTotalOf(p);
      return acc;
    },
    { qty: 0, mrpTotal: 0, amount: 0 }
  );
  const totalSaving = round2(totals.mrpTotal - totals.amount);

  // ---------- notices auto-dismiss ----------
  const notify = (type, text) => setNotice({ type, text });
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // ---------- search-as-you-type (debounced, ignores stale responses) ----------
  useEffect(() => {
    const term = searchText.trim();
    if (!term) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearchLoading(true);

    const t = setTimeout(async () => {
      try {
        const res = await searchInventory(term);
        if (seq !== searchSeq.current) return;
        setSearchResults(res.data || []);
        setActiveIdx(0);
      } catch {
        if (seq === searchSeq.current) setSearchResults([]);
      } finally {
        if (seq === searchSeq.current) setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchText]);

  // ---------- keyboard shortcuts: Ctrl+S save, Ctrl+P print ----------
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        if (canSave) saveQuotationData();
        else notify("error", `Please fill: ${missing.join(", ")}`);
      }
      if (k === "p") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- customer ----------
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    const v = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setCustomer((prev) => ({ ...prev, [name]: v }));
  };

  // ---------- product search ----------
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setCurrentProduct(emptyProduct); // typing again clears the previous selection
  };

  const selectProduct = (item) => {
    setCurrentProduct({
      ...emptyProduct,
      productId: item.productId,
      productName: item.productName,
      mrp: Number(item.mrp) || 0,
      make: item.make,
    });
    setSearchResults([]);
    setActiveIdx(0);
    qtyRef.current?.focus();
    qtyRef.current?.select();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchResults([]);
      return;
    }
    if (!searchResults.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectProduct(searchResults[activeIdx] ?? searchResults[0]);
    }
  };

  // ---------- add product (same discount logic as before) ----------
  const addProduct = async () => {
    const qty = Number(currentProduct.quantity);

    if (!currentProduct.productId) {
      notify("error", "Search and select a product first.");
      searchRef.current?.focus();
      return;
    }
    if (!(qty > 0)) {
      notify("error", "Quantity must be at least 1.");
      qtyRef.current?.focus();
      return;
    }
    if (!customer.category) {
      notify("error", "Select a customer category first (discount depends on it).");
      return;
    }

    setAdding(true);
    let discountPercent = 0;
    try {
      const discountRes = await getDiscountByBrand(currentProduct.make);
      if (discountRes.data) {
        discountPercent =
          Number(discountRes.data[`category_${customer.category}`]) || 0;
      }
    } catch {
      discountPercent = 0;
    } finally {
      setAdding(false);
    }

    setProducts((prev) => {
      // same product added twice -> merge quantity instead of duplicate row
      const idx = prev.findIndex((p) => p.productId === currentProduct.productId);
      if (idx >= 0) {
        return prev.map((p, i) =>
          i === idx ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [
        ...prev,
        { ...currentProduct, quantity: qty, discount: discountPercent },
      ];
    });

    setCurrentProduct(emptyProduct);
    setSearchText("");
    searchRef.current?.focus();
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addProduct();
    }
  };

  // ---------- edit / remove rows (immutable updates) ----------
  const updateProduct = (index, changes) =>
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...changes } : p))
    );

  const updateProductDiscount = (index, value) => {
    const d = Math.min(100, Math.max(0, parseFloat(value) || 0));
    updateProduct(index, { discount: d });
  };

  const updateProductQuantity = (index, value) => {
    const q = Math.max(1, parseInt(value, 10) || 1);
    updateProduct(index, { quantity: q });
  };

  const removeProduct = (index) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  const clearAll = () => {
    if (!window.confirm("Clear customer details and all products?")) return;
    setCustomer(emptyCustomer);
    setProducts([]);
    setCurrentProduct(emptyProduct);
    setSearchText("");
    searchRef.current?.focus();
  };

  // ---------- save (same payload shape as before) ----------
  const saveQuotationData = async () => {
    if (!canSave) {
      notify("error", `Please fill: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const quotation = {
        customerName: customer.name.trim(),
        contactNo: customer.phone,
        category: customer.category,
        products: products.map((p) => ({ ...p, finalPrice: lineTotalOf(p) })),
      };
      await saveQuotation(quotation);
      notify("success", "Quotation saved successfully.");
      setCustomer(emptyCustomer);
      setProducts([]);
      searchRef.current?.focus();
    } catch {
      notify("error", "Failed to save quotation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- print (uses the print-only template below) ----------
  const handlePrint = () => {
    if (!products.length) {
      notify("error", "Add products before printing.");
      return;
    }
    window.print();
  };

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="qt-page">
      <Header />

      {notice && (
        <div className={`qt-toast qt-toast-${notice.type}`} role="status">
          {notice.text}
        </div>
      )}

      <div className="qt-screen no-print">
        {/* Top bar */}
        <div className="qt-topbar">
          <div>
            <h2>Create Quotation</h2>
            <span className="qt-date">Date: {today}</span>
          </div>
          <div className="qt-shortcuts">
            <kbd>Enter</kbd> add item &nbsp; <kbd>↑↓</kbd> pick &nbsp;
            <kbd>Ctrl+S</kbd> save &nbsp; <kbd>Ctrl+P</kbd> print
          </div>
        </div>

        <div className="qt-layout">
          {/* LEFT: customer + items */}
          <div className="qt-main">
            {/* Customer card */}
            <section className="qt-card">
              <header className="qt-card-title">
                <span className="qt-step">1</span> Customer Details
              </header>
              <div className="qt-grid-3">
                <label className="qt-field">
                  <span>Customer Name *</span>
                  <input
                    name="name"
                    placeholder="e.g. Ramesh Kumar"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    autoFocus
                  />
                </label>

                <label className="qt-field">
                  <span>Phone Number *</span>
                  <input
                    name="phone"
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                    className={
                      customer.phone && !isPhoneValid ? "qt-invalid" : ""
                    }
                  />
                  {customer.phone && !isPhoneValid && (
                    <small className="qt-hint-error">
                      Enter 10 digits ({customer.phone.length}/10)
                    </small>
                  )}
                </label>

                <label className="qt-field">
                  <span>Price Category *</span>
                  <select
                    name="category"
                    value={customer.category}
                    onChange={handleCustomerChange}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        Category {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            {/* Add product card */}
            <section className="qt-card">
              <header className="qt-card-title">
                <span className="qt-step">2</span> Add Products
              </header>

              <div className="qt-add-row">
                <div className="qt-search-wrap">
                  <input
                    ref={searchRef}
                    className="qt-search"
                    placeholder="Type product ID or name to search…"
                    value={
                      currentProduct.productId
                        ? `${currentProduct.productId} - ${currentProduct.productName}`
                        : searchText
                    }
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    autoComplete="off"
                  />
                  {searchLoading && <span className="qt-spinner" />}

                  {searchResults.length > 0 && (
                    <ul className="qt-dropdown">
                      {searchResults.map((item, idx) => (
                        <li
                          key={item.productId}
                          className={idx === activeIdx ? "active" : ""}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectProduct(item)}
                        >
                          <div>
                            <strong>{item.productName}</strong>
                            <small>
                              {item.productId}
                              {item.make ? ` · ${item.make}` : ""}
                            </small>
                          </div>
                          <span className="qt-mrp">MRP ₹{money(item.mrp)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!searchLoading &&
                    searchText.trim() &&
                    !currentProduct.productId &&
                    searchResults.length === 0 && (
                      <div className="qt-dropdown qt-dropdown-empty">
                        No products match "{searchText}"
                      </div>
                    )}
                </div>

                {currentProduct.productId && (
                  <div className="qt-selected">
                    MRP <b>₹{money(currentProduct.mrp)}</b>
                  </div>
                )}

                <input
                  ref={qtyRef}
                  className="qt-qty"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={currentProduct.quantity}
                  onChange={(e) =>
                    setCurrentProduct((p) => ({ ...p, quantity: e.target.value }))
                  }
                  onKeyDown={handleQtyKeyDown}
                />

                <button
                  className="qt-btn primary"
                  onClick={addProduct}
                  disabled={adding}
                >
                  {adding ? "Adding…" : "+ Add"}
                </button>
              </div>
            </section>

            {/* Items table */}
            <section className="qt-card qt-card-grow">
              <header className="qt-card-title">
                <span className="qt-step">3</span> Items
                <span className="qt-count">{products.length} item(s)</span>
              </header>

              <div className="qt-table-wrap">
                <table className="qt-table">
                  <thead>
                    <tr>
                      <th className="c-sl">#</th>
                      <th>Product</th>
                      <th className="r">MRP</th>
                      <th className="r c-disc">Disc %</th>
                      <th className="r c-qty">Qty</th>
                      <th className="r">Unit Price</th>
                      <th className="r">Amount</th>
                      <th className="c-del" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="qt-empty">
                          No items yet. Search a product above and press Enter.
                        </td>
                      </tr>
                    ) : (
                      products.map((p, idx) => (
                        <tr key={p.productId}>
                          <td className="c-sl">{idx + 1}</td>
                          <td>
                            <div className="qt-pname">{p.productName}</div>
                            <small className="qt-pid">
                              {p.productId}
                              {p.make ? ` · ${p.make}` : ""}
                            </small>
                          </td>
                          <td className="r">₹{money(p.mrp)}</td>
                          <td className="r c-disc">
                            <input
                              className="qt-cell-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={p.discount}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateProductDiscount(idx, e.target.value)
                              }
                            />
                          </td>
                          <td className="r c-qty">
                            <input
                              className="qt-cell-input"
                              type="number"
                              min="1"
                              value={p.quantity}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateProductQuantity(idx, e.target.value)
                              }
                            />
                          </td>
                          <td className="r">₹{money(unitPriceOf(p))}</td>
                          <td className="r amount">₹{money(lineTotalOf(p))}</td>
                          <td className="c-del">
                            <button
                              className="qt-icon-btn"
                              title="Remove item"
                              onClick={() => removeProduct(idx)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT: sticky summary */}
          <aside className="qt-summary">
            <div className="qt-summary-card">
              <h4>Summary</h4>
              <div className="qt-sum-row">
                <span>Customer</span>
                <b>{customer.name || "—"}</b>
              </div>
              <div className="qt-sum-row">
                <span>Items</span>
                <b>{products.length}</b>
              </div>
              <div className="qt-sum-row">
                <span>Total Qty</span>
                <b>{totals.qty}</b>
              </div>
              <div className="qt-sum-row">
                <span>Total MRP</span>
                <b>₹{money(totals.mrpTotal)}</b>
              </div>
              <div className="qt-sum-row saving">
                <span>You Save</span>
                <b>− ₹{money(totalSaving)}</b>
              </div>
              <div className="qt-grand">
                <span>Grand Total</span>
                <span>₹{money(totals.amount)}</span>
              </div>
            </div>

            {missing.length > 0 && (
              <div className="qt-missing">
                <b>To save, add:</b>
                <ul>
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* Bottom action bar */}
        <div className="qt-actions">
          <button className="qt-btn ghost" onClick={clearAll}>
            Clear All
          </button>
          <div className="qt-actions-right">
            <button className="qt-btn" onClick={handlePrint} disabled={!products.length}>
              🖨 Print Quotation
            </button>
            <button
              className="qt-btn primary big"
              onClick={saveQuotationData}
              disabled={!canSave}
            >
              {saving ? "Saving…" : "Save Quotation"}
            </button>
          </div>
        </div>
      </div>

      {/* PRINT TEMPLATE: only customer-facing fields (no MRP, no discount %) */}
      <div className="print-only">
        <div className="pr-company">
          <h1>{COMPANY.name}</h1>
          <p>{COMPANY.address}</p>
          <p>{COMPANY.contact}</p>
        </div>

        <h2 className="pr-title">QUOTATION</h2>

        <div className="pr-meta">
          <div>
            <p><b>To:</b> {customer.name}</p>
            <p><b>Phone:</b> {customer.phone}</p>
          </div>
          <div className="pr-right">
            <p><b>Date:</b> {today}</p>
          </div>
        </div>

        <table className="pr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product ID</th>
              <th>Product Name</th>
              <th className="r">Qty</th>
              <th className="r">Unit Price</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.productId}>
                <td>{idx + 1}</td>
                <td>{p.productId}</td>
                <td>{p.productName}</td>
                <td className="r">{p.quantity}</td>
                <td className="r">₹{money(unitPriceOf(p))}</td>
                <td className="r">₹{money(lineTotalOf(p))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className="r"><b>Grand Total</b></td>
              <td className="r"><b>₹{money(totals.amount)}</b></td>
            </tr>
          </tfoot>
        </table>

        <div className="pr-footer">
          <p>This quotation is valid for 15 days from the date of issue.</p>
          <div className="pr-sign">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}