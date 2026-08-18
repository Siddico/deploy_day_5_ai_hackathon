import React from 'react';
import { MessageSquare, History, FileText, Info, Settings, LogOut, Brain, Sun, Moon } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, theme, toggleTheme, isOpen, setIsOpen }) => {
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

  const handleNavClick = (name) => {
    setActiveTab(name);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`drawer-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      
      <aside id="main-sidebar" className={`sidebar ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="sidebar-header">
          <Brain size={28} color="var(--primary)" />
          <span style={{fontWeight: 700, letterSpacing: '0.5px'}}>Probably RAG</span>
        </div>

        <nav className="nav-links">
          {mainLinks.map(link => (
            <button 
              key={link.name}
              className={`nav-link ${activeTab === link.name ? 'active' : ''}`}
              onClick={() => handleNavClick(link.name)}
              aria-current={activeTab === link.name ? 'page' : undefined}
              style={{ background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {link.icon}
              {link.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-link" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{ background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          {footerLinks.map(link => (
            <button 
              key={link.name}
              className={`nav-link ${activeTab === link.name ? 'active' : ''}`}
              onClick={() => handleNavClick(link.name)}
              style={{ background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {link.icon}
              {link.name}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
