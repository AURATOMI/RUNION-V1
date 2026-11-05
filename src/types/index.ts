/**
 * Core type definitions for Runion - System Creation IDE
 */

export type PropertyType = 'string' | 'number' | 'boolean' | 'date' | 'list';

export interface EntityProperty {
  id: string;
  key: string;
  type: PropertyType;
  value: any;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: Record<string, { type: PropertyType; value: any }>;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  description?: string;
  createdAt: string;
}

export interface SystemGroup {
  id: string;
  name: string;
  description: string;
  entityIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RuleType =
  | 'REQUIRED_PROPERTY'
  | 'UNIQUE_NAME_PER_TYPE'
  | 'VALID_RELATIONSHIP_REFERENCES'
  | 'VALID_SYSTEM_MEMBERSHIP'
  | 'REQUIRED_DESCRIPTION'
  | 'NO_ORPHAN_ENTITIES';

export interface SystemRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'completeness' | 'integrity' | 'custom';
  ruleType: RuleType;
  severity: RuleSeverity;
  enabled: boolean;
  config?: {
    targetType?: string;
    propertyName?: string;
    [key: string]: any;
  };
}

export interface TimelineEvent {
  id: string;
  name: string;
  description: string;
  date: string; // ISO date string or formatted date
  entityIds: string[];
  createdAt: string;
}

export interface EntityTypeDefinition {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ProjectMetadata {
  author?: string;
  version?: string;
  tags?: string[];
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  entities: Entity[];
  relationships: Relationship[];
  systems: SystemGroup[];
  rules: SystemRule[];
  events: TimelineEvent[];
  customEntityTypes: EntityTypeDefinition[];
  metadata: ProjectMetadata;
}

export type ValidationCategory = 'entities' | 'relationships' | 'systems' | 'rules' | 'timeline';

export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: RuleSeverity;
  title: string;
  description: string;
  affectedComponentType: 'entity' | 'relationship' | 'system' | 'event' | 'rule';
  affectedId: string;
  suggestedCorrection: string;
  targetModule: 'entities' | 'relationships' | 'systems' | 'rules' | 'timeline';
}

export type ActiveModule =
  | 'overview'
  | 'entities'
  | 'relationships'
  | 'visual'
  | 'systems'
  | 'rules'
  | 'timeline'
  | 'validation'
  | 'settings';
