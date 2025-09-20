import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { 
  Project, 
  Slide, 
  Element, 
  EditorState, 
  HistoryEntry,
  Position
} from '../types'

interface EditorStore extends EditorState {
  // Actions para projeto
  setProject: (project: Project | null) => void
  updateProject: (updates: Partial<Project>) => void
  
  // Actions para slides
  setCurrentSlideIndex: (index: number) => void
  addSlide: (slide: Omit<Slide, 'id' | 'createdAt'>) => void
  updateSlide: (slideId: string, updates: Partial<Slide>) => void
  deleteSlide: (slideId: string) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  
  // Actions para elementos
  addElement: (slideId: string, elementData: Partial<Element>) => void
  updateElement: (elementId: string, updates: Partial<Element>) => void
  deleteElement: (elementId: string) => void
  duplicateElement: (elementId: string) => void
  
  // Actions para seleção
  selectElement: (elementId: string) => void
  selectMultiple: (elementIds: string[]) => void
  deselectElement: (elementId: string) => void
  clearSelection: () => void
  
  // Actions para clipboard
  copyElements: (elementIds: string[]) => void
  pasteElements: () => void
  
  // Actions para histórico
  addHistoryEntry: (action: 'add' | 'update' | 'delete' | 'move' | 'duplicate', elementId?: string, beforeState?: any, afterState?: any) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
  
  // Actions para reprodução
  play: () => void
  pause: () => void
  stop: () => void
  setPlaybackTime: (time: number) => void
  
  // Actions para visualização
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  toggleSnapToGrid: () => void
  
  // Actions para posicionamento
  moveElement: (elementId: string, position: Position) => void
  resizeElement: (elementId: string, width: number, height: number) => void
  rotateElement: (elementId: string, rotation: number) => void
  
  // Actions para camadas
  bringToFront: (elementId: string) => void
  sendToBack: (elementId: string) => void
  bringForward: (elementId: string) => void
  sendBackward: (elementId: string) => void
}

