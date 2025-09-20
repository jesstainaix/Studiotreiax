import { useState, useEffect, useCallback, useRef } from 'react';

// Types for Virtual DOM system
interface VNode {
  type: string | Function;
  props: Record<string, any>;
  children: VNode[];
  key?: string | number;
  ref?: any;
}

interface VDOMPatch {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'REPLACE' | 'REORDER';
  node?: VNode;
  oldNode?: VNode;
  newNode?: VNode;
  index?: number;
  props?: Record<string, any>;
  children?: VNode[];
}

interface VDOMConfig {
  enableBatching: boolean;
  batchSize: number;
  enableMemoization: boolean;
  enableLazyRendering: boolean;
  enableVirtualization: boolean;
  enableDiffOptimization: boolean;
  maxDepth: number;
  updateThreshold: number;
}

interface VDOMMetrics {
  renderTime: number;
  diffTime: number;
  patchTime: number;
  nodesCreated: number;
  nodesUpdated: number;
  nodesDeleted: number;
  batchesProcessed: number;
  memoryUsage: number;
  cacheHitRate: number;
  virtualizedNodes: number;
}

interface VDOMState {
  tree: VNode | null;
  patches: VDOMPatch[];
  isRendering: boolean;
  metrics: VDOMMetrics;
  cache: Map<string, VNode>;
  memoizedComponents: Map<string, any>;
  renderQueue: VNode[];
  batchQueue: VDOMPatch[];
}

interface ComponentCache {
  component: any;
  props: Record<string, any>;
  result: VNode;
  timestamp: number;
  hitCount: number;
}

interface RenderContext {
  depth: number;
  parentKey?: string;
  isVirtualized: boolean;
  viewport?: { top: number; bottom: number; left: number; right: number };
}

// Virtual DOM Cache Manager
class VDOMCacheManager {
  private cache = new Map<string, ComponentCache>();
  private maxSize: number;
  private ttl: number;
  
  constructor(maxSize = 1000, ttl = 300000) { // 5 minutes TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  generateKey(component: any, props: Record<string, any>): string {
    const propsStr = JSON.stringify(props, Object.keys(props).sort());
    return `${component.name || component.toString()}_${propsStr}`;
  }
  
  get(component: any, props: Record<string, any>): VNode | null {
    const key = this.generateKey(component, props);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count
    cached.hitCount++;
    return cached.result;
  }
  
  set(component: any, props: Record<string, any>, result: VNode): void {
    const key = this.generateKey(component, props);
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      component,
      props: { ...props },
      result,
      timestamp: Date.now(),
      hitCount: 0
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length
        : 0
    };
  }
}

// Virtual DOM Differ
class VDOMDiffer {
  private config: VDOMConfig;
  
  constructor(config: VDOMConfig) {
    this.config = config;
  }
  
  diff(oldTree: VNode | null, newTree: VNode | null, context: RenderContext = { depth: 0, isVirtualized: false }): VDOMPatch[] {
    const patches: VDOMPatch[] = [];
    
    if (!oldTree && !newTree) {
      return patches;
    }
    
    if (!oldTree && newTree) {
      patches.push({ type: 'CREATE', node: newTree, index: 0 });
      return patches;
    }
    
    if (oldTree && !newTree) {
      patches.push({ type: 'DELETE', node: oldTree, index: 0 });
      return patches;
    }
    
    if (oldTree && newTree) {
      if (this.shouldReplace(oldTree, newTree)) {
        patches.push({ type: 'REPLACE', oldNode: oldTree, newNode: newTree, index: 0 });
        return patches;
      }
      
      // Diff props
      const propPatches = this.diffProps(oldTree.props, newTree.props);
      if (propPatches.length > 0) {
        patches.push({ type: 'UPDATE', node: newTree, props: newTree.props });
      }
      
      // Diff children
      const childPatches = this.diffChildren(oldTree.children, newTree.children, {
        ...context,
        depth: context.depth + 1
      });
      patches.push(...childPatches);
    }
    
    return patches;
  }
  
  private shouldReplace(oldNode: VNode, newNode: VNode): boolean {
    return (
      oldNode.type !== newNode.type ||
      oldNode.key !== newNode.key
    );
  }
  
  private diffProps(oldProps: Record<string, any>, newProps: Record<string, any>): string[] {
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
    
    for (const key of allKeys) {
      if (oldProps[key] !== newProps[key]) {
        changes.push(key);
      }
    }
    
    return changes;
  }
  
