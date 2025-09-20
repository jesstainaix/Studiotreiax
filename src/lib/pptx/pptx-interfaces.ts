/**
 * PPTX Studio - Sistema Unificado de Interfaces TypeScript
 * Centralização e padronização de todas as interfaces do módulo PPTX
 */

// ===== INTERFACES BÁSICAS =====

export interface PPTXFile {
  name: string;
  size: number;
  data: ArrayBuffer;
  type: string;
  lastModified: number;
  metadata?: PPTXMetadata;
}

export interface PPTXMetadata {
  title?: string;
  author?: string;
  creator?: string;
  subject?: string;
  description?: string;
  keywords?: string[];
  category?: string;
  version?: string;
  created?: Date;
  modified?: Date;
  slideCount?: number;
  hasAnimations?: boolean;
  hasTransitions?: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
  customProperties?: Record<string, any>;
}

// ===== INTERFACES DE SLIDE =====

export interface PPTXSlide {
  id: string;
  index: number;
  title: string;
  content: PPTXSlideContent;
  layout: PPTXSlideLayout;
  background: PPTXBackground;
  animations: PPTXAnimation[];
  transitions: PPTXTransition[];
  notes?: string;
  thumbnail?: PPTXThumbnail;
  hidden?: boolean;
  duration?: number;
  xml?: string;
}

export interface PPTXSlideContent {
  textElements: PPTXTextElement[];
  imageElements: PPTXImageElement[];
  shapeElements: PPTXShapeElement[];
  tableElements: PPTXTableElement[];
  chartElements: PPTXChartElement[];
  mediaElements: PPTXMediaElement[];
  groupElements: PPTXGroupElement[];
}

export interface PPTXSlideLayout {
  name: string;
  type: SlideLayoutType;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  placeholders: PPTXPlaceholder[];
  masterSlideId?: string;
}

export type SlideLayoutType = 
  | 'title'
  | 'titleContent'
  | 'twoContent'
  | 'comparison'
  | 'titleOnly'
  | 'blank'
  | 'contentWithCaption'
  | 'pictureWithCaption'
  | 'custom';

// ===== INTERFACES DE ELEMENTOS =====

export interface PPTXElement {
  id: string;
  type: ElementType;
  position: PPTXPosition;
  size: PPTXSize;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex?: number;
  animations?: PPTXAnimation[];
  hyperlink?: PPTXHyperlink;
}

export type ElementType = 
  | 'text'
  | 'image'
  | 'shape'
  | 'table'
  | 'chart'
  | 'media'
  | 'group'
  | 'placeholder';

export interface PPTXTextElement extends PPTXElement {
  type: 'text';
  text: string;
  formatting: PPTXTextFormatting;
  paragraphs: PPTXParagraph[];
  wordWrap?: boolean;
  autoFit?: TextAutoFitType;
  verticalAlignment?: VerticalAlignment;
}

export interface PPTXImageElement extends PPTXElement {
  type: 'image';
  source: PPTXImageSource;
  alt?: string;
  effects?: PPTXImageEffect[];
  cropping?: PPTXCropping;
  compression?: PPTXCompression;
}

export interface PPTXShapeElement extends PPTXElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: PPTXFill;
  border: PPTXBorder;
  shadow?: PPTXShadow;
  reflection?: PPTXReflection;
  glow?: PPTXGlow;
  textContent?: PPTXTextContent;
}

export interface PPTXTableElement extends PPTXElement {
  type: 'table';
  rows: PPTXTableRow[];
  columns: PPTXTableColumn[];
  style?: PPTXTableStyle;
  header?: boolean;
  bandedRows?: boolean;
  bandedColumns?: boolean;
}

export interface PPTXChartElement extends PPTXElement {
  type: 'chart';
  chartType: ChartType;
  data: PPTXChartData;
  title?: string;
  legend?: PPTXLegend;
  axes?: PPTXAxis[];
  series: PPTXSeries[];
}