export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Estado inicial
      project: null,
      currentSlideIndex: 0,
      selectedElementIds: [],
      clipboard: [],
      history: [],
      historyIndex: -1,
      isPlaying: false,
      playbackTime: 0,
      zoomLevel: 1.0,
      viewMode: 'design' as const,
      gridEnabled: true,
      snapEnabled: true,

      // Actions para projeto
      setProject: (project) => {
        set({ project: project }, false, 'setProject')
      },

      updateProject: (updates) => {
        const { project } = get()
        if (!project) return
        
        const updatedProject = { ...project, ...updates }
        set({ project: updatedProject }, false, 'updateProject')
      },

      // Actions para slides
      setCurrentSlideIndex: (index) => {
        set({ 
          currentSlideIndex: index,
          selectedElementIds: [],
          playbackTime: 0
        }, false, 'setCurrentSlideIndex')
      },

      addSlide: (slideData) => {
        const { project } = get()
        if (!project) return

        const newSlide: Slide = {
          ...slideData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          elements: []
        }

        const updatedProject = {
          ...project,
          slides: [...(project.slides || []), newSlide]
        }

        set({ 
          project: updatedProject
        }, false, 'addSlide')
        
        get().addHistoryEntry('add', newSlide.id, newSlide)
      },

      updateSlide: (slideId, updates) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const updatedSlides = project.slides.map(slide => 
          slide.id === slideId ? { ...slide, ...updates } : slide
        )

        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        const currentSlide = project.slides[currentSlideIndex]
        const updatedCurrentSlide = currentSlide?.id === slideId
          ? { ...currentSlide, ...updates }
          : currentSlide

        set({ 
          project: updatedProject
        }, false, 'updateSlide')
        
        get().addHistoryEntry('update', slideId, updates)
      },

      deleteSlide: (slideId) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const updatedSlides = project.slides.filter(slide => slide.id !== slideId)
        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        const currentSlide = project.slides[currentSlideIndex]
        const newCurrentSlide = currentSlide?.id === slideId 
          ? (updatedSlides[0] || null)
          : currentSlide

        set({ 
          project: updatedProject,
          selectedElementIds: []
        }, false, 'deleteSlide')
        
        get().addHistoryEntry('delete', slideId)
      },

      reorderSlides: (fromIndex, toIndex) => {
        const { project } = get()
        if (!project?.slides) return

        const slides = [...project.slides]
        const [movedSlide] = slides.splice(fromIndex, 1)
        slides.splice(toIndex, 0, movedSlide)

        // Atualizar orderIndex
        const updatedSlides = slides.map((slide, index) => ({
          ...slide,
          orderIndex: index
        }))

        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        set({ project: updatedProject }, false, 'reorderSlides')
        get().addHistoryEntry('update', undefined, { fromIndex, toIndex })
      },

      // Actions para elementos
      addElement: (slideId, elementData) => {
        const { project } = get()
        if (!project?.slides) return

        const defaultProperties = {
          width: 200,
          height: 100,
          opacity: 1,
          rotation: 0
        }

        const newElement: Element = {
          id: crypto.randomUUID(),
          slideId,
          type: elementData.type || 'text',
          properties: elementData.properties || defaultProperties,
          position: elementData.position || { x: 100, y: 100 },
          animations: elementData.animations || [],
          zIndex: 0,
          createdAt: new Date().toISOString(),
          ...elementData
        }

        const updatedSlides = project.slides.map(slide => {
          if (slide.id === slideId) {
            return {
              ...slide,
              elements: [...slide.elements, newElement]
            }
          }
          return slide
        })

        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        set({ project: updatedProject }, false, 'addElement')
        get().addHistoryEntry('add', slideId, null, newElement)
      },

      updateElement: (elementId, updates) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const updatedSlides = project.slides.map((slide, index) => {
          if (index === currentSlideIndex) {
            return {
              ...slide,
              elements: slide.elements.map(element => 
                element.id === elementId ? { ...element, ...updates } : element
              )
            }
          }
          return slide
        })

        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        set({ project: updatedProject }, false, 'updateElement')
        get().addHistoryEntry('update', elementId, null, updates)
      },

      deleteElement: (elementId) => {
        const { project, currentSlideIndex, selectedElementIds } = get()
        if (!project?.slides) return

        const updatedSlides = project.slides.map((slide, index) => {
          if (index === currentSlideIndex) {
            return {
              ...slide,
              elements: slide.elements.filter(element => element.id !== elementId)
            }
          }
          return slide
        })

        const updatedSelectedElements = selectedElementIds.filter(id => id !== elementId)
        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        set({ 
          project: updatedProject,
          selectedElementIds: updatedSelectedElements 
        }, false, 'deleteElement')
        get().addHistoryEntry('delete', elementId, null, null)
      },

      duplicateElement: (elementId) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        const element = currentSlide.elements.find(el => el.id === elementId)
        if (!element) return

        const duplicatedElement = {
          ...element,
          id: crypto.randomUUID(),
          position: {
            ...element.position,
            x: element.position.x + 20,
            y: element.position.y + 20
          }
        }

        const updatedSlides = project.slides.map((slide, index) => {
          if (index === currentSlideIndex) {
            return {
              ...slide,
              elements: [...slide.elements, duplicatedElement]
            }
          }
          return slide
        })

        const updatedProject = {
          ...project,
          slides: updatedSlides
        }

        set({ project: updatedProject }, false, 'duplicateElement')
        get().selectElement(duplicatedElement.id)
        get().addHistoryEntry('duplicate', elementId, null, duplicatedElement)
      },

      // Actions para seleção
      selectElement: (elementId) => {
        set({ selectedElementIds: [elementId] }, false, 'selectElement')
      },

      selectMultiple: (elementIds) => {
          set({ selectedElementIds: elementIds }, false, 'selectMultiple')
        },

      deselectElement: (elementId) => {
        const { selectedElementIds } = get()
        set({ 
          selectedElementIds: selectedElementIds.filter(id => id !== elementId) 
        }, false, 'deselectElement')
      },

      clearSelection: () => {
        set({ selectedElementIds: [] }, false, 'clearSelection')
      },

      // Actions para clipboard
      copyElements: (elementIds) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        const elementsToCopy = currentSlide.elements.filter((element: Element) => 
          elementIds.includes(element.id)
        )

        set({ clipboard: elementsToCopy }, false, 'copyElements')
      },

      pasteElements: () => {
        const { clipboard, project, currentSlideIndex } = get()
        if (clipboard.length === 0 || !project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        clipboard.forEach((element: Element) => {
          const pastedElement = {
            ...element,
            id: crypto.randomUUID(),
            slideId: currentSlide.id,
            position: {
              ...element.position,
              x: element.position.x + 20,
              y: element.position.y + 20
            },
            createdAt: new Date().toISOString()
          }
          get().addElement(currentSlide.id, pastedElement)
        })
      },

      // Actions para histórico
      addHistoryEntry: (action, elementId, beforeState, afterState) => {
        const { history, historyIndex } = get()
        
        const newEntry: HistoryEntry = {
          id: crypto.randomUUID(),
          action,
          elementId,
          beforeState,
          afterState,
          timestamp: new Date().toISOString()
        }

        // Remove entradas futuras se estamos no meio do histórico
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newEntry)

        // Limita o histórico a 100 entradas
        if (newHistory.length > 100) {
          newHistory.shift()
        }

        set({ 
          history: newHistory,
          historyIndex: newHistory.length - 1
        }, false, 'addHistoryEntry')
      },

      undo: () => {
        const { history, historyIndex, project, currentSlideIndex } = get()
        
        if (historyIndex >= 0 && project) {
          const entry = history[historyIndex]
          
          if (entry.elementId && entry.beforeState && project.slides) {
            const currentSlide = project.slides[currentSlideIndex]
            if (currentSlide) {
              const elementIndex = currentSlide.elements.findIndex(el => el.id === entry.elementId)
              if (elementIndex !== -1) {
                const updatedSlides = [...project.slides]
                updatedSlides[currentSlideIndex] = {
                  ...currentSlide,
                  elements: [
                    ...currentSlide.elements.slice(0, elementIndex),
                    { ...currentSlide.elements[elementIndex], ...entry.beforeState },
                    ...currentSlide.elements.slice(elementIndex + 1)
                  ]
                }
                
                set({ 
                  project: { ...project, slides: updatedSlides },
                  historyIndex: historyIndex - 1 
                }, false, 'undo')
              }
            }
          }
        }
      },

      redo: () => {
        const { history, historyIndex, project, currentSlideIndex } = get()
        
        if (historyIndex < history.length - 1 && project) {
          const entry = history[historyIndex + 1]
          
          if (entry.elementId && entry.afterState && project.slides) {
            const currentSlide = project.slides[currentSlideIndex]
            if (currentSlide) {
              const elementIndex = currentSlide.elements.findIndex(el => el.id === entry.elementId)
              if (elementIndex !== -1) {
                const updatedSlides = [...project.slides]
                updatedSlides[currentSlideIndex] = {
                  ...currentSlide,
                  elements: [
                    ...currentSlide.elements.slice(0, elementIndex),
                    { ...currentSlide.elements[elementIndex], ...entry.afterState },
                    ...currentSlide.elements.slice(elementIndex + 1)
                  ]
                }
                
                set({ 
                  project: { ...project, slides: updatedSlides },
                  historyIndex: historyIndex + 1 
                }, false, 'redo')
              }
            }
          }
        }
      },

      clearHistory: () => {
        set({ history: [], historyIndex: -1 }, false, 'clearHistory')
      },

      // Actions para reprodução
      play: () => {
        set({ isPlaying: true }, false, 'play')
      },

      pause: () => {
        set({ isPlaying: false }, false, 'pause')
      },

      stop: () => {
        set({ isPlaying: false, playbackTime: 0 }, false, 'stop')
      },

      setPlaybackTime: (time) => {
        set({ playbackTime: time }, false, 'setPlaybackTime')
      },

      // Actions para visualização
      setZoom: (zoom) => {
        const clampedZoom = Math.max(0.1, Math.min(5.0, zoom))
        set({ zoomLevel: clampedZoom }, false, 'setZoom')
      },

      toggleGrid: () => {
        set(state => ({ gridEnabled: !state.gridEnabled }), false, 'toggleGrid')
      },

      toggleSnapToGrid: () => {
        set(state => ({ snapEnabled: !state.snapEnabled }), false, 'toggleSnapToGrid')
      },

      // Actions para posicionamento
      moveElement: (elementId, position) => {
        get().updateElement(elementId, { position })
      },

      resizeElement: (elementId, width, height) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return
        
        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return
        
        const element = currentSlide.elements.find((el: Element) => el.id === elementId)
        if (element) {
          get().updateElement(elementId, { 
            properties: { 
              ...element.properties,
              width, 
              height 
            }
          })
        }
      },

      rotateElement: (elementId, rotation) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return
        
        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return
        
        const element = currentSlide.elements.find((el: Element) => el.id === elementId)
        if (element) {
          get().updateElement(elementId, { 
            properties: { 
              ...element.properties,
              rotation 
            }
          })
        }
      },

      // Actions para camadas
      bringToFront: (elementId: string) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        const maxZIndex = Math.max(...currentSlide.elements.map((el: Element) => el.zIndex))
        get().updateElement(elementId, { zIndex: maxZIndex + 1 })
      },

      sendToBack: (elementId: string) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        const minZIndex = Math.min(...currentSlide.elements.map((el: Element) => el.zIndex))
        get().updateElement(elementId, { zIndex: minZIndex - 1 })
      },

      bringForward: (elementId: string) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        const element = currentSlide.elements.find((el: Element) => el.id === elementId)
        if (element) {
          get().updateElement(elementId, { zIndex: element.zIndex + 1 })
        }
      },

      sendBackward: (elementId: string) => {
        const { project, currentSlideIndex } = get()
        if (!project?.slides) return

        const currentSlide = project.slides[currentSlideIndex]
        if (!currentSlide) return

        const element = currentSlide.elements.find((el: Element) => el.id === elementId)
        if (element) {
          get().updateElement(elementId, { zIndex: element.zIndex - 1 })
        }
      }
    })),
    {
      name: 'editor-store'
    }
  )
)

// Seletores
export const useCurrentProject = () => useEditorStore(state => state.project)
export const useCurrentSlide = () => useEditorStore(state => {
  const { project, currentSlideIndex } = state
  return project?.slides?.[currentSlideIndex]
})
export const useSelectedElements = () => useEditorStore(state => {
  const { project, currentSlideIndex, selectedElementIds } = state
  const currentSlide = project?.slides?.[currentSlideIndex]
  return currentSlide?.elements.filter(el => selectedElementIds.includes(el.id)) || []
})
export const useEditorState = () => useEditorStore(state => ({
  isPlaying: state.isPlaying,
  playbackTime: state.playbackTime,
  zoomLevel: state.zoomLevel,
  viewMode: state.viewMode,
  gridEnabled: state.gridEnabled,
  snapEnabled: state.snapEnabled
}))
export const useCanUndo = () => useEditorStore(state => state.historyIndex >= 0)
export const useCanRedo = () => useEditorStore(state => state.historyIndex < state.history.length - 1)