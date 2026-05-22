import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Download } from 'lucide-react';

export default function BillPdfGenerator() {
  const [form, setForm] = useState({
    account_number: 'ACC-100237',
    customer_name: 'Jane Rivera',
    address: '4218 Lakeside Ave, Springfield',
    usage_gallons: 7400,
    period: new Date().toISOString().slice(0, 7),
  });
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generatePreview = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/custom-views/bill-pdf?format=json', form);
      setPreview(data);
      toast.success(`Bill calculated — $${data.grand_total}`);
    } catch (e) {
      toast.error('Failed to generate bill');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/custom-views/bill-pdf', form, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill-${form.account_number}-${form.period}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', background: '#0a1628',
    border: '1px solid #253a5c', borderRadius: 8, color: '#e0e6ed', fontSize: 13, boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#111d35', border: '1px solid #253a5c', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <FileText size={20} color="#00c853" />
        <h3 style={{ margin: 0, color: '#e0e6ed', fontSize: 16, fontWeight: 600 }}>Water Bill / Usage PDF</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Account #"><input style={inputStyle} value={form.account_number} onChange={e => upd('account_number', e.target.value)} /></Field>
        <Field label="Customer"><input style={inputStyle} value={form.customer_name} onChange={e => upd('customer_name', e.target.value)} /></Field>
        <Field label="Address"><input style={inputStyle} value={form.address} onChange={e => upd('address', e.target.value)} /></Field>
        <Field label="Billing Period"><input type="month" style={inputStyle} value={form.period} onChange={e => upd('period', e.target.value)} /></Field>
        <Field label="Usage (gallons)"><input type="number" style={inputStyle} value={form.usage_gallons} onChange={e => upd('usage_gallons', Number(e.target.value))} /></Field>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={generatePreview} disabled={submitting}
          style={{ background: 'linear-gradient(135deg,#00b4d8,#0096c7)', color: 'white', border: 'none',
            padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          Preview Charges
        </button>
        <button onClick={downloadPdf} disabled={submitting}
          style={{ background: 'rgba(0,200,83,0.15)', color: '#00c853', border: '1px solid rgba(0,200,83,0.4)',
            padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
            display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Download size={14} /> Download PDF
        </button>
      </div>

      {preview && (
        <div style={{ marginTop: 16, background: '#0a1628', border: '1px solid #1d2f4d', borderRadius: 8, padding: 14 }}>
          <div style={{ color: '#7a8ba8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Tier Breakdown</div>
          {preview.breakdown.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#e0e6ed', fontSize: 13, padding: '4px 0' }}>
              <span>{b.tier} · {b.gallons} gal</span>
              <span>${b.cost.toFixed(2)}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #1d2f4d', margin: '10px 0' }} />
          <Row label="Service Charge" value={`$${preview.fixed_service_charge.toFixed(2)}`} />
          <Row label="Tax" value={`$${preview.tax.toFixed(2)}`} />
          <Row label="Amount Due" value={`$${preview.grand_total.toFixed(2)}`} bold />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ color: '#7a8ba8', fontSize: 11, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      color: bold ? '#00c853' : '#e0e6ed', fontSize: 13, fontWeight: bold ? 700 : 400, padding: '4px 0' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