  private diffChildren(oldChildren: VNode[], newChildren: VNode[], context: RenderContext): VDOMPatch[] {
    const patches: VDOMPatch[] = [];
    
    // Skip deep diffing if max depth reached
    if (context.depth > this.config.maxDepth) {
      return patches;
    }
    
    // Use key-based diffing for better performance
    if (this.config.enableDiffOptimization) {
      return this.diffChildrenWithKeys(oldChildren, newChildren, context);
    }
    
    // Simple index-based diffing
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      
      const childPatches = this.diff(oldChild, newChild, context);
      patches.push(...childPatches.map(patch => ({ ...patch, index: i })));
    }
    
    return patches;
  }
  
  private diffChildrenWithKeys(oldChildren: VNode[], newChildren: VNode[], context: RenderContext): VDOMPatch[] {
    const patches: VDOMPatch[] = [];
    const oldKeyMap = new Map<string | number, { node: VNode; index: number }>();
    const newKeyMap = new Map<string | number, { node: VNode; index: number }>();
    
    // Build key maps
    oldChildren.forEach((child, index) => {
      if (child.key !== undefined) {
        oldKeyMap.set(child.key, { node: child, index });
      }
    });
    
    newChildren.forEach((child, index) => {
      if (child.key !== undefined) {
        newKeyMap.set(child.key, { node: child, index });
      }
    });
    
    // Find moves, updates, and deletions
    for (const [key, oldItem] of oldKeyMap) {
      const newItem = newKeyMap.get(key);
      
      if (!newItem) {
        // Node was deleted
        patches.push({ type: 'DELETE', node: oldItem.node, index: oldItem.index });
      } else if (oldItem.index !== newItem.index) {
        // Node was moved
        patches.push({ type: 'REORDER', node: newItem.node, index: newItem.index });
        
        // Also diff the moved node
        const childPatches = this.diff(oldItem.node, newItem.node, context);
        patches.push(...childPatches);
      } else {
        // Node stayed in place, just diff it
        const childPatches = this.diff(oldItem.node, newItem.node, context);
        patches.push(...childPatches);
      }
    }
    
    // Find new nodes
    for (const [key, newItem] of newKeyMap) {
      if (!oldKeyMap.has(key)) {
        patches.push({ type: 'CREATE', node: newItem.node, index: newItem.index });
      }
    }
    
    return patches;
  }
}

// Virtual DOM Renderer
class VDOMRenderer {
  private config: VDOMConfig;
  private cache: VDOMCacheManager;
  private differ: VDOMDiffer;
  private batchTimer: number | null = null;
  
  constructor(config: VDOMConfig) {
    this.config = config;
    this.cache = new VDOMCacheManager();
    this.differ = new VDOMDiffer(config);
  }
  
  render(component: any, props: Record<string, any>, context: RenderContext = { depth: 0, isVirtualized: false }): VNode {
    // Check cache first if memoization is enabled
    if (this.config.enableMemoization) {
      const cached = this.cache.get(component, props);
      if (cached) {
        return cached;
      }
    }
    
    // Render component
    const startTime = performance.now();
    let result: VNode;
    
    if (typeof component === 'function') {
      // Function component
      const rendered = component(props);
      result = this.normalizeVNode(rendered);
    } else {
      // Element
      result = {
        type: component,
        props: props || {},
        children: [],
        key: props?.key
      };
    }
    
    const renderTime = performance.now() - startTime;
    
    // Cache result if memoization is enabled
    if (this.config.enableMemoization) {
      this.cache.set(component, props, result);
    }
    
    return result;
  }
  
  private normalizeVNode(node: any): VNode {
    if (typeof node === 'string' || typeof node === 'number') {
      return {
        type: 'text',
        props: { value: node.toString() },
        children: []
      };
    }
    
    if (Array.isArray(node)) {
      return {
        type: 'fragment',
        props: {},
        children: node.map(child => this.normalizeVNode(child))
      };
    }
    
    if (node && typeof node === 'object' && node.type) {
      return {
        type: node.type,
        props: node.props || {},
        children: (node.children || []).map((child: any) => this.normalizeVNode(child)),
        key: node.key,
        ref: node.ref
      };
    }
    
    return {
      type: 'null',
      props: {},
      children: []
    };
  }
  
  applyPatches(patches: VDOMPatch[], target: Element): void {
    if (this.config.enableBatching) {
      this.batchPatches(patches, target);
    } else {
      this.applyPatchesSync(patches, target);
    }
  }
  
  private batchPatches(patches: VDOMPatch[], target: Element): void {
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Batch patches and apply after delay
    this.batchTimer = window.setTimeout(() => {
      this.applyPatchesSync(patches, target);
      this.batchTimer = null;
    }, 16); // ~60fps
  }
  
