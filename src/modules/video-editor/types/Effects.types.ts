export interface Effect {
  id: string;
  name: string;
  category: 'transition' | 'filter' | 'overlay' | 'audio' | 'text';
  description: string;
  thumbnailUrl: string;
  parameters: EffectParameter[];
  presetValues: Record<string, any>;
  gpuAccelerated: boolean;
}

export interface EffectParameter {
  name: string;
  displayName: string;
  type: 'number' | 'color' | 'boolean' | 'text' | 'select' | 'range';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export interface AppliedEffect {
  id: string;
  effectId: string;
  itemId: string;
  parameters: Record<string, any>;
  enabled: boolean;
  startTime?: number;
  duration?: number;
}

export interface Transition {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'wipe' | 'dissolve' | 'zoom';
  duration: number;
  parameters: Record<string, any>;
  fromItemId: string;
  toItemId: string;
}

export interface EffectPreset {
  id: string;
  name: string;
  effectId: string;
  parameters: Record<string, any>;
  thumbnailUrl: string;
  category: string;
  tags: string[];
}

export interface RenderSettings {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number;
  format: 'mp4' | 'webm' | 'avi' | 'mov';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  quality: 'draft' | 'good' | 'best';
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: number;
}