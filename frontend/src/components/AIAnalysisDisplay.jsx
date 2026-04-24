import { Sparkles, Brain, AlertCircle, CheckCircle, TrendingUp, Shield } from 'lucide-react';

const SECTION_ICONS = {
  risk: AlertCircle,
  warning: AlertCircle,
  alert: AlertCircle,
  success: CheckCircle,
  complete: CheckCircle,
  resolved: CheckCircle,
  trend: TrendingUp,
  forecast: TrendingUp,
  prediction: TrendingUp,
  security: Shield,
  compliance: Shield,
  safety: Shield,
};

function getSectionIcon(text) {
  const lower = text.toLowerCase();
  for (const [keyword, Icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(keyword)) return Icon;
  }
  return null;
}

function formatInlineText(text) {
  // Split on bold markers and return mixed array of strings and <strong> elements
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function parseSection(section, index) {
  const lines = section.split('\n').filter(line => line.trim());
  if (lines.length === 0) return null;

  let heading = null;
  let bodyLines = lines;

  // Check if first line is a numbered heading or markdown heading
  const numberedMatch = lines[0].match(/^(\d+[\.\)])\s+(.+)/);
  const hashMatch = lines[0].match(/^#{1,3}\s+(.+)/);
  const boldLineMatch = lines[0].match(/^\*\*([^*]+)\*\*:?\s*(.*)/);

  if (numberedMatch) {
    heading = { number: numberedMatch[1], text: numberedMatch[2] };
    bodyLines = lines.slice(1);
  } else if (hashMatch) {
    heading = { text: hashMatch[1] };
    bodyLines = lines.slice(1);
  } else if (boldLineMatch) {
    heading = { text: boldLineMatch[1] };
    // If there's text after the bold header on the same line, keep it
    if (boldLineMatch[2]) {
      bodyLines = [boldLineMatch[2], ...lines.slice(1)];
    } else {
      bodyLines = lines.slice(1);
    }
  }

  const SectionIcon = heading ? getSectionIcon(heading.text) : null;

  return (
    <div key={index} className="ai-section">
      {heading && (
        <div className="ai-section-heading">
          {heading.number && <span className="ai-section-number">{heading.number}</span>}
          {SectionIcon && <SectionIcon size={16} className="ai-section-icon" />}
          <span>{formatInlineText(heading.text)}</span>
        </div>
      )}
      <div className="ai-section-content">
        {bodyLines.map((line, i) => {
          const trimmed = line.trim();

          // Bullet points
          if (/^[-*]\s/.test(trimmed)) {
            const bulletText = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={i} className="ai-bullet">
                <span className="ai-bullet-dot" />
                <span>{formatInlineText(bulletText)}</span>
              </div>
            );
          }

          // Sub-numbered items (e.g., a., b., or i., ii.)
          if (/^[a-z][\.\)]\s/i.test(trimmed)) {
            return (
              <div key={i} className="ai-sub-item">
                {formatInlineText(trimmed)}
              </div>
            );
          }

          // Regular text
          return (
            <p key={i} className="ai-paragraph">
              {formatInlineText(trimmed)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function AIAnalysisDisplay({ analysis, timestamp }) {
  if (!analysis) {
    return (
      <div className="ai-analysis-empty">
        <Brain size={48} className="ai-empty-icon" />
        <p className="ai-empty-title">No AI analysis yet</p>
        <p className="text-muted">Click &quot;Run AI Analysis&quot; to generate insights</p>
      </div>
    );
  }

  const formatAnalysis = (text) => {
    // Split into sections by numbered items, markdown headings, or bold-line headers
    const sections = text
      .split(/\n(?=\d+[\.\)]\s|#{1,3}\s|\*\*[^*]+\*\*:?\s*\n)/)
      .filter(s => s.trim());

    return sections.map((section, i) => parseSection(section, i));
  };

  return (
    <div className="ai-analysis-card">
      <div className="ai-analysis-header">
        <div className="ai-analysis-header-icon">
          <Sparkles size={20} className="ai-sparkle" />
        </div>
        <div className="ai-analysis-header-text">
          <h3>AI Analysis</h3>
          <span className="text-muted text-sm">Powered by Claude AI</span>
        </div>
      </div>
      <div className="ai-analysis-body">
        {formatAnalysis(analysis)}
      </div>
      {timestamp && (
        <div className="ai-analysis-footer">
          <span className="text-muted text-sm">
            Analyzed: {new Date(timestamp).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
