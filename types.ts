
export interface NodeData {
  id: string;
  label: string;
  group: number;
}

export interface LinkData {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface ApiResponse {
  concepts: NodeData[];
  relationships: LinkData[];
  relatedTopics: string[];
}