export interface PPTXMediaElement extends PPTXElement {
  type: 'media';
  mediaType: MediaType;
  source: PPTXMediaSource;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  poster?: string;
}

export interface PPTXGroupElement extends PPTXElement {
  type: 'group';
  elements: PPTXElement[];
  groupName?: string;
}

// ===== INTERFACES DE POSICIONAMENTO E TAMANHO =====

export interface PPTXPosition {
  x: number;
  y: number;
  unit: PositionUnit;
}

export interface PPTXSize {
  width: number;
  height: number;
  unit: SizeUnit;
}

export type PositionUnit = 'px' | 'pt' | 'in' | 'cm' | 'mm' | '%';
export type SizeUnit = 'px' | 'pt' | 'in' | 'cm' | 'mm' | '%';

// ===== INTERFACES DE FORMATAÇÃO =====

export interface PPTXTextFormatting {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  color?: PPTXColor;
  backgroundColor?: PPTXColor;
  underline?: UnderlineType;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  letterSpacing?: number;
  lineSpacing?: number;
  textAlign?: TextAlignment;
  textDirection?: TextDirection;
  language?: string;
}

export interface PPTXParagraph {
  text: string;
  formatting?: PPTXTextFormatting;
  bulletPoint?: PPTXBulletPoint;
  indentation?: PPTXIndentation;
  spacing?: PPTXSpacing;
}

export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type FontStyle = 'normal' | 'italic' | 'oblique';
export type UnderlineType = 'none' | 'single' | 'double' | 'thick' | 'dotted' | 'dashed';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextDirection = 'ltr' | 'rtl';
export type TextAutoFitType = 'none' | 'shrink' | 'resize';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';

// ===== INTERFACES DE COR E ESTILO =====

export interface PPTXColor {
  type: ColorType;
  value: string;
  alpha?: number;
  scheme?: ColorScheme;
  tint?: number;
  shade?: number;
}

export type ColorType = 'rgb' | 'hsl' | 'hex' | 'theme' | 'system';
export type ColorScheme = 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6' | 'background1' | 'background2' | 'text1' | 'text2' | 'hyperlink' | 'followedHyperlink';

export interface PPTXFill {
  type: FillType;
  color?: PPTXColor;
  gradient?: PPTXGradient;
  pattern?: PPTXPattern;
  image?: PPTXImageFill;
  transparency?: number;
}

export type FillType = 'solid' | 'gradient' | 'pattern' | 'image' | 'none';

export interface PPTXBorder {
  width: number;
  style: BorderStyle;
  color: PPTXColor;
  transparency?: number;
}

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset' | 'none';

// ===== INTERFACES DE EFEITOS =====

export interface PPTXShadow {
  type: ShadowType;
  color: PPTXColor;
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  transparency?: number;
}

export type ShadowType = 'outer' | 'inner' | 'perspective';

export interface PPTXReflection {
  transparency: number;
  size: number;
  distance: number;
  blur: number;
  direction: number;
  fadeDirection: number;
  rotateWithShape: boolean;
}

export interface PPTXGlow {
  color: PPTXColor;
  size: number;
  transparency?: number;
}

// ===== INTERFACES DE ANIMAÇÃO E TRANSIÇÃO =====

export interface PPTXAnimation {
  id: string;
  type: AnimationType;
  effect: AnimationEffect;
  duration: number;
  delay?: number;
  trigger: AnimationTrigger;
  direction?: AnimationDirection;
  sequence?: number;
  repeat?: AnimationRepeat;
  bounce?: boolean;
  smooth?: boolean;
}

export type AnimationType = 'entrance' | 'exit' | 'emphasis' | 'motion';
export type AnimationEffect = 'fade' | 'fly' | 'wipe' | 'split' | 'reveal' | 'randomBars' | 'grow' | 'zoom' | 'swivel' | 'bounce';
export type AnimationTrigger = 'onClick' | 'withPrevious' | 'afterPrevious' | 'onPageClick';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight';
export type AnimationRepeat = 'none' | 'once' | 'infinite' | number;

