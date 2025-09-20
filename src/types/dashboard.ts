export interface Project {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastModified: string;
}

export interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface QuickStat {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
}

export interface NRCategory {
  id: string;
  title: string;
  description: string;
  progress: number;
}

export interface DashboardMetrics {
  loadTime: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
}