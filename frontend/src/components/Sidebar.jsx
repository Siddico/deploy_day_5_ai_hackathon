import React from 'react';
import { MessageSquare, History, FileText, Info, Settings, LogOut, Shield } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
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
        <Shield size={24} color="var(--primary)" />
        <span>Decision Support <span className="badge">LITE</span></span>
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