export interface PPTXTransition {
  type: TransitionType;
  duration: number;
  direction?: TransitionDirection;
  advanceOnTime?: boolean;
  advanceTime?: number;
  sound?: PPTXTransitionSound;
}

export type TransitionType = 'none' | 'fade' | 'push' | 'wipe' | 'split' | 'reveal' | 'cover' | 'cut' | 'morph';
export type TransitionDirection = 'up' | 'down' | 'left' | 'right' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight' | 'horizontal' | 'vertical';

// ===== INTERFACES DE MÍDIA =====

export interface PPTXImageSource {
  type: ImageSourceType;
  url?: string;
  data?: ArrayBuffer;
  base64?: string;
  fileName?: string;
  format?: ImageFormat;
  originalSize?: PPTXSize;
}

export type ImageSourceType = 'url' | 'data' | 'base64' | 'embedded';
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'svg' | 'webp';

export interface PPTXMediaSource {
  type: MediaSourceType;
  url?: string;
  data?: ArrayBuffer;
  fileName?: string;
  format?: MediaFormat;
  duration?: number;
}

export type MediaSourceType = 'url' | 'data' | 'embedded';
export type MediaFormat = 'mp4' | 'avi' | 'wmv' | 'mov' | 'mp3' | 'wav' | 'wma';
export type MediaType = 'video' | 'audio';

// ===== INTERFACES DE THUMBNAIL =====

export interface PPTXThumbnail {
  data: ArrayBuffer;
  format: ImageFormat;
  width: number;
  height: number;
  quality?: number;
}

// ===== INTERFACES DE PROCESSAMENTO =====

export interface PPTXProcessingOptions {
  includeThumbnails: boolean;
  includeNotes: boolean;
  includeAnimations: boolean;
  includeTransitions: boolean;
  includeMaster: boolean;
  includeLayouts: boolean;
  includeTheme: boolean;
  extractMedia: boolean;
  extractImages: boolean;
  optimizeImages: boolean;
  imageQuality: number;
  thumbnailSize: PPTXSize;
  parallel: boolean;
  workerCount?: number;
  chunkSize?: number;
  timeout?: number;
  memoryLimit?: number;
  useCache: boolean;
  cacheSize?: number;
  validateStructure: boolean;
  sanitizeData: boolean;
  preserveOriginal: boolean;
}

export interface PPTXProcessingResult {
  success: boolean;
  file: PPTXFile;
  slides: PPTXSlide[];
  master?: PPTXMasterSlide;
  layouts?: PPTXSlideLayout[];
  theme?: PPTXTheme;
  metadata: PPTXMetadata;
  processing: PPTXProcessingStats;
  errors: PPTXError[];
  warnings: PPTXWarning[];
}

export interface PPTXProcessingStats {
  startTime: number;
  endTime: number;
  duration: number;
  slidesProcessed: number;
  elementsProcessed: number;
  imagesExtracted: number;
  mediaExtracted: number;
  memoryUsed: number;
  cacheHits: number;
  cacheMisses: number;
  workerStats?: PPTXWorkerStats[];
}

// ===== INTERFACES DE ERRO E VALIDAÇÃO =====

export interface PPTXError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  location?: PPTXErrorLocation;
  timestamp: number;
  recoverable: boolean;
  suggested?: string;
  stack?: string;
}

export interface PPTXWarning {
  id: string;
  type: WarningType;
  message: string;
  location?: PPTXErrorLocation;
  timestamp: number;
  suggested?: string;
}

export type ErrorType = 
  | 'parsing'
  | 'validation'
  | 'memory'
  | 'timeout'
  | 'network'
  | 'format'
  | 'compression'
  | 'security'
  | 'permission'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type WarningType = 
  | 'deprecation'
  | 'performance'
  | 'compatibility'
  | 'quality'
  | 'security'
  | 'accessibility';

