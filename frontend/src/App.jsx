import React, { useState, useEffect } from 'react';
import { Menu, Brain } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('Ask Question');
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle escape to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`app-container ${theme}`}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <Brain size={24} color="var(--primary)" />
          <span>Probably RAG</span>
        </div>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open Navigation Menu"
          aria-expanded={isSidebarOpen}
          aria-controls="main-sidebar"
        >
          <Menu size={24} />
        </button>
      </header>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
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
