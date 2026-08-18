import React from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="top-bar">
          <div className="dashboard-header">
            <h1>DAY 5 — FINAL DELIVERABLE EXAMPLE</h1>
            <p>AI Clinical Decision Support Lite Hackathon — Final Product</p>
          </div>
        </div>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
