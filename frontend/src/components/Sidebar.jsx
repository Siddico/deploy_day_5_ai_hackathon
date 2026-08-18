import React from 'react';
import { MessageSquare, History, FileText, Info, Settings, LogOut, Shield } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Shield size={24} color="var(--primary)" />
        <span>Clinical Decision Support <span className="badge">LITE</span></span>
      </div>

      <nav className="nav-links">
        <a href="#" className="nav-link active">
          <MessageSquare size={18} />
          Ask Question
        </a>
        <a href="#" className="nav-link">
          <History size={18} />
          History
        </a>
        <a href="#" className="nav-link">
          <FileText size={18} />
          Sources
        </a>
        <a href="#" className="nav-link">
          <Info size={18} />
          About
        </a>
      </nav>

      <div className="sidebar-footer">
        <a href="#" className="nav-link">
          <Settings size={18} />
          Settings
        </a>
        <a href="#" className="nav-link">
          <LogOut size={18} />
          Logout
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
