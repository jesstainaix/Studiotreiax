import { LMSConfig, SCORMPackage, SCORMVersion, LMSApiResponse } from '../../../types/lms';
import { Project } from '../../../types';

export interface SCORMManifest {
  identifier: string;
  version: string;
  metadata: {
    schema: string;
    schemaversion: string;
    title: string;
    description?: string;
    keyword?: string[];
    coverage?: string;
    structure?: string;
    aggregationlevel?: number;
    difficulty?: string;
    typicallearningtime?: string;
    language?: string;
  };
  organizations: {
    default: string;
    organization: {
      identifier: string;
      title: string;
      item: SCORMItem[];
    };
  };
  resources: SCORMResource[];
}

export interface SCORMItem {
  identifier: string;
  identifierref?: string;
  title: string;
  isvisible?: boolean;
  parameters?: string;
  timelimitaction?: string;
  datafromlms?: string;
  masteryscore?: number;
  prerequisites?: string;
  maxtimeallowed?: string;
  item?: SCORMItem[];
}

export interface SCORMResource {
  identifier: string;
  type: string;
  href?: string;
  scormtype?: string;
  file: string[];
  dependency?: string[];
}

export interface SCORMExportOptions {
  version: SCORMVersion;
  includeVideos: boolean;
  includeInteractions: boolean;
  includeQuizzes: boolean;
  masteryScore?: number;
  timeLimit?: number;
  language?: string;
  customCSS?: string;
  customJS?: string;
  trackingMode: 'completion' | 'score' | 'both';
  sequencing?: {
    preventActivation?: boolean;
    constrainChoice?: boolean;
    rollupRules?: any[];
  };
}

export class SCORMExporter {
  private version: SCORMVersion;
  private options: SCORMExportOptions;

  constructor(version: SCORMVersion = '2004', options: Partial<SCORMExportOptions> = {}) {
    this.version = version;
    this.options = {
      version,
      includeVideos: true,
      includeInteractions: true,
      includeQuizzes: true,
      masteryScore: 80,
      language: 'pt-BR',
      trackingMode: 'both',
      ...options
    };
  }

  async exportProject(project: Project): Promise<SCORMPackage> {
    try {
      // Generate SCORM manifest
      const manifest = this.generateManifest(project);
      
      // Generate content files
      const contentFiles = await this.generateContentFiles(project);
      
      // Generate SCORM API wrapper
      const apiWrapper = this.generateSCORMAPI();
      
      // Generate launch file
      const launchFile = this.generateLaunchFile(project);
      
      // Package everything
      const scormPackage: SCORMPackage = {
        id: `scorm_${project.id}_${Date.now()}`,
        projectId: project.id,
        version: this.version,
        title: project.title,
        description: project.description || '',
        manifestXML: this.manifestToXML(manifest),
        launchFile: 'index.html',
        files: {
          'imsmanifest.xml': this.manifestToXML(manifest),
          'index.html': launchFile,
          'scorm_api.js': apiWrapper,
          ...contentFiles
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          size: this.calculatePackageSize(contentFiles),
          masteryScore: this.options.masteryScore || 80,
          timeLimit: this.options.timeLimit,
          language: this.options.language || 'pt-BR'
        }
      };

      return scormPackage;
    } catch (error) {
      console.error('SCORM export failed:', error);
      throw new Error(`Failed to export SCORM package: ${error.message}`);
    }
  }

  private generateManifest(project: Project): SCORMManifest {
    const identifier = `scorm_${project.id}`;
    
    return {
      identifier,
      version: '1.0',
      metadata: {
        schema: this.version === '1.2' ? 'ADL SCORM' : 'ADL SCORM 2004 4th Edition',
        schemaversion: this.version === '1.2' ? '1.2' : '4.0',
        title: project.title,
        description: project.description || '',
        keyword: project.tags || [],
        language: this.options.language || 'pt-BR',
        typicallearningtime: this.calculateLearningTime(project),
        difficulty: this.mapDifficulty(project.difficulty),
        aggregationlevel: 2
      },
      organizations: {
        default: `${identifier}_org`,
        organization: {
          identifier: `${identifier}_org`,
          title: project.title,
          item: this.generateSCORMItems(project)
        }
      },
      resources: this.generateSCORMResources(project)
    };
  }

