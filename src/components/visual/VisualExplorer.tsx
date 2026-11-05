import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  ExternalLink,
  Layers,
  Share2,
  X,
  Compass,
  Move,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Entity, Relationship } from '../../types';

interface NodePosition {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export const VisualExplorer: React.FC = () => {
  const {
    currentProject,
    selectedEntityId,
    setSelectedEntityId,
    navigateToEntity,
  } = useProject();

  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport Transform (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Positions Map
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');

  // Compute available types and color map
  const typeColorMap = useMemo(() => {
    const map = new Map<string, string>();
    currentProject?.customEntityTypes?.forEach((t) => map.set(t.name.toLowerCase(), t.color));
    return map;
  }, [currentProject]);

  const getNodeColor = useCallback(
    (type: string) => {
      return typeColorMap.get(type.toLowerCase()) || '#38bdf8';
    },
    [typeColorMap]
  );

  // Initialize or update node positions when entities change
  useEffect(() => {
    if (!currentProject) return;

    setPositions((prev) => {
      const next = { ...prev };
      const entities = currentProject.entities;
      const count = entities.length;
      const radius = Math.max(220, count * 35);
      const centerX = 500;
      const centerY = 350;

      entities.forEach((ent, idx) => {
        if (!next[ent.id]) {
          // Distribute in a balanced circle
          const angle = (idx / (count || 1)) * 2 * Math.PI;
          next[ent.id] = {
            x: centerX + radius * Math.cos(angle) + (Math.random() * 20 - 10),
            y: centerY + radius * Math.sin(angle) + (Math.random() * 20 - 10),
          };
        }
      });

      return next;
    });
  }, [currentProject?.entities]);

  // Center on searched entity
  useEffect(() => {
    if (searchQuery.trim() && currentProject) {
      const matched = currentProject.entities.find((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matched && positions[matched.id]) {
        setSelectedEntityId(matched.id);
        const pos = positions[matched.id];
        // Center view on this node
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          setPan({
            x: rect.width / 2 - pos.x * zoom,
            y: rect.height / 2 - pos.y * zoom,
          });
        }
      }
    }
  }, [searchQuery]);

  // Auto-arrange layout in neat concentric rings
  const handleAutoLayout = () => {
    if (!currentProject) return;
    const entities = currentProject.entities;
    const count = entities.length;
    const radius = Math.max(250, count * 40);
    const centerX = 500;
    const centerY = 350;

    const newPos: Record<string, NodePosition> = {};
    entities.forEach((ent, idx) => {
      const angle = (idx / (count || 1)) * 2 * Math.PI;
      newPos[ent.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    setPositions(newPos);
    setPan({ x: 50, y: 50 });
    setZoom(1);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - pan.x) / zoom;
      const currentY = (e.clientY - rect.top - pan.y) / zoom;

      setPositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: currentX - dragOffset.x,
          y: currentY - dragOffset.y,
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedEntityId(nodeId);
    setDraggingNodeId(nodeId);

    const nodePos = positions[nodeId] || { x: 0, y: 0 };
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setDragOffset({
        x: mouseX - nodePos.x,
        y: mouseY - nodePos.y,
      });
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(0.25, prev + delta), 2.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 50, y: 50 });
  };

  const handleFitToScreen = () => {
    if (!currentProject || currentProject.entities.length === 0 || !svgRef.current) return;
    const allX = Object.values(positions).map((p) => p.x);
    const allY = Object.values(positions).map((p) => p.y);
    if (allX.length === 0) return;

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const width = maxX - minX + 240;
    const height = maxY - minY + 240;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const newZoom = Math.min(Math.max(0.3, Math.min(scaleX, scaleY) * 0.85), 1.2);

    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - ((minX + maxX) / 2) * newZoom,
      y: rect.height / 2 - ((minY + maxY) / 2) * newZoom,
    });
  };

  // Active selected entity details
  const activeEntity = useMemo(() => {
    if (!currentProject || !selectedEntityId) return null;
    return currentProject.entities.find((e) => e.id === selectedEntityId) || null;
  }, [currentProject, selectedEntityId]);

