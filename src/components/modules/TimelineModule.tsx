import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { TimelineEvent } from '../../types';
import { Modal, ConfirmDialog } from '../common/UIComponents';

export const TimelineModule: React.FC = () => {
  const {
    currentProject,
    createEvent,
    updateEvent,
    deleteEvent,
    navigateToEntity,
  } = useProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [associatedEntityIds, setAssociatedEntityIds] = useState<string[]>([]);

  const entityMap = useMemo(() => {
    const map = new Map<string, string>();
    currentProject?.entities.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [currentProject]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setAssociatedEntityIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: TimelineEvent) => {
    setEditingEvent(ev);
    setName(ev.name);
    setDate(ev.date);
    setDescription(ev.description || '');
    setAssociatedEntityIds([...ev.entityIds]);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date.trim()) return;

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        name: name.trim(),
        date: date.trim(),
        description: description.trim(),
        entityIds: associatedEntityIds,
      });
    } else {
      createEvent({
        name: name.trim(),
        date: date.trim(),
        description: description.trim(),
        entityIds: associatedEntityIds,
      });
    }

    setIsModalOpen(false);
  };

  const toggleEntityAssociation = (entId: string) => {
    setAssociatedEntityIds((prev) =>
      prev.includes(entId) ? prev.filter((id) => id !== entId) : [...prev, entId]
    );
  };

  const filteredEvents = useMemo(() => {
    if (!currentProject) return [];
    let list = [...currentProject.events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ev) =>
          ev.name.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          ev.date.toLowerCase().includes(q)
      );
    }

    if (selectedEntityFilter !== 'ALL') {
      list = list.filter((ev) => ev.entityIds.includes(selectedEntityFilter));
    }

    list.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });

    return list;
  }, [currentProject, searchQuery, selectedEntityFilter, sortOrder]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-[#0c1018] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timeline events..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#121722] border border-slate-700/80 rounded text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter by Entity */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value)}
              className="bg-[#121722] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[180px] truncate"
            >
              <option value="ALL">All Entities</option>
              {currentProject?.entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-2.5 py-1.5 bg-[#121722] border border-slate-700/80 hover:bg-slate-800 rounded text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'asc' ? 'Chronological (Oldest)' : 'Reverse (Newest)'}</span>
          </button>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Timeline Event</span>
        </button>
      </div>

      {/* Timeline Viewport */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-400 mb-3" />
            <div className="text-sm font-semibold text-slate-300">No Timeline Events</div>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Sequence operational milestones, historical treaties, or architectural changes across time.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Event</span>
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto relative pl-6 border-l border-slate-800 space-y-8 my-4">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="relative group">
                {/* Timeline node bullet */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#101520] border-2 border-cyan-500 group-hover:scale-125 transition-transform" />

                {/* Event Card */}
                <div className="bg-[#0f141f] border border-slate-800/80 hover:border-slate-700 rounded-lg p-5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs font-semibold text-cyan-400">
                        {ev.date}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-1">{ev.name}</h3>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {ev.description || 'No description recorded.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEventToDelete(ev.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Associated Entities */}
                  {ev.entityIds.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                        Involved Entities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ev.entityIds.map((id) => {
                          const entName = entityMap.get(id);
                          return (
                            <button
                              key={id}
                              onClick={() => navigateToEntity(id)}
                              className="px-2 py-0.5 bg-[#141b27] hover:bg-slate-800 border border-slate-700/80 rounded text-xs text-slate-200 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                            >
                              <span>{entName || `Missing (${id.slice(0, 8)}…)`}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Edit Timeline Event' : 'Create Timeline Event'}
        description="Record a chronological event and associate participating system components."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Event Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Surface Touchdown, Treaty Summit, Core Engine Upgrade"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Date / Timestamp <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD or custom epoch (e.g. 2188-09-03)"
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what occurred and what state changes resulted..."
              className="w-full px-3 py-2 bg-[#121722] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Associated Entities Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Associated Entities ({associatedEntityIds.length} Selected)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-800 rounded bg-[#121722] p-2 space-y-1">
              {currentProject?.entities.map((e) => {
                const isChecked = associatedEntityIds.includes(e.id);
                return (
                  <label
                    key={e.id}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-slate-800/50 rounded cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleEntityAssociation(e.id)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                    />
                    <span className="text-slate-200">{e.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({e.type})</span>
                  </label>
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
              {editingEvent ? 'Save Changes' : 'Record Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={() => {
          if (eventToDelete) {
            deleteEvent(eventToDelete);
          }
        }}
        title="Delete Timeline Event"
        message="Are you sure you want to delete this timeline event? This cannot be undone."
        confirmLabel="Delete Event"
        isDestructive
      />
    </div>
  );
};
