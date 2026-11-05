import { Project, Entity, Relationship } from '../types';
import {
  dbGetAllProjects,
  dbGetProject,
  dbSaveProject,
  dbDeleteProject,
  dbGetWorkspaceMeta,
  dbSetWorkspaceMeta,
} from './indexedDb';
import { TEMPLATES } from '../data/templates';

const RECENT_PROJECTS_KEY = 'recent_project_ids';
const ACTIVE_PROJECT_ID_KEY = 'active_project_id';

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Initializes workspace with starter projects if completely empty.
 */
export async function initializeStorage(): Promise<Project[]> {
  const existing = await dbGetAllProjects();
  if (existing.length > 0) {
    return existing;
  }

  // Seed with the 3 rich templates
  const worldbuilding: Project = {
    ...TEMPLATES.worldbuilding,
    id: 'proj-worldbuilding-solaris',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const organization: Project = {
    ...TEMPLATES.organization,
    id: 'proj-org-omnicorp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const workflow: Project = {
    ...TEMPLATES.workflow,
    id: 'proj-rover-mission',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    dbSaveProject(worldbuilding),
    dbSaveProject(organization),
    dbSaveProject(workflow),
  ]);

  await dbSetWorkspaceMeta(RECENT_PROJECTS_KEY, [worldbuilding.id, organization.id, workflow.id]);
  await dbSetWorkspaceMeta(ACTIVE_PROJECT_ID_KEY, worldbuilding.id);

  return [worldbuilding, organization, workflow];
}

export async function fetchProjects(): Promise<Project[]> {
  return dbGetAllProjects();
}

export async function fetchProject(id: string): Promise<Project | null> {
  const proj = await dbGetProject(id);
  if (proj) {
    // Record recent access
    const recent: string[] = (await dbGetWorkspaceMeta(RECENT_PROJECTS_KEY)) || [];
    const updated = [id, ...recent.filter((item) => item !== id)].slice(0, 10);
    await dbSetWorkspaceMeta(RECENT_PROJECTS_KEY, updated);
    await dbSetWorkspaceMeta(ACTIVE_PROJECT_ID_KEY, id);
  }
  return proj;
}

export async function saveProject(project: Project): Promise<void> {
  const updated: Project = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await dbSaveProject(updated);
}

export async function createProjectFromTemplate(
  templateKey: 'worldbuilding' | 'organization' | 'workflow' | 'blank',
  customName?: string,
  customCategory?: string
): Promise<Project> {
  const template = TEMPLATES[templateKey] || TEMPLATES.blank;
  const newProject: Project = {
    ...template,
    id: generateId('proj'),
    name: customName?.trim() || template.name,
    category: customCategory?.trim() || template.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dbSaveProject(newProject);
  return newProject;
}

export async function duplicateProject(sourceId: string): Promise<Project> {
  const source = await dbGetProject(sourceId);
  if (!source) {
    throw new Error('Source project not found');
  }

  const duplicated: Project = {
    ...source,
    id: generateId('proj'),
    name: `${source.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dbSaveProject(duplicated);
  return duplicated;
}

export async function deleteProject(id: string): Promise<void> {
  await dbDeleteProject(id);
  const recent: string[] = (await dbGetWorkspaceMeta(RECENT_PROJECTS_KEY)) || [];
  await dbSetWorkspaceMeta(RECENT_PROJECTS_KEY, recent.filter((i) => i !== id));
}

export async function getRecentProjectIds(): Promise<string[]> {
  return (await dbGetWorkspaceMeta(RECENT_PROJECTS_KEY)) || [];
}

export async function getActiveProjectId(): Promise<string | null> {
  return (await dbGetWorkspaceMeta(ACTIVE_PROJECT_ID_KEY)) || null;
}

export async function setActiveProjectId(id: string | null): Promise<void> {
  await dbSetWorkspaceMeta(ACTIVE_PROJECT_ID_KEY, id);
}

// ----------------------------------------------------
// Import & Export Utilities
// ----------------------------------------------------

export function exportProjectToJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function validateAndParseProjectJson(jsonStr: string): {
  success: boolean;
  project?: Project;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'JSON does not contain a valid object.' };
    }

    if (!parsed.name || typeof parsed.name !== 'string') {
      return { success: false, error: 'Missing or invalid "name" string property in project.' };
    }

    if (!Array.isArray(parsed.entities)) {
      return { success: false, error: 'Project must contain an "entities" array.' };
    }

    if (!Array.isArray(parsed.relationships)) {
      return { success: false, error: 'Project must contain a "relationships" array.' };
    }

    // Sanitize and ensure proper arrays
    const sanitizedProject: Project = {
      id: parsed.id || generateId('proj'),
      name: parsed.name.trim(),
      description: typeof parsed.description === 'string' ? parsed.description : '',
      category: typeof parsed.category === 'string' ? parsed.category : 'general',
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entities: parsed.entities.map((e: any) => ({
        id: e.id || generateId('ent'),
        name: e.name || 'Unnamed Entity',
        type: e.type || 'Generic',
        description: e.description || '',
        properties: typeof e.properties === 'object' && e.properties ? e.properties : {},
        createdAt: e.createdAt || new Date().toISOString(),
        updatedAt: e.updatedAt || new Date().toISOString(),
      })),
      relationships: parsed.relationships.map((r: any) => ({
        id: r.id || generateId('rel'),
        sourceId: r.sourceId || '',
        targetId: r.targetId || '',
        label: r.label || 'Connected',
        description: r.description || '',
        createdAt: r.createdAt || new Date().toISOString(),
      })),
      systems: Array.isArray(parsed.systems)
        ? parsed.systems.map((s: any) => ({
            id: s.id || generateId('sys'),
            name: s.name || 'Unnamed System',
            description: s.description || '',
            entityIds: Array.isArray(s.entityIds) ? s.entityIds : [],
            createdAt: s.createdAt || new Date().toISOString(),
            updatedAt: s.updatedAt || new Date().toISOString(),
          }))
        : [],
      rules: Array.isArray(parsed.rules) ? parsed.rules : TEMPLATES.blank.rules,
      events: Array.isArray(parsed.events)
        ? parsed.events.map((ev: any) => ({
            id: ev.id || generateId('evt'),
            name: ev.name || 'Unnamed Event',
            description: ev.description || '',
            date: ev.date || new Date().toISOString().split('T')[0],
            entityIds: Array.isArray(ev.entityIds) ? ev.entityIds : [],
            createdAt: ev.createdAt || new Date().toISOString(),
          }))
        : [],
      customEntityTypes: Array.isArray(parsed.customEntityTypes) ? parsed.customEntityTypes : [],
      metadata: typeof parsed.metadata === 'object' && parsed.metadata ? parsed.metadata : {},
    };

    return { success: true, project: sanitizedProject };
  } catch (err: any) {
    return { success: false, error: `Invalid JSON syntax: ${err.message}` };
  }
}

export function exportEntitiesToCsv(entities: Entity[]): string {
  const headers = ['id', 'name', 'type', 'description', 'property_count', 'created_at', 'updated_at'];
  const rows = entities.map((e) => [
    csvEscape(e.id),
    csvEscape(e.name),
    csvEscape(e.type),
    csvEscape(e.description),
    Object.keys(e.properties || {}).length.toString(),
    csvEscape(e.createdAt),
    csvEscape(e.updatedAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportRelationshipsToCsv(relationships: Relationship[], entities: Entity[]): string {
  const entityMap = new Map<string, string>();
  entities.forEach((e) => entityMap.set(e.id, e.name));

  const headers = [
    'id',
    'source_id',
    'source_name',
    'target_id',
    'target_name',
    'label',
    'description',
    'created_at',
  ];

  const rows = relationships.map((r) => [
    csvEscape(r.id),
    csvEscape(r.sourceId),
    csvEscape(entityMap.get(r.sourceId) || 'UNKNOWN_OR_DELETED'),
    csvEscape(r.targetId),
    csvEscape(entityMap.get(r.targetId) || 'UNKNOWN_OR_DELETED'),
    csvEscape(r.label),
    csvEscape(r.description || ''),
    csvEscape(r.createdAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function csvEscape(str: string): string {
  if (str === null || str === undefined) return '""';
  const text = String(str).replace(/"/g, '""');
  return `"${text}"`;
}
