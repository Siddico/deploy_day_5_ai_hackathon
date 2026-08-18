import React from 'react';
import { MessageSquare, History, FileText, Info, Settings, LogOut, Brain, Sun, Moon } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, theme, toggleTheme }) => {
  const mainLinks = [
    { name: 'Ask Question', icon: <MessageSquare size={18} /> },
    { name: 'History', icon: <History size={18} /> },
    { name: 'Sources', icon: <FileText size={18} /> },
    { name: 'About', icon: <Info size={18} /> }
  ];

  const footerLinks = [
    { name: 'Settings', icon: <Settings size={18} /> },
    { name: 'Logout', icon: <LogOut size={18} /> }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Brain size={28} color="var(--primary)" />
        <span style={{fontWeight: 700, letterSpacing: '0.5px'}}>Probably RAG</span>
      </div>

      <nav className="nav-links">
        {mainLinks.map(link => (
          <div 
            key={link.name}
            className={`nav-link ${activeTab === link.name ? 'active' : ''}`}
            onClick={() => setActiveTab(link.name)}
          >
            {link.icon}
            {link.name}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-link" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </div>
        
        {footerLinks.map(link => (
          <div 
            key={link.name}
            className={`nav-link ${activeTab === link.name ? 'active' : ''}`}
            onClick={() => setActiveTab(link.name)}
          >
            {link.icon}
            {link.name}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