export interface PPTXErrorLocation {
  slide?: number;
  element?: string;
  property?: string;
  line?: number;
  column?: number;
  file?: string;
}

// ===== INTERFACES DE VALIDAÇÃO =====

export interface PPTXValidationOptions {
  validateStructure: boolean;
  validateContent: boolean;
  validateMedia: boolean;
  validateAnimations: boolean;
  validateAccessibility: boolean;
  validateSecurity: boolean;
  strictMode: boolean;
  customRules?: PPTXValidationRule[];
}

export interface PPTXValidationRule {
  id: string;
  name: string;
  description: string;
  severity: ErrorSeverity;
  validator: (element: any, context: PPTXValidationContext) => PPTXValidationResult;
}

export interface PPTXValidationContext {
  slide: PPTXSlide;
  element?: PPTXElement;
  file: PPTXFile;
  options: PPTXValidationOptions;
  metadata: PPTXMetadata;
}

export interface PPTXValidationResult {
  valid: boolean;
  errors: PPTXError[];
  warnings: PPTXWarning[];
  suggestions: string[];
}

// ===== INTERFACES DE CACHE =====

export interface PPTXCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  compressed: boolean;
  expires?: number;
  tags?: string[];
}

export interface PPTXCacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
  averageAccessTime: number;
  memoryUsage: number;
  storageUsage: number;
}

// ===== INTERFACES DE WORKER =====

export interface PPTXWorkerTask {
  id: string;
  type: WorkerTaskType;
  data: any;
  priority: TaskPriority;
  timeout: number;
  retry: number;
  created: number;
}

export interface PPTXWorkerResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: PPTXError;
  duration: number;
  workerId: string;
}

export interface PPTXWorkerStats {
  id: string;
  tasksProcessed: number;
  tasksSucceeded: number;
  tasksFailed: number;
  averageTime: number;
  totalTime: number;
  memoryUsage: number;
  status: WorkerStatus;
}

export type WorkerTaskType = 'parse' | 'render' | 'thumbnail' | 'validate' | 'extract' | 'optimize';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type WorkerStatus = 'idle' | 'working' | 'error' | 'terminated';

// ===== INTERFACES DE CONFIGURAÇÃO =====

export interface PPTXStudioConfig {
  processing: PPTXProcessingOptions;
  validation: PPTXValidationOptions;
  cache: PPTXCacheConfig;
  memory: PPTXMemoryConfig;
  worker: PPTXWorkerConfig;
  security: PPTXSecurityConfig;
  performance: PPTXPerformanceConfig;
  logging: PPTXLoggingConfig;
}

export interface PPTXCacheConfig {
  enabled: boolean;
  maxSize: number;
  maxEntries: number;
  ttl: number;
  compression: boolean;
  storageType: CacheStorageType[];
  evictionPolicy: CacheEvictionPolicy;
  cleanupInterval: number;
}

export interface PPTXMemoryConfig {
  maxHeapSize: number;
  cleanupInterval: number;
  gcThreshold: number;
  enableMonitoring: boolean;
  streamProcessing: {
    enabled: boolean;
    chunkSize: number;
    maxConcurrentChunks: number;
  };
  objectPool: {
    enabled: boolean;
    maxPoolSize: number;
    cleanupFrequency: number;
  };
  weakReferences: {
    enabled: boolean;
    cleanupThreshold: number;
  };
}

export interface PPTXWorkerConfig {
  enabled: boolean;
  maxWorkers: number;
  workerTimeout: number;
  queueSize: number;
  retryAttempts: number;
  fallbackToMain: boolean;
  taskPriorities: Record<WorkerTaskType, TaskPriority>;
}

export interface PPTXSecurityConfig {
  validateSignatures: boolean;
  allowMacros: boolean;
  allowExternalLinks: boolean;
  allowEmbeddedObjects: boolean;
  maxFileSize: number;
  allowedMimeTypes: string[];
  sanitizeContent: boolean;
  contentSecurityPolicy: string[];
}

