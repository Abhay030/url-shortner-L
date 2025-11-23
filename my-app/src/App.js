import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CodeStatsPage from './components/CodeStatsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/code/:code" element={<CodeStatsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
