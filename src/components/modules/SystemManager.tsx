import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Search,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { SystemGroup } from '../../types';
import { Modal, ConfirmDialog } from '../common/UIComponents';

export const SystemManager: React.FC = () => {
  const {
    currentProject,
    createSystem,
    updateSystem,
    deleteSystem,
    navigateToEntity,
  } = useProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemGroup | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [searchEntityQuery, setSearchEntityQuery] = useState('');

  const entityMap = new Map<string, string>();
  currentProject?.entities.forEach((e) => entityMap.set(e.id, e.name));

  const handleOpenAdd = () => {
    setEditingSystem(null);
    setName('');
    setDescription('');
    setSelectedEntityIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sys: SystemGroup) => {
    setEditingSystem(sys);
    setName(sys.name);
    setDescription(sys.description || '');
    setSelectedEntityIds([...sys.entityIds]);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSystem) {
      updateSystem(editingSystem.id, {
        name: name.trim(),
        description: description.trim(),
        entityIds: selectedEntityIds,
      });
    } else {
      createSystem({
        name: name.trim(),
        description: description.trim(),
        entityIds: selectedEntityIds,
      });
    }

    setIsModalOpen(false);
  };

  const toggleEntityMembership = (entId: string) => {
    setSelectedEntityIds((prev) =>
      prev.includes(entId) ? prev.filter((id) => id !== entId) : [...prev, entId]
    );
  };

  const handleRemoveMemberFromSystem = (sys: SystemGroup, entId: string) => {
    updateSystem(sys.id, {
      entityIds: sys.entityIds.filter((id) => id !== entId),
    });
  };

  const filteredEntitiesForModal = (currentProject?.entities || []).filter((e) =>
    e.name.toLowerCase().includes(searchEntityQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchEntityQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-800 bg-[#0c1018] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">System Groups</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Encapsulate entities into subsystems, federations, and functional modules.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New System Group</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {(!currentProject?.systems || currentProject.systems.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Cpu className="w-12 h-12 text-slate-400 mb-3" />
            <div className="text-sm font-semibold text-slate-300">No System Groups Defined</div>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Group entities into larger structural systems to manage architectural complexity.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First System</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {currentProject.systems.map((sys) => {
              // Calculate internal relationships between member entities
              const memberSet = new Set(sys.entityIds);
              const internalConnections = currentProject.relationships.filter(
                (r) => memberSet.has(r.sourceId) && memberSet.has(r.targetId)
              ).length;

              const missingMembers = sys.entityIds.filter((id) => !entityMap.has(id));

              return (
                <div
                  key={sys.id}
                  className="bg-[#0f141f] border border-slate-800 rounded-lg p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-sm font-bold text-slate-100">{sys.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {sys.description || 'No system description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(sys)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSystemToDelete(sys.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* System Statistics */}
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 my-4 py-2 border-y border-slate-800/80">
                      <span>
                        Members: <strong className="text-slate-200">{sys.entityIds.length}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Internal Links: <strong className="text-cyan-400">{internalConnections}</strong>
                      </span>
                      {missingMembers.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-rose-400 flex items-center gap-1 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{missingMembers.length} Missing</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Member Entities List */}
                    <div>
                      <div className="text-[11px] font-mono uppercase text-slate-400 mb-2">
                        Member Entities
                      </div>
                      {sys.entityIds.length === 0 ? (
                        <div className="text-xs text-slate-400 italic">No member entities in this group.</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {sys.entityIds.map((entId) => {
                            const name = entityMap.get(entId);
                            const isMissing = !name;

                            return (
                              <span
                                key={entId}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                                  isMissing
                                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                                    : 'bg-[#141b27] border-slate-700/80 text-slate-200'
                                }`}
                              >
                                {isMissing ? (
                                  <span>Missing ID ({entId.slice(0, 8)}…)</span>
                                ) : (
                                  <button
                                    onClick={() => navigateToEntity(entId)}
                                    className="hover:text-cyan-300 font-medium"
                                  >
                                    {name}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveMemberFromSystem(sys, entId)}
                                  className="text-slate-400 hover:text-rose-400 ml-0.5"
                                  title="Remove from system"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>ID: {sys.id}</span>
                    <span>Updated {new Date(sys.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit System Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSystem ? 'Edit System Group' : 'Create System Group'}
        description="Select entities that compose this functional subsystem."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              System Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Life Support Subsystem, Autonomous Flight Avionics"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the boundaries and objective of this system..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Member Entity Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Select Member Entities ({selectedEntityIds.length} Selected)
              </label>
              <div className="relative w-44">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter entities..."
                  value={searchEntityQuery}
                  onChange={(e) => setSearchEntityQuery(e.target.value)}
                  className="w-full pl-6 pr-2 py-0.5 bg-[#121722] border border-slate-700 rounded text-[11px] text-slate-200"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-800 rounded bg-[#121722] divide-y divide-slate-800/80">
              {filteredEntitiesForModal.map((ent) => {
                const isSelected = selectedEntityIds.includes(ent.id);
                return (
                  <div
                    key={ent.id}
                    onClick={() => toggleEntityMembership(ent.id)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-cyan-950/40 text-cyan-200' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-slate-200">{ent.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                        {ent.type}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              {editingSystem ? 'Save Changes' : 'Create System'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSystemToDelete(null);
        }}
        onConfirm={() => {
          if (systemToDelete) {
            deleteSystem(systemToDelete);
          }
        }}
        title="Delete System Group"
        message="Are you sure you want to delete this system group? The member entities and relationships will not be deleted."
        confirmLabel="Delete System"
        isDestructive
      />
    </div>
  );
};
