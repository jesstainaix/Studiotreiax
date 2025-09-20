import React, { useState, useEffect } from 'react';
import { performanceOptimizer } from '../../services/PerformanceOptimizer';

// Responsive design hooks and utilities for Phase 4
export const useResponsiveDesign = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    is1080p: window.innerWidth >= 1920 && window.innerHeight >= 1080,
    is1440p: window.innerWidth >= 2560 && window.innerHeight >= 1440
  });

  useEffect(() => {
    const handleResize = performanceOptimizer.createThrottledScrollHandler(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        is1080p: width >= 1920 && height >= 1080,
        is1440p: width >= 2560 && height >= 1440
      });
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Timeline responsive utilities
export const getTimelineConfig = (viewport: ReturnType<typeof useResponsiveDesign>) => {
  if (viewport.isMobile) {
    return {
      trackHeight: 60,
      zoom: 20,
      showWaveforms: false,
      showMarkers: true,
      timelineHeight: 200,
      maxVisibleTracks: 3
    };
  } else if (viewport.isTablet) {
    return {
      trackHeight: 70,
      zoom: 35,
      showWaveforms: true,
      showMarkers: true,
      timelineHeight: 280,
      maxVisibleTracks: 5
    };
  } else if (viewport.is1440p) {
    return {
      trackHeight: 100,
      zoom: 60,
      showWaveforms: true,
      showMarkers: true,
      timelineHeight: 400,
      maxVisibleTracks: 8
    };
  } else {
    // Desktop (1080p and similar)
    return {
      trackHeight: 80,
      zoom: 50,
      showWaveforms: true,
      showMarkers: true,
      timelineHeight: 320,
      maxVisibleTracks: 6
    };
  }
};

// Scene player responsive utilities
export const getScenePlayerConfig = (viewport: ReturnType<typeof useResponsiveDesign>) => {
  if (viewport.isMobile) {
    return {
      showAvatarOverlay: false,
      showElementsPanel: false,
      canvasZoom: 0.8,
      gridSize: 0.1,
      minElementSize: 0.05
    };
  } else if (viewport.isTablet) {
    return {
      showAvatarOverlay: true,
      showElementsPanel: false,
      canvasZoom: 0.9,
      gridSize: 0.05,
      minElementSize: 0.03
    };
  } else {
    return {
      showAvatarOverlay: true,
      showElementsPanel: true,
      canvasZoom: 1.0,
      gridSize: 0.025,
      minElementSize: 0.02
    };
  }
};

// Elements panel responsive utilities
export const getElementsPanelConfig = (viewport: ReturnType<typeof useResponsiveDesign>) => {
  if (viewport.isMobile) {
    return {
      width: '100%',
      height: '40vh',
      position: 'bottom' as const,
      showPreview: false,
      compactMode: true
    };
  } else if (viewport.isTablet) {
    return {
      width: '300px',
      height: '100%',
      position: 'right' as const,
      showPreview: true,
      compactMode: true
    };
  } else if (viewport.is1440p) {
    return {
      width: '400px',
      height: '100%',
      position: 'right' as const,
      showPreview: true,
      compactMode: false
    };
  } else {
    return {
      width: '320px',
      height: '100%',
      position: 'right' as const,
      showPreview: true,
      compactMode: false
    };
  }
};

// Layout configuration for HeyGen interface
export const getLayoutConfig = (viewport: ReturnType<typeof useResponsiveDesign>) => {
  if (viewport.isMobile) {
    return {
      layout: 'stack' as const,
      scenesPanel: { width: '100%', position: 'top' },
      preview: { width: '100%', height: '60vh' },
      library: { width: '100%', position: 'bottom' },
      timeline: { height: '200px', position: 'bottom' }
    };
  } else if (viewport.isTablet) {
    return {
      layout: 'hybrid' as const,
      scenesPanel: { width: '250px', position: 'left' },
      preview: { width: 'auto', height: '60vh' },
      library: { width: '280px', position: 'right' },
      timeline: { height: '280px', position: 'bottom' }
    };
  } else {
    return {
      layout: 'full' as const,
      scenesPanel: { width: '320px', position: 'left' },
      preview: { width: 'auto', height: 'auto' },
      library: { width: '320px', position: 'right' },
      timeline: { height: '320px', position: 'bottom' }
    };
  }
};

// Performance optimization component
interface ResponsiveOptimizerProps {
  children: React.ReactNode;
}

export const ResponsiveOptimizer: React.FC<ResponsiveOptimizerProps> = ({ children }) => {
  const viewport = useResponsiveDesign();
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    // Apply responsive optimizations
    const applyOptimizations = async () => {
      // Disable heavy animations on mobile
      if (viewport.isMobile) {
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
        document.documentElement.style.setProperty('--transition-duration', '0.1s');
      } else {
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
        document.documentElement.style.setProperty('--transition-duration', '0.2s');
      }

      // Adjust rendering quality
      if (viewport.isMobile || viewport.isTablet) {
        document.documentElement.style.setProperty('--image-rendering', 'optimizeSpeed');
      } else {
        document.documentElement.style.setProperty('--image-rendering', 'optimizeQuality');
      }

      setIsOptimized(true);
    };

    applyOptimizations();
  }, [viewport]);

  if (!isOptimized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Otimizando interface...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// CSS-in-JS responsive styles
export const getResponsiveStyles = (viewport: ReturnType<typeof useResponsiveDesign>) => ({
  container: {
    maxWidth: viewport.isMobile ? '100%' : viewport.isTablet ? '768px' : '100%',
    padding: viewport.isMobile ? '8px' : '16px',
    fontSize: viewport.isMobile ? '14px' : '16px'
  },
  
  timeline: {
    height: getTimelineConfig(viewport).timelineHeight,
    overflowX: viewport.isMobile ? 'scroll' : 'auto',
    touchAction: viewport.isMobile ? 'pan-x' : 'auto'
  },
  
  elementsPanel: {
    width: getElementsPanelConfig(viewport).width,
    height: getElementsPanelConfig(viewport).height,
    position: getElementsPanelConfig(viewport).position === 'bottom' ? 'fixed' : 'static',
    bottom: getElementsPanelConfig(viewport).position === 'bottom' ? 0 : 'auto',
    zIndex: getElementsPanelConfig(viewport).position === 'bottom' ? 1000 : 'auto'
  },
  
  scenePlayer: {
    touchAction: viewport.isMobile ? 'pan-y pinch-zoom' : 'none',
    userSelect: 'none',
    webkitUserSelect: 'none'
  }
});

// Test responsive breakpoints
export const testResponsiveBreakpoints = () => {
  const breakpoints = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: '1440p', width: 2560, height: 1440 }
  ];

  console.log('Testing responsive breakpoints:');
  
  breakpoints.forEach(breakpoint => {
    // Simulate viewport
    const mockViewport = {
      width: breakpoint.width,
      height: breakpoint.height,
      isMobile: breakpoint.width < 768,
      isTablet: breakpoint.width >= 768 && breakpoint.width < 1024,
      isDesktop: breakpoint.width >= 1024,
      is1080p: breakpoint.width >= 1920 && breakpoint.height >= 1080,
      is1440p: breakpoint.width >= 2560 && breakpoint.height >= 1440
    };

    const timelineConfig = getTimelineConfig(mockViewport);
    const playerConfig = getScenePlayerConfig(mockViewport);
    const layoutConfig = getLayoutConfig(mockViewport);

    console.log(`${breakpoint.name} (${breakpoint.width}x${breakpoint.height}):`, {
      timeline: timelineConfig,
      player: playerConfig,
      layout: layoutConfig
    });
  });
};