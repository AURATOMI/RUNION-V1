import React, { useState } from 'react';
import {
  Layers,
  Network,
  Share2,
  Cpu,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Settings,
  FolderGit2,
  Plus,
  Download,
  Upload,
  ChevronDown,
  Activity,
  Check,
  Search,
  LayoutDashboard,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { ActiveModule } from '../../types';
import { ToastContainer, Modal } from '../common/UIComponents';

export const AppLayout: React.FC<{
  children: React.ReactNode;
  onOpenDashboard?: () => void;
}> = ({ children, onOpenDashboard }) => {
  const {
    projects,
    currentProject,
    activeModule,
    setActiveModule,
    switchProject,
    createProject,
    importProjectJson,
    exportCurrentProject,
    validationIssues,
    isSaving,
    toasts,
    dismissToast,
    addToast,
  } = useProject();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('worldbuilding');
  const [newProjectTemplate, setNewProjectTemplate] = useState<
    'worldbuilding' | 'organization' | 'workflow' | 'blank'
  >('worldbuilding');

  const errorCount = validationIssues.filter((i) => i.severity === 'error').length;
  const warningCount = validationIssues.filter((i) => i.severity === 'warning').length;

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      addToast('Please enter a project name', 'error');
      return;
    }
    await createProject(newProjectTemplate, newProjectName, newProjectCategory);
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      addToast('Please paste valid JSON project contents', 'error');
      return;
    }
    const res = importProjectJson(importJsonText);
    if (res.success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const navItems: Array<{
    id: ActiveModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'entities', label: 'Entities', icon: Layers, count: currentProject?.entities.length ?? 0 },
    { id: 'relationships', label: 'Relationships', icon: Share2, count: currentProject?.relationships.length ?? 0 },
    { id: 'visual', label: 'Visual Explorer', icon: Network },
    { id: 'systems', label: 'Systems', icon: Cpu, count: currentProject?.systems.length ?? 0 },
    { id: 'rules', label: 'Rules', icon: ShieldCheck, count: currentProject?.rules.filter((r) => r.enabled).length ?? 0 },
    { id: 'timeline', label: 'Timeline', icon: Calendar, count: currentProject?.events.length ?? 0 },
    { id: 'validation', label: 'Validation', icon: AlertCircle, count: errorCount + warningCount },
    { id: 'settings', label: 'Data & Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0d14] text-slate-100 font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Persistent Technical Left Navigation */}
      <aside className="w-64 bg-[#0d111a] border-r border-slate-800/80 flex flex-col shrink-0 select-none z-20">
        {/* Workspace Brand Zone */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0a0d14]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              R
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide text-slate-100">RUNION</span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">SYSTEM IDE</span>
            </div>
          </div>
          {isSaving ? (
            <span className="text-[10px] text-cyan-400 font-mono tracking-tight animate-pulse">
              SYNCING
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">V0.1</span>
          )}
        </div>

        {/* Project Selector Box */}
        <div className="p-3 border-b border-slate-800/60 relative">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 block mb-1">
            Active Project
          </label>
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#121722] hover:bg-[#161d2b] border border-slate-800 rounded text-left transition-colors group"
          >
            <div className="truncate pr-2">
              <span className="block text-xs font-medium text-slate-200 truncate">
                {currentProject?.name || 'Select Project'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block capitalize">
                {currentProject?.category || 'General'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0" />
          </button>

          {/* Project Switcher Dropdown */}
          {isProjectDropdownOpen && (
            <div
              className="absolute left-3 right-3 top-full mt-1 bg-[#121722] border border-slate-700/80 rounded-md shadow-2xl py-1 z-30 max-h-64 overflow-y-auto"
              onMouseLeave={() => setIsProjectDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Switch Project
              </div>
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    switchProject(proj.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                    proj.id === currentProject?.id
                      ? 'bg-cyan-950/40 text-cyan-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{proj.name}</span>
                  {proj.id === currentProject?.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-800/80 mt-1 pt-1">
                {onOpenDashboard && (
                  <button
                    onClick={() => {
                      setIsProjectDropdownOpen(false);
                      onOpenDashboard();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Workspace Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setIsNewProjectModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 hover:bg-slate-800/60 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setIsImportModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON Project</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const isValidation = item.id === 'validation';

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                {isValidation ? (
                  errorCount > 0 ? (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                      {errorCount}
                    </span>
                  ) : warningCount > 0 ? (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {warningCount}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-slate-400">0</span>
                  )
                ) : item.count !== undefined ? (
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Quick Footer Action Area */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0a0d14]/70 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Offline Ready</span>
            </span>
            <button
              onClick={exportCurrentProject}
              title="Export Current Project JSON"
              className="hover:text-slate-200 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar adhering to Top Bar Contract */}
        <header className="h-14 px-6 border-b border-slate-800/80 bg-[#0c1018] flex items-center justify-between gap-8 shrink-0 select-none">
          {/* Zone 1: Breadcrumb Trail Wordmark */}
          <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap shrink-0">
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Open Workspace Dashboard"
            >
              <FolderGit2 className="w-4 h-4 text-slate-400" />
              <span>Workspace</span>
            </button>
            <span className="text-slate-400">/</span>
            <span className="font-medium text-slate-200">{currentProject?.name}</span>
            <span className="text-slate-400">/</span>
            <span className="capitalize text-cyan-400 font-medium">{activeModule}</span>
          </div>

          {/* Zone 2: Navigation Info / System Status */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400 whitespace-nowrap">
            <span>
              Entities: <strong className="text-slate-200 font-mono">{currentProject?.entities.length}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>
              Connections: <strong className="text-slate-200 font-mono">{currentProject?.relationships.length}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>
              Systems: <strong className="text-slate-200 font-mono">{currentProject?.systems.length}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>
              Integrity:{' '}
              {errorCount === 0 ? (
                <span className="text-emerald-400 font-medium">Nominal</span>
              ) : (
                <span className="text-rose-400 font-medium">{errorCount} Errors</span>
              )}
            </span>
          </div>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {activeModule !== 'validation' && (errorCount > 0 || warningCount > 0) && (
              <button
                onClick={() => setActiveModule('validation')}
                className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{errorCount} Issues</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeModule === 'entities') {
                  // Trigger open entity drawer or modal
                  const event = new CustomEvent('open-add-entity-modal');
                  window.dispatchEvent(event);
                } else {
                  setActiveModule('entities');
                  setTimeout(() => {
                    const event = new CustomEvent('open-add-entity-modal');
                    window.dispatchEvent(event);
                  }, 50);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Entity</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-auto bg-[#0a0d14] relative">{children}</main>
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Create New System Project"
        description="Choose a starting template or build a completely blank system."
      >
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Orion Frontier, Quantum Engine, Supply Mesh"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
            <input
              type="text"
              value={newProjectCategory}
              onChange={(e) => setNewProjectCategory(e.target.value)}
              placeholder="e.g. worldbuilding, organization, workflow, scientific"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Starter Template</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'worldbuilding', title: 'Worldbuilding', desc: 'Solaris Expanse with factions, habitats & slipstream tech' },
                { key: 'organization', title: 'Business Org', desc: 'OmniCorp architecture with leadership, platforms & policies' },
                { key: 'workflow', title: 'Project & Workflow', desc: 'Autonomous Mars Rover avionics & sensor pipelines' },
                { key: 'blank', title: 'Blank Project', desc: 'Clean slate without predetermined structures' },
              ].map((tmpl) => (
                <button
                  key={tmpl.key}
                  type="button"
                  onClick={() => setNewProjectTemplate(tmpl.key as any)}
                  className={`p-3 text-left rounded border transition-colors ${
                    newProjectTemplate === tmpl.key
                      ? 'bg-cyan-950/40 border-cyan-500/80 text-white'
                      : 'bg-[#121722] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-100">{tmpl.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">{tmpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              Initialize Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Project Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Project from JSON"
        description="Paste JSON content or select an exported Runion project file."
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Or Paste JSON Document
            </label>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste raw project JSON here..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              Verify & Import
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
