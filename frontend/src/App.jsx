import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('Ask Question');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <div className="top-bar">
          <div className="dashboard-header">
            <h1 className="brand-font">DAY 5 — FINAL DELIVERABLE EXAMPLE</h1>
            <p>AI Clinical Decision Support Lite Hackathon — Final Product</p>
          </div>
        </div>
        <Dashboard activeTab={activeTab} />
      </main>
    </div>
  );
}

export default App;