export interface PPTXPerformanceConfig {
  enableProfiling: boolean;
  measureTiming: boolean;
  trackMemory: boolean;
  optimizeImages: boolean;
  lazyLoading: boolean;
  batchProcessing: boolean;
  parallelProcessing: boolean;
  compressionLevel: number;
}

export interface PPTXLoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxLogSize: number;
  rotateInterval: number;
  includeStackTrace: boolean;
  sensitiveDataMask: boolean;
}

export type CacheStorageType = 'memory' | 'localStorage' | 'indexedDB' | 'webSQL';
export type CacheEvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'random' | 'ttl';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ===== INTERFACES ESPECÍFICAS =====

export interface PPTXMasterSlide {
  id: string;
  name: string;
  background: PPTXBackground;
  placeholders: PPTXPlaceholder[];
  textStyles: PPTXTextStyle[];
  colorScheme: PPTXColorScheme;
  fontScheme: PPTXFontScheme;
}

export interface PPTXBackground {
  type: BackgroundType;
  fill: PPTXFill;
  image?: PPTXImageSource;
  transparency?: number;
}

export type BackgroundType = 'solid' | 'gradient' | 'pattern' | 'image' | 'none';

export interface PPTXPlaceholder {
  type: PlaceholderType;
  position: PPTXPosition;
  size: PPTXSize;
  textContent?: string;
  formatting?: PPTXTextFormatting;
}

export type PlaceholderType = 
  | 'title'
  | 'subtitle'
  | 'content'
  | 'text'
  | 'object'
  | 'chart'
  | 'table'
  | 'media'
  | 'image'
  | 'clipArt'
  | 'diagram'
  | 'date'
  | 'footer'
  | 'header'
  | 'slideNumber';

export interface PPTXTheme {
  name: string;
  colorScheme: PPTXColorScheme;
  fontScheme: PPTXFontScheme;
  formatScheme: PPTXFormatScheme;
}

export interface PPTXColorScheme {
  name: string;
  colors: Record<ColorScheme, PPTXColor>;
}

export interface PPTXFontScheme {
  name: string;
  majorFont: PPTXFontInfo;
  minorFont: PPTXFontInfo;
}

export interface PPTXFontInfo {
  latin: string;
  eastAsia?: string;
  complexScript?: string;
}

export interface PPTXFormatScheme {
  name: string;
  fillStyles: PPTXFill[];
  lineStyles: PPTXBorder[];
  effectStyles: PPTXEffectStyle[];
  backgroundFillStyles: PPTXFill[];
}

export interface PPTXEffectStyle {
  effectList: PPTXEffect[];
  scene3d?: PPTX3DScene;
  shape3d?: PPTX3DShape;
}

export interface PPTXEffect {
  type: EffectType;
  properties: Record<string, any>;
}

export type EffectType = 'shadow' | 'reflection' | 'glow' | 'softEdge' | 'bevel' | 'preset';

// ===== INTERFACES AUXILIARES =====

export interface PPTXHyperlink {
  type: HyperlinkType;
  target: string;
  tooltip?: string;
  action?: HyperlinkAction;
}

export type HyperlinkType = 'url' | 'email' | 'file' | 'slide' | 'presentation';
export type HyperlinkAction = 'firstSlide' | 'lastSlide' | 'nextSlide' | 'previousSlide' | 'endShow';

export interface PPTXBulletPoint {
  type: BulletType;
  character?: string;
  font?: string;
  color?: PPTXColor;
  size?: number;
  image?: PPTXImageSource;
  level: number;
}

export type BulletType = 'none' | 'character' | 'number' | 'image';

export interface PPTXIndentation {
  left: number;
  right: number;
  firstLine: number;
  hanging: number;
}

export interface PPTXSpacing {
  before: number;
  after: number;
  line: number;
  lineRule: SpacingRule;
}

