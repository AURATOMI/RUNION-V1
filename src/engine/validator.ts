import { Project, ValidationIssue } from '../types';

/**
 * Deterministic Validation Engine for Runion
 * Analyzes graph integrity, structural completeness, naming invariants, and user-defined rules.
 */
export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entityIdMap = new Map<string, string>();
  const entityNamesByType = new Map<string, Map<string, string[]>>(); // type -> (normalizedName -> [entityIds])

  // 1. Validate Entities
  for (const entity of project.entities) {
    entityIdMap.set(entity.id, entity.name);

    // Rule 1: Entities without names
    if (!entity.name || entity.name.trim() === '') {
      issues.push({
        id: `issue-ent-noname-${entity.id}`,
        category: 'entities',
        severity: 'error',
        title: 'Entity Missing Name',
        description: `Entity with ID "${entity.id}" does not have a designated name.`,
        affectedComponentType: 'entity',
        affectedId: entity.id,
        suggestedCorrection: 'Open the entity editor and assign a descriptive identifier name.',
        targetModule: 'entities',
      });
    }

    // Rule 2: Entities without types
    if (!entity.type || entity.type.trim() === '') {
      issues.push({
        id: `issue-ent-notype-${entity.id}`,
        category: 'entities',
        severity: 'warning',
        title: 'Entity Missing Type Classification',
        description: `Entity "${entity.name || entity.id}" has no category or structural type assigned.`,
        affectedComponentType: 'entity',
        affectedId: entity.id,
        suggestedCorrection: 'Assign a custom or predefined type to categorize this component.',
        targetModule: 'entities',
      });
    } else {
      const typeKey = entity.type.trim().toLowerCase();
      const nameKey = (entity.name || '').trim().toLowerCase();

      if (!entityNamesByType.has(typeKey)) {
        entityNamesByType.set(typeKey, new Map());
      }
      const namesInType = entityNamesByType.get(typeKey)!;
      if (!namesInType.has(nameKey)) {
        namesInType.set(nameKey, []);
      }
      namesInType.get(nameKey)!.push(entity.id);
    }

    // Check entity description completeness if enabled in rules
    const descRule = project.rules?.find((r) => r.ruleType === 'REQUIRED_DESCRIPTION' && r.enabled);
    if (descRule && (!entity.description || entity.description.trim() === '')) {
      issues.push({
        id: `issue-ent-nodesc-${entity.id}`,
        category: 'entities',
        severity: descRule.severity || 'info',
        title: 'Empty Entity Description',
        description: `Entity "${entity.name || entity.id}" contains no explanatory description.`,
        affectedComponentType: 'entity',
        affectedId: entity.id,
        suggestedCorrection: 'Provide documentation detailing the responsibilities or role of this component.',
        targetModule: 'entities',
      });
    }
  }

  // Rule 3: Duplicate entity names within the same type
  const uniqueNameRule = project.rules?.find((r) => r.ruleType === 'UNIQUE_NAME_PER_TYPE' && r.enabled);
  if (uniqueNameRule !== undefined ? uniqueNameRule.enabled : true) {
    for (const [typeKey, namesMap] of entityNamesByType.entries()) {
      for (const [nameKey, ids] of namesMap.entries()) {
        if (nameKey && ids.length > 1) {
          for (const entId of ids) {
            issues.push({
              id: `issue-dup-name-${entId}`,
              category: 'entities',
              severity: uniqueNameRule?.severity || 'warning',
              title: 'Duplicate Entity Name in Same Type',
              description: `Multiple entities of type "${typeKey}" share the identical name "${nameKey}".`,
              affectedComponentType: 'entity',
              affectedId: entId,
              suggestedCorrection: 'Rename one of the entities or modify its type to ensure unambiguous disambiguation.',
              targetModule: 'entities',
            });
          }
        }
      }
    }
  }

  // 2. Validate Relationships
  const connectedEntityIds = new Set<string>();

  for (const rel of project.relationships) {
    const sourceExists = entityIdMap.has(rel.sourceId);
    const targetExists = entityIdMap.has(rel.targetId);

    if (sourceExists) connectedEntityIds.add(rel.sourceId);
    if (targetExists) connectedEntityIds.add(rel.targetId);

    // Rule 4 & 5: Relationships referencing missing entities
    if (!sourceExists && !targetExists) {
      issues.push({
        id: `issue-rel-both-missing-${rel.id}`,
        category: 'relationships',
        severity: 'error',
        title: 'Broken Relationship (Both Endpoints Missing)',
        description: `Relationship "${rel.label}" connects source "${rel.sourceId}" and target "${rel.targetId}", neither of which exists.`,
        affectedComponentType: 'relationship',
        affectedId: rel.id,
        suggestedCorrection: 'Delete this orphan relationship or reconnect it to valid active entities.',
        targetModule: 'relationships',
      });
    } else if (!sourceExists) {
      issues.push({
        id: `issue-rel-source-missing-${rel.id}`,
        category: 'relationships',
        severity: 'error',
        title: 'Broken Relationship Source Reference',
        description: `Relationship "${rel.label}" originates from missing entity "${rel.sourceId}".`,
        affectedComponentType: 'relationship',
        affectedId: rel.id,
        suggestedCorrection: 'Update the relationship source endpoint or prune the orphaned connection.',
        targetModule: 'relationships',
      });
    } else if (!targetExists) {
      issues.push({
        id: `issue-rel-target-missing-${rel.id}`,
        category: 'relationships',
        severity: 'error',
        title: 'Broken Relationship Target Reference',
        description: `Relationship "${rel.label}" terminates at missing entity "${rel.targetId}".`,
        affectedComponentType: 'relationship',
        affectedId: rel.id,
        suggestedCorrection: 'Update the relationship target endpoint or prune the orphaned connection.',
        targetModule: 'relationships',
      });
    }

    // Self-referential loop with empty label check
    if (rel.sourceId === rel.targetId && (!rel.label || rel.label.trim() === '')) {
      issues.push({
        id: `issue-rel-loop-unlabeled-${rel.id}`,
        category: 'relationships',
        severity: 'info',
        title: 'Unlabeled Self-Referential Connection',
        description: `Relationship loops back onto the same entity without an explanatory relationship verb.`,
        affectedComponentType: 'relationship',
        affectedId: rel.id,
        suggestedCorrection: 'Clarify the self-referential behavior by adding a descriptive label (e.g., "Recursively Invokes").',
        targetModule: 'relationships',
      });
    }
  }

  // Optional: Check for orphan entities if rule enabled
  const orphanRule = project.rules?.find((r) => r.ruleType === 'NO_ORPHAN_ENTITIES' && r.enabled);
  if (orphanRule && project.entities.length > 1) {
    for (const entity of project.entities) {
      if (!connectedEntityIds.has(entity.id)) {
        issues.push({
          id: `issue-orphan-ent-${entity.id}`,
          category: 'entities',
          severity: orphanRule.severity || 'warning',
          title: 'Isolated / Orphan Entity',
          description: `Entity "${entity.name}" has no incoming or outgoing relationship connections.`,
          affectedComponentType: 'entity',
          affectedId: entity.id,
          suggestedCorrection: 'Establish at least one functional connection in the Relationship Manager or Visual Explorer.',
          targetModule: 'relationships',
        });
      }
    }
  }

  // 3. Validate Systems
  for (const sys of project.systems) {
    if (!sys.name || sys.name.trim() === '') {
      issues.push({
        id: `issue-sys-noname-${sys.id}`,
        category: 'systems',
        severity: 'error',
        title: 'System Group Missing Name',
        description: `A system group is missing an identifying title.`,
        affectedComponentType: 'system',
        affectedId: sys.id,
        suggestedCorrection: 'Assign a descriptive designation to this subsystem grouping.',
        targetModule: 'systems',
      });
    }

    // Rule 6: Systems referencing missing entities
    const missingMembers = (sys.entityIds || []).filter((id) => !entityIdMap.has(id));
    if (missingMembers.length > 0) {
      issues.push({
        id: `issue-sys-missing-members-${sys.id}`,
        category: 'systems',
        severity: 'error',
        title: 'System Contains Deleted / Missing Member Entities',
        description: `System "${sys.name}" references ${missingMembers.length} entity ID(s) that no longer exist in the catalog (${missingMembers.join(', ')}).`,
        affectedComponentType: 'system',
        affectedId: sys.id,
        suggestedCorrection: 'Remove the invalid member IDs from this system in the System Manager.',
        targetModule: 'systems',
      });
    }

    if (!sys.entityIds || sys.entityIds.length === 0) {
      issues.push({
        id: `issue-sys-empty-${sys.id}`,
        category: 'systems',
        severity: 'info',
        title: 'Empty System Group',
        description: `System "${sys.name}" currently contains no member entities.`,
        affectedComponentType: 'system',
        affectedId: sys.id,
        suggestedCorrection: 'Add member entities to aggregate functional subcomponents into this system.',
        targetModule: 'systems',
      });
    }
  }

  // 4. Validate Timeline Events
  for (const ev of project.events) {
    if (!ev.name || ev.name.trim() === '') {
      issues.push({
        id: `issue-evt-noname-${ev.id}`,
        category: 'timeline',
        severity: 'error',
        title: 'Timeline Event Missing Title',
        description: `An event on the system timeline has no title.`,
        affectedComponentType: 'event',
        affectedId: ev.id,
        suggestedCorrection: 'Specify a milestone or event title.',
        targetModule: 'timeline',
      });
    }

    // Rule 8: Events with invalid dates
    if (!ev.date || ev.date.trim() === '') {
      issues.push({
        id: `issue-evt-nodate-${ev.id}`,
        category: 'timeline',
        severity: 'error',
        title: 'Timeline Event Missing Date',
        description: `Event "${ev.name || ev.id}" does not specify a chronological occurrence date.`,
        affectedComponentType: 'event',
        affectedId: ev.id,
        suggestedCorrection: 'Set a valid ISO date or year timestamp for chronological sequencing.',
        targetModule: 'timeline',
      });
    } else {
      // Check if date can be interpreted
      const isIsoDate = /^\d{4}(-\d{2}(-\d{2})?)?/.test(ev.date);
      const parsedTime = Date.parse(ev.date);
      if (!isIsoDate && isNaN(parsedTime)) {
        issues.push({
          id: `issue-evt-invalid-date-${ev.id}`,
          category: 'timeline',
          severity: 'warning',
          title: 'Unparseable Event Date Format',
          description: `Event "${ev.name}" has date value "${ev.date}", which is not standard ISO YYYY-MM-DD format.`,
          affectedComponentType: 'event',
          affectedId: ev.id,
          suggestedCorrection: 'Format the date as YYYY-MM-DD to guarantee accurate chronological sorting.',
          targetModule: 'timeline',
        });
      }
    }

    // Check associated entities existence
    if (ev.entityIds && ev.entityIds.length > 0) {
      const missingEntities = ev.entityIds.filter((id) => !entityIdMap.has(id));
      if (missingEntities.length > 0) {
        issues.push({
          id: `issue-evt-missing-entity-${ev.id}`,
          category: 'timeline',
          severity: 'warning',
          title: 'Timeline Event References Missing Entity',
          description: `Event "${ev.name}" is associated with ${missingEntities.length} nonexistent entity record(s).`,
          affectedComponentType: 'event',
          affectedId: ev.id,
          suggestedCorrection: 'Update the event participants to link existing catalog entities.',
          targetModule: 'timeline',
        });
      }
    }
  }

  // 5. Custom Rule: Required Property
  const requiredPropRules = project.rules?.filter((r) => r.ruleType === 'REQUIRED_PROPERTY' && r.enabled && r.config?.propertyName);
  if (requiredPropRules && requiredPropRules.length > 0) {
    for (const rule of requiredPropRules) {
      const propKey = rule.config?.propertyName?.trim();
      const targetType = rule.config?.targetType?.trim().toLowerCase();

      if (propKey) {
        for (const entity of project.entities) {
          if (!targetType || (entity.type && entity.type.toLowerCase() === targetType)) {
            const hasProp = entity.properties && entity.properties[propKey] !== undefined && entity.properties[propKey].value !== '';
            if (!hasProp) {
              issues.push({
                id: `issue-rule-reqprop-${rule.id}-${entity.id}`,
                category: 'rules',
                severity: rule.severity || 'error',
                title: `Missing Required Property: "${propKey}"`,
                description: `Entity "${entity.name}" does not satisfy rule "${rule.name}" requiring property "${propKey}".`,
                affectedComponentType: 'entity',
                affectedId: entity.id,
                suggestedCorrection: `Open "${entity.name}" and add property "${propKey}".`,
                targetModule: 'entities',
              });
            }
          }
        }
      }
    }
  }

  return issues;
}
