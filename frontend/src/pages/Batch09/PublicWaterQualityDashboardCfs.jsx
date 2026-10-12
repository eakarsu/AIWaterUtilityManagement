import React from 'react';
import AIWorkspace from "../../components/AIWorkspace";
const feature = {"id": "cfs-aiwaterutilitymanagement/public-water-quality-dashboard", "title": "Public water quality dashboard", "description": "Prepare a reviewable water utility advisory report for public water quality dashboard. Use actual utility records and verify illustrative examples before operational action.", "samples": []};
export default function FeaturePage({ token } = {}) { return <AIWorkspace feature={feature} token={token} />; }
