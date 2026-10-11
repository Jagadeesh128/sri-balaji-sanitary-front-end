import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Quotations from "./Quotations";
import { getQuotations, getQuotationById } from "../services/api";
import "./ViewQuotations.css";

const pad = (n) => String(n).padStart(2, "0");

const monthKeyOf = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const monthLabelOf = (key) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateOf = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Same math as the quotation screen: MRP less discount, times quantity
const amountOf = (q) =>
  (q.products || []).reduce((sum, p) => {
    const unit = Number(p.mrp) - (Number(p.mrp) * Number(p.discount)) / 100;
    return sum + unit * Number(p.quantity);
  }, 0);

export default function ViewQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [openingId, setOpeningId] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getQuotations();
      setQuotations(res.data || []);
    } catch {
      setError("Could not load quotations. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  // Months that exist in the data, newest first
  const months = useMemo(() => {
    const keys = [...new Set(quotations.map((q) => monthKeyOf(q.createdAt)))];
    return keys.sort().reverse();
  }, [quotations]);

  // Apply month + search filters, then group by month
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = quotations
      .filter(
        (q) => monthFilter === "all" || monthKeyOf(q.createdAt) === monthFilter
      )
      .filter(
        (q) =>
          !term ||
          String(q.customerName || "").toLowerCase().includes(term) ||
          String(q.quotationNo || "").toLowerCase().includes(term)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const map = new Map();
    filtered.forEach((q) => {
      const key = monthKeyOf(q.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    });

    return [...map.entries()].map(([key, list]) => ({
      key,
      list,
      total: list.reduce((s, q) => s + amountOf(q), 0),
    }));
  }, [quotations, search, monthFilter]);

  const visibleCount = groups.reduce((s, g) => s + g.list.length, 0);

  const thisMonthKey = monthKeyOf(new Date());
  const thisMonth = quotations.filter(
    (q) => monthKeyOf(q.createdAt) === thisMonthKey
  );
  const thisMonthTotal = thisMonth.reduce((s, q) => s + amountOf(q), 0);

  const openQuotation = async (q) => {
    if (openingId) return;
    setOpeningId(q.id);
    setError("");
    try {
      const res = await getQuotationById(q.id);
      setSelected(res.data);
    } catch {
      setError("Could not open this quotation. Please try again.");
    } finally {
      setOpeningId(null);
    }
  };

  const handleDone = (msg) => {
    setSelected(null);
    if (msg) setFlash(msg);
    fetchAll();
  };

  // Edit view: reuse the quotation screen, pre-filled with the saved data
  if (selected) {
    return <Quotations quotation={selected} onDone={handleDone} />;
  }

  const filtersActive = search.trim() !== "" || monthFilter !== "all";

  return (
    <div className="qt-page">
      <Header />

      {flash && (
        <div className="qt-toast qt-toast-success" role="status">
          {flash}
        </div>
      )}

      <div className="vq-screen">
        {/* Top bar with stats */}
        <div className="vq-topbar">
          <div>
            <h2>Quotations</h2>
            <span className="vq-sub">Click any quotation to view or edit it</span>
          </div>
          <div className="vq-stats">
            <div className="vq-stat">
              <span>Total</span>
              <b>{quotations.length}</b>
            </div>
            <div className="vq-stat">
              <span>This month</span>
              <b>{thisMonth.length}</b>
            </div>
            <div className="vq-stat">
              <span>This month value</span>
              <b>₹{money(thisMonthTotal)}</b>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="vq-filters">
          <input
            className="vq-search"
            placeholder="Search by customer name or quotation no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabelOf(m)}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              className="qt-btn ghost"
              onClick={() => {
                setSearch("");
                setMonthFilter("all");
              }}
            >
              Reset
            </button>
          )}
          <span className="vq-count">{visibleCount} result(s)</span>
        </div>

        {error && <div className="vq-error">{error}</div>}

        {/* List */}
        {loading ? (
          <div className="vq-empty">Loading quotations…</div>
        ) : groups.length === 0 ? (
          <div className="vq-empty">
            {quotations.length === 0
              ? "No quotations saved yet."
              : "No quotations match your search."}
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key} className="vq-month">
              <header className="vq-month-head">
                <h3>{monthLabelOf(g.key)}</h3>
                <span>
                  {g.list.length} quotation(s) · ₹{money(g.total)}
                </span>
              </header>

              <div className="vq-table-wrap">
                <table className="qt-table">
                  <thead>
                    <tr>
                      <th>Quotation No</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Category</th>
                      <th className="r">Items</th>
                      <th className="r">Amount</th>
                      <th className="r" />
                    </tr>
                  </thead>
                  <tbody>
                    {g.list.map((q) => (
                      <tr
                        key={q.id}
                        className="vq-row"
                        onClick={() => openQuotation(q)}
                      >
                        <td>
                          <b>{q.id}</b>
                        </td>
                        <td>{dateOf(q.createdAt)}</td>
                        <td>{q.customerName}</td>
                        <td>{q.contactNo}</td>
                        <td>{q.category}</td>
                        <td className="r">{q.products?.length || 0}</td>
                        <td className="r amount">₹{money(amountOf(q))}</td>
                        <td className="r">
                          <span className="vq-open">
                            {openingId === q.id ? "Opening…" : "Open →"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}