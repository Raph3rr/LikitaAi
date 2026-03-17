import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Conditions from "./components/Conditions";
import SymptomChecker from "./components/SymptomChecker";
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/conditions" element={<Conditions />} />
        <Route path="/symptom-checker" element={<SymptomChecker />} />
      </Routes>
    </Router>
  );
}

export default App;


