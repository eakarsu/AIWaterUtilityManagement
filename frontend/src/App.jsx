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
import EmergencyResponsePage from './pages/EmergencyResponsePage';
import AIInsightsPage from './pages/AIInsightsPage';

// // === Batch 09 Gaps & Frontend Mounts ===
const RealTimeMultiSensorFusionFlowPressureChlorineTurbidiCfs = React.lazy(() => import('./pages/Batch09/RealTimeMultiSensorFusionFlowPressureChlorineTurbidiCfs'));
const WaterDemandNowcastingFromWeatherEventsTimeOfDayCfs = React.lazy(() => import('./pages/Batch09/WaterDemandNowcastingFromWeatherEventsTimeOfDayCfs'));
const MeterAnalyticsDrivingConservationIncentiveProgramsCfs = React.lazy(() => import('./pages/Batch09/MeterAnalyticsDrivingConservationIncentiveProgramsCfs'));
const EmergencyResponseIntegrationForMainBreaksCfs = React.lazy(() => import('./pages/Batch09/EmergencyResponseIntegrationForMainBreaksCfs'));
const PublicWaterQualityDashboardCfs = React.lazy(() => import('./pages/Batch09/PublicWaterQualityDashboardCfs'));
const SmartMeterRolloutOrchestrationWithHandOffToBillingCfs = React.lazy(() => import('./pages/Batch09/SmartMeterRolloutOrchestrationWithHandOffToBillingCfs'));
const PreventiveMaintenanceSchedulingAiGapAi = React.lazy(() => import('./pages/Batch09/PreventiveMaintenanceSchedulingAiGapAi'));
const CustomerSegmentDemandModelingGapAi = React.lazy(() => import('./pages/Batch09/CustomerSegmentDemandModelingGapAi'));
const ComputerVisionPipeInspectionFromCameraFeedsGapAi = React.lazy(() => import('./pages/Batch09/ComputerVisionPipeInspectionFromCameraFeedsGapAi'));
const CustomerBillingAndMeterToCashFlowGapNon = React.lazy(() => import('./pages/Batch09/CustomerBillingAndMeterToCashFlowGapNon'));
const ServiceDisruptionNotificationSmsemailGapNon = React.lazy(() => import('./pages/Batch09/ServiceDisruptionNotificationSmsemailGapNon'));
const FullGisMapIntegrationForPipeNetworkGapNon = React.lazy(() => import('./pages/Batch09/FullGisMapIntegrationForPipeNetworkGapNon'));
const PermitregulatoryTrackingAndReportingGapNon = React.lazy(() => import('./pages/Batch09/PermitregulatoryTrackingAndReportingGapNon'));
const PublicFacingTransparencyPortalGapNon = React.lazy(() => import('./pages/Batch09/PublicFacingTransparencyPortalGapNon'));

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
        <Route path="/emergency-response" element={<ProtectedRoute><EmergencyResponsePage /></ProtectedRoute>} />
        <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      
      {/* // === Batch 09 Gaps & Frontend Mounts === */}
        <Route path="/batch09/cfs/real-time-multi-sensor-fusion-flow-pressure-chlorine-turbidi" element={<React.Suspense fallback={<div>Loading...</div>}><RealTimeMultiSensorFusionFlowPressureChlorineTurbidiCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/water-demand-nowcasting-from-weather-events-time-of-day" element={<React.Suspense fallback={<div>Loading...</div>}><WaterDemandNowcastingFromWeatherEventsTimeOfDayCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/meter-analytics-driving-conservation-incentive-programs" element={<React.Suspense fallback={<div>Loading...</div>}><MeterAnalyticsDrivingConservationIncentiveProgramsCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/emergency-response-integration-for-main-breaks" element={<React.Suspense fallback={<div>Loading...</div>}><EmergencyResponseIntegrationForMainBreaksCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/public-water-quality-dashboard" element={<React.Suspense fallback={<div>Loading...</div>}><PublicWaterQualityDashboardCfs /></React.Suspense>} />
        <Route path="/batch09/cfs/smart-meter-rollout-orchestration-with-hand-off-to-billing" element={<React.Suspense fallback={<div>Loading...</div>}><SmartMeterRolloutOrchestrationWithHandOffToBillingCfs /></React.Suspense>} />
        <Route path="/batch09/gap-ai/preventive-maintenance-scheduling-ai" element={<React.Suspense fallback={<div>Loading...</div>}><PreventiveMaintenanceSchedulingAiGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-ai/customer-segment-demand-modeling" element={<React.Suspense fallback={<div>Loading...</div>}><CustomerSegmentDemandModelingGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-ai/computer-vision-pipe-inspection-from-camera-feeds" element={<React.Suspense fallback={<div>Loading...</div>}><ComputerVisionPipeInspectionFromCameraFeedsGapAi /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/customer-billing-and-meter-to-cash-flow" element={<React.Suspense fallback={<div>Loading...</div>}><CustomerBillingAndMeterToCashFlowGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/service-disruption-notification-smsemail" element={<React.Suspense fallback={<div>Loading...</div>}><ServiceDisruptionNotificationSmsemailGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/full-gis-map-integration-for-pipe-network" element={<React.Suspense fallback={<div>Loading...</div>}><FullGisMapIntegrationForPipeNetworkGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/permitregulatory-tracking-and-reporting" element={<React.Suspense fallback={<div>Loading...</div>}><PermitregulatoryTrackingAndReportingGapNon /></React.Suspense>} />
        <Route path="/batch09/gap-nonai/public-facing-transparency-portal" element={<React.Suspense fallback={<div>Loading...</div>}><PublicFacingTransparencyPortalGapNon /></React.Suspense>} />

      </Routes>
    </>
  );
}
