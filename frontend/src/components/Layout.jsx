import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Droplets, LayoutDashboard, Search, TrendingUp, Shield, Building2,
  AlertTriangle, Beaker, Users, Gauge, ClipboardList, PipetteIcon,
  Zap, Database, LogOut, Waves, Siren, Sparkles
} from 'lucide-react';

const aiLinks = [
  { to: '/ai-insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/leak-detection', icon: Search, label: 'Leak Detection' },
  { to: '/demand-forecast', icon: TrendingUp, label: 'Demand Forecasting' },
  { to: '/water-quality', icon: Shield, label: 'Water Quality' },
  { to: '/infrastructure-aging', icon: Building2, label: 'Infrastructure Aging' },
  { to: '/anomaly-detection', icon: AlertTriangle, label: 'Anomaly Detection' },
  { to: '/treatment-optimization', icon: Beaker, label: 'Treatment Optimization' },
  { to: '/emergency-response', icon: Siren, label: 'Emergency Response' },
];

const opsLinks = [
  { to: '/customers', icon: Users, label: 'Customer Management' },
  { to: '/meter-readings', icon: Gauge, label: 'Meter Readings' },
  { to: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
  { to: '/pipe-inventory', icon: PipetteIcon, label: 'Pipe Inventory' },
  { to: '/pump-stations', icon: Zap, label: 'Pump Stations' },
  { to: '/reservoirs', icon: Database, label: 'Reservoirs' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1><Droplets size={24} /> AquaFlow AI</h1>
          <p>Water Utility Management</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">AI-Powered Analytics</div>
            {aiLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <link.icon size={18} /> {link.label}
              </NavLink>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Operations Management</div>
            {opsLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <link.icon size={18} /> {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || 'User'}</div>
            <div className="sidebar-user-role">{user.role || 'Operator'}</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
