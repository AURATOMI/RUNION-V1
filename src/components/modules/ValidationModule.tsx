import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Filter,
  Wrench,
  Layers,
  Share2,
  Cpu,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ValidationCategory, RuleSeverity, ValidationIssue } from '../../types';
import { SeverityBadge } from '../common/UIComponents';

export const ValidationModule: React.FC = () => {
  const {
    currentProject,
    validationIssues,
    setActiveModule,
    setSelectedEntityId,
    fixBrokenReferences,
  } = useProject();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const errors = useMemo(
    () => validationIssues.filter((i) => i.severity === 'error'),
    [validationIssues]
  );
  const warnings = useMemo(
    () => validationIssues.filter((i) => i.severity === 'warning'),
    [validationIssues]
  );
  const notices = useMemo(
    () => validationIssues.filter((i) => i.severity === 'info'),
    [validationIssues]
  );

  const filteredIssues = useMemo(() => {
    return validationIssues.filter((issue) => {
      if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && issue.severity !== severityFilter) return false;
      return true;
    });
  }, [validationIssues, categoryFilter, severityFilter]);

  const handleNavigateToIssueTarget = (issue: ValidationIssue) => {
    if (issue.targetModule === 'entities') {
      setSelectedEntityId(issue.affectedId);
      setActiveModule('entities');
    } else {
      setActiveModule(issue.targetModule);
    }
  };

  const hasBrokenReferences = validationIssues.some(
    (i) => i.id.startsWith('issue-rel-') || i.id.startsWith('issue-sys-missing-members-')
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0c1018] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Deterministic Validation Engine</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
              ACTIVE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time invariant checking across entity completeness, relationship topologies, and active rules.
          </p>
        </div>

        {hasBrokenReferences && (
          <button
            onClick={fixBrokenReferences}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prune Broken References</span>
          </button>
        )}
      </div>

      {/* Summary Scorecards Bar */}
      <div className="grid grid-cols-3 border-b border-slate-800/80 bg-[#0a0d14] divide-x divide-slate-800/80 shrink-0">
        <button
          onClick={() => setSeverityFilter(severityFilter === 'error' ? 'ALL' : 'error')}
          className={`p-4 text-left transition-colors ${
            severityFilter === 'error' ? 'bg-rose-950/20' : 'hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Errors</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
            {errors.length}
          </div>
          <span className="text-[11px] text-slate-400">Structural integrity blockers</span>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'ALL' : 'warning')}
          className={`p-4 text-left transition-colors ${
            severityFilter === 'warning' ? 'bg-amber-950/20' : 'hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {warnings.length}
          </div>
          <span className="text-[11px] text-slate-400">Potential inconsistencies</span>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'info' ? 'ALL' : 'info')}
          className={`p-4 text-left transition-colors ${
            severityFilter === 'info' ? 'bg-sky-950/20' : 'hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Notices</span>
            <Info className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
            {notices.length}
          </div>
          <span className="text-[11px] text-slate-400">Completeness suggestions</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-slate-800 bg-[#0c1018] flex items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-1">
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'entities', label: 'Entities' },
            { id: 'relationships', label: 'Relationships' },
            { id: 'systems', label: 'Systems' },
            { id: 'rules', label: 'Rules' },
            { id: 'timeline', label: 'Timeline' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded transition-colors font-medium ${
                categoryFilter === cat.id
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {severityFilter !== 'ALL' && (
          <button
            onClick={() => setSeverityFilter('ALL')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Clear Severity Filter
          </button>
        )}
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-3" />
            <div className="text-base font-bold text-slate-100">
              No Issues Found in Current View
            </div>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Your system structure satisfies all active deterministic invariants and validation rules.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {filteredIssues.map((issue) => {
              const isError = issue.severity === 'error';
              const isWarn = issue.severity === 'warning';

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isError
                      ? 'bg-rose-950/15 border-rose-900/60'
                      : isWarn
                      ? 'bg-amber-950/15 border-amber-900/60'
                      : 'bg-[#0f141f] border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={issue.severity} />
                        <span className="font-semibold text-xs text-slate-100">{issue.title}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          [{issue.category}]
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{issue.description}</p>

                      <div className="text-xs text-slate-400 pt-1 flex items-start gap-1.5">
                        <strong className="text-slate-300 font-mono text-[11px] shrink-0">
                          Correction:
                        </strong>
                        <span>{issue.suggestedCorrection}</span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <button
                        onClick={() => handleNavigateToIssueTarget(issue)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
                      >
                        <span className="capitalize">Inspect {issue.targetModule}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
