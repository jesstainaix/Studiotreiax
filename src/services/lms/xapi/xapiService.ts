import { LMSConfig, XAPIStatement, XAPIActor, XAPIVerb, XAPIObject, XAPIResult, XAPIContext } from '../../../types/lms';
import { Project, User } from '../../../types';

export interface XAPIConfig {
  endpoint: string;
  username: string;
  password: string;
  version: string;
  actorMbox?: string;
  actorName?: string;
}

export interface XAPIStatementTemplate {
  id: string;
  name: string;
  description: string;
  verb: XAPIVerb;
  objectType: string;
  resultExtensions?: Record<string, any>;
  contextExtensions?: Record<string, any>;
}

export interface XAPIActivityDefinition {
  name: Record<string, string>;
  description: Record<string, string>;
  type: string;
  moreInfo?: string;
  extensions?: Record<string, any>;
  interactionType?: 'choice' | 'fill-in' | 'long-fill-in' | 'matching' | 'performance' | 'sequencing' | 'likert' | 'numeric' | 'other';
  correctResponsesPattern?: string[];
  choices?: Array<{
    id: string;
    description: Record<string, string>;
  }>;
}

export interface XAPIProgress {
  userId: string;
  projectId: string;
  statements: XAPIStatement[];
  completion: number;
  score?: number;
  duration: number;
  lastActivity: Date;
}

export class XAPIService {
  private config: XAPIConfig;
  private statements: XAPIStatement[] = [];
  private sessionId: string;
  private startTime: Date;

  constructor(config: XAPIConfig) {
    this.config = config;
    this.sessionId = this.generateUUID();
    this.startTime = new Date();
  }

  // Statement Creation Methods
  createStatement(
    actor: XAPIActor,
    verb: XAPIVerb,
    object: XAPIObject,
    result?: XAPIResult,
    context?: XAPIContext
  ): XAPIStatement {
    const statement: XAPIStatement = {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      actor,
      verb,
      object,
      stored: new Date().toISOString(),
      authority: {
        objectType: 'Agent',
        name: 'TreiaX LMS Integration',
        mbox: 'mailto:system@treiax.com'
      }
    };

    if (result) {
      statement.result = result;
    }

    if (context) {
      statement.context = context;
    }

    return statement;
  }

