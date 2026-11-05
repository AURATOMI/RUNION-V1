import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewModule } from './components/modules/OverviewModule';
import { EntityManager } from './components/modules/EntityManager';
import { RelationshipManager } from './components/modules/RelationshipManager';
import { VisualExplorer } from './components/visual/VisualExplorer';
import { SystemManager } from './components/modules/SystemManager';
import { RulesManager } from './components/modules/RulesManager';
import { TimelineModule } from './components/modules/TimelineModule';
import { ValidationModule } from './components/modules/ValidationModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { WorkspaceDashboard } from './components/dashboard/WorkspaceDashboard';

const AppContent: React.FC = () => {
  const { currentProject, activeModule, isLoading } = useProject();
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0d14] text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white animate-pulse">
            R
          </div>
          <div className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
            RUNION SYSTEM IDE
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2 font-mono">
          Initializing offline IndexedDB storage…
        </div>
      </div>
    );
  }

  return (
    <>
      <AppLayout onOpenDashboard={() => setIsDashboardOpen(true)}>
        {activeModule === 'overview' && <OverviewModule />}
        {activeModule === 'entities' && <EntityManager />}
        {activeModule === 'relationships' && <RelationshipManager />}
        {activeModule === 'visual' && <VisualExplorer />}
        {activeModule === 'systems' && <SystemManager />}
        {activeModule === 'rules' && <RulesManager />}
        {activeModule === 'timeline' && <TimelineModule />}
        {activeModule === 'validation' && <ValidationModule />}
        {activeModule === 'settings' && <SettingsModule />}
      </AppLayout>

      {isDashboardOpen && (
        <WorkspaceDashboard onClose={() => setIsDashboardOpen(false)} />
      )}
    </>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