export type SpacingRule = 'atLeast' | 'exactly' | 'multiple';

export interface PPTXGradient {
  type: GradientType;
  direction: number;
  stops: PPTXGradientStop[];
}

export type GradientType = 'linear' | 'radial' | 'rectangular' | 'path';

export interface PPTXGradientStop {
  position: number;
  color: PPTXColor;
}

export interface PPTXPattern {
  type: PatternType;
  foregroundColor: PPTXColor;
  backgroundColor: PPTXColor;
}

export type PatternType = 
  | 'horizontal'
  | 'vertical'
  | 'diagonal'
  | 'reverseDiagonal'
  | 'cross'
  | 'diagonalCross'
  | 'dots'
  | 'weave'
  | 'plaid'
  | 'solidDiamond';

export interface PPTXImageFill {
  source: PPTXImageSource;
  tileMode: TileMode;
  alignment: ImageAlignment;
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
}

export type TileMode = 'tile' | 'stretch' | 'fit' | 'center';
export type ImageAlignment = 'topLeft' | 'topCenter' | 'topRight' | 'centerLeft' | 'center' | 'centerRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

export interface PPTXImageEffect {
  type: ImageEffectType;
  properties: Record<string, any>;
}

export type ImageEffectType = 'crop' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'sepia' | 'blur' | 'sharpen';

