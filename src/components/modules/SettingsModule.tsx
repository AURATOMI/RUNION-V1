import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Copy,
  Trash2,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  FolderGit2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  exportEntitiesToCsv,
  exportRelationshipsToCsv,
} from '../../storage/storageManager';
import { ConfirmDialog, Modal } from '../common/UIComponents';

export const SettingsModule: React.FC = () => {
  const {
    currentProject,
    updateProjectMeta,
    duplicateProject,
    deleteProject,
    exportCurrentProject,
    importProjectJson,
    addToast,
  } = useProject();

  // Form State
  const [name, setName] = useState(currentProject?.name || '');
  const [description, setDescription] = useState(currentProject?.description || '');
  const [category, setCategory] = useState(currentProject?.category || 'general');
  const [author, setAuthor] = useState(currentProject?.metadata?.author || '');
  const [version, setVersion] = useState(currentProject?.metadata?.version || '1.0');
  const [notes, setNotes] = useState(currentProject?.metadata?.notes || '');

  // Dialogs
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  if (!currentProject) {
    return <div className="p-8 text-center text-slate-400">No project active.</div>;
  }

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectMeta({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      metadata: {
        ...currentProject.metadata,
        author: author.trim(),
        version: version.trim(),
        notes: notes.trim(),
      },
    });
  };

  const handleExportEntitiesCsv = () => {
    const csv = exportEntitiesToCsv(currentProject.entities);
    downloadFile(
      csv,
      `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_entities.csv`,
      'text/csv'
    );
    addToast('Entities exported as CSV', 'success');
  };

  const handleExportRelationshipsCsv = () => {
    const csv = exportRelationshipsToCsv(currentProject.relationships, currentProject.entities);
    downloadFile(
      csv,
      `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_relationships.csv`,
      'text/csv'
    );
    addToast('Relationships exported as CSV', 'success');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importProjectJson(importJsonText);
    if (res.success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Project Settings & Data Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage metadata, JSON interchange, and tabular data exports.
          </p>
        </div>

        {/* Metadata Configuration Form */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">System Identification</h3>
            <span className="text-[10px] font-mono text-slate-400">ID: {currentProject.id}</span>
          </div>

          <form onSubmit={handleSaveMetadata} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Author / Lead</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Model Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">System Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Architectural conventions, assumptions, or operational context..."
                className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
              >
                Save Metadata Changes
              </button>
            </div>
          </form>
        </div>

        {/* Data Export & Interchange */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">Data Interchange & Export</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Extract and interchange your system model in standardized portable formats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* JSON Export */}
            <div className="p-4 bg-[#121722] border border-slate-800 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  <span>Full Project JSON</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Complete graph including entities, relationships, systems, rules, and events.
                </p>
              </div>
              <button
                onClick={exportCurrentProject}
                className="mt-4 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* CSV Entities */}
            <div className="p-4 bg-[#121722] border border-slate-800 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Entities CSV</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Tabular catalogue of all entities, classification types, and property metrics.
                </p>
              </div>
              <button
                onClick={handleExportEntitiesCsv}
                className="mt-4 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* CSV Relationships */}
            <div className="p-4 bg-[#121722] border border-slate-800 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  <span>Relationships CSV</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Edge list linking source entities, labels, target entities, and descriptions.
                </p>
              </div>
              <button
                onClick={handleExportRelationshipsCsv}
                className="mt-4 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone & Duplication */}
        <div className="bg-[#0f141f] border border-rose-950/40 rounded-lg p-6 space-y-4">
          <div className="pb-3 border-b border-rose-950/60">
            <h3 className="text-sm font-semibold text-rose-300">Project Operations & Danger Zone</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Duplicate this model or remove it permanently from local IndexedDB storage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-200">Duplicate System Project</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Creates an independent clone with all entities and relationships.
              </div>
            </div>
            <button
              onClick={() => duplicateProject(currentProject.id)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate Project</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-rose-300">Delete Project</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Permanently purge this project from offline browser storage.
              </div>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-700/50 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteProject(currentProject.id)}
        title="Permanently Delete Project"
        message={`Are you sure you want to permanently delete "${currentProject.name}"? All associated entities, relationships, and systems will be removed.`}
        confirmLabel="Permanently Delete"
        isDestructive
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Project JSON"
        description="Paste JSON content or select an exported project file."
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Or Paste JSON</label>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
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
