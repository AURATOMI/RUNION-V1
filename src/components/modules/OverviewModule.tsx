import React from 'react';
import {
  Layers,
  Share2,
  Cpu,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const OverviewModule: React.FC = () => {
  const {
    currentProject,
    setActiveModule,
    navigateToEntity,
    validationIssues,
    fixBrokenReferences,
  } = useProject();

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active project selected.
      </div>
    );
  }

  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');

  // Compute type distribution
  const typeCounts: Record<string, number> = {};
  currentProject.entities.forEach((e) => {
    const t = e.type || 'Untyped';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const totalEntities = currentProject.entities.length;

  const recentEntities = [...currentProject.entities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const brokenRelCount = currentProject.relationships.filter((r) => {
    const sExists = currentProject.entities.some((e) => e.id === r.sourceId);
    const tExists = currentProject.entities.some((e) => e.id === r.targetId);
    return !sExists || !tExists;
  }).length;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Hero System Header */}
      <div className="border border-slate-800 bg-[#0f141f] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-mono">
              <span className="uppercase">{currentProject.category || 'General'}</span>
              <span>·</span>
              <span>Modified {new Date(currentProject.updatedAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              {currentProject.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {currentProject.description || 'No system description provided.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveModule('visual')}
              className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
            >
              <span>Explore Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveModule('entities')}
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Health Banner */}
      {errors.length > 0 || warnings.length > 0 ? (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">
                System Invariant Issues Detected ({errors.length} Errors, {warnings.length} Warnings)
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                The deterministic validation engine identified structural inconsistencies in your model.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {brokenRelCount > 0 && (
              <button
                onClick={fixBrokenReferences}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                Prune {brokenRelCount} Broken Ref{brokenRelCount > 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => setActiveModule('validation')}
              className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded transition-colors flex items-center gap-1.5"
            >
              <span>Inspect Issues</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">System Model Nominal</div>
              <div className="text-xs text-slate-400">
                All entity references, system groups, and active rules are valid.
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-medium">0 Invariant Errors</span>
        </div>
      )}

      {/* Primary System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Entities', count: currentProject.entities.length, icon: Layers, mod: 'entities' as const },
          { label: 'Relationships', count: currentProject.relationships.length, icon: Share2, mod: 'relationships' as const },
          { label: 'Systems', count: currentProject.systems.length, icon: Cpu, mod: 'systems' as const },
          { label: 'Active Rules', count: currentProject.rules.filter((r) => r.enabled).length, icon: ShieldCheck, mod: 'rules' as const },
          { label: 'Timeline Events', count: currentProject.events.length, icon: Calendar, mod: 'timeline' as const },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => setActiveModule(stat.mod)}
              className="text-left p-4 bg-[#0f141f] border border-slate-800/80 hover:border-slate-700 rounded-lg transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-300">
                <span className="text-xs font-medium">{stat.label}</span>
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-2 tabular-nums">
                {stat.count}
              </div>
              <div className="text-[11px] text-cyan-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>View {stat.label}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Two Column Grid: Entity Distribution + Recent Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity Type Distribution */}
        <div className="border border-slate-800/80 bg-[#0f141f] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Entity Classification Types</h2>
            <button
              onClick={() => setActiveModule('entities')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Manage Types
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {sortedTypes.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No entities created yet. Create entities to establish classification types.
              </div>
            ) : (
              sortedTypes.map(([type, count]) => {
                const percent = totalEntities > 0 ? Math.round((count / totalEntities) * 100) : 0;
                const typeDef = currentProject.customEntityTypes?.find(
                  (t) => t.name.toLowerCase() === type.toLowerCase()
                );
                const color = typeDef?.color || '#38bdf8';

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        <span>{type}</span>
                      </div>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Modified Entities */}
        <div className="border border-slate-800/80 bg-[#0f141f] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Recently Updated Entities</h2>
            <button
              onClick={() => setActiveModule('entities')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              All Entities ({currentProject.entities.length})
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-800/60">
            {recentEntities.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No entities recorded in this system yet.
              </div>
            ) : (
              recentEntities.map((entity) => (
                <div
                  key={entity.id}
                  onClick={() => navigateToEntity(entity.id)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded cursor-pointer transition-colors group"
                >
                  <div className="truncate pr-3">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {entity.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {entity.description || 'No description provided.'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {entity.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(entity.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
