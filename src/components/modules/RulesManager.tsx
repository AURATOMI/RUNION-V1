import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { SystemRule, RuleSeverity, RuleType } from '../../types';
import { Modal, SeverityBadge } from '../common/UIComponents';

export const RulesManager: React.FC = () => {
  const { currentProject, toggleRule, createRule, deleteRule, validationIssues } = useProject();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<RuleType>('REQUIRED_PROPERTY');
  const [severity, setSeverity] = useState<RuleSeverity>('warning');
  const [targetType, setTargetType] = useState('');
  const [propertyName, setPropertyName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createRule({
      name: name.trim(),
      description: description.trim(),
      category: ruleType === 'REQUIRED_PROPERTY' ? 'completeness' : 'integrity',
      ruleType,
      severity,
      enabled: true,
      config:
        ruleType === 'REQUIRED_PROPERTY'
          ? {
              targetType: targetType.trim() || undefined,
              propertyName: propertyName.trim(),
            }
          : undefined,
    });

    setIsAddModalOpen(false);
    setName('');
    setDescription('');
    setPropertyName('');
    setTargetType('');
  };

  // Find violations for each rule
  const getViolationCountForRule = (rule: SystemRule) => {
    if (!rule.enabled) return 0;
    if (rule.ruleType === 'REQUIRED_PROPERTY' && rule.config?.propertyName) {
      return validationIssues.filter((i) => i.id.startsWith(`issue-rule-reqprop-${rule.id}`)).length;
    }
    if (rule.ruleType === 'UNIQUE_NAME_PER_TYPE') {
      return validationIssues.filter((i) => i.id.startsWith('issue-dup-name-')).length;
    }
    if (rule.ruleType === 'VALID_RELATIONSHIP_REFERENCES') {
      return validationIssues.filter((i) => i.id.startsWith('issue-rel-')).length;
    }
    if (rule.ruleType === 'VALID_SYSTEM_MEMBERSHIP') {
      return validationIssues.filter((i) => i.id.startsWith('issue-sys-missing-members-')).length;
    }
    if (rule.ruleType === 'REQUIRED_DESCRIPTION') {
      return validationIssues.filter((i) => i.id.startsWith('issue-ent-nodesc-')).length;
    }
    if (rule.ruleType === 'NO_ORPHAN_ENTITIES') {
      return validationIssues.filter((i) => i.id.startsWith('issue-orphan-ent-')).length;
    }
    return 0;
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-800 bg-[#0c1018] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">System Invariant Rules</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic rules enforcing structural completeness, integrity, and domain constraints.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* Rules Catalog */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {currentProject?.rules.map((rule) => {
            const violations = getViolationCountForRule(rule);

            return (
              <div
                key={rule.id}
                className={`p-5 bg-[#0f141f] border rounded-lg transition-all ${
                  rule.enabled ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-slate-100">{rule.name}</h3>
                      <SeverityBadge severity={rule.severity} />
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        [{rule.category}]
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>

                    {rule.config?.propertyName && (
                      <div className="text-[11px] font-mono text-cyan-400 mt-1">
                        Requires property &quot;{rule.config.propertyName}&quot;
                        {rule.config.targetType ? ` on "${rule.config.targetType}"` : ' across all entities'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Live Violation Badge */}
                    {rule.enabled && (
                      <div className="text-right">
                        {violations > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{violations} Violations</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.enabled ? 'bg-cyan-600' : 'bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={rule.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Delete Custom Rule button */}
                    {rule.category === 'custom' && (
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Invariant Rule"
        description="Configure a deterministic constraint to validate your system model."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rule Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mandatory Uptime SLA, Unique Sensor ID"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Rule Type</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="REQUIRED_PROPERTY">Required Property on Entities</option>
              <option value="REQUIRED_DESCRIPTION">Required Entity Description</option>
              <option value="NO_ORPHAN_ENTITIES">Prohibit Orphan / Isolated Entities</option>
              <option value="UNIQUE_NAME_PER_TYPE">Unique Entity Names Per Type</option>
            </select>
          </div>

          {ruleType === 'REQUIRED_PROPERTY' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#121722] border border-slate-800 rounded">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Property Key Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. status, version, powerDrawGw"
                  className="w-full px-3 py-1.5 bg-[#0c1018] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Entity Type (Optional)
                </label>
                <input
                  type="text"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  placeholder="Leave empty for all types"
                  className="w-full px-3 py-1.5 bg-[#0c1018] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as RuleSeverity)}
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="error">Error (Blocks structural integrity)</option>
              <option value="warning">Warning (Quality warning)</option>
              <option value="info">Notice (Informational guideline)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this rule must be preserved..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
