import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BDMCommissionCalculatorV2 from "./BDMCommissionCalculatorV2";
import AusFteGpCalculator from "./AusFteGpCalculator";
import AusContractorGpCalculator from "./AusContractorGpCalculator";
import PhpContractorGpCalculator from "./PhpContractorGpCalculator";
import PhpFteGpCalculator from "./PhpFteGpCalculator";
import Home from "./Home";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bdm-calculator-v2" element={<BDMCommissionCalculatorV2 />} />
        <Route path="/aus-fte-gp" element={<AusFteGpCalculator />} />
        <Route path="/aus-contractor-gp" element={<AusContractorGpCalculator />} />
        <Route path="/php-contractor-gp" element={<PhpContractorGpCalculator />} />
        <Route path="/php-fte-gp" element={<PhpFteGpCalculator />} />
      </Routes>
    </Router>
  );
}

export default App;