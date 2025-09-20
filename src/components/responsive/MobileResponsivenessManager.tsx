// Componente de gerenciamento de responsividade móvel
import React, { useState, useEffect, useCallback } from 'react';
import {
  useMobileResponsiveness,
  useAutoDeviceDetection,
  useResponsivePerformance,
  useResponsiveStats,
  useResponsiveConfig,
  useResponsiveDebug
} from '../../hooks/useMobileResponsiveness';
import {
  DeviceInfo,
  Breakpoint,
  ResponsiveComponent,
  TouchGesture,
  ResponsiveImage
} from '../../utils/mobileResponsiveness';
import {
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  RotateCcw,
  TouchpadIcon as Touch,
  Zap,
  Settings,
  BarChart3,
  Bug,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Upload,
  Filter,
  Search,
  X,
  Check,
  AlertTriangle,
  Info,
  Maximize,
  Minimize
} from 'lucide-react';

const MobileResponsivenessManager: React.FC = () => {
  // Hooks
  const responsive = useMobileResponsiveness({
    enableDeviceDetection: true,
    enableTouchOptimizations: true,
    enableGestureRecognition: true,
    enablePerformanceOptimizations: true,
    autoInitialize: true,
    debugMode: true
  });
  
  useAutoDeviceDetection({
    interval: 3000,
    enableOrientationTracking: true,
    enableResizeTracking: true
  });
  
  const performance = useResponsivePerformance();
  const stats = useResponsiveStats();
  const config = useResponsiveConfig();
  const debug = useResponsiveDebug();
  
  // Estado local
  const [activeTab, setActiveTab] = useState<'device' | 'breakpoints' | 'components' | 'gestures' | 'images' | 'performance' | 'config' | 'debug'>('device');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'breakpoint' | 'component' | 'gesture' | 'image' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAutoDetecting, setIsAutoDetecting] = useState(true);
  
  // Filtros
  const filteredBreakpoints = responsive.breakpoints.filter(bp => 
    bp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredComponents = responsive.components.filter(comp => 
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterType === 'all' || comp.touchOptimizations.gestureSupport.includes(filterType))
  );
  
  const filteredGestures = responsive.gestures.filter(gesture => 
    gesture.type.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterType === 'all' || gesture.type === filterType)
  );
  
  const filteredImages = responsive.images.filter(img => 
    img.alt.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handlers
  const handleDetectDevice = useCallback(async () => {
    await responsive.detectDevice();
  }, [responsive]);
  
  const handleOptimizeForDevice = useCallback(() => {
    responsive.optimizeForDevice();
  }, [responsive]);
  
  const handleAddBreakpoint = useCallback(() => {
    setModalType('breakpoint');
    setSelectedItem(null);
    setShowModal(true);
  }, []);
  
  const handleEditBreakpoint = useCallback((breakpoint: Breakpoint) => {
    setModalType('breakpoint');
    setSelectedItem(breakpoint);
    setShowModal(true);
  }, []);
  
  const handleAddComponent = useCallback(() => {
    setModalType('component');
    setSelectedItem(null);
    setShowModal(true);
  }, []);
  
  const handleEditComponent = useCallback((component: ResponsiveComponent) => {
    setModalType('component');
    setSelectedItem(component);
    setShowModal(true);
  }, []);
  
  const handleAddGesture = useCallback(() => {
    setModalType('gesture');
    setSelectedItem(null);
    setShowModal(true);
  }, []);
  
  const handleEditGesture = useCallback((gesture: TouchGesture) => {
    setModalType('gesture');
    setSelectedItem(gesture);
    setShowModal(true);
  }, []);
  
  const handleAddImage = useCallback(() => {
    setModalType('image');
    setSelectedItem(null);
    setShowModal(true);
  }, []);
  
  const handleEditImage = useCallback((image: ResponsiveImage) => {
    setModalType('image');
    setSelectedItem(image);
    setShowModal(true);
  }, []);
  
  const handleSaveItem = useCallback((data: any) => {
    if (modalType === 'breakpoint') {
      if (selectedItem) {
        responsive.updateBreakpoint(selectedItem.id, data);
      } else {
        responsive.addBreakpoint({ ...data, id: `bp-${Date.now()}` });
      }
    } else if (modalType === 'component') {
      if (selectedItem) {
        responsive.updateComponent(selectedItem.id, data);
      } else {
        responsive.createResponsiveComponent(`comp-${Date.now()}`, data);
      }
    } else if (modalType === 'gesture') {
      if (selectedItem) {
        responsive.updateGesture(selectedItem.id, data);
      } else {
        responsive.createTouchGesture(`gesture-${Date.now()}`, data);
      }
    } else if (modalType === 'image') {
      if (selectedItem) {
        responsive.updateResponsiveImage(selectedItem.id, data);
      } else {
        responsive.addResponsiveImage({ ...data, id: `img-${Date.now()}` });
      }
    }
    
    setShowModal(false);
    setSelectedItem(null);
  }, [modalType, selectedItem, responsive]);
  
  const handleDeleteItem = useCallback((type: string, id: string) => {
    if (type === 'breakpoint') {
      responsive.removeBreakpoint(id);
    } else if (type === 'component') {
      responsive.removeComponent(id);
    } else if (type === 'gesture') {
      responsive.removeGesture(id);
    } else if (type === 'image') {
      responsive.removeResponsiveImage(id);
    }
  }, [responsive]);
  
  // Funções de demonstração
  const createDemoBreakpoints = useCallback(() => {
    const demoBreakpoints = [
      {
        id: 'xxs',
        name: 'Extra Extra Small',
        minWidth: 0,
        maxWidth: 359,
        columns: 1,
        gutters: 12,
        margins: 12,
        typography: { baseSize: 12, lineHeight: 1.3, scale: 1.1 },
        spacing: { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }
      },
      {
        id: 'xxl',
        name: 'Extra Extra Large',
        minWidth: 1600,
        columns: 8,
        gutters: 40,
        margins: 40,
        typography: { baseSize: 20, lineHeight: 1.7, scale: 1.5 },
        spacing: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 }
      }
    ];
    
    demoBreakpoints.forEach(bp => responsive.addBreakpoint(bp));
  }, [responsive]);
  
  const createDemoComponents = useCallback(() => {
    const demoComponents = [
      {
        name: 'Navigation Menu',
        breakpoints: {
          xs: { visible: true, layout: 'stack', fontSize: 14 },
          sm: { visible: true, layout: 'flex', fontSize: 15 },
          md: { visible: true, layout: 'flex', fontSize: 16 },
          lg: { visible: true, layout: 'flex', fontSize: 17 },
          xl: { visible: true, layout: 'flex', fontSize: 18 }
        },
        minTouchTarget: 44,
        gestureSupport: ['tap', 'swipe'],
        hapticFeedback: true,
        swipeActions: true,
        lazyLoad: false,
        virtualScroll: false,
        imageOptimization: false,
        animationReduction: false
      },
      {
        name: 'Product Grid',
        breakpoints: {
          xs: { visible: true, layout: 'stack', columns: 1 },
          sm: { visible: true, layout: 'grid', columns: 2 },
          md: { visible: true, layout: 'grid', columns: 3 },
          lg: { visible: true, layout: 'grid', columns: 4 },
          xl: { visible: true, layout: 'grid', columns: 6 }
        },
        minTouchTarget: 48,
        gestureSupport: ['tap', 'long-press'],
        hapticFeedback: false,
        swipeActions: false,
        lazyLoad: true,
        virtualScroll: true,
        imageOptimization: true,
        animationReduction: true
      }
    ];
    
    demoComponents.forEach((comp, index) => {
      responsive.createResponsiveComponent(`demo-comp-${index}`, comp);
    });
  }, [responsive]);
  
  const createDemoGestures = useCallback(() => {
    const demoGestures = [
      {
        type: 'swipe',
        element: '.carousel',
        action: 'next-slide',
        threshold: 50,
        enabled: true,
        hapticFeedback: true
      },
      {
        type: 'pinch',
        element: '.zoomable',
        action: 'zoom',
        threshold: 1.2,
        enabled: true,
        hapticFeedback: false
      },
      {
        type: 'double-tap',
        element: '.image',
        action: 'toggle-fullscreen',
        threshold: 300,
        enabled: true,
        hapticFeedback: true
      }
    ];
    
    demoGestures.forEach((gesture, index) => {
      responsive.createTouchGesture(`demo-gesture-${index}`, gesture);
    });
  }, [responsive]);
  
  const createDemoImages = useCallback(() => {
    const demoImages = [
      {
        src: '/images/hero.jpg',
        alt: 'Hero Image',
        breakpoints: {
          xs: { src: '/images/hero-xs.webp', width: 360, height: 200, quality: 70, format: 'webp' as const },
          sm: { src: '/images/hero-sm.webp', width: 576, height: 320, quality: 75, format: 'webp' as const },
          md: { src: '/images/hero-md.webp', width: 768, height: 430, quality: 80, format: 'webp' as const },
          lg: { src: '/images/hero-lg.webp', width: 992, height: 550, quality: 85, format: 'webp' as const },
          xl: { src: '/images/hero-xl.webp', width: 1200, height: 670, quality: 90, format: 'webp' as const }
        },
        lazyLoad: true,
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzAiIHZpZXdCb3g9IjAgMCAxMjAwIDY3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjcwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo='
      },
      {
        src: '/images/product.jpg',
        alt: 'Product Image',
        breakpoints: {
          xs: { src: '/images/product-xs.avif', width: 150, height: 150, quality: 65, format: 'avif' as const },
          sm: { src: '/images/product-sm.avif', width: 200, height: 200, quality: 70, format: 'avif' as const },
          md: { src: '/images/product-md.avif', width: 250, height: 250, quality: 75, format: 'avif' as const },
          lg: { src: '/images/product-lg.avif', width: 300, height: 300, quality: 80, format: 'avif' as const },
          xl: { src: '/images/product-xl.avif', width: 400, height: 400, quality: 85, format: 'avif' as const }
        },
        lazyLoad: true,
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo='
      }
    ];
    
    demoImages.forEach((img, index) => {
      responsive.addResponsiveImage({ ...img, id: `demo-img-${index}` });
    });
  }, [responsive]);
  
  // Renderização de ícones de dispositivo
  const renderDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'tv': return <Tv className="w-5 h-5" />;
      default: return <Smartphone className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📱 Mobile Responsiveness Manager
            </h1>
            <p className="text-gray-600">
              Sistema avançado de responsividade móvel com detecção de dispositivos, breakpoints adaptativos e otimizações de performance
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDetectDevice}
              disabled={responsive.isDetecting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${responsive.isDetecting ? 'animate-spin' : ''}`} />
              <span>Detectar Dispositivo</span>
            </button>
            
            <button
              onClick={handleOptimizeForDevice}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Zap className="w-4 h-4" />
              <span>Otimizar</span>
            </button>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              responsive.isInitialized ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>Status: {responsive.isInitialized ? 'Inicializado' : 'Não Inicializado'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isAutoDetecting ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span>Auto-detecção: {isAutoDetecting ? 'Ativa' : 'Inativa'}</span>
          </div>
          
          {responsive.deviceInfo && (
            <div className="flex items-center space-x-2">
              {renderDeviceIcon(responsive.deviceInfo.type)}
              <span>
                {responsive.deviceInfo.type} - {responsive.deviceInfo.screenSize.width}x{responsive.deviceInfo.screenSize.height}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'device', label: 'Dispositivo', icon: Smartphone },
            { id: 'breakpoints', label: 'Breakpoints', icon: Monitor },
            { id: 'components', label: 'Componentes', icon: Settings },
            { id: 'gestures', label: 'Gestos', icon: Touch },
            { id: 'images', label: 'Imagens', icon: Eye },
            { id: 'performance', label: 'Performance', icon: BarChart3 },
            { id: 'config', label: 'Config', icon: Settings },
            { id: 'debug', label: 'Debug', icon: Bug }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="space-y-6">
        {/* Device Tab */}
        {activeTab === 'device' && (
          <div className="space-y-6">
            {responsive.deviceInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Device Info */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    {renderDeviceIcon(responsive.deviceInfo.type)}
                    <span>Informações do Dispositivo</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{responsive.deviceInfo.type}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orientação:</span>
                      <div className="flex items-center space-x-1">
                        <RotateCcw className="w-4 h-4" />
                        <span className="font-medium">{responsive.deviceInfo.orientation}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resolução:</span>
                      <span className="font-medium">
                        {responsive.deviceInfo.screenSize.width}x{responsive.deviceInfo.screenSize.height}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pixel Ratio:</span>
                      <span className="font-medium">{responsive.deviceInfo.pixelRatio}x</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Touch:</span>
                      <span className={`font-medium ${
                        responsive.deviceInfo.touchCapable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {responsive.deviceInfo.touchCapable ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Retina:</span>
                      <span className={`font-medium ${
                        responsive.deviceInfo.isRetina ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {responsive.deviceInfo.isRetina ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Current Breakpoint */}
                {responsive.currentBreakpoint && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Monitor className="w-5 h-5" />
                      <span>Breakpoint Atual</span>
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{responsive.currentBreakpoint.id}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="font-medium">{responsive.currentBreakpoint.name}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Largura Mín:</span>
                        <span className="font-medium">{responsive.currentBreakpoint.minWidth}px</span>
                      </div>
                      
                      {responsive.currentBreakpoint.maxWidth && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Largura Máx:</span>
                          <span className="font-medium">{responsive.currentBreakpoint.maxWidth}px</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Colunas:</span>
                        <span className="font-medium">{responsive.currentBreakpoint.columns}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fonte Base:</span>
                        <span className="font-medium">{responsive.currentBreakpoint.typography.baseSize}px</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Safe Area */}
                {responsive.deviceInfo.safeArea && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Maximize className="w-5 h-5" />
                      <span>Área Segura</span>
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Topo:</span>
                        <span className="font-medium">{responsive.deviceInfo.safeArea.top}px</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Direita:</span>
                        <span className="font-medium">{responsive.deviceInfo.safeArea.right}px</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inferior:</span>
                        <span className="font-medium">{responsive.deviceInfo.safeArea.bottom}px</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Esquerda:</span>
                        <span className="font-medium">{responsive.deviceInfo.safeArea.left}px</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dispositivo detectado</h3>
                <p className="text-gray-600 mb-4">Clique em "Detectar Dispositivo" para começar</p>
                <button
                  onClick={handleDetectDevice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Detectar Agora
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Breakpoints Tab */}
        {activeTab === 'breakpoints' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar breakpoints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={createDemoBreakpoints}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Demo</span>
                </button>
                
                <button
                  onClick={handleAddBreakpoint}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Breakpoint</span>
                </button>
              </div>
            </div>
            
            {/* Breakpoints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBreakpoints.map(breakpoint => (
                <div key={breakpoint.id} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{breakpoint.name}</h3>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBreakpoint(breakpoint)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteItem('breakpoint', breakpoint.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-medium">{breakpoint.id}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Largura:</span>
                      <span className="font-medium">
                        {breakpoint.minWidth}px{breakpoint.maxWidth ? ` - ${breakpoint.maxWidth}px` : '+'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Colunas:</span>
                      <span className="font-medium">{breakpoint.columns}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fonte:</span>
                      <span className="font-medium">{breakpoint.typography.baseSize}px</span>
                    </div>
                    
                    {responsive.currentBreakpoint?.id === breakpoint.id && (
                      <div className="mt-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full text-center">
                        Ativo
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredBreakpoints.length === 0 && (
              <div className="text-center py-12">
                <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum breakpoint encontrado</h3>
                <p className="text-gray-600">Adicione breakpoints para começar</p>
              </div>
            )}
          </div>
        )}
        
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Score */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Score de Performance</span>
              </h3>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Score Geral</span>
                    <span className="text-sm font-medium">{stats.getPerformanceScore().toFixed(1)}/100</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stats.getPerformanceScore() >= 80 ? 'bg-green-500' :
                        stats.getPerformanceScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.getPerformanceScore()}%` }}
                    />
                  </div>
                </div>
                
                <div className={`text-2xl font-bold ${
                  stats.getPerformanceScore() >= 80 ? 'text-green-600' :
                  stats.getPerformanceScore() >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.getPerformanceScore() >= 80 ? '🟢' :
                   stats.getPerformanceScore() >= 60 ? '🟡' : '🔴'}
                </div>
              </div>
            </div>
            
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Tempo de Renderização</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {responsive.formatters.duration(responsive.stats.renderTime)}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Layout Shifts</h4>
                <div className="text-2xl font-bold text-orange-600">
                  {responsive.stats.layoutShifts}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Uso de Memória</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {responsive.formatters.fileSize(responsive.stats.memoryUsage)}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Otimizações</h4>
                <div className="text-2xl font-bold text-green-600">
                  {responsive.stats.performanceOptimizations}
                </div>
              </div>
            </div>
            
            {/* Usage Report */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Relatório de Uso</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Interações</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Touch:</span>
                      <span className="font-medium">{responsive.stats.touchInteractions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Gestos:</span>
                      <span className="font-medium">{responsive.stats.gestureRecognitions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total:</span>
                      <span className="font-medium">{stats.getUsageReport().totalInteractions}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Mudanças</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Dispositivo:</span>
                      <span className="font-medium">{responsive.stats.deviceDetections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Orientação:</span>
                      <span className="font-medium">{responsive.stats.orientationChanges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Breakpoints:</span>
                      <span className="font-medium">{responsive.stats.breakpointChanges}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-6">Configurações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-4">Funcionalidades</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'enableDeviceDetection', label: 'Detecção de Dispositivo' },
                      { key: 'enableTouchOptimizations', label: 'Otimizações Touch' },
                      { key: 'enableGestureRecognition', label: 'Reconhecimento de Gestos' },
                      { key: 'enablePerformanceOptimizations', label: 'Otimizações de Performance' },
                      { key: 'enableImageOptimization', label: 'Otimização de Imagens' },
                      { key: 'enableHapticFeedback', label: 'Feedback Háptico' },
                      { key: 'enableAnimationReduction', label: 'Redução de Animações' },
                      { key: 'enableAccessibility', label: 'Acessibilidade' }
                    ].map(feature => (
                      <div key={feature.key} className="flex items-center justify-between">
                        <span className="text-sm">{feature.label}</span>
                        <button
                          onClick={() => config.toggleFeature(feature.key as keyof ResponsiveConfig)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            responsive.config[feature.key as keyof ResponsiveConfig]
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              responsive.config[feature.key as keyof ResponsiveConfig]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Settings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-4">Configurações</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nível de Log
                      </label>
                      <select
                        value={responsive.config.logLevel}
                        onChange={(e) => config.setLogLevel(e.target.value as ResponsiveConfig['logLevel'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="none">Nenhum</option>
                        <option value="error">Erro</option>
                        <option value="warn">Aviso</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Modo Debug</span>
                      <button
                        onClick={() => config.enableDebugMode(!responsive.config.debugMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          responsive.config.debugMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            responsive.config.debugMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Ações Rápidas</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={config.optimizeForPerformance}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Otimizar Performance
                  </button>
                  
                  <button
                    onClick={config.optimizeForAccessibility}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Otimizar Acessibilidade
                  </button>
                  
                  <button
                    onClick={responsive.resetStats}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Resetar Estatísticas
                  </button>
                  
                  <button
                    onClick={config.resetConfig}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Resetar Configurações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Bug className="w-5 h-5" />
                  <span>Informações de Debug</span>
                </h3>
                
                <button
                  onClick={debug.logDebugInfo}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Log Console</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Device Debug */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Dispositivo</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(debug.debugInfo.device, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {/* Breakpoint Debug */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Breakpoint</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(debug.debugInfo.breakpoint, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {/* Performance Debug */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Performance</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(debug.debugInfo.performance, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {/* Status Debug */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Status</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(debug.debugInfo.status, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedItem ? 'Editar' : 'Adicionar'} {modalType}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal content would go here */}
            <div className="text-center py-8 text-gray-500">
              Formulário de {modalType} seria implementado aqui
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveItem({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileResponsivenessManager;