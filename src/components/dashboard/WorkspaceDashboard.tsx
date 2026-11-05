import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Clock,
  Layers,
  Share2,
  Cpu,
  ShieldCheck,
  Copy,
  Trash2,
  ArrowRight,
  Upload,
  BookOpen,
  Briefcase,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Modal, ConfirmDialog } from '../common/UIComponents';

export const WorkspaceDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    projects,
    currentProject,
    switchProject,
    createProject,
    duplicateProject,
    deleteProject,
    importProjectJson,
    addToast,
  } = useProject();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('worldbuilding');
  const [newProjectTemplate, setNewProjectTemplate] = useState<
    'worldbuilding' | 'organization' | 'workflow' | 'blank'
  >('worldbuilding');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Compute workspace wide stats
  const totalProjects = projects.length;
  const totalEntitiesAcrossWorkspace = projects.reduce((acc, p) => acc + p.entities.length, 0);
  const totalRelationshipsAcrossWorkspace = projects.reduce(
    (acc, p) => acc + p.relationships.length,
    0
  );
  const totalSystemsAcrossWorkspace = projects.reduce((acc, p) => acc + p.systems.length, 0);

  // Sort by recently updated
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      addToast('Please enter a project title', 'error');
      return;
    }
    await createProject(newProjectTemplate, newProjectName, newProjectCategory);
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    onClose();
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importProjectJson(importJsonText);
    if (res.success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#090c12]/95 backdrop-blur-md flex flex-col overflow-y-auto">
      {/* Top Header */}
      <div className="h-16 px-8 border-b border-slate-800 bg-[#0c1018] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
            R
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight">Runion Workspace</h1>
            <span className="text-xs text-slate-400 block -mt-0.5 font-mono">
              System Creation Environment · {totalProjects} Projects Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
          {currentProject && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors"
            >
              Back to Project
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full p-8 space-y-8">
        {/* Workspace Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#0f141f] border border-slate-800 rounded-lg">
            <span className="text-xs font-medium text-slate-400">Total Projects</span>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1 tabular-nums">
              {totalProjects}
            </div>
            <span className="text-[11px] text-slate-400">Indexed in local storage</span>
          </div>
          <div className="p-4 bg-[#0f141f] border border-slate-800 rounded-lg">
            <span className="text-xs font-medium text-slate-400">Total Entities</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
              {totalEntitiesAcrossWorkspace}
            </div>
            <span className="text-[11px] text-slate-400">Across all active systems</span>
          </div>
          <div className="p-4 bg-[#0f141f] border border-slate-800 rounded-lg">
            <span className="text-xs font-medium text-slate-400">Relationships</span>
            <div className="text-2xl font-bold font-mono text-indigo-400 mt-1 tabular-nums">
              {totalRelationshipsAcrossWorkspace}
            </div>
            <span className="text-[11px] text-slate-400">Interconnected edges</span>
          </div>
          <div className="p-4 bg-[#0f141f] border border-slate-800 rounded-lg">
            <span className="text-xs font-medium text-slate-400">Subsystem Groups</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              {totalSystemsAcrossWorkspace}
            </div>
            <span className="text-[11px] text-slate-400">Encapsulated modules</span>
          </div>
        </div>

        {/* Starter Templates Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Start from Domain Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                key: 'worldbuilding',
                icon: BookOpen,
                title: 'Solaris Expanse',
                badge: 'Worldbuilding',
                desc: 'Planetary factions, orbital habitats, slipstream warp drive & interstellar accords.',
              },
              {
                key: 'organization',
                icon: Briefcase,
                title: 'OmniCorp Architecture',
                badge: 'Business Org',
                desc: 'Executive hierarchy, engineering squads, distributed lakehouse & SOC2 policies.',
              },
              {
                key: 'workflow',
                icon: GitBranch,
                title: 'Mars Rover Mission',
                badge: 'Workflow',
                desc: 'Flight controller avionics, LiDAR sensor streams, hazard avoidance & thermal invariants.',
              },
              {
                key: 'blank',
                icon: Plus,
                title: 'Blank System',
                badge: 'Custom',
                desc: 'Clean slate without predetermined templates for modeling any structured concept.',
              },
            ].map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <div
                  key={tmpl.key}
                  className="p-5 bg-[#0f141f] border border-slate-800/80 hover:border-slate-700 rounded-lg flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider">
                        {tmpl.badge}
                      </span>
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">{tmpl.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tmpl.desc}</p>
                  </div>

                  <button
                    onClick={async () => {
                      await createProject(tmpl.key as any);
                      onClose();
                    }}
                    className="mt-4 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Instantiate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Projects Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">System Projects Catalog</h2>
          <div className="border border-slate-800 rounded-lg bg-[#0f141f] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0c1018] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Project Name</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Entities</th>
                  <th className="py-3 px-4 font-semibold text-right">Connections</th>
                  <th className="py-3 px-4 font-semibold text-right">Modified</th>
                  <th className="py-3 px-4 font-semibold text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedProjects.map((proj) => {
                  const isActive = proj.id === currentProject?.id;

                  return (
                    <tr
                      key={proj.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isActive ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <FolderGit2
                            className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}
                          />
                          <button
                            onClick={() => {
                              switchProject(proj.id);
                              onClose();
                            }}
                            className="hover:text-cyan-300 font-semibold text-left truncate max-w-xs"
                          >
                            {proj.name}
                          </button>
                          {isActive && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 capitalize">
                        {proj.category || 'General'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                        {proj.entities.length}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                        {proj.relationships.length}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400 text-[11px]">
                        {new Date(proj.updatedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              switchProject(proj.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => duplicateProject(proj.id)}
                            title="Duplicate"
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProjectToDelete(proj.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Create New System Project"
        description="Choose a starting template or build a completely blank system."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={() => {
          if (projectToDelete) {
            deleteProject(projectToDelete);
          }
        }}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will remove all entities, relationships, and systems stored locally."
        confirmLabel="Delete Project"
        isDestructive
      />
    </div>
  );
};