  // Pre-defined Statement Templates
  createVideoStartedStatement(user: User, project: Project, sceneId?: string): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('started');
    const object = this.createVideoObject(project, sceneId);
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, undefined, context);
  }

  createVideoCompletedStatement(user: User, project: Project, duration: number, sceneId?: string): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('completed');
    const object = this.createVideoObject(project, sceneId);
    const result: XAPIResult = {
      completion: true,
      duration: `PT${Math.round(duration)}S`
    };
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, result, context);
  }

  createQuizAttemptedStatement(user: User, project: Project, quizId: string): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('attempted');
    const object = this.createQuizObject(project, quizId);
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, undefined, context);
  }

  createQuizAnsweredStatement(
    user: User,
    project: Project,
    quizId: string,
    questionId: string,
    response: string,
    correct: boolean
  ): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('answered');
    const object = this.createQuestionObject(project, quizId, questionId);
    const result: XAPIResult = {
      response,
      success: correct,
      score: {
        scaled: correct ? 1 : 0
      }
    };
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, result, context);
  }

  createQuizPassedStatement(
    user: User,
    project: Project,
    quizId: string,
    score: number,
    maxScore: number,
    duration: number
  ): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('passed');
    const object = this.createQuizObject(project, quizId);
    const result: XAPIResult = {
      completion: true,
      success: true,
      score: {
        raw: score,
        max: maxScore,
        scaled: score / maxScore
      },
      duration: `PT${Math.round(duration)}S`
    };
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, result, context);
  }

  createCourseRegisteredStatement(user: User, project: Project): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('registered');
    const object = this.createCourseObject(project);
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, undefined, context);
  }

  createCourseCompletedStatement(
    user: User,
    project: Project,
    finalScore: number,
    totalDuration: number
  ): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('completed');
    const object = this.createCourseObject(project);
    const result: XAPIResult = {
      completion: true,
      success: finalScore >= 70, // Assuming 70% pass rate
      score: {
        raw: finalScore,
        max: 100,
        scaled: finalScore / 100
      },
      duration: `PT${Math.round(totalDuration)}S`
    };
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, result, context);
  }

  createProgressStatement(
    user: User,
    project: Project,
    progress: number,
    currentScene?: string
  ): XAPIStatement {
    const actor = this.createActor(user);
    const verb = this.getVerb('progressed');
    const object = this.createCourseObject(project);
    const result: XAPIResult = {
      completion: progress >= 100,
      score: {
        scaled: progress / 100
      },
      extensions: {
        'http://treiax.com/xapi/extensions/progress': progress,
        'http://treiax.com/xapi/extensions/current-scene': currentScene
      }
    };
    const context = this.createContext(project);

    return this.createStatement(actor, verb, object, result, context);
  }

  // Helper Methods for Creating xAPI Objects
  private createActor(user: User): XAPIActor {
    return {
      objectType: 'Agent',
      name: user.name || user.email,
      mbox: `mailto:${user.email}`,
      account: {
        homePage: 'https://treiax.com',
        name: user.id
      }
    };
  }

  private createVideoObject(project: Project, sceneId?: string): XAPIObject {
    const id = sceneId 
      ? `https://treiax.com/projects/${project.id}/scenes/${sceneId}`
      : `https://treiax.com/projects/${project.id}/video`;
    
    return {
      objectType: 'Activity',
      id,
      definition: {
        name: {
          'pt-BR': sceneId ? `Vídeo - Cena ${sceneId}` : project.title,
          'en-US': sceneId ? `Video - Scene ${sceneId}` : project.title
        },
        description: {
          'pt-BR': project.description || 'Vídeo de treinamento',
          'en-US': project.description || 'Training video'
        },
        type: 'http://adlnet.gov/expapi/activities/media',
        extensions: {
          'http://treiax.com/xapi/extensions/project-id': project.id,
          'http://treiax.com/xapi/extensions/scene-id': sceneId,
          'http://treiax.com/xapi/extensions/content-type': 'video'
        }
      }
    };
  }

  private createQuizObject(project: Project, quizId: string): XAPIObject {
    return {
      objectType: 'Activity',
      id: `https://treiax.com/projects/${project.id}/quizzes/${quizId}`,
      definition: {
        name: {
          'pt-BR': `Quiz - ${project.title}`,
          'en-US': `Quiz - ${project.title}`
        },
        description: {
          'pt-BR': 'Questionário de avaliação',
          'en-US': 'Assessment quiz'
        },
        type: 'http://adlnet.gov/expapi/activities/assessment',
        extensions: {
          'http://treiax.com/xapi/extensions/project-id': project.id,
          'http://treiax.com/xapi/extensions/quiz-id': quizId,
          'http://treiax.com/xapi/extensions/content-type': 'quiz'
        }
      }
    };
  }

  private createQuestionObject(project: Project, quizId: string, questionId: string): XAPIObject {
    return {
      objectType: 'Activity',
      id: `https://treiax.com/projects/${project.id}/quizzes/${quizId}/questions/${questionId}`,
      definition: {
        name: {
          'pt-BR': `Pergunta ${questionId}`,
          'en-US': `Question ${questionId}`
        },
        description: {
          'pt-BR': 'Pergunta do questionário',
          'en-US': 'Quiz question'
        },
        type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
        extensions: {
          'http://treiax.com/xapi/extensions/project-id': project.id,
          'http://treiax.com/xapi/extensions/quiz-id': quizId,
          'http://treiax.com/xapi/extensions/question-id': questionId
        }
      }
    };
  }

  private createCourseObject(project: Project): XAPIObject {
    return {
      objectType: 'Activity',
      id: `https://treiax.com/projects/${project.id}`,
      definition: {
        name: {
          'pt-BR': project.title,
          'en-US': project.title
        },
        description: {
          'pt-BR': project.description || 'Curso de treinamento',
          'en-US': project.description || 'Training course'
        },
        type: 'http://adlnet.gov/expapi/activities/course',
        extensions: {
          'http://treiax.com/xapi/extensions/project-id': project.id,
          'http://treiax.com/xapi/extensions/category': project.category,
          'http://treiax.com/xapi/extensions/tags': project.tags
        }
      }
    };
  }

  private createContext(project: Project): XAPIContext {
    return {
      registration: this.sessionId,
      platform: 'TreiaX',
      language: 'pt-BR',
      contextActivities: {
        parent: [{
          objectType: 'Activity',
          id: 'https://treiax.com/platform',
          definition: {
            name: {
              'pt-BR': 'Plataforma TreiaX',
              'en-US': 'TreiaX Platform'
            },
            type: 'http://adlnet.gov/expapi/activities/course'
          }
        }],
        category: [{
          objectType: 'Activity',
          id: 'https://treiax.com/categories/safety-training',
          definition: {
            name: {
              'pt-BR': 'Treinamento de Segurança',
              'en-US': 'Safety Training'
            },
            type: 'http://adlnet.gov/expapi/activities/profile'
          }
        }]
      },
      extensions: {
        'http://treiax.com/xapi/extensions/session-id': this.sessionId,
        'http://treiax.com/xapi/extensions/project-version': project.version || '1.0',
        'http://treiax.com/xapi/extensions/user-agent': navigator.userAgent
      }
    };
  }

  private getVerb(verbName: string): XAPIVerb {
    const verbs: Record<string, XAPIVerb> = {
      'started': {
        id: 'http://adlnet.gov/expapi/verbs/launched',
        display: {
          'pt-BR': 'iniciou',
          'en-US': 'started'
        }
      },
      'completed': {
        id: 'http://adlnet.gov/expapi/verbs/completed',
        display: {
          'pt-BR': 'completou',
          'en-US': 'completed'
        }
      },
      'attempted': {
        id: 'http://adlnet.gov/expapi/verbs/attempted',
        display: {
          'pt-BR': 'tentou',
          'en-US': 'attempted'
        }
      },
      'answered': {
        id: 'http://adlnet.gov/expapi/verbs/answered',
        display: {
          'pt-BR': 'respondeu',
          'en-US': 'answered'
        }
      },
      'passed': {
        id: 'http://adlnet.gov/expapi/verbs/passed',
        display: {
          'pt-BR': 'passou',
          'en-US': 'passed'
        }
      },
      'failed': {
        id: 'http://adlnet.gov/expapi/verbs/failed',
        display: {
          'pt-BR': 'falhou',
          'en-US': 'failed'
        }
      },
      'registered': {
        id: 'http://adlnet.gov/expapi/verbs/registered',
        display: {
          'pt-BR': 'registrou-se',
          'en-US': 'registered'
        }
      },
      'progressed': {
        id: 'http://adlnet.gov/expapi/verbs/progressed',
        display: {
          'pt-BR': 'progrediu',
          'en-US': 'progressed'
        }
      },
      'experienced': {
        id: 'http://adlnet.gov/expapi/verbs/experienced',
        display: {
          'pt-BR': 'experimentou',
          'en-US': 'experienced'
        }
      },
      'interacted': {
        id: 'http://adlnet.gov/expapi/verbs/interacted',
        display: {
          'pt-BR': 'interagiu',
          'en-US': 'interacted'
        }
      }
    };

    return verbs[verbName] || verbs['experienced'];
  }

  // Statement Management
  addStatement(statement: XAPIStatement): void {
    this.statements.push(statement);
  }

  getStatements(): XAPIStatement[] {
    return [...this.statements];
  }

  clearStatements(): void {
    this.statements = [];
  }

  // Send statements to LRS
  async sendStatement(statement: XAPIStatement): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/statements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'X-Experience-API-Version': this.config.version || '1.0.3'
        },
        body: JSON.stringify(statement)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send xAPI statement:', error);
      return false;
    }
  }

  async sendStatements(statements: XAPIStatement[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/statements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'X-Experience-API-Version': this.config.version || '1.0.3'
        },
        body: JSON.stringify(statements)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send xAPI statements:', error);
      return false;
    }
  }

  // Query statements from LRS
  async getStatementsFromLRS(params: {
    agent?: XAPIActor;
    verb?: string;
    activity?: string;
    since?: string;
    until?: string;
    limit?: number;
  }): Promise<XAPIStatement[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.agent) {
        queryParams.append('agent', JSON.stringify(params.agent));
      }
      if (params.verb) {
        queryParams.append('verb', params.verb);
      }
      if (params.activity) {
        queryParams.append('activity', params.activity);
      }
      if (params.since) {
        queryParams.append('since', params.since);
      }
      if (params.until) {
        queryParams.append('until', params.until);
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const response = await fetch(`${this.config.endpoint}/statements?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'X-Experience-API-Version': this.config.version || '1.0.3'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.statements || [];
    } catch (error) {
      console.error('Failed to query xAPI statements:', error);
      return [];
    }
  }

  // Analytics and Reporting
  async getUserProgress(userId: string, projectId: string): Promise<XAPIProgress | null> {
    try {
      const actor: XAPIActor = {
        objectType: 'Agent',
        account: {
          homePage: 'https://treiax.com',
          name: userId
        }
      };

      const statements = await this.getStatementsFromLRS({
        agent: actor,
        activity: `https://treiax.com/projects/${projectId}`
      });

      if (statements.length === 0) {
        return null;
      }

      // Calculate progress from statements
      const completedStatements = statements.filter(s => 
        s.verb.id === 'http://adlnet.gov/expapi/verbs/completed'
      );
      
      const progressStatements = statements.filter(s => 
        s.verb.id === 'http://adlnet.gov/expapi/verbs/progressed'
      );

      let completion = 0;
      let score = 0;
      let duration = 0;
      let lastActivity = new Date(0);

      // Get latest progress
      if (progressStatements.length > 0) {
        const latest = progressStatements.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        completion = latest.result?.score?.scaled ? latest.result.score.scaled * 100 : 0;
      }

      // Calculate total score and duration
      statements.forEach(statement => {
        if (statement.result?.score?.scaled) {
          score = Math.max(score, statement.result.score.scaled * 100);
        }
        
        if (statement.result?.duration) {
          const durationMatch = statement.result.duration.match(/PT(\d+)S/);
          if (durationMatch) {
            duration += parseInt(durationMatch[1]);
          }
        }
        
        const statementTime = new Date(statement.timestamp);
        if (statementTime > lastActivity) {
          lastActivity = statementTime;
        }
      });

      return {
        userId,
        projectId,
        statements,
        completion,
        score,
        duration,
        lastActivity
      };
    } catch (error) {
      console.error('Failed to get user progress:', error);
      return null;
    }
  }

  // Utility Methods
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Batch processing for offline support
  async sendQueuedStatements(): Promise<boolean> {
    if (this.statements.length === 0) {
      return true;
    }

    const success = await this.sendStatements(this.statements);
    if (success) {
      this.clearStatements();
    }
    
    return success;
  }

  // Configuration management
  updateConfig(newConfig: Partial<XAPIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): XAPIConfig {
    return { ...this.config };
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/about`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'X-Experience-API-Version': this.config.version || '1.0.3'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('xAPI connection test failed:', error);
      return false;
    }
  }
}

export default XAPIService;