export interface PPTXCropping {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PPTXCompression {
  quality: number;
  format?: ImageFormat;
  progressive?: boolean;
}

export interface PPTXTextContent {
  text: string;
  formatting: PPTXTextFormatting;
  fit: TextFitType;
  wrap: boolean;
  overflow: TextOverflow;
}

export type TextFitType = 'none' | 'shrink' | 'resize' | 'overflow';
export type TextOverflow = 'clip' | 'ellipsis' | 'visible';

export type ShapeType = 
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'arrow'
  | 'callout'
  | 'flowchart'
  | 'connector'
  | 'freeform';

export interface PPTXTableRow {
  id: string;
  height: number;
  cells: PPTXTableCell[];
}

export interface PPTXTableColumn {
  id: string;
  width: number;
}

export interface PPTXTableCell {
  id: string;
  text: string;
  formatting: PPTXTextFormatting;
  fill: PPTXFill;
  border: PPTXCellBorder;
  rowSpan?: number;
  colSpan?: number;
  verticalAlignment?: VerticalAlignment;
}

export interface PPTXCellBorder {
  top?: PPTXBorder;
  bottom?: PPTXBorder;
  left?: PPTXBorder;
  right?: PPTXBorder;
}

export interface PPTXTableStyle {
  name: string;
  headerRowFill?: PPTXFill;
  oddRowFill?: PPTXFill;
  evenRowFill?: PPTXFill;
  firstColumnFill?: PPTXFill;
  lastColumnFill?: PPTXFill;
  borderStyle?: PPTXBorder;
}

export type ChartType = 
  | 'column'
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'surface'
  | 'bubble'
  | 'stock'
  | 'combination';

export interface PPTXChartData {
  categories: string[];
  series: PPTXSeries[];
}

export interface PPTXSeries {
  name: string;
  values: number[];
  format?: PPTXSeriesFormat;
}

export interface PPTXSeriesFormat {
  fill?: PPTXFill;
  border?: PPTXBorder;
  marker?: PPTXMarker;
}

export interface PPTXMarker {
  type: MarkerType;
  size: number;
  fill?: PPTXFill;
  border?: PPTXBorder;
}

export type MarkerType = 'none' | 'circle' | 'square' | 'triangle' | 'diamond' | 'x' | 'star' | 'dash' | 'dot';

export interface PPTXLegend {
  position: LegendPosition;
  visible: boolean;
  formatting?: PPTXTextFormatting;
  border?: PPTXBorder;
  fill?: PPTXFill;
}

export type LegendPosition = 'none' | 'bottom' | 'top' | 'left' | 'right' | 'topRight';

export interface PPTXAxis {
  type: AxisType;
  title?: string;
  visible: boolean;
  minimum?: number;
  maximum?: number;
  majorUnit?: number;
  minorUnit?: number;
  format?: PPTXAxisFormat;
}

export type AxisType = 'category' | 'value' | 'date';

export interface PPTXAxisFormat {
  numberFormat?: string;
  fontFormatting?: PPTXTextFormatting;
  lineFormat?: PPTXBorder;
  tickMarks?: TickMarkType;
}

export type TickMarkType = 'none' | 'inside' | 'outside' | 'cross';

export interface PPTXTransitionSound {
  type: SoundType;
  source?: PPTXMediaSource;
  loop?: boolean;
  volume?: number;
}

export type SoundType = 'none' | 'applause' | 'arrow' | 'bomb' | 'breeze' | 'camera' | 'cash' | 'chime' | 'click' | 'coin' | 'drum' | 'file';

export interface PPTX3DScene {
  camera: PPTX3DCamera;
  lightRig: PPTX3DLightRig;
  backdrop?: PPTX3DBackdrop;
}

export interface PPTX3DCamera {
  preset: CameraPreset;
  position?: PPTX3DPosition;
  lookAt?: PPTX3DPosition;
  fieldOfView?: number;
}

export type CameraPreset = 'legacyOblique' | 'oblique' | 'orthographic' | 'perspective';

export interface PPTX3DLightRig {
  type: LightRigType;
  direction: LightDirection;
}

export type LightRigType = 'balanced' | 'bright' | 'chilly' | 'contrasting' | 'flat' | 'flood' | 'freezing' | 'glow' | 'harsh' | 'legacyFlat' | 'morning' | 'soft' | 'sunrise' | 'sunset' | 'threePt' | 'twoPt' | 'warm';
export type LightDirection = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br';

export interface PPTX3DBackdrop {
  plane: PPTX3DPlane;
}

export interface PPTX3DPlane {
  normal: PPTX3DVector;
  point: PPTX3DPosition;
}

export interface PPTX3DShape {
  material: Material3D;
  bevel?: PPTX3DBevel;
  extrusion?: PPTX3DExtrusion;
  contour?: PPTX3DContour;
}

export type Material3D = 'legacyMatte' | 'legacyPlastic' | 'legacyMetal' | 'legacyWireframe' | 'matte' | 'plastic' | 'metal' | 'warmMatte' | 'translucentPowder' | 'powder' | 'dkEdge' | 'softEdge' | 'clear' | 'flat' | 'softmetal';

export interface PPTX3DBevel {
  type: BevelType;
  width: number;
  height: number;
}

export type BevelType = 'relaxedInset' | 'cross' | 'coolSlant' | 'angle' | 'softRound' | 'convex' | 'slope' | 'divot' | 'riblet' | 'hardEdge' | 'artDeco';

export interface PPTX3DExtrusion {
  height: number;
  color?: PPTXColor;
}

export interface PPTX3DContour {
  width: number;
  color?: PPTXColor;
}

export interface PPTX3DPosition {
  x: number;
  y: number;
  z: number;
}

export interface PPTX3DVector {
  x: number;
  y: number;
  z: number;
}

// ===== TIPOS UTILITÁRIOS =====

export type PPTXElementUnion = 
  | PPTXTextElement
  | PPTXImageElement
  | PPTXShapeElement
  | PPTXTableElement
  | PPTXChartElement
  | PPTXMediaElement
  | PPTXGroupElement;

export type PPTXStyleUnion = 
  | PPTXTextFormatting
  | PPTXFill
  | PPTXBorder
  | PPTXShadow
  | PPTXReflection
  | PPTXGlow;

export type PPTXEffectUnion = 
  | PPTXShadow
  | PPTXReflection
  | PPTXGlow
  | PPTXImageEffect;

// ===== INTERFACES DE EVENTOS =====

export interface PPTXEvent {
  type: PPTXEventType;
  timestamp: number;
  source: string;
  data: any;
}

export type PPTXEventType = 
  | 'processingStart'
  | 'processingProgress'
  | 'processingComplete'
  | 'processingError'
  | 'slideProcessed'
  | 'elementProcessed'
  | 'cacheHit'
  | 'cacheMiss'
  | 'memoryWarning'
  | 'workerStart'
  | 'workerComplete'
  | 'workerError'
  | 'validationStart'
  | 'validationComplete'
  | 'validationError';

export interface PPTXEventListener {
  (event: PPTXEvent): void;
}

// ===== INTERFACES DE MÉTRICAS =====

export interface PPTXMetrics {
  performance: PPTXPerformanceMetrics;
  memory: PPTXMemoryMetrics;
  cache: PPTXCacheMetrics;
  error: PPTXErrorMetrics;
  quality: PPTXQualityMetrics;
}

export interface PPTXPerformanceMetrics {
  totalProcessingTime: number;
  averageSlideTime: number;
  averageElementTime: number;
  throughput: number;
  concurrency: number;
  bottlenecks: string[];
}

export interface PPTXMemoryMetrics {
  peakUsage: number;
  averageUsage: number;
  leakCount: number;
  gcCount: number;
  poolUtilization: number;
}

export interface PPTXCacheMetrics {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionRatio: number;
  storageEfficiency: number;
}

export interface PPTXErrorMetrics {
  totalErrors: number;
  errorRate: number;
  recoveryRate: number;
  criticalErrors: number;
  errorDistribution: Record<ErrorType, number>;
}

export interface PPTXQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  accessibility: number;
  security: number;
}

