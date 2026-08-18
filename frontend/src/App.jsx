import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('Ask Question');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        <div className="top-bar">
          <div className="dashboard-header">
            <h1 className="brand-font">PROBABLY RAG</h1>
            <p>AI Clinical Decision Support Hackathon — Final Product</p>
          </div>
        </div>
        <Dashboard activeTab={activeTab} />
      </main>
    </div>
  );
}

export default App;
