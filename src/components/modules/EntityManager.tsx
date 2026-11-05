import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  ExternalLink,
  Tag,
  Share2,
  Calendar,
  Layers,
  X,
  PlusCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Entity, PropertyType, EntityTypeDefinition } from '../../types';
import { Modal, ConfirmDialog } from '../common/UIComponents';

export const EntityManager: React.FC = () => {
  const {
    currentProject,
    createEntity,
    updateEntity,
    deleteEntity,
    createEntityType,
    selectedEntityId,
    setSelectedEntityId,
    setActiveModule,
  } = useProject();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>('date-desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);

  // Form state for creating entity
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProperties, setFormProperties] = useState<Array<{ key: string; type: PropertyType; value: any }>>([]);

  // Form state for adding custom type
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#38bdf8');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Editing property inline in inspector
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropType, setNewPropType] = useState<PropertyType>('string');
  const [newPropVal, setNewPropVal] = useState('');

  // Listen for global "open-add-entity-modal" event from TopBar
  useEffect(() => {
    const handleOpenModal = () => {
      resetCreateForm();
      setIsAddModalOpen(true);
    };
    window.addEventListener('open-add-entity-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-entity-modal', handleOpenModal);
  }, [currentProject]);

  const activeEntity = useMemo(() => {
    if (!currentProject || !selectedEntityId) return null;
    return currentProject.entities.find((e) => e.id === selectedEntityId) || null;
  }, [currentProject, selectedEntityId]);

  // Available types (both custom + discovered from entities)
  const availableTypes = useMemo(() => {
    if (!currentProject) return [];
    const set = new Set<string>();
    currentProject.customEntityTypes?.forEach((t) => set.add(t.name));
    currentProject.entities.forEach((e) => {
      if (e.type) set.add(e.type);
    });
    return Array.from(set).sort();
  }, [currentProject]);

  const resetCreateForm = () => {
    setFormName('');
    setFormType(availableTypes[0] || 'Core Component');
    setFormDescription('');
    setFormProperties([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const propertiesMap: Record<string, { type: PropertyType; value: any }> = {};
    formProperties.forEach((p) => {
      if (p.key.trim()) {
        propertiesMap[p.key.trim()] = {
          type: p.type,
          value: p.value,
        };
      }
    });

    const newEnt = createEntity({
      name: formName.trim(),
      type: formType.trim(),
      description: formDescription.trim(),
      properties: propertiesMap,
    });

    setIsAddModalOpen(false);
    setSelectedEntityId(newEnt.id);
  };

  const handleCreateTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    createEntityType({
      name: newTypeName.trim(),
      color: newTypeColor,
      description: newTypeDesc.trim(),
    });

    setFormType(newTypeName.trim());
    setIsNewTypeModalOpen(false);
    setNewTypeName('');
    setNewTypeDesc('');
  };

  const handleAddPropertyRowToForm = () => {
    setFormProperties((prev) => [...prev, { key: '', type: 'string', value: '' }]);
  };

  const handleAddPropertyToActiveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntity || !newPropKey.trim()) return;

    let processedVal: any = newPropVal;
    if (newPropType === 'number') processedVal = Number(newPropVal) || 0;
    if (newPropType === 'boolean') processedVal = newPropVal === 'true';

    const updatedProps = {
      ...(activeEntity.properties || {}),
      [newPropKey.trim()]: {
        type: newPropType,
        value: processedVal,
      },
    };

    updateEntity(activeEntity.id, { properties: updatedProps });
    setNewPropKey('');
    setNewPropVal('');
  };

  const handleDeletePropertyFromActive = (propKey: string) => {
    if (!activeEntity) return;
    const updatedProps = { ...(activeEntity.properties || {}) };
    delete updatedProps[propKey];
    updateEntity(activeEntity.id, { properties: updatedProps });
  };

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    if (!currentProject) return [];
    let list = [...currentProject.entities];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          Object.entries(e.properties || {}).some(
            ([k, v]) => k.toLowerCase().includes(q) || String(v.value).toLowerCase().includes(q)
          )
      );
    }

    if (typeFilter !== 'ALL') {
      list = list.filter((e) => e.type.toLowerCase() === typeFilter.toLowerCase());
    }

    list.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-asc') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return list;
  }, [currentProject, searchQuery, typeFilter, sortBy]);

  // Compute incoming & outgoing relationships for activeEntity
  const entityConnections = useMemo(() => {
    if (!currentProject || !activeEntity) return { incoming: [], outgoing: [] };

    const incoming = currentProject.relationships
      .filter((r) => r.targetId === activeEntity.id)
      .map((r) => ({
        ...r,
        sourceEntity: currentProject.entities.find((e) => e.id === r.sourceId),
      }));

    const outgoing = currentProject.relationships
      .filter((r) => r.sourceId === activeEntity.id)
      .map((r) => ({
        ...r,
        targetEntity: currentProject.entities.find((e) => e.id === r.targetId),
      }));

    return { incoming, outgoing };
  }, [currentProject, activeEntity]);

  // Systems containing this entity
  const containingSystems = useMemo(() => {
    if (!currentProject || !activeEntity) return [];
    return currentProject.systems.filter((s) => s.entityIds.includes(activeEntity.id));
  }, [currentProject, activeEntity]);

  // Events involving this entity
  const associatedEvents = useMemo(() => {
    if (!currentProject || !activeEntity) return [];
    return currentProject.events.filter((ev) => ev.entityIds.includes(activeEntity.id));
  }, [currentProject, activeEntity]);

  const getTypeColor = (typeName: string) => {
    const def = currentProject?.customEntityTypes?.find(
      (t) => t.name.toLowerCase() === typeName.toLowerCase()
    );
    return def?.color || '#38bdf8';
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Entity Catalog Main Pane */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeEntity ? 'border-r border-slate-800' : ''}`}>
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-[#0c1018] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities by name, property, or text..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#121722] border border-slate-700/80 rounded text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#121722] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Types ({currentProject?.entities.length})</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#121722] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="date-desc">Recently Updated</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNewTypeModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Type</span>
            </button>
            <button
              onClick={() => {
                resetCreateForm();
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Entity</span>
            </button>
          </div>
        </div>

        {/* Entities Table / Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Layers className="w-12 h-12 text-slate-400 mb-3" />
              <div className="text-sm font-semibold text-slate-300">No Entities Found</div>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'No entities match the selected search terms or classification filter.'
                  : 'Start modeling your system by creating fundamental entities.'}
              </p>
              <button
                onClick={() => {
                  resetCreateForm();
                  setIsAddModalOpen(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Entity</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#0c1018] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider select-none z-10">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Entity Name</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Properties</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Modified</th>
                  <th className="py-2.5 px-4 font-semibold text-center w-16">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEntities.map((entity) => {
                  const isSelected = activeEntity?.id === entity.id;
                  const typeColor = getTypeColor(entity.type);
                  const propCount = Object.keys(entity.properties || {}).length;

                  return (
                    <tr
                      key={entity.id}
                      onClick={() => setSelectedEntityId(entity.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/30 text-white'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: typeColor }}
                          />
                          <span className="truncate max-w-[200px]">{entity.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-400">{entity.type}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                        {entity.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                        {propCount > 0 ? (
                          <span className="text-slate-300">{propCount}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400 text-[11px]">
                        {new Date(entity.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Contextual Entity Inspector Drawer */}
      {activeEntity && (
        <div className="w-[420px] bg-[#0c1018] flex flex-col h-full shrink-0 overflow-hidden select-none border-l border-slate-800">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0e131d]">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getTypeColor(activeEntity.type) }}
              />
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                Entity Inspector
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEntityToDelete(activeEntity.id);
                  setIsDeleteConfirmOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800/80 transition-colors"
                title="Delete Entity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedEntityId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Title & Type editable */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={activeEntity.name}
                  onChange={(e) => updateEntity(activeEntity.id, { name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#121722] border border-slate-700 rounded text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Type Classification
                </label>
                <select
                  value={activeEntity.type}
                  onChange={(e) => updateEntity(activeEntity.id, { type: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={activeEntity.description}
                  onChange={(e) => updateEntity(activeEntity.id, { description: e.target.value })}
                  placeholder="Describe this entity's role in the system..."
                  className="w-full px-3 py-1.5 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Custom Properties */}
            <div className="border-t border-slate-800/80 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide font-mono">
                  Custom Properties
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Object.keys(activeEntity.properties || {}).length} Total
                </span>
              </div>

              {/* Property list */}
              <div className="space-y-2">
                {Object.entries(activeEntity.properties || {}).map(([key, prop]) => (
                  <div
                    key={key}
                    className="p-2.5 bg-[#121722] border border-slate-800 rounded flex items-center justify-between gap-2 group"
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-medium text-slate-200">{key}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          ({prop.type})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                        {String(prop.value)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePropertyFromActive(key)}
                      className="p-1 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Property Form */}
              <form
                onSubmit={handleAddPropertyToActiveEntity}
                className="p-3 bg-[#121722]/60 border border-slate-800/60 rounded space-y-2"
              >
                <div className="text-[10px] font-mono text-slate-400">Add Property</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. status)"
                    value={newPropKey}
                    onChange={(e) => setNewPropKey(e.target.value)}
                    className="px-2 py-1 bg-[#0c1018] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newPropType}
                    onChange={(e) => setNewPropType(e.target.value as PropertyType)}
                    className="px-2 py-1 bg-[#0c1018] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Value (e.g. Active, 42)"
                    value={newPropVal}
                    onChange={(e) => setNewPropVal(e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#0c1018] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* Outgoing Connections */}
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Outgoing Connections ({entityConnections.outgoing.length})</span>
                </span>
                <button
                  onClick={() => setActiveModule('relationships')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Add
                </button>
              </div>

              {entityConnections.outgoing.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No outgoing connections.</div>
              ) : (
                <div className="space-y-1.5">
                  {entityConnections.outgoing.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => rel.targetEntity && setSelectedEntityId(rel.targetEntity.id)}
                      className="p-2 bg-[#121722] hover:bg-slate-800/50 border border-slate-800 rounded flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="truncate">
                        <span className="text-[10px] font-mono text-cyan-400 block">
                          — {rel.label} →
                        </span>
                        <span className="text-xs text-slate-200 font-medium group-hover:text-cyan-300">
                          {rel.targetEntity?.name || 'Deleted Entity'}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Connections */}
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Incoming Connections ({entityConnections.incoming.length})</span>
                </span>
              </div>

              {entityConnections.incoming.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No incoming connections.</div>
              ) : (
                <div className="space-y-1.5">
                  {entityConnections.incoming.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => rel.sourceEntity && setSelectedEntityId(rel.sourceEntity.id)}
                      className="p-2 bg-[#121722] hover:bg-slate-800/50 border border-slate-800 rounded flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="truncate">
                        <span className="text-[10px] font-mono text-indigo-400 block">
                          ← {rel.label} —
                        </span>
                        <span className="text-xs text-slate-200 font-medium group-hover:text-cyan-300">
                          {rel.sourceEntity?.name || 'Deleted Entity'}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subsystem Memberships */}
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide font-mono">
                System Memberships ({containingSystems.length})
              </span>
              {containingSystems.length === 0 ? (
                <div className="text-xs text-slate-400">Not part of any system groups.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {containingSystems.map((sys) => (
                    <span
                      key={sys.id}
                      onClick={() => setActiveModule('systems')}
                      className="cursor-pointer px-2 py-1 bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs flex items-center gap-1"
                    >
                      <span>{sys.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Milestones */}
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide font-mono">
                Timeline Events ({associatedEvents.length})
              </span>
              {associatedEvents.length === 0 ? (
                <div className="text-xs text-slate-400">No events associated with this entity.</div>
              ) : (
                <div className="space-y-1">
                  {associatedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setActiveModule('timeline')}
                      className="cursor-pointer p-2 bg-[#121722] hover:bg-slate-800/60 rounded border border-slate-800 text-xs flex justify-between items-center"
                    >
                      <span className="text-slate-200 font-medium truncate">{ev.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">{ev.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Entity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New System Entity"
        description="Define an atomic component, actor, device, or concept in the system."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Entity Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Navigation Sensor, Fleet Admiral, Lakehouse Engine"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Type Classification <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsNewTypeModalOpen(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                + Define New Type
              </button>
            </div>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Detail the operational responsibility and role of this component..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Initial Properties Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Custom Properties</label>
              <button
                type="button"
                onClick={handleAddPropertyRowToForm}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Property Field</span>
              </button>
            </div>

            {formProperties.map((prop, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Key (e.g. latencyMs)"
                  value={prop.key}
                  onChange={(e) => {
                    const clone = [...formProperties];
                    clone[idx].key = e.target.value;
                    setFormProperties(clone);
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200"
                />
                <select
                  value={prop.type}
                  onChange={(e) => {
                    const clone = [...formProperties];
                    clone[idx].type = e.target.value as PropertyType;
                    setFormProperties(clone);
                  }}
                  className="w-24 px-2 py-1.5 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={prop.value}
                  onChange={(e) => {
                    const clone = [...formProperties];
                    clone[idx].value = e.target.value;
                    setFormProperties(clone);
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setFormProperties(formProperties.filter((_, i) => i !== idx))}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
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
              Save Entity
            </button>
          </div>
        </form>
      </Modal>

      {/* Define Custom Type Modal */}
      <Modal
        isOpen={isNewTypeModalOpen}
        onClose={() => setIsNewTypeModalOpen(false)}
        title="Define Entity Classification Type"
        description="Establish a domain classification category with an accent color identifier."
      >
        <form onSubmit={handleCreateTypeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Type Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Microservice, Celestial Body, Policy Constraint"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Type Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTypeColor}
                onChange={(e) => setNewTypeColor(e.target.value)}
                className="w-10 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-300">{newTypeColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={newTypeDesc}
              onChange={(e) => setNewTypeDesc(e.target.value)}
              placeholder="What this category represents..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewTypeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              Save Type
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEntityToDelete(null);
        }}
        onConfirm={() => {
          if (entityToDelete) {
            deleteEntity(entityToDelete, false);
          }
        }}
        title="Delete System Entity"
        message="Are you sure you want to delete this entity? Existing relationships referencing this entity will be flagged by the validation engine."
        confirmLabel="Delete Entity"
        isDestructive
      />
    </div>
  );
};