// ===== INTERFACES DE PLUGIN =====

export interface PPTXPlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  initialize: (studio: PPTXStudio) => Promise<void>;
  process?: (slide: PPTXSlide, options: any) => Promise<PPTXSlide>;
  validate?: (file: PPTXFile) => Promise<PPTXValidationResult>;
  cleanup?: () => Promise<void>;
}

export interface PPTXStudio {
  config: PPTXStudioConfig;
  plugins: PPTXPlugin[];
  metrics: PPTXMetrics;
  events: PPTXEventSystem;
  addPlugin(plugin: PPTXPlugin): Promise<void>;
  removePlugin(name: string): Promise<void>;
  process(file: PPTXFile, options?: PPTXProcessingOptions): Promise<PPTXProcessingResult>;
  validate(file: PPTXFile, options?: PPTXValidationOptions): Promise<PPTXValidationResult>;
  optimize(file: PPTXFile): Promise<PPTXFile>;
}

export interface PPTXEventSystem {
  on(event: PPTXEventType, listener: PPTXEventListener): void;
  off(event: PPTXEventType, listener: PPTXEventListener): void;
  emit(event: PPTXEvent): void;
  once(event: PPTXEventType, listener: PPTXEventListener): void;
}

// ===== CONSTANTES E DEFAULTS =====

export const PPTX_DEFAULTS = {
  SLIDE_SIZE: {
    width: 720,
    height: 540,
    unit: 'pt' as const
  },
  THUMBNAIL_SIZE: {
    width: 160,
    height: 120,
    unit: 'px' as const
  },
  PROCESSING: {
    timeout: 30000,
    chunkSize: 1024 * 1024,
    workerCount: 4,
    retryAttempts: 3
  },
  CACHE: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 1000,
    ttl: 24 * 60 * 60 * 1000 // 24 horas
  },
  MEMORY: {
    maxHeapSize: 100 * 1024 * 1024, // 100MB
    gcThreshold: 0.8,
    cleanupInterval: 30000
  }
} as const;

export const PPTX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.template',
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12'
] as const;

export const PPTX_FILE_EXTENSIONS = [
  '.pptx',
  '.ppt',
  '.potx',
  '.pptm',
  '.potm',
  '.ppsx',
  '.ppsm'
] as const;