  private applyPatchesSync(patches: VDOMPatch[], target: Element): void {
    const startTime = performance.now();
    
    for (const patch of patches) {
      this.applyPatch(patch, target);
    }
    
    const patchTime = performance.now() - startTime;
  }
  
  private applyPatch(patch: VDOMPatch, target: Element): void {
    switch (patch.type) {
      case 'CREATE':
        if (patch.node) {
          const element = this.createDOMElement(patch.node);
          if (patch.index !== undefined) {
            const children = Array.from(target.children);
            if (patch.index < children.length) {
              target.insertBefore(element, children[patch.index]);
            } else {
              target.appendChild(element);
            }
          } else {
            target.appendChild(element);
          }
        }
        break;
        
      case 'UPDATE':
        if (patch.node && patch.props) {
          const element = target.children[patch.index || 0] as HTMLElement;
          if (element) {
            this.updateDOMElement(element, patch.props);
          }
        }
        break;
        
      case 'DELETE':
        if (patch.index !== undefined) {
          const element = target.children[patch.index];
          if (element) {
            target.removeChild(element);
          }
        }
        break;
        
      case 'REPLACE':
        if (patch.oldNode && patch.newNode && patch.index !== undefined) {
          const oldElement = target.children[patch.index];
          const newElement = this.createDOMElement(patch.newNode);
          if (oldElement) {
            target.replaceChild(newElement, oldElement);
          }
        }
        break;
        
      case 'REORDER':
        if (patch.node && patch.index !== undefined) {
          const element = this.findElementByKey(target, patch.node.key);
          if (element) {
            const children = Array.from(target.children);
            if (patch.index < children.length) {
              target.insertBefore(element, children[patch.index]);
            } else {
              target.appendChild(element);
            }
          }
        }
        break;
    }
  }
  
  private createDOMElement(vnode: VNode): Element {
    if (vnode.type === 'text') {
      return document.createTextNode(vnode.props.value) as any;
    }
    
    if (vnode.type === 'fragment') {
      const fragment = document.createDocumentFragment();
      vnode.children.forEach(child => {
        fragment.appendChild(this.createDOMElement(child));
      });
      return fragment as any;
    }
    
    const element = document.createElement(vnode.type as string);
    
    // Set attributes
    Object.entries(vnode.props).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key !== 'children' && key !== 'key' && key !== 'ref') {
        element.setAttribute(key, value);
      }
    });
    
    // Add children
    vnode.children.forEach(child => {
      element.appendChild(this.createDOMElement(child));
    });
    
    // Set key attribute for tracking
    if (vnode.key !== undefined) {
      element.setAttribute('data-key', vnode.key.toString());
    }
    
    return element;
  }
  
  private updateDOMElement(element: HTMLElement, props: Record<string, any>): void {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Remove old listeners and add new ones
        const eventName = key.slice(2).toLowerCase();
        const oldListener = (element as any)[`__${eventName}__`];
        if (oldListener) {
          element.removeEventListener(eventName, oldListener);
        }
        element.addEventListener(eventName, value);
        (element as any)[`__${eventName}__`] = value;
      } else if (key !== 'children' && key !== 'key' && key !== 'ref') {
        element.setAttribute(key, value);
      }
    });
  }
  
  private findElementByKey(parent: Element, key: string | number | undefined): Element | null {
    if (!key) return null;
    
    for (const child of Array.from(parent.children)) {
      if (child.getAttribute('data-key') === key.toString()) {
        return child;
      }
    }
    
    return null;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  getCacheStats() {
    return this.cache.getStats();
  }
}

