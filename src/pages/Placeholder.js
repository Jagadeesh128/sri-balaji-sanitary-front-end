import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Placeholder.css";

export default function Placeholder({ title }) {
  const navigate = useNavigate();
  return (
    <div className="placeholder-page">
      <Header />
      <div className="placeholder-content">
        <h2>{title}</h2>
        <p>Development in process</p>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
