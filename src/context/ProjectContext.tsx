import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Project,
  Entity,
  Relationship,
  SystemGroup,
  SystemRule,
  TimelineEvent,
  EntityTypeDefinition,
  ValidationIssue,
  ActiveModule,
} from '../types';
import {
  initializeStorage,
  fetchProjects,
  fetchProject,
  saveProject as dbSaveProject,
  createProjectFromTemplate,
  duplicateProject as dbDuplicateProject,
  deleteProject as dbDeleteProject,
  generateId,
  validateAndParseProjectJson,
  exportProjectToJson,
} from '../storage/storageManager';
import { validateProject } from '../engine/validator';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ProjectContextValue {
  projects: Project[];
  currentProject: Project | null;
  activeModule: ActiveModule;
  selectedEntityId: string | null;
  validationIssues: ValidationIssue[];
  isLoading: boolean;
  isSaving: boolean;
  toasts: Toast[];

  // Navigation
  setActiveModule: (module: ActiveModule) => void;
  setSelectedEntityId: (id: string | null) => void;
  navigateToEntity: (id: string) => void;
  navigateToModuleWithFilter?: (module: ActiveModule, filter?: any) => void;

  // Project Actions
  switchProject: (id: string) => Promise<void>;
  createProject: (
    templateKey: 'worldbuilding' | 'organization' | 'workflow' | 'blank',
    name?: string,
    category?: string
  ) => Promise<Project>;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectMeta: (updates: Partial<Pick<Project, 'name' | 'description' | 'category' | 'metadata'>>) => Promise<void>;

  // Entity Actions
  createEntity: (data: { name: string; type: string; description: string; properties?: Record<string, any> }) => Entity;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string, cascadeClean?: boolean) => void;

  // Relationship Actions
  createRelationship: (data: { sourceId: string; targetId: string; label: string; description?: string }) => Relationship;
  updateRelationship: (id: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;

  // System Actions
  createSystem: (data: { name: string; description: string; entityIds: string[] }) => SystemGroup;
  updateSystem: (id: string, updates: Partial<SystemGroup>) => void;
  deleteSystem: (id: string) => void;

  // Rules Actions
  toggleRule: (id: string) => void;
  createRule: (rule: Omit<SystemRule, 'id'>) => void;
  deleteRule: (id: string) => void;

  // Timeline Event Actions
  createEvent: (data: { name: string; description: string; date: string; entityIds: string[] }) => TimelineEvent;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;

  // Entity Type Actions
  createEntityType: (data: { name: string; color: string; description?: string }) => EntityTypeDefinition;

  // Data & Utilities
  importProjectJson: (jsonContent: string) => { success: boolean; error?: string };
  exportCurrentProject: () => void;
  dismissToast: (id: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  fixBrokenReferences: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const projs = await initializeStorage();
        if (!mounted) return;
        setProjects(projs);
        if (projs.length > 0) {
          setCurrentProject(projs[0]);
        }
      } catch (err) {
        console.error('Failed to initialize workspace data:', err);
        addToast('Failed to load projects from storage', 'error');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  // Persist project changes debounced
  useEffect(() => {
    if (!currentProject) return;

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        await dbSaveProject(currentProject);
        // Sync project list
        setProjects((prev) =>
          prev.map((p) => (p.id === currentProject.id ? currentProject : p))
        );
      } catch (err) {
        console.error('Failed to persist project:', err);
      } finally {
        setIsSaving(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentProject]);

  // Real-time validation issues calculation
  const validationIssues = useMemo(() => {
    if (!currentProject) return [];
    return validateProject(currentProject);
  }, [currentProject]);

  const switchProject = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const proj = await fetchProject(id);
      if (proj) {
        setCurrentProject(proj);
        setSelectedEntityId(null);
        setActiveModule('overview');
        addToast(`Switched to "${proj.name}"`, 'info');
      }
    } catch (err) {
      console.error('Error switching project:', err);
      addToast('Error switching project', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const createProject = useCallback(
    async (
      templateKey: 'worldbuilding' | 'organization' | 'workflow' | 'blank',
      name?: string,
      category?: string
    ) => {
      const newProj = await createProjectFromTemplate(templateKey, name, category);
      const updatedList = await fetchProjects();
      setProjects(updatedList);
      setCurrentProject(newProj);
      setActiveModule('overview');
      addToast(`Created project "${newProj.name}"`, 'success');
      return newProj;
    },
    [addToast]
  );

  const duplicateProject = useCallback(
    async (id: string) => {
      try {
        const copy = await dbDuplicateProject(id);
        const updatedList = await fetchProjects();
        setProjects(updatedList);
        setCurrentProject(copy);
        addToast(`Duplicated as "${copy.name}"`, 'success');
      } catch (err: any) {
        addToast(`Failed to duplicate: ${err.message}`, 'error');
      }
    },
    [addToast]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await dbDeleteProject(id);
        const updatedList = await fetchProjects();
        setProjects(updatedList);
        if (currentProject?.id === id) {
          if (updatedList.length > 0) {
            setCurrentProject(updatedList[0]);
          } else {
            // If all deleted, create blank project
            const fresh = await createProjectFromTemplate('blank', 'Default Workspace');
            setProjects([fresh]);
            setCurrentProject(fresh);
          }
        }
        addToast('Project deleted successfully', 'info');
      } catch (err: any) {
        addToast(`Failed to delete project: ${err.message}`, 'error');
      }
    },
    [currentProject, addToast]
  );

  const updateProjectMeta = useCallback(
    async (updates: Partial<Pick<Project, 'name' | 'description' | 'category' | 'metadata'>>) => {
      if (!currentProject) return;
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Project updated', 'success');
    },
    [currentProject, addToast]
  );

  const navigateToEntity = useCallback((id: string) => {
    setSelectedEntityId(id);
    setActiveModule('entities');
  }, []);

  // Entity operations
  const createEntity = useCallback(
    (data: { name: string; type: string; description: string; properties?: Record<string, any> }) => {
      const newEntity: Entity = {
        id: generateId('ent'),
        name: data.name.trim(),
        type: data.type.trim() || 'Generic',
        description: data.description || '',
        properties: data.properties || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          entities: [newEntity, ...prev.entities],
          updatedAt: new Date().toISOString(),
        };
      });

      addToast(`Entity "${newEntity.name}" created`, 'success');
      return newEntity;
    },
    [addToast]
  );

  const updateEntity = useCallback(
    (id: string, updates: Partial<Entity>) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        const exists = prev.entities.some((e) => e.id === id);
        if (!exists) return prev;

        return {
          ...prev,
          entities: prev.entities.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Entity updated', 'success');
    },
    [addToast]
  );

  const deleteEntity = useCallback(
    (id: string, cascadeClean: boolean = false) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        const target = prev.entities.find((e) => e.id === id);
        const newEntities = prev.entities.filter((e) => e.id !== id);

        let newRelationships = prev.relationships;
        let newSystems = prev.systems;
        let newEvents = prev.events;

        if (cascadeClean) {
          // Cleanly remove any relations referencing this entity
          newRelationships = prev.relationships.filter(
            (r) => r.sourceId !== id && r.targetId !== id
          );
          // Clean systems
          newSystems = prev.systems.map((s) => ({
            ...s,
            entityIds: s.entityIds.filter((eid) => eid !== id),
          }));
          // Clean events
          newEvents = prev.events.map((ev) => ({
            ...ev,
            entityIds: ev.entityIds.filter((eid) => eid !== id),
          }));
        }

        return {
          ...prev,
          entities: newEntities,
          relationships: newRelationships,
          systems: newSystems,
          events: newEvents,
          updatedAt: new Date().toISOString(),
        };
      });

      if (selectedEntityId === id) {
        setSelectedEntityId(null);
      }
      addToast('Entity deleted', 'info');
    },
    [selectedEntityId, addToast]
  );

  // Relationship operations
  const createRelationship = useCallback(
    (data: { sourceId: string; targetId: string; label: string; description?: string }) => {
      const newRel: Relationship = {
        id: generateId('rel'),
        sourceId: data.sourceId,
        targetId: data.targetId,
        label: data.label.trim() || 'Connected',
        description: data.description || '',
        createdAt: new Date().toISOString(),
      };

      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          relationships: [newRel, ...prev.relationships],
          updatedAt: new Date().toISOString(),
        };
      });

      addToast(`Relationship "${newRel.label}" established`, 'success');
      return newRel;
    },
    [addToast]
  );

  const updateRelationship = useCallback(
    (id: string, updates: Partial<Relationship>) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          relationships: prev.relationships.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Relationship updated', 'success');
    },
    [addToast]
  );

  const deleteRelationship = useCallback(
    (id: string) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          relationships: prev.relationships.filter((r) => r.id !== id),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Relationship severed', 'info');
    },
    [addToast]
  );

  // System operations
  const createSystem = useCallback(
    (data: { name: string; description: string; entityIds: string[] }) => {
      const newSys: SystemGroup = {
        id: generateId('sys'),
        name: data.name.trim(),
        description: data.description || '',
        entityIds: data.entityIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          systems: [newSys, ...prev.systems],
          updatedAt: new Date().toISOString(),
        };
      });

      addToast(`System "${newSys.name}" configured`, 'success');
      return newSys;
    },
    [addToast]
  );

  const updateSystem = useCallback(
    (id: string, updates: Partial<SystemGroup>) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          systems: prev.systems.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('System updated', 'success');
    },
    [addToast]
  );

  const deleteSystem = useCallback(
    (id: string) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          systems: prev.systems.filter((s) => s.id !== id),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('System group deleted', 'info');
    },
    [addToast]
  );

  // Rule operations
  const toggleRule = useCallback((id: string) => {
    setCurrentProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        rules: prev.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const createRule = useCallback(
    (ruleData: Omit<SystemRule, 'id'>) => {
      const newRule: SystemRule = {
        ...ruleData,
        id: generateId('rule'),
      };
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rules: [...prev.rules, newRule],
          updatedAt: new Date().toISOString(),
        };
      });
      addToast(`Rule "${newRule.name}" added`, 'success');
    },
    [addToast]
  );

  const deleteRule = useCallback(
    (id: string) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rules: prev.rules.filter((r) => r.id !== id),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Rule removed', 'info');
    },
    [addToast]
  );

  // Event operations
  const createEvent = useCallback(
    (data: { name: string; description: string; date: string; entityIds: string[] }) => {
      const newEvent: TimelineEvent = {
        id: generateId('evt'),
        name: data.name.trim(),
        description: data.description || '',
        date: data.date.trim(),
        entityIds: data.entityIds || [],
        createdAt: new Date().toISOString(),
      };

      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          events: [...prev.events, newEvent],
          updatedAt: new Date().toISOString(),
        };
      });

      addToast(`Timeline event "${newEvent.name}" created`, 'success');
      return newEvent;
    },
    [addToast]
  );

  const updateEvent = useCallback(
    (id: string, updates: Partial<TimelineEvent>) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          events: prev.events.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Event updated', 'success');
    },
    [addToast]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          events: prev.events.filter((ev) => ev.id !== id),
          updatedAt: new Date().toISOString(),
        };
      });
      addToast('Timeline event deleted', 'info');
    },
    [addToast]
  );

  // Entity Type operations
  const createEntityType = useCallback(
    (data: { name: string; color: string; description?: string }) => {
      const newType: EntityTypeDefinition = {
        id: generateId('type'),
        name: data.name.trim(),
        color: data.color,
        description: data.description || '',
      };

      setCurrentProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          customEntityTypes: [...(prev.customEntityTypes || []), newType],
          updatedAt: new Date().toISOString(),
        };
      });

      addToast(`Entity type "${newType.name}" added`, 'success');
      return newType;
    },
    [addToast]
  );

  // Fix broken references across systems & relationships
  const fixBrokenReferences = useCallback(() => {
    if (!currentProject) return;
    const validEntityIds = new Set(currentProject.entities.map((e) => e.id));

    setCurrentProject((prev) => {
      if (!prev) return null;
      const cleanedRelationships = prev.relationships.filter(
        (r) => validEntityIds.has(r.sourceId) && validEntityIds.has(r.targetId)
      );
      const cleanedSystems = prev.systems.map((s) => ({
        ...s,
        entityIds: s.entityIds.filter((id) => validEntityIds.has(id)),
      }));
      const cleanedEvents = prev.events.map((ev) => ({
        ...ev,
        entityIds: ev.entityIds.filter((id) => validEntityIds.has(id)),
      }));

      return {
        ...prev,
        relationships: cleanedRelationships,
        systems: cleanedSystems,
        events: cleanedEvents,
        updatedAt: new Date().toISOString(),
      };
    });

    addToast('Pruned broken references across relationships and systems', 'success');
  }, [currentProject, addToast]);

  // Import / Export
  const importProjectJson = useCallback(
    (jsonContent: string) => {
      const res = validateAndParseProjectJson(jsonContent);
      if (!res.success || !res.project) {
        addToast(res.error || 'Import failed validation', 'error');
        return { success: false, error: res.error };
      }

      const importedProj = res.project;
      dbSaveProject(importedProj);
      setProjects((prev) => [importedProj, ...prev]);
      setCurrentProject(importedProj);
      setActiveModule('overview');
      addToast(`Imported project "${importedProj.name}" successfully`, 'success');
      return { success: true };
    },
    [addToast]
  );

  const exportCurrentProject = useCallback(() => {
    if (!currentProject) return;
    const jsonStr = exportProjectToJson(currentProject);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_runion_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Project exported as JSON', 'success');
  }, [currentProject, addToast]);

  const value: ProjectContextValue = {
    projects,
    currentProject,
    activeModule,
    selectedEntityId,
    validationIssues,
    isLoading,
    isSaving,
    toasts,
    setActiveModule,
    setSelectedEntityId,
    navigateToEntity,
    switchProject,
    createProject,
    duplicateProject,
    deleteProject,
    updateProjectMeta,
    createEntity,
    updateEntity,
    deleteEntity,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    createSystem,
    updateSystem,
    deleteSystem,
    toggleRule,
    createRule,
    deleteRule,
    createEvent,
    updateEvent,
    deleteEvent,
    createEntityType,
    importProjectJson,
    exportCurrentProject,
    dismissToast,
    addToast,
    fixBrokenReferences,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