  private generateSCORMItems(project: Project): SCORMItem[] {
    const items: SCORMItem[] = [];
    
    // Main content item
    items.push({
      identifier: `${project.id}_main`,
      identifierref: `${project.id}_resource`,
      title: project.title,
      isvisible: true,
      masteryscore: this.options.masteryScore,
      timelimitaction: 'continue,no message',
      datafromlms: '',
      parameters: ''
    });

    // Add quiz items if available
    if (project.scenes && this.options.includeQuizzes) {
      project.scenes.forEach((scene, index) => {
        if (scene.type === 'quiz' || scene.interactions?.length > 0) {
          items.push({
            identifier: `${project.id}_quiz_${index}`,
            identifierref: `${project.id}_quiz_resource_${index}`,
            title: `Quiz ${index + 1}`,
            isvisible: true,
            prerequisites: index > 0 ? `${project.id}_quiz_${index - 1}` : undefined
          });
        }
      });
    }

    return items;
  }

  private generateSCORMResources(project: Project): SCORMResource[] {
    const resources: SCORMResource[] = [];
    
    // Main resource
    resources.push({
      identifier: `${project.id}_resource`,
      type: 'webcontent',
      href: 'index.html',
      scormtype: this.version === '1.2' ? 'sco' : 'sco',
      file: ['index.html', 'scorm_api.js', 'content.js', 'styles.css']
    });

    // Video resources
    if (this.options.includeVideos && project.scenes) {
      project.scenes.forEach((scene, index) => {
        if (scene.videoUrl) {
          resources.push({
            identifier: `${project.id}_video_${index}`,
            type: 'webcontent',
            file: [`video_${index}.mp4`]
          });
        }
      });
    }

    return resources;
  }

  private async generateContentFiles(project: Project): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    
    // Generate main content JavaScript
    files['content.js'] = this.generateContentJS(project);
    
    // Generate CSS styles
    files['styles.css'] = this.generateCSS();
    
    // Generate quiz files if needed
    if (this.options.includeQuizzes && project.scenes) {
      project.scenes.forEach((scene, index) => {
        if (scene.type === 'quiz' || scene.interactions?.length > 0) {
          files[`quiz_${index}.js`] = this.generateQuizJS(scene, index);
        }
      });
    }

