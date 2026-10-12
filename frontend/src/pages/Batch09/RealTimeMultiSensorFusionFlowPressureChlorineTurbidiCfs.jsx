import React from 'react';
import AIWorkspace from "../../components/AIWorkspace";
const feature = {"id": "cfs-aiwaterutilitymanagement/real-time-multi-sensor-fusion-flow-pressure-chlorine-turbidi", "title": "Real-time multi-sensor fusion (flow, pressure, chlorine, turbidity) for anomaly detection", "description": "Prepare a reviewable water utility advisory report for real-time multi-sensor fusion (flow, pressure, chlorine, turbidity) for anomaly detection. Use actual utility records and verify illustrative examples before operational action.", "samples": []};
export default function FeaturePage({ token } = {}) { return <AIWorkspace feature={feature} token={token} />; }
