import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileInvoiceDollar,
  FaClipboardList,
  FaBoxes,
  FaTags,
} from "react-icons/fa";
import Header from "../components/Header";
import "./Dashboard.css";

const tiles = [
  {
    label: "Quotations",
    icon: <FaFileInvoiceDollar size={56} />,
    path: "/quotations",
    color: "#3b82f6",
  },
  {
    label: "View Quotations",
    icon: <FaClipboardList size={56} />,
    path: "/view-quotations",
    color: "#10b981",
  },
  {
    label: "Stock Management",
    icon: <FaBoxes size={56} />,
    path: "/stock-management",
    color: "#f59e0b",
  },
  {
    label: "Categories",
    icon: <FaTags size={56} />,
    path: "/categories",
    color: "#ef4444",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-grid">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="dashboard-tile"
            style={{ borderTop: `6px solid ${tile.color}` }}
            onClick={() => navigate(tile.path)}
          >
            <div className="tile-icon" style={{ color: tile.color }}>
              {tile.icon}
            </div>
            <div className="tile-label">{tile.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
