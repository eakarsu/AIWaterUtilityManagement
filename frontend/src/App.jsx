import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LeakDetectionPage from './pages/LeakDetectionPage';
import DemandForecastPage from './pages/DemandForecastPage';
import WaterQualityPage from './pages/WaterQualityPage';
import InfrastructureAgingPage from './pages/InfrastructureAgingPage';
import AnomalyDetectionPage from './pages/AnomalyDetectionPage';
import TreatmentOptimizationPage from './pages/TreatmentOptimizationPage';
import CustomersPage from './pages/CustomersPage';
import MeterReadingsPage from './pages/MeterReadingsPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import PipeInventoryPage from './pages/PipeInventoryPage';
import PumpStationsPage from './pages/PumpStationsPage';
import ReservoirsPage from './pages/ReservoirsPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2d4d',
            color: '#e0e6ed',
            border: '1px solid #253a5c',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leak-detection" element={<ProtectedRoute><LeakDetectionPage /></ProtectedRoute>} />
        <Route path="/demand-forecast" element={<ProtectedRoute><DemandForecastPage /></ProtectedRoute>} />
        <Route path="/water-quality" element={<ProtectedRoute><WaterQualityPage /></ProtectedRoute>} />
        <Route path="/infrastructure-aging" element={<ProtectedRoute><InfrastructureAgingPage /></ProtectedRoute>} />
        <Route path="/anomaly-detection" element={<ProtectedRoute><AnomalyDetectionPage /></ProtectedRoute>} />
        <Route path="/treatment-optimization" element={<ProtectedRoute><TreatmentOptimizationPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/meter-readings" element={<ProtectedRoute><MeterReadingsPage /></ProtectedRoute>} />
        <Route path="/work-orders" element={<ProtectedRoute><WorkOrdersPage /></ProtectedRoute>} />
        <Route path="/pipe-inventory" element={<ProtectedRoute><PipeInventoryPage /></ProtectedRoute>} />
        <Route path="/pump-stations" element={<ProtectedRoute><PumpStationsPage /></ProtectedRoute>} />
        <Route path="/reservoirs" element={<ProtectedRoute><ReservoirsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
