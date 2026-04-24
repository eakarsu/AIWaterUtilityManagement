import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  TrendingUp,
  Beaker,
  Building2,
  Activity,
  FlaskConical,
  Users,
  Gauge,
  ClipboardList,
  Pipette,
  Zap,
  Database,
  BarChart3,
  Droplets,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AI_FEATURES = [
  {
    title: 'Leak Detection',
    icon: AlertTriangle,
    color: '#ef5350',
    desc: 'AI-powered pressure and flow analysis for leak detection',
    route: '/leak-detection',
  },
  {
    title: 'Demand Forecasting',
    icon: TrendingUp,
    color: '#00b4d8',
    desc: 'Predict water demand using AI weather and usage analysis',
    route: '/demand-forecasting',
  },
  {
    title: 'Water Quality',
    icon: Beaker,
    color: '#00c853',
    desc: 'AI compliance monitoring for water quality parameters',
    route: '/water-quality',
  },
  {
    title: 'Infrastructure Aging',
    icon: Building2,
    color: '#ffa726',
    desc: 'AI predictive analysis for infrastructure lifecycle',
    route: '/infrastructure',
  },
  {
    title: 'Anomaly Detection',
    icon: Activity,
    color: '#ab47bc',
    desc: 'AI pattern recognition for consumption anomalies',
    route: '/anomaly-detection',
  },
  {
    title: 'Treatment Optimization',
    icon: FlaskConical,
    color: '#26c6da',
    desc: 'AI-optimized chemical dosing and treatment processes',
    route: '/treatment-optimization',
  },
];

const OPS_FEATURES = [
  {
    title: 'Customer Management',
    icon: Users,
    color: '#42a5f5',
    route: '/customers',
  },
  {
    title: 'Meter Readings',
    icon: Gauge,
    color: '#66bb6a',
    route: '/meter-readings',
  },
  {
    title: 'Work Orders',
    icon: ClipboardList,
    color: '#ffa726',
    route: '/work-orders',
  },
  {
    title: 'Pipe Inventory',
    icon: Pipette,
    color: '#78909c',
    route: '/pipes',
  },
  {
    title: 'Pump Stations',
    icon: Zap,
    color: '#ab47bc',
    route: '/pump-stations',
  },
  {
    title: 'Reservoirs',
    icon: Database,
    color: '#26c6da',
    route: '/reservoirs',
  },
];

const STAT_CONFIG = [
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, color: '#42a5f5' },
  { key: 'activeLeakAlerts', label: 'Active Leak Alerts', icon: AlertTriangle, color: '#ef5350' },
  { key: 'pendingWorkOrders', label: 'Pending Work Orders', icon: Wrench, color: '#ffa726' },
  { key: 'complianceRate', label: 'Compliance Rate', icon: ShieldCheck, color: '#00c853', suffix: '%' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || user.email || 'Operator';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setStats(data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div style={{ padding: '0' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#e0e6ed', margin: '0 0 4px 0' }}>
          Welcome back, {userName}
        </h1>
        <p style={{ color: '#7a8ba8', fontSize: '14px', margin: 0 }}>{formatDate()}</p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        {STAT_CONFIG.map((stat) => {
          const Icon = stat.icon;
          const value = stats?.[stat.key] ?? '--';
          return (
            <div
              key={stat.key}
              style={{
                background: '#111d35',
                borderRadius: '12px',
                padding: '24px',
                borderLeft: `4px solid ${stat.color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#e0e6ed', lineHeight: 1.1 }}>
                  {value}{stat.suffix || ''}
                </div>
                <div style={{ fontSize: '13px', color: '#7a8ba8', marginTop: '2px' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI-Powered Analytics Section */}
      <SectionHeader
        icon={<BarChart3 size={20} color="#00b4d8" />}
        title="AI-Powered Analytics"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        {AI_FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            isAI
            onClick={() => navigate(feature.route)}
          />
        ))}
      </div>

      {/* Operations Management Section */}
      <SectionHeader
        icon={<Wrench size={20} color="#ffa726" />}
        title="Operations Management"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {OPS_FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            onClick={() => navigate(feature.route)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
      }}
    >
      {icon}
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e0e6ed', margin: 0 }}>{title}</h2>
    </div>
  );
}

function FeatureCard({ feature, isAI = false, onClick }) {
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111d35',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${feature.color}30`
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* AI Badge */}
      {isAI && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.5px',
          }}
        >
          AI
        </span>
      )}

      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: `${feature.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={22} color={feature.color} />
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e0e6ed', margin: '0 0 6px 0' }}>
        {feature.title}
      </h3>

      {feature.desc && (
        <p style={{ fontSize: '13px', color: '#7a8ba8', margin: 0, lineHeight: 1.5 }}>
          {feature.desc}
        </p>
      )}
    </div>
  );
}