    return files;
  }

  private generateSCORMAPI(): string {
    if (this.version === '1.2') {
      return this.generateSCORM12API();
    } else {
      return this.generateSCORM2004API();
    }
  }

  private generateSCORM12API(): string {
    return `
// SCORM 1.2 API Wrapper
class SCORM12API {
  constructor() {
    this.apiHandle = null;
    this.findAPI();
  }

  findAPI() {
    let api = null;
    let findAPITries = 0;
    
    while ((api === null) && (findAPITries < 500)) {
      findAPITries++;
      
      if (window.API) {
        api = window.API;
      } else if (window.parent && window.parent.API) {
        api = window.parent.API;
      } else if (window.top && window.top.API) {
        api = window.top.API;
      }
      
      if (api === null && window.parent && window.parent !== window) {
        window = window.parent;
      }
    }
    
    this.apiHandle = api;
    return api;
  }

  initialize() {
    if (this.apiHandle) {
      return this.apiHandle.LMSInitialize('');
    }
    return 'false';
  }

  terminate() {
    if (this.apiHandle) {
      return this.apiHandle.LMSFinish('');
    }
    return 'false';
  }

  getValue(element) {
    if (this.apiHandle) {
      return this.apiHandle.LMSGetValue(element);
    }
    return '';
  }

  setValue(element, value) {
    if (this.apiHandle) {
      return this.apiHandle.LMSSetValue(element, value);
    }
    return 'false';
  }

  commit() {
    if (this.apiHandle) {
      return this.apiHandle.LMSCommit('');
    }
    return 'false';
  }

  getLastError() {
    if (this.apiHandle) {
      return this.apiHandle.LMSGetLastError();
    }
    return '0';
  }

  getErrorString(errorCode) {
    if (this.apiHandle) {
      return this.apiHandle.LMSGetErrorString(errorCode);
    }
    return '';
  }

  getDiagnostic(errorCode) {
    if (this.apiHandle) {
      return this.apiHandle.LMSGetDiagnostic(errorCode);
    }
    return '';
  }
}

// Global SCORM API instance
window.scormAPI = new SCORM12API();
`;
  }

  private generateSCORM2004API(): string {
    return `
// SCORM 2004 API Wrapper
class SCORM2004API {
  constructor() {
    this.apiHandle = null;
    this.findAPI();
  }

  findAPI() {
    let api = null;
    let findAPITries = 0;
    
    while ((api === null) && (findAPITries < 500)) {
      findAPITries++;
      
      if (window.API_1484_11) {
        api = window.API_1484_11;
      } else if (window.parent && window.parent.API_1484_11) {
        api = window.parent.API_1484_11;
      } else if (window.top && window.top.API_1484_11) {
        api = window.top.API_1484_11;
      }
      
      if (api === null && window.parent && window.parent !== window) {
        window = window.parent;
      }
    }
    
    this.apiHandle = api;
    return api;
  }

  initialize() {
    if (this.apiHandle) {
      return this.apiHandle.Initialize('');
    }
    return 'false';
  }

  terminate() {
    if (this.apiHandle) {
      return this.apiHandle.Terminate('');
    }
    return 'false';
  }

  getValue(element) {
    if (this.apiHandle) {
      return this.apiHandle.GetValue(element);
    }
    return '';
  }

  setValue(element, value) {
    if (this.apiHandle) {
      return this.apiHandle.SetValue(element, value);
    }
    return 'false';
  }

  commit() {
    if (this.apiHandle) {
      return this.apiHandle.Commit('');
    }
    return 'false';
  }

  getLastError() {
    if (this.apiHandle) {
      return this.apiHandle.GetLastError();
    }
    return '0';
  }

  getErrorString(errorCode) {
    if (this.apiHandle) {
      return this.apiHandle.GetErrorString(errorCode);
    }
    return '';
  }

  getDiagnostic(errorCode) {
    if (this.apiHandle) {
      return this.apiHandle.GetDiagnostic(errorCode);
    }
    return '';
  }
}

// Global SCORM API instance
window.scormAPI = new SCORM2004API();
`;
  }

  private generateLaunchFile(project: Project): string {
    return `
<!DOCTYPE html>
<html lang="${this.options.language || 'pt-BR'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <link rel="stylesheet" href="styles.css">
    ${this.options.customCSS ? `<style>${this.options.customCSS}</style>` : ''}
</head>
<body>
    <div id="scorm-content">
        <header>
            <h1>${project.title}</h1>
            ${project.description ? `<p class="description">${project.description}</p>` : ''}
        </header>
        
        <main id="content-area">
            <div id="loading" class="loading">
                <p>Carregando conteúdo...</p>
            </div>
            
            <div id="video-container" style="display: none;">
                <video id="main-video" controls>
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            </div>
            
            <div id="quiz-container" style="display: none;">
                <!-- Quiz content will be loaded here -->
            </div>
            
            <div id="progress-container">
                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill"></div>
                </div>
                <span id="progress-text">0%</span>
            </div>
        </main>
        
        <footer>
            <div class="controls">
                <button id="prev-btn" disabled>Anterior</button>
                <button id="next-btn">Próximo</button>
                <button id="complete-btn" style="display: none;">Concluir</button>
            </div>
        </footer>
    </div>
    
    <script src="scorm_api.js"></script>
    <script src="content.js"></script>
    ${this.options.customJS ? `<script>${this.options.customJS}</script>` : ''}
    
    <script>
        // Initialize SCORM
        document.addEventListener('DOMContentLoaded', function() {
            if (window.scormAPI) {
                const initialized = window.scormAPI.initialize();
                if (initialized === 'true') {
                    
                    // Set initial values
                    window.scormAPI.setValue('cmi.core.lesson_status', 'incomplete');
                    window.scormAPI.setValue('cmi.core.score.min', '0');
                    window.scormAPI.setValue('cmi.core.score.max', '100');
                    window.scormAPI.commit();
                    
                    // Start content
                    startContent();
                } else {
                    console.error('Failed to initialize SCORM');
                    startContent(); // Start anyway for testing
                }
            } else {
                console.warn('SCORM API not found, running in standalone mode');
                startContent();
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (window.scormAPI) {
                window.scormAPI.terminate();
            }
        });
    </script>
</body>
</html>
`;
  }

  private generateContentJS(project: Project): string {
    return `
// Content Management
class SCORMContent {
    constructor() {
        this.currentScene = 0;
        this.totalScenes = ${project.scenes?.length || 1};
        this.score = 0;
        this.completed = false;
        this.startTime = new Date();
        
        this.scenes = ${JSON.stringify(project.scenes || [])};
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.loadingEl = document.getElementById('loading');
        this.videoContainer = document.getElementById('video-container');
        this.quizContainer = document.getElementById('quiz-container');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.completeBtn = document.getElementById('complete-btn');
    }
    
    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.previousScene());
        this.nextBtn.addEventListener('click', () => this.nextScene());
        this.completeBtn.addEventListener('click', () => this.completeCourse());
    }
    
    start() {
        this.loadingEl.style.display = 'none';
        this.loadScene(0);
        this.updateProgress();
    }
    
    loadScene(index) {
        if (index < 0 || index >= this.totalScenes) return;
        
        this.currentScene = index;
        const scene = this.scenes[index];
        
        // Hide all containers
        this.videoContainer.style.display = 'none';
        this.quizContainer.style.display = 'none';
        
        if (scene.type === 'video' && scene.videoUrl) {
            this.loadVideo(scene);
        } else if (scene.type === 'quiz' || scene.interactions?.length > 0) {
            this.loadQuiz(scene);
        }
        
        this.updateNavigation();
        this.updateProgress();
        this.trackProgress();
    }
    
    loadVideo(scene) {
        const video = document.getElementById('main-video');
        video.src = scene.videoUrl;
        this.videoContainer.style.display = 'block';
        
        video.addEventListener('ended', () => {
            this.markSceneComplete();
        });
    }
    
    loadQuiz(scene) {
        this.quizContainer.innerHTML = this.generateQuizHTML(scene);
        this.quizContainer.style.display = 'block';
        this.bindQuizEvents();
    }
    
    generateQuizHTML(scene) {
        if (!scene.interactions || scene.interactions.length === 0) {
            return '<p>Nenhuma interação disponível.</p>';
        }
        
        let html = '<div class="quiz">';
        
        scene.interactions.forEach((interaction, index) => {
            html += \`
                <div class="question" data-question="\${index}">
                    <h3>\${interaction.question || 'Pergunta ' + (index + 1)}</h3>
                    <div class="options">
            \`;
            
            if (interaction.options) {
                interaction.options.forEach((option, optIndex) => {
                    html += \`
                        <label>
                            <input type="radio" name="q\${index}" value="\${optIndex}">
                            \${option}
                        </label>
                    \`;
                });
            }
            
            html += '</div></div>';
        });
        
        html += '<button id="submit-quiz" class="submit-btn">Enviar Respostas</button></div>';
        
        return html;
    }
    
    bindQuizEvents() {
        const submitBtn = document.getElementById('submit-quiz');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitQuiz());
        }
    }
    
    submitQuiz() {
        const scene = this.scenes[this.currentScene];
        let correct = 0;
        let total = scene.interactions?.length || 0;
        
        scene.interactions?.forEach((interaction, index) => {
            const selected = document.querySelector(\`input[name="q\${index}"]:checked\`);
            if (selected && parseInt(selected.value) === interaction.correctAnswer) {
                correct++;
            }
        });
        
        const quizScore = total > 0 ? (correct / total) * 100 : 100;
        this.score = Math.max(this.score, quizScore);
        
        this.markSceneComplete();
        this.updateScore(quizScore);
    }
    
    markSceneComplete() {
        // Mark current scene as completed
        if (this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].completed = true;
        }
        
        this.updateProgress();
        
        // Check if all scenes are completed
        const allCompleted = this.scenes.every(scene => scene.completed);
        if (allCompleted) {
            this.showCompleteButton();
        }
    }
    
    updateProgress() {
        const completedScenes = this.scenes.filter(scene => scene.completed).length;
        const progress = (completedScenes / this.totalScenes) * 100;
        
        this.progressFill.style.width = progress + '%';
        this.progressText.textContent = Math.round(progress) + '%';
        
        // Update SCORM progress
        if (window.scormAPI) {
            window.scormAPI.setValue('cmi.core.lesson_location', this.currentScene.toString());
            window.scormAPI.setValue('cmi.core.score.raw', this.score.toString());
            
            if (progress >= 100) {
                window.scormAPI.setValue('cmi.core.lesson_status', 'completed');
            } else {
                window.scormAPI.setValue('cmi.core.lesson_status', 'incomplete');
            }
            
            window.scormAPI.commit();
        }
    }
    
    updateScore(score) {
        if (window.scormAPI) {
            window.scormAPI.setValue('cmi.core.score.raw', score.toString());
            window.scormAPI.commit();
        }
    }
    
    trackProgress() {
        const sessionTime = Math.floor((new Date() - this.startTime) / 1000);
        
        if (window.scormAPI) {
            window.scormAPI.setValue('cmi.core.session_time', this.formatTime(sessionTime));
            window.scormAPI.commit();
        }
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
    }
    
    previousScene() {
        if (this.currentScene > 0) {
            this.loadScene(this.currentScene - 1);
        }
    }
    
    nextScene() {
        if (this.currentScene < this.totalScenes - 1) {
            this.loadScene(this.currentScene + 1);
        }
    }
    
    updateNavigation() {
        this.prevBtn.disabled = this.currentScene === 0;
        this.nextBtn.disabled = this.currentScene === this.totalScenes - 1;
    }
    
    showCompleteButton() {
        this.completeBtn.style.display = 'inline-block';
        this.nextBtn.style.display = 'none';
    }
    
    completeCourse() {
        this.completed = true;
        
        if (window.scormAPI) {
            window.scormAPI.setValue('cmi.core.lesson_status', 'completed');
            window.scormAPI.setValue('cmi.core.score.raw', this.score.toString());
            window.scormAPI.commit();
        }
        
        alert('Curso concluído com sucesso!');
    }
}

// Global content instance
let contentManager;

function startContent() {
    contentManager = new SCORMContent();
    contentManager.start();
}
`;
  }

  private generateCSS(): string {
    return `
/* SCORM Content Styles */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    color: #333;
}

#scorm-content {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
}

header h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 300;
}

.description {
    margin: 1rem 0 0 0;
    font-size: 1.1rem;
    opacity: 0.9;
}

main {
    flex: 1;
    padding: 2rem;
}

.loading {
    text-align: center;
    padding: 4rem;
    font-size: 1.2rem;
    color: #666;
}

#video-container {
    text-align: center;
    margin-bottom: 2rem;
}

#main-video {
    width: 100%;
    max-width: 800px;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.quiz {
    max-width: 600px;
    margin: 0 auto;
}

.question {
    background: #f8f9fa;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #667eea;
}

.question h3 {
    margin: 0 0 1rem 0;
    color: #333;
}

.options label {
    display: block;
    padding: 0.5rem 0;
    cursor: pointer;
    transition: background-color 0.2s;
}

.options label:hover {
    background-color: #e9ecef;
    border-radius: 4px;
}

.options input[type="radio"] {
    margin-right: 0.5rem;
}

.submit-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    display: block;
    margin: 2rem auto 0;
}

.submit-btn:hover {
    background: #5a6fd8;
}

#progress-container {
    margin: 2rem 0;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    width: 0%;
    transition: width 0.3s ease;
}

#progress-text {
    font-weight: 600;
    color: #667eea;
}

footer {
    background: #f8f9fa;
    padding: 1.5rem 2rem;
    border-top: 1px solid #dee2e6;
}

.controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.controls button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.controls button:hover:not(:disabled) {
    background: #5a6268;
}

.controls button:disabled {
    background: #adb5bd;
    cursor: not-allowed;
}

#complete-btn {
    background: #28a745 !important;
}

#complete-btn:hover {
    background: #218838 !important;
}

/* Responsive Design */
@media (max-width: 768px) {
    header {
        padding: 1.5rem;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    main {
        padding: 1rem;
    }
    
    .controls {
        flex-direction: column;
        gap: 1rem;
    }
    
    .controls button {
        width: 100%;
    }
}

${this.options.customCSS || ''}
`;
  }

  private generateQuizJS(scene: any, index: number): string {
    return `
// Quiz ${index + 1} Logic
const quiz${index} = {
    questions: ${JSON.stringify(scene.interactions || [])},
    
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        // Quiz-specific event handlers
    },
    
    submit() {
        // Quiz submission logic
    }
};

quiz${index}.init();
`;
  }

  private manifestToXML(manifest: SCORMManifest): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const namespaces = this.version === '1.2' 
      ? 'xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd"'
      : 'xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3" xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3" xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3" xmlns:imsss="http://www.imsglobal.org/xsd/imsss" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd"';
    
    return `${xmlHeader}
<manifest identifier="${manifest.identifier}" version="${manifest.version}" ${namespaces}>
  <metadata>
    <schema>${manifest.metadata.schema}</schema>
    <schemaversion>${manifest.metadata.schemaversion}</schemaversion>
    <lom xmlns="http://ltsc.ieee.org/xsd/LOM">
      <general>
        <title>
          <string language="${manifest.metadata.language}">${manifest.metadata.title}</string>
        </title>
        <description>
          <string language="${manifest.metadata.language}">${manifest.metadata.description}</string>
        </description>
        <language>${manifest.metadata.language}</language>
      </general>
      <educational>
        <typicallearningtime>
          <duration>${manifest.metadata.typicallearningtime}</duration>
        </typicallearningtime>
        <difficulty>
          <value>${manifest.metadata.difficulty}</value>
        </difficulty>
      </educational>
    </lom>
  </metadata>
  <organizations default="${manifest.organizations.default}">
    <organization identifier="${manifest.organizations.organization.identifier}">
      <title>${manifest.organizations.organization.title}</title>
      ${this.generateItemsXML(manifest.organizations.organization.item)}
    </organization>
  </organizations>
  <resources>
    ${this.generateResourcesXML(manifest.resources)}
  </resources>
</manifest>`;
  }

  private generateItemsXML(items: SCORMItem[]): string {
    return items.map(item => {
      let xml = `<item identifier="${item.identifier}"`;
      if (item.identifierref) xml += ` identifierref="${item.identifierref}"`;
      if (item.isvisible !== undefined) xml += ` isvisible="${item.isvisible}"`;
      if (item.parameters) xml += ` parameters="${item.parameters}"`;
      xml += `>\n        <title>${item.title}</title>`;
      
      if (this.version === '1.2' && item.masteryscore) {
        xml += `\n        <adlcp:masteryscore>${item.masteryscore}</adlcp:masteryscore>`;
      }
      
      if (item.item && item.item.length > 0) {
        xml += `\n        ${this.generateItemsXML(item.item)}`;
      }
      
      xml += `\n      </item>`;
      return xml;
    }).join('\n      ');
  }

  private generateResourcesXML(resources: SCORMResource[]): string {
    return resources.map(resource => {
      let xml = `<resource identifier="${resource.identifier}" type="${resource.type}"`;
      if (resource.href) xml += ` href="${resource.href}"`;
      if (resource.scormtype) xml += ` adlcp:scormtype="${resource.scormtype}"`;
      xml += `>`;
      
      resource.file.forEach(file => {
        xml += `\n      <file href="${file}" />`;
      });
      
      if (resource.dependency && resource.dependency.length > 0) {
        resource.dependency.forEach(dep => {
          xml += `\n      <dependency identifierref="${dep}" />`;
        });
      }
      
      xml += `\n    </resource>`;
      return xml;
    }).join('\n    ');
  }

  private calculateLearningTime(project: Project): string {
    // Calculate estimated learning time based on content
    const baseTime = 10; // 10 minutes base
    const videoTime = project.scenes?.reduce((total, scene) => {
      return total + (scene.duration || 5); // 5 minutes per scene default
    }, 0) || 0;
    
    const totalMinutes = baseTime + videoTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `PT${hours}H${minutes}M`; // ISO 8601 duration format
  }

  private mapDifficulty(difficulty?: string): string {
    const difficultyMap: Record<string, string> = {
      'easy': 'very easy',
      'medium': 'medium',
      'hard': 'difficult',
      'expert': 'very difficult'
    };
    
    return difficultyMap[difficulty || 'medium'] || 'medium';
  }

  private calculatePackageSize(files: Record<string, string>): number {
    return Object.values(files).reduce((total, content) => {
      return total + new Blob([content]).size;
    }, 0);
  }

  async createZipPackage(scormPackage: SCORMPackage): Promise<Blob> {
    // This would typically use a library like JSZip
    // For now, return a placeholder
    const content = JSON.stringify(scormPackage.files);
    return new Blob([content], { type: 'application/zip' });
  }
}

export default SCORMExporter;