  // Connected edges to active selected node
  const activeConnectedRels = useMemo(() => {
    if (!currentProject || !selectedEntityId) return [];
    return currentProject.relationships.filter(
      (r) => r.sourceId === selectedEntityId || r.targetId === selectedEntityId
    );
  }, [currentProject, selectedEntityId]);

  // Connected node IDs for highlighting
  const highlightedNodeIds = useMemo(() => {
    if (!selectedEntityId) return new Set<string>();
    const set = new Set<string>([selectedEntityId]);
    activeConnectedRels.forEach((r) => {
      set.add(r.sourceId);
      set.add(r.targetId);
    });
    return set;
  }, [selectedEntityId, activeConnectedRels]);

  // Available entity types for filter
  const availableTypes = useMemo(() => {
    if (!currentProject) return [];
    const set = new Set<string>();
    currentProject.entities.forEach((e) => {
      if (e.type) set.add(e.type);
    });
    return Array.from(set).sort();
  }, [currentProject]);

  return (
    <div className="flex h-full w-full overflow-hidden select-none relative bg-[#090c12]">
      {/* Top Floating Graph Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#101520]/90 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl">
        {/* Search Input */}
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find node in graph..."
            className="w-full pl-8 pr-2 py-1 bg-[#161d2b] border border-slate-700 rounded text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={activeTypeFilter}
          onChange={(e) => setActiveTypeFilter(e.target.value)}
          className="bg-[#161d2b] border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Types</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Zoom Controls */}
        <button
          onClick={() => handleZoom(0.15)}
          title="Zoom In"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          title="Zoom Out"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitToScreen}
          title="Fit to Screen"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleAutoLayout}
          title="Auto-Arrange Layout"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset View"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-mono text-slate-400 px-1.5 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 h-full w-full overflow-hidden cursor-grab active:cursor-grabbing">
        <svg
          ref={svgRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            {/* Arrow Marker Definitions */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker
              id="arrow-highlight"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
            </marker>

            {/* Subtle grid pattern */}
            <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161e2e" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#graph-grid)" />

          {/* Transformed Content Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges Layer */}
            {currentProject?.relationships.map((rel) => {
              const srcPos = positions[rel.sourceId];
              const tgtPos = positions[rel.targetId];
              if (!srcPos || !tgtPos) return null;

              const isConnectedToSelected =
                rel.sourceId === selectedEntityId || rel.targetId === selectedEntityId;
              const hasSelection = Boolean(selectedEntityId);

              // Calculate gentle curvature
              const dx = tgtPos.x - srcPos.x;
              const dy = tgtPos.y - srcPos.y;
              const midX = (srcPos.x + tgtPos.x) / 2;
              const midY = (srcPos.y + tgtPos.y) / 2;
              // Perpendicular offset for curvature
              const curvature = 24;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const normX = -dy / len;
              const normY = dx / len;
              const ctrlX = midX + normX * curvature;
              const ctrlY = midY + normY * curvature;

              const pathData = `M ${srcPos.x} ${srcPos.y} Q ${ctrlX} ${ctrlY} ${tgtPos.x} ${tgtPos.y}`;

              return (
                <g key={rel.id} className="transition-opacity duration-200">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isConnectedToSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isConnectedToSelected ? 2.5 : 1.5}
                    strokeDasharray={isConnectedToSelected ? 'none' : 'none'}
                    opacity={hasSelection && !isConnectedToSelected ? 0.25 : 0.85}
                    markerEnd={
                      isConnectedToSelected
                        ? 'url(#arrow-highlight)'
                        : 'url(#arrow-default)'
                    }
                  />

                  {/* Edge Label text pill */}
                  <g
                    transform={`translate(${ctrlX}, ${ctrlY})`}
                    opacity={hasSelection && !isConnectedToSelected ? 0.2 : 0.95}
                  >
                    <rect
                      x={-(rel.label.length * 3.5 + 8)}
                      y="-9"
                      width={rel.label.length * 7 + 16}
                      height="18"
                      rx="4"
                      fill="#0c1018"
                      stroke={isConnectedToSelected ? '#38bdf8' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isConnectedToSelected ? '#7dd3fc' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      className="select-none pointer-events-none"
                    >
                      {rel.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Nodes Layer */}
            {currentProject?.entities.map((entity) => {
              if (
                activeTypeFilter !== 'ALL' &&
                entity.type.toLowerCase() !== activeTypeFilter.toLowerCase()
              ) {
                return null;
              }

              const pos = positions[entity.id] || { x: 400, y: 300 };
              const isSelected = selectedEntityId === entity.id;
              const isHighlighted = highlightedNodeIds.has(entity.id);
              const hasSelection = Boolean(selectedEntityId);
              const typeColor = getNodeColor(entity.type);

              const nodeWidth = 160;
              const nodeHeight = 56;

              return (
                <g
                  key={entity.id}
                  transform={`translate(${pos.x - nodeWidth / 2}, ${pos.y - nodeHeight / 2})`}
                  onMouseDown={(e) => handleNodeMouseDown(e, entity.id)}
                  className="cursor-move"
                  opacity={hasSelection && !isHighlighted ? 0.3 : 1}
                >
                  {/* Node Background & Border */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="8"
                    fill="#111622"
                    stroke={isSelected ? '#38bdf8' : isHighlighted ? '#60a5fa' : '#1e293b'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-150"
                    filter={isSelected ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.35))' : undefined}
                  />

                  {/* Left Color Accent Bar */}
                  <rect
                    x="0"
                    y="0"
                    width="4"
                    height={nodeHeight}
                    rx="2"
                    fill={typeColor}
                  />

                  {/* Type Label */}
                  <text
                    x="12"
                    y="18"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    className="select-none pointer-events-none uppercase tracking-wider"
                  >
                    {entity.type}
                  </text>

                  {/* Entity Name */}
                  <text
                    x="12"
                    y="36"
                    fill="#f1f5f9"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    className="select-none pointer-events-none"
                  >
                    {entity.name.length > 18 ? `${entity.name.slice(0, 18)}…` : entity.name}
                  </text>

                  {/* Property Count Badge */}
                  {Object.keys(entity.properties || {}).length > 0 && (
                    <g transform={`translate(${nodeWidth - 22}, 10)`}>
                      <circle r="7" fill="#1e293b" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#cbd5e1"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {Object.keys(entity.properties || {}).length}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Node Inspector Panel (when node selected) */}
      {activeEntity && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-[#0e131d]/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0d14]">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getNodeColor(activeEntity.type) }}
              />
              <span className="text-xs font-mono uppercase text-slate-400">Node Inspector</span>
            </div>
            <button
              onClick={() => setSelectedEntityId(null)}
              className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                {activeEntity.type}
              </span>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{activeEntity.name}</h3>
              <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                {activeEntity.description || 'No description provided.'}
              </p>
            </div>

            {/* Custom Properties */}
            {Object.keys(activeEntity.properties || {}).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Properties
                </span>
                <div className="space-y-1">
                  {Object.entries(activeEntity.properties).map(([k, p]) => (
                    <div
                      key={k}
                      className="px-2.5 py-1.5 bg-[#141a27] border border-slate-800 rounded flex justify-between items-center font-mono text-[11px]"
                    >
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-slate-200 font-medium">{String(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Relationships in Explorer */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Connected Edges ({activeConnectedRels.length})
              </span>
              <div className="space-y-1.5">
                {activeConnectedRels.map((rel) => {
                  const isOutgoing = rel.sourceId === activeEntity.id;
                  const otherId = isOutgoing ? rel.targetId : rel.sourceId;
                  const other = currentProject?.entities.find((e) => e.id === otherId);

                  return (
                    <div
                      key={rel.id}
                      onClick={() => other && setSelectedEntityId(other.id)}
                      className="p-2 bg-[#141a27] hover:bg-slate-800 border border-slate-800 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                        <span>{isOutgoing ? '→ Outgoing' : '← Incoming'}</span>
                        <span>{rel.label}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
                        {other?.name || 'Deleted Entity'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                onClick={() => navigateToEntity(activeEntity.id)}
                className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center justify-center gap-2 transition-colors text-xs"
              >
                <span>Edit in Entity Manager</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
