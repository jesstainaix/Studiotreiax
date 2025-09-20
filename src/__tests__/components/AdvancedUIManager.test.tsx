/**
 * Testes de integração para AdvancedUIManager component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdvancedUIManager from '../../components/ui/AdvancedUIManager';
import { useAdvancedUI } from '../../hooks/useAdvancedUI';

// Mock do hook
vi.mock('../../hooks/useAdvancedUI');

const mockUseAdvancedUI = {
  // State
  themes: [],
  currentTheme: null,
  components: [],
  layouts: [],
  animations: [],
  activeAnimations: [],
  preferences: {
    theme: 'light',
    language: 'pt-BR',
    animations: true,
    accessibility: true
  },
  metrics: {
    componentsCreated: 0,
    themesApplied: 0,
    animationsPlayed: 0,
    performanceScore: 95
  },
  isLoading: false,
  error: null,
  initialized: true,
  config: {
    autoSave: true,
    notifications: true,
    theme: 'light',
    language: 'pt-BR'
  },
  stats: {
    activeComponents: 0,
    totalComponents: 0,
    completedTours: 0,
    userEngagement: 75,
    performanceScore: 95
  },
  analytics: {
    pageViews: 0,
    userInteractions: 0,
    conversionRate: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    topPages: [],
    userFlow: [],
    performanceMetrics: {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0
    }
  },
  tours: [],
  activeTheme: null,
  visibleComponents: [],
  activeTours: 0,
  completedTours: [],
  pendingTours: [],
  recommendations: [],
  isHealthy: true,
  needsAttention: false,

  // Theme actions
  setTheme: vi.fn(),
  addTheme: vi.fn(),
  updateTheme: vi.fn(),
  removeTheme: vi.fn(),
  getCurrentTheme: vi.fn(),

  // Component actions
  addComponent: vi.fn(),
  updateComponent: vi.fn(),
  removeComponent: vi.fn(),
  getFilteredComponents: vi.fn(() => []),
  showComponent: vi.fn(),
  hideComponent: vi.fn(),

  // Layout actions
  addLayout: vi.fn(),
  updateLayout: vi.fn(),
  removeLayout: vi.fn(),

  // Animation actions
  addAnimation: vi.fn(),
  updateAnimation: vi.fn(),
  removeAnimation: vi.fn(),

  // Tour actions
  getFilteredTours: vi.fn(() => []),
  startTour: vi.fn(),
  stopTour: vi.fn(),
  nextStep: vi.fn(),
  previousStep: vi.fn(),
  completeTour: vi.fn(),

  // Settings
  updatePreferences: vi.fn(),
  updateConfig: vi.fn(),
  setActiveTheme: vi.fn(),

  // History
  undo: vi.fn(),
  redo: vi.fn(),

  // Data management
  exportData: vi.fn(),
  importData: vi.fn(),

  // Legacy actions for backward compatibility
  actions: {
    createComponent: vi.fn(),
    updateComponent: vi.fn(),
    deleteComponent: vi.fn(),
    createTour: vi.fn(),
    updateTour: vi.fn(),
    deleteTour: vi.fn(),
    startTour: vi.fn(),
    completeTour: vi.fn(),
    createTheme: vi.fn(),
    updateTheme: vi.fn(),
    deleteTheme: vi.fn(),
    applyTheme: vi.fn(),
    updateConfig: vi.fn(),
    resetConfig: vi.fn(),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    updateAnalytics: vi.fn(),
    showNotification: vi.fn()
  },
  quickActions: {
    createComponent: vi.fn(),
    createTour: vi.fn(),
    createTheme: vi.fn(),
    clearAllComponents: vi.fn(),
    resetAllTours: vi.fn(),
    enableAccessibility: vi.fn(),
    optimizePerformance: vi.fn()
  },
  throttledActions: {
    updateComponent: vi.fn(),
    updateTour: vi.fn(),
    updateTheme: vi.fn()
  },
  debouncedActions: {
    setFilters: vi.fn(),
    updateAnalytics: vi.fn()
  }
};

describe('AdvancedUIManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAdvancedUI as any).mockReturnValue(mockUseAdvancedUI);
  });

  describe('Renderização', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<AdvancedUIManager />);
      
      expect(screen.getByText('Advanced UI Manager')).toBeInTheDocument();
      expect(screen.getByText('Gerenciamento avançado de interface')).toBeInTheDocument();
    });

    it('deve renderizar todas as abas', () => {
      render(<AdvancedUIManager />);
      
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      expect(screen.getByText('Componentes')).toBeInTheDocument();
      expect(screen.getByText('Tours')).toBeInTheDocument();
      expect(screen.getByText('Temas')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    it('deve renderizar cards de status', () => {
      render(<AdvancedUIManager />);
      
      expect(screen.getByText('Total de Componentes')).toBeInTheDocument();
      expect(screen.getByText('Tours Ativos')).toBeInTheDocument();
      expect(screen.getByText('Saúde do Sistema')).toBeInTheDocument();
    });

    it('deve renderizar barra de busca e filtros', () => {
      render(<AdvancedUIManager />);
      
      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });
  });

  describe('Navegação entre Abas', () => {
    it('deve alternar entre abas', async () => {
      render(<AdvancedUIManager />);
      
      // Clicar na aba Componentes
      fireEvent.click(screen.getByText('Componentes'));
      await waitFor(() => {
        expect(screen.getByText('Nenhum componente encontrado')).toBeInTheDocument();
      });

      // Clicar na aba Tours
      fireEvent.click(screen.getByText('Tours'));
      await waitFor(() => {
        expect(screen.getByText('Nenhum tour encontrado')).toBeInTheDocument();
      });

      // Clicar na aba Temas
      fireEvent.click(screen.getByText('Temas'));
      await waitFor(() => {
        expect(screen.getByText('Nenhum tema encontrado')).toBeInTheDocument();
      });
    });

    it('deve manter estado da aba ativa', () => {
      render(<AdvancedUIManager />);
      
      const componentesTab = screen.getByText('Componentes');
      fireEvent.click(componentesTab);
      
      // Verificar se a aba está ativa
      expect(componentesTab.closest('button')).toHaveClass('border-blue-500');
    });
  });

  describe('Funcionalidades de Busca e Filtro', () => {
    it('deve executar busca', async () => {
      render(<AdvancedUIManager />);
      
      const searchInput = screen.getByPlaceholderText('Buscar...');
      fireEvent.change(searchInput, { target: { value: 'modal' } });
      
      await waitFor(() => {
        expect(mockUseAdvancedUI.debouncedActions.setFilters).toHaveBeenCalledWith({
          search: 'modal'
        });
      });
    });

    it('deve limpar filtros', async () => {
      render(<AdvancedUIManager />);
      
      const clearButton = screen.getByText('Limpar');
      fireEvent.click(clearButton);
      
      expect(mockUseAdvancedUI.actions.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Criação de Componentes', () => {
    it('deve abrir dialog de criação de componente', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Componentes
      fireEvent.click(screen.getByText('Componentes'));
      
      // Clicar no botão de criar
      const createButton = screen.getByText('Criar Componente');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Componente')).toBeInTheDocument();
      });
    });

    it('deve criar componente com dados válidos', async () => {
      render(<AdvancedUIManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Componentes'));
      fireEvent.click(screen.getByText('Criar Componente'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Componente')).toBeInTheDocument();
      });
      
      // Preencher formulário
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Test Modal' }
      });
      
      fireEvent.change(screen.getByLabelText('Tipo'), {
        target: { value: 'modal' }
      });
      
      // Submeter formulário
      fireEvent.click(screen.getByText('Criar'));
      
      await waitFor(() => {
        expect(mockUseAdvancedUI.quickActions.createComponent).toHaveBeenCalledWith({
          name: 'Test Modal',
          type: 'modal',
          config: {}
        });
      });
    });

    it('deve validar campos obrigatórios', async () => {
      render(<AdvancedUIManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Componentes'));
      fireEvent.click(screen.getByText('Criar Componente'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Componente')).toBeInTheDocument();
      });
      
      // Tentar submeter sem preencher
      fireEvent.click(screen.getByText('Criar'));
      
      // Verificar se não foi chamado
      expect(mockUseAdvancedUI.quickActions.createComponent).not.toHaveBeenCalled();
    });
  });

  describe('Criação de Tours', () => {
    it('deve abrir dialog de criação de tour', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Tours
      fireEvent.click(screen.getByText('Tours'));
      
      // Clicar no botão de criar
      const createButton = screen.getByText('Criar Tour');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Tour')).toBeInTheDocument();
      });
    });

    it('deve criar tour com steps', async () => {
      render(<AdvancedUIManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Tours'));
      fireEvent.click(screen.getByText('Criar Tour'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Tour')).toBeInTheDocument();
      });
      
      // Preencher formulário
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Onboarding Tour' }
      });
      
      // Adicionar step
      fireEvent.click(screen.getByText('Adicionar Step'));
      
      // Submeter formulário
      fireEvent.click(screen.getByText('Criar'));
      
      await waitFor(() => {
        expect(mockUseAdvancedUI.quickActions.createTour).toHaveBeenCalled();
      });
    });
  });

  describe('Criação de Temas', () => {
    it('deve abrir dialog de criação de tema', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Temas
      fireEvent.click(screen.getByText('Temas'));
      
      // Clicar no botão de criar
      const createButton = screen.getByText('Criar Tema');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Tema')).toBeInTheDocument();
      });
    });

    it('deve criar tema com cores personalizadas', async () => {
      render(<AdvancedUIManager />);
      
      // Abrir dialog
      fireEvent.click(screen.getByText('Temas'));
      fireEvent.click(screen.getByText('Criar Tema'));
      
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Tema')).toBeInTheDocument();
      });
      
      // Preencher formulário
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Dark Theme' }
      });
      
      fireEvent.change(screen.getByLabelText('Cor Primária'), {
        target: { value: '#000000' }
      });
      
      // Submeter formulário
      fireEvent.click(screen.getByText('Criar'));
      
      await waitFor(() => {
        expect(mockUseAdvancedUI.quickActions.createTheme).toHaveBeenCalledWith({
          name: 'Dark Theme',
          colors: {
            primary: '#000000',
            secondary: '#333333',
            background: '#111111',
            text: '#ffffff'
          },
          fonts: {
            primary: 'Arial, sans-serif',
            secondary: 'Georgia, serif'
          }
        });
      });
    });
  });

  describe('Configurações', () => {
    it('deve renderizar configurações na aba correspondente', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Configurações
      fireEvent.click(screen.getByText('Configurações'));
      
      await waitFor(() => {
        expect(screen.getByText('Auto Save')).toBeInTheDocument();
        expect(screen.getByText('Notificações')).toBeInTheDocument();
        expect(screen.getByText('Tema')).toBeInTheDocument();
        expect(screen.getByText('Idioma')).toBeInTheDocument();
      });
    });

    it('deve atualizar configurações', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Configurações
      fireEvent.click(screen.getByText('Configurações'));
      
      await waitFor(() => {
        const autoSaveToggle = screen.getByRole('switch', { name: /auto save/i });
        fireEvent.click(autoSaveToggle);
      });
      
      expect(mockUseAdvancedUI.actions.updateConfig).toHaveBeenCalledWith({
        autoSave: false
      });
    });

    it('deve resetar configurações', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Configurações
      fireEvent.click(screen.getByText('Configurações'));
      
      await waitFor(() => {
        const resetButton = screen.getByText('Resetar Configurações');
        fireEvent.click(resetButton);
      });
      
      expect(mockUseAdvancedUI.actions.resetConfig).toHaveBeenCalled();
    });
  });

  describe('Analytics', () => {
    it('deve renderizar analytics na aba correspondente', async () => {
      render(<AdvancedUIManager />);
      
      // Ir para aba Analytics
      fireEvent.click(screen.getByText('Analytics'));
      
      await waitFor(() => {
        expect(screen.getByText('Page Views')).toBeInTheDocument();
        expect(screen.getByText('User Interactions')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      });
    });

    it('deve exibir métricas de performance', async () => {
      const mockWithAnalytics = {
        ...mockUseAdvancedUI,
        analytics: {
          ...mockUseAdvancedUI.analytics,
          pageViews: 1500,
          userInteractions: 750,
          conversionRate: 0.15
        }
      };
      
      (useAdvancedUI as any).mockReturnValue(mockWithAnalytics);
      
      render(<AdvancedUIManager />);
      
      // Ir para aba Analytics
      fireEvent.click(screen.getByText('Analytics'));
      
      await waitFor(() => {
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('750')).toBeInTheDocument();
        expect(screen.getByText('15%')).toBeInTheDocument();
      });
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve exibir estado de loading', () => {
      const mockWithLoading = {
        ...mockUseAdvancedUI,
        isLoading: true
      };
      
      (useAdvancedUI as any).mockReturnValue(mockWithLoading);
      
      render(<AdvancedUIManager />);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve exibir estado de erro', () => {
      const mockWithError = {
        ...mockUseAdvancedUI,
        error: 'Erro ao carregar dados'
      };
      
      (useAdvancedUI as any).mockReturnValue(mockWithError);
      
      render(<AdvancedUIManager />);
      
      expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar layout para mobile', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<AdvancedUIManager />);
      
      // Verificar se o layout mobile está sendo aplicado
      const container = screen.getByTestId('advanced-ui-manager');
      expect(container).toHaveClass('flex-col');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter navegação por teclado', () => {
      render(<AdvancedUIManager />);
      
      const firstTab = screen.getByText('Visão Geral');
      firstTab.focus();
      
      // Simular navegação por teclado
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      
      const secondTab = screen.getByText('Componentes');
      expect(secondTab).toHaveFocus();
    });

    it('deve ter labels apropriados', () => {
      render(<AdvancedUIManager />);
      
      const searchInput = screen.getByPlaceholderText('Buscar...');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar componentes, tours ou temas');
    });

    it('deve ter roles ARIA corretos', () => {
      render(<AdvancedUIManager />);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);
    });
  });
});