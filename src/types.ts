export type ViewMode = 'high-level' | 'dependency';

export interface HighLevelNodeData {
  id: string;
  label: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'api' | 'config' | 'middleware' | 'external';
  description: string;
  tech?: string;
  layer?: string;
  iconType?: string;
  fileCount?: number;
  importance?: 'core' | 'supporting' | 'utility';
}

export interface FileNodeData {
  id: string;
  label: string;
  path: string;
  folder: string;
  fileType: string;
  summary: string;
  githubUrl: string;
  metrics: {
    linesEst?: number;
    complexity?: 'Low' | 'Medium' | 'High';
    type?: string;
  };
  incomingCount?: number;
  outgoingCount?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
  style?: Record<string, any>;
}

export interface HighLevelGraph {
  nodes: HighLevelNodeData[];
  edges: GraphEdge[];
  architectureOverview: string;
  primaryTechStack: string[];
}

export interface FileGraph {
  nodes: FileNodeData[];
  edges: GraphEdge[];
  directoryStructureSummary: string;
  totalFilesParsed: number;
}

export interface RepoAnalysisResult {
  repoUrl: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  stars?: number;
  forks?: number;
  description?: string;
  language?: string;
  highLevelGraph: HighLevelGraph;
  fileGraph: FileGraph;
  analyzedAt: string;
}

export interface NodeExplanation {
  nodeId: string;
  summary: string;
  detailedPurpose: string;
  keyResponsibilities: string[];
  simplifiedUrduExplanation?: string;
  suggestedImprovements?: string[];
}