// Main Virtual DOM Hook
export const useVirtualDOM = (initialConfig?: Partial<VDOMConfig>) => {
  const [state, setState] = useState<VDOMState>({
    tree: null,
    patches: [],
    isRendering: false,
    metrics: {
      renderTime: 0,
      diffTime: 0,
      patchTime: 0,
      nodesCreated: 0,
      nodesUpdated: 0,
      nodesDeleted: 0,
      batchesProcessed: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      virtualizedNodes: 0
    },
    cache: new Map(),
    memoizedComponents: new Map(),
    renderQueue: [],
    batchQueue: []
  });
  
  const [config, setConfig] = useState<VDOMConfig>({
    enableBatching: true,
    batchSize: 50,
    enableMemoization: true,
    enableLazyRendering: true,
    enableVirtualization: false,
    enableDiffOptimization: true,
    maxDepth: 10,
    updateThreshold: 16,
    ...initialConfig
  });
  
  const rendererRef = useRef<VDOMRenderer | null>(null);
  const metricsRef = useRef<VDOMMetrics>(state.metrics);
  
  // Initialize renderer
  useEffect(() => {
    rendererRef.current = new VDOMRenderer(config);
  }, [config]);
  
  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (rendererRef.current) {
        const cacheStats = rendererRef.current.getCacheStats();
        setState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            cacheHitRate: cacheStats.totalHits > 0 ? cacheStats.totalHits / (cacheStats.totalHits + cacheStats.size) : 0,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
          }
        }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const render = useCallback((component: any, props: Record<string, any>, target?: Element) => {
    if (!rendererRef.current) return;
    
    setState(prev => ({ ...prev, isRendering: true }));
    
    const startTime = performance.now();
    
    try {
      // Render new tree
      const newTree = rendererRef.current.render(component, props);
      
      // Diff with old tree
      const patches = rendererRef.current.differ.diff(state.tree, newTree);
      
      // Apply patches if target is provided
      if (target && patches.length > 0) {
        rendererRef.current.applyPatches(patches, target);
      }
      
      const renderTime = performance.now() - startTime;
      
      setState(prev => ({
        ...prev,
        tree: newTree,
        patches,
        isRendering: false,
        metrics: {
          ...prev.metrics,
          renderTime,
          nodesCreated: prev.metrics.nodesCreated + patches.filter(p => p.type === 'CREATE').length,
          nodesUpdated: prev.metrics.nodesUpdated + patches.filter(p => p.type === 'UPDATE').length,
          nodesDeleted: prev.metrics.nodesDeleted + patches.filter(p => p.type === 'DELETE').length
        }
      }));
      
      return newTree;
    } catch (error) {
      console.error('Virtual DOM render error:', error);
      setState(prev => ({ ...prev, isRendering: false }));
      throw error;
    }
  }, [state.tree]);
  
  const createElement = useCallback((type: string | Function, props: Record<string, any> = {}, ...children: any[]): VNode => {
    return {
      type,
      props: {
        ...props,
        children: children.flat()
      },
      children: children.flat().map(child => {
        if (typeof child === 'string' || typeof child === 'number') {
          return {
            type: 'text',
            props: { value: child.toString() },
            children: []
          };
        }
        return child;
      }),
      key: props.key,
      ref: props.ref
    };
  }, []);
  
  const memoize = useCallback((component: Function, areEqual?: (prevProps: any, nextProps: any) => boolean) => {
    return (props: any) => {
      const key = `${component.name}_${JSON.stringify(props)}`;
      const cached = state.memoizedComponents.get(key);
      
      if (cached) {
        if (!areEqual || areEqual(cached.props, props)) {
          return cached.result;
        }
      }
      
      const result = component(props);
      
      setState(prev => {
        const newMemoized = new Map(prev.memoizedComponents);
        newMemoized.set(key, { props, result });
        return { ...prev, memoizedComponents: newMemoized };
      });
      
      return result;
    };
  }, [state.memoizedComponents]);
  
  const batchUpdates = useCallback((updates: (() => void)[]) => {
    setState(prev => ({ ...prev, isRendering: true }));
    
    try {
      updates.forEach(update => update());
    } finally {
      setState(prev => ({ ...prev, isRendering: false }));
    }
  }, []);
  
  const clearCache = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.clearCache();
    }
    
    setState(prev => ({
      ...prev,
      cache: new Map(),
      memoizedComponents: new Map()
    }));
  }, []);
  
  const updateConfig = useCallback((newConfig: Partial<VDOMConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  const getMetrics = useCallback(() => {
    return {
      ...state.metrics,
      cacheSize: state.cache.size,
      memoizedComponents: state.memoizedComponents.size,
      queueSize: state.renderQueue.length
    };
  }, [state]);
  
  const exportData = useCallback(() => {
    return {
      config,
      metrics: getMetrics(),
      cacheStats: rendererRef.current?.getCacheStats()
    };
  }, [config, getMetrics]);
  
  const importData = useCallback((data: any) => {
    if (data.config) {
      setConfig(data.config);
    }
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.clearCache();
      }
    };
  }, []);
  
  return {
    state,
    config,
    actions: {
      render,
      createElement,
      memoize,
      batchUpdates,
      clearCache,
      updateConfig,
      getMetrics,
      exportData,
      importData
    }
  };
};

export type {
  VNode,
  VDOMPatch,
  VDOMConfig,
  VDOMMetrics,
  VDOMState,
  RenderContext
};

export { VDOMCacheManager, VDOMDiffer, VDOMRenderer };