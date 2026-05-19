import { Waves } from 'lucide-react';
import ConsumptionTrendChart from '../components/ConsumptionTrendChart';
import LeakHeatmap from '../components/LeakHeatmap';
import BillPdfGenerator from '../components/BillPdfGenerator';
import TariffRulesEditor from '../components/TariffRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
        <Waves size={28} color="#00b4d8" />
        <h1 data-testid="custom-views-title"
          style={{ color: '#e0e6ed', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
          Water Views
        </h1>
      </div>
      <p style={{ color: '#7a8ba8', margin: '4px 0 24px 0', fontSize: 14 }}>
        Custom dashboards: consumption trend, leak heatmap, billing PDF, and tariff rules editor.
      </p>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))' }}>
        <ConsumptionTrendChart />
        <LeakHeatmap />
        <BillPdfGenerator />
        <TariffRulesEditor />
      </div>
    </div>
  );
}
