import React, { useState, useMemo } from 'react';
import {
  Share2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ArrowLeftRight,
  Trash2,
  Edit2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Relationship } from '../../types';
import { Modal, ConfirmDialog } from '../common/UIComponents';

const PRESET_LABELS = [
  'Connects To',
  'Directs',
  'Depends On',
  'Ratified',
  'Governs',
  'Feeds Data To',
  'Resides At',
  'Maintains',
  'Encompasses',
  'Preempts',
  'Collaborates With',
];

export const RelationshipManager: React.FC = () => {
  const {
    currentProject,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    navigateToEntity,
  } = useProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRel, setEditingRel] = useState<Relationship | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [relToDelete, setRelToDelete] = useState<string | null>(null);

  // Form state
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [label, setLabel] = useState('Connects To');
  const [description, setDescription] = useState('');

  const entityMap = useMemo(() => {
    const map = new Map<string, string>();
    currentProject?.entities.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [currentProject]);

  const handleOpenAddModal = () => {
    if (currentProject && currentProject.entities.length >= 2) {
      setSourceId(currentProject.entities[0].id);
      setTargetId(currentProject.entities[1].id);
    } else if (currentProject && currentProject.entities.length === 1) {
      setSourceId(currentProject.entities[0].id);
      setTargetId(currentProject.entities[0].id);
    }
    setLabel('Connects To');
    setDescription('');
    setIsAddModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || !label.trim()) return;

    createRelationship({
      sourceId,
      targetId,
      label: label.trim(),
      description: description.trim(),
    });

    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRel || !label.trim()) return;

    updateRelationship(editingRel.id, {
      sourceId,
      targetId,
      label: label.trim(),
      description: description.trim(),
    });

    setEditingRel(null);
  };

  const handleReverseDirection = (rel: Relationship) => {
    updateRelationship(rel.id, {
      sourceId: rel.targetId,
      targetId: rel.sourceId,
    });
  };

  const filteredRelationships = useMemo(() => {
    if (!currentProject) return [];
    let list = [...currentProject.relationships];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        const sName = entityMap.get(r.sourceId) || '';
        const tName = entityMap.get(r.targetId) || '';
        return (
          r.label.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          sName.toLowerCase().includes(q) ||
          tName.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [currentProject, searchQuery, entityMap]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800 bg-[#0c1018] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by label or connected entities..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#121722] border border-slate-700/80 rounded text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredRelationships.length} of {currentProject?.relationships.length} Connections
          </span>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Relationship</span>
        </button>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredRelationships.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Share2 className="w-12 h-12 text-slate-400 mb-3" />
            <div className="text-sm font-semibold text-slate-300">No Relationships Found</div>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Connect entities to map the dependencies, data flows, and interactions of your system.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Connection</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#0c1018] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider select-none z-10">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Source Entity</th>
                <th className="py-2.5 px-4 font-semibold text-center w-40">Relationship Label</th>
                <th className="py-2.5 px-4 font-semibold">Target Entity</th>
                <th className="py-2.5 px-4 font-semibold">Description</th>
                <th className="py-2.5 px-4 font-semibold text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRelationships.map((rel) => {
                const sourceName = entityMap.get(rel.sourceId);
                const targetName = entityMap.get(rel.targetId);
                const isSourceMissing = !sourceName;
                const isTargetMissing = !targetName;

                return (
                  <tr key={rel.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Source Entity */}
                    <td className="py-3 px-4">
                      {isSourceMissing ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-mono text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Missing Entity ({rel.sourceId})</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => navigateToEntity(rel.sourceId)}
                          className="font-medium text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                        >
                          <span>{sourceName}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </button>
                      )}
                    </td>

                    {/* Relationship Arrow & Label */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121722] border border-slate-700/80 rounded font-mono text-[11px] text-cyan-300">
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="font-semibold">{rel.label}</span>
                      </div>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3 px-4">
                      {isTargetMissing ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-mono text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Missing Entity ({rel.targetId})</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => navigateToEntity(rel.targetId)}
                          className="font-medium text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                        >
                          <span>{targetName}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </button>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-sm truncate text-slate-400">
                      {rel.description || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleReverseDirection(rel)}
                          title="Reverse Direction"
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRel(rel);
                            setSourceId(rel.sourceId);
                            setTargetId(rel.targetId);
                            setLabel(rel.label);
                            setDescription(rel.description || '');
                          }}
                          title="Edit Relationship"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setRelToDelete(rel.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          title="Sever Connection"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
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
        )}
      </div>

      {/* Add / Edit Relationship Modal */}
      <Modal
        isOpen={isAddModalOpen || editingRel !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRel(null);
        }}
        title={editingRel ? 'Edit Relationship' : 'Create New Relationship'}
        description="Establish a directed connection between two entities."
      >
        <form onSubmit={editingRel ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Source Entity <span className="text-rose-400">*</span>
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {currentProject?.entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Entity <span className="text-rose-400">*</span>
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {currentProject?.entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Relationship Label <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Depends On, Feeds Data To, Ratified"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500 mb-2"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLabel(preset)}
                  className="px-2 py-0.5 bg-[#121722] hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the technical or semantic nature of this connection..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingRel(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              {editingRel ? 'Save Changes' : 'Establish Connection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setRelToDelete(null);
        }}
        onConfirm={() => {
          if (relToDelete) {
            deleteRelationship(relToDelete);
          }
        }}
        title="Sever Relationship"
        message="Are you sure you want to delete this connection? The connected entities will remain intact."
        confirmLabel="Sever Connection"
        isDestructive
      />
    </div>
  );
};
