// Types para o sistema de Smart Templates e Automation

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'effect';
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  properties: Record<string, any>;
  animations?: Animation[];
  constraints?: ElementConstraint[];
}

export interface Animation {
  id: string;
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'rotate' | 'custom';
  duration: number;
  delay: number;
  easing: string;
  properties: Record<string, any>;
}

export interface ElementConstraint {
  type: 'aspectRatio' | 'minSize' | 'maxSize' | 'position' | 'alignment';
  value: any;
  target?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail: string;
  preview: string;
  elements: TemplateElement[];
  duration: number;
  aspectRatio: string;
  resolution: {
    width: number;
    height: number;
  };
  metadata: TemplateMetadata;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  author: TemplateAuthor;
  license: TemplateLicense;
  pricing: TemplatePricing;
  analytics: TemplateAnalytics;
}

export interface TemplateMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  requiredAssets: string[];
  compatibleFormats: string[];
  features: string[];
  industry: string[];
  mood: string[];
  colorScheme: string[];
}

export interface TemplateAuthor {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  rating: number;
  totalTemplates: number;
}

export interface TemplateLicense {
  type: 'free' | 'premium' | 'commercial' | 'exclusive';
  usage: string[];
  restrictions: string[];
  attribution: boolean;
}

export interface TemplatePricing {
  type: 'free' | 'paid' | 'subscription';
  price?: number;
  currency?: string;
  subscription?: {
    monthly: number;
    yearly: number;
  };
}

export interface TemplateAnalytics {
  downloads: number;
  views: number;
  likes: number;
  rating: number;
  reviews: number;
  trending: boolean;
  featured: boolean;
}

export type TemplateCategory = 
  | 'social-media'
  | 'marketing'
  | 'education'
  | 'entertainment'
  | 'business'
  | 'personal'
  | 'events'
  | 'news'
  | 'sports'
  | 'travel'
  | 'food'
  | 'fashion'
  | 'technology'
  | 'health'
  | 'finance';

export interface TemplateFilter {
  category?: TemplateCategory[];
  tags?: string[];
  difficulty?: string[];
  duration?: {
    min: number;
    max: number;
  };
  aspectRatio?: string[];
  pricing?: string[];
  license?: string[];
  author?: string[];
  rating?: number;
  sortBy?: 'popular' | 'recent' | 'rating' | 'downloads' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateSearchResult {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
  filters: TemplateFilter;
}

// Automation Types
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  type: 'contentAdded' | 'timeReached' | 'userAction' | 'dataChange' | 'schedule' | 'manual';
  config: Record<string, any>;
}

export interface AutomationCondition {
  type: 'contentType' | 'duration' | 'aspectRatio' | 'fileSize' | 'metadata' | 'custom';
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
  target?: string;
}

export interface AutomationAction {
  type: 'applyTemplate' | 'addEffect' | 'adjustTiming' | 'cropVideo' | 'addText' | 'addMusic' | 'export' | 'notify';
  config: Record<string, any>;
  delay?: number;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  rules: AutomationRule[];
  enabled: boolean;
  stats: WorkflowStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStats {
  executions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecution?: Date;
  errors: WorkflowError[];
}

export interface WorkflowError {
  timestamp: Date;
  ruleId: string;
  error: string;
  context: Record<string, any>;
}

// Template Builder Types
export interface TemplateBuilderState {
  template: Partial<Template>;
  selectedElement?: string;
  clipboard?: TemplateElement[];
  history: TemplateBuilderAction[];
  historyIndex: number;
  previewMode: boolean;
  gridEnabled: boolean;
  snapEnabled: boolean;
  zoom: number;
}

export interface TemplateBuilderAction {
  type: 'add' | 'remove' | 'modify' | 'move' | 'resize' | 'duplicate';
  elementId?: string;
  before?: any;
  after?: any;
  timestamp: Date;
}

// Smart Suggestions Types
export interface SmartSuggestion {
  id: string;
  type: 'template' | 'element' | 'effect' | 'layout' | 'color' | 'font' | 'automation';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  preview?: string;
  data: any;
  templateId?: string;
  workflowId?: string;
}

export interface ContentAnalysis {
  contentType: string[];
  dominantColors: string[];
  mood: string;
  style: string;
  complexity: number;
  duration: number;
  aspectRatio: string;
  quality: number;
  metadata: Record<string, any>;
}

// Template Engine Types
export interface TemplateRenderOptions {
  quality: 'draft' | 'preview' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'gif' | 'frames';
  resolution?: {
    width: number;
    height: number;
  };
  fps?: number;
  bitrate?: number;
  optimization?: {
    compression: boolean;
    progressive: boolean;
    fastStart: boolean;
  };
}

export interface TemplateRenderJob {
  id: string;
  templateId: string;
  options: TemplateRenderOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  outputUrl?: string;
  error?: string;
}

// Marketplace Types
export interface MarketplaceStats {
  totalTemplates: number;
  totalDownloads: number;
  totalAuthors: number;
  featuredTemplates: Template[];
  trendingTemplates: Template[];
  newTemplates: Template[];
  topAuthors: TemplateAuthor[];
  categories: {
    category: TemplateCategory;
    count: number;
  }[];
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: Date;
  verified: boolean;
}

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  templates: string[];
  author: TemplateAuthor;
  public: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// All types are already exported with their interface declarations above