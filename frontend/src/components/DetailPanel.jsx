import { useEffect } from 'react';
import { X, Sparkles, Brain } from 'lucide-react';

function AIAnalysisSection({ analysis }) {
  if (!analysis) return null;

  const formatText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, i) => {
      // Bold text formatting
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const formatted = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );

      // Numbered items
      if (/^\d+[\.\)]\s/.test(line)) {
        return (
          <div key={i} className="ai-inline-numbered">
            {formatted}
          </div>
        );
      }

      // Bullet points
      if (/^[-*]\s/.test(line.trim())) {
        return (
          <div key={i} className="ai-inline-bullet">
            <span className="bullet-dot" />
            <span>{formatted}</span>
          </div>
        );
      }

      // Regular paragraph
      return <p key={i} className="ai-inline-paragraph">{formatted}</p>;
    });
  };

  return (
    <div className="panel-ai-section">
      <div className="panel-ai-header">
        <Sparkles size={18} className="ai-sparkle" />
        <span>AI Analysis</span>
        <span className="text-muted text-sm">Powered by Claude AI</span>
      </div>
      <div className="panel-ai-content">
        {typeof analysis === 'string' ? formatText(analysis) : (
          <div className="ai-analysis-empty-inline">
            <Brain size={32} />
            <p className="text-muted">No AI analysis available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailPanel({ isOpen, onClose, title, data, fields, actions = [], aiAnalysis }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>{title}</h2>
          <button className="panel-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="panel-body">
          {fields.map(f => (
            <div key={f.key} className="panel-field">
              <span className="panel-label">{f.label}</span>
              <span className="panel-value">{data?.[f.key] ?? '\u2014'}</span>
            </div>
          ))}
          {aiAnalysis && <AIAnalysisSection analysis={aiAnalysis} />}
        </div>
        <div className="panel-actions">
          {actions.map((a, i) => (
            <button
              key={i}
              className={`btn btn-${a.variant || 'primary'}`}
              onClick={a.onClick}
            >
              {a.variant === 'ai' && <Sparkles size={16} />}
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
