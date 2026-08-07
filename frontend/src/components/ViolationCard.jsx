const SEVERITY_STYLE = {
  critical: {
    label: '🚨 Critical Violation',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
  moderate: {
    label: '⚠️ Moderate Issue',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  minor: {
    label: 'ℹ️ Minor Warning',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  suspicious: {
    label: '🔍 Suspicious / Predatory',
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-900 border-purple-200',
  },
};

export default function ViolationCard({ violation, selected, onToggleSelect, onStatusChange }) {
  const isSuspicious = violation.rule_id?.includes('suspicious') || violation.clause_type === 'suspicious_clause';
  const typeKey = isSuspicious ? 'suspicious' : (violation.severity || 'minor');
  const sev = SEVERITY_STYLE[typeKey] || SEVERITY_STYLE.minor;
  const confidencePct = Math.round((violation.confidence ?? 0) * 100);

  return (
    <div className={`border ${sev.border} ${sev.bg} rounded-lg p-5 mb-4 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 w-full">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(violation.id)}
              className="mt-1 h-4 w-4 rounded accent-red-600 cursor-pointer"
              aria-label="Include in dispute letter"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${sev.badge}`}>
                {sev.label}
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
                {confidencePct}% confidence
              </span>
              {violation.rule_id && (
                <span className="font-mono text-[11px] text-slate-400">
                  {violation.rule_id}
                </span>
              )}
            </div>

            <div className="bg-white/90 rounded border border-slate-200/70 p-3 my-2 text-sm text-slate-800 italic leading-relaxed">
              &ldquo;{violation.clause_text}&rdquo;
            </div>

            <p className="text-sm font-medium text-slate-900 leading-normal mt-2">
              {violation.explanation}
            </p>

            {violation.legal_reference && (
              <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-100/80 rounded px-2.5 py-1 inline-block">
                ⚖️ Legal Basis: {violation.legal_reference}
              </div>
            )}
          </div>
        </div>

        {onStatusChange && (
          <select
            value={violation.status || 'open'}
            onChange={(e) => onStatusChange(violation.id, e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="open">Open</option>
            <option value="awaiting_response">Awaiting response</option>
            <option value="resolved">Resolved</option>
          </select>
        )}
      </div>
    </div>
  );
}
