/**
 * Effects Library for Video Projects
 * Provides visual effects, transitions, and animations
 */

export interface VideoEffect {
  id: string
  name: string
  description: string
  category: 'transition' | 'animation' | 'filter' | 'overlay' | 'particle'
  type: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'background'
  duration: number // in milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'
  properties: {
    [key: string]: any
  }
  preview?: string
  intensity: 'subtle' | 'moderate' | 'strong'
}

export interface EffectPreset {
  id: string
  name: string
  description: string
  effects: VideoEffect[]
  category: 'corporate' | 'creative' | 'educational' | 'cinematic'
}

class EffectsLibrary {
  private effects: VideoEffect[] = [
    // Transition Effects
    {
      id: 'fade-in',
      name: 'Fade In',
      description: 'Smooth fade in transition',
      category: 'transition',
      type: 'entrance',
      duration: 500,
      easing: 'ease-in-out',
      intensity: 'subtle',
      properties: {
        opacity: { from: 0, to: 1 }
      }
    },
    {
      id: 'slide-left',
      name: 'Slide from Left',
      description: 'Element slides in from the left',
      category: 'transition',
      type: 'entrance',
      duration: 600,
      easing: 'ease-out',
      intensity: 'moderate',
      properties: {
        transform: { from: 'translateX(-100%)', to: 'translateX(0)' }
      }
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      description: 'Element zooms in from center',
      category: 'animation',
      type: 'entrance',
      duration: 400,
      easing: 'ease-out',
      intensity: 'moderate',
      properties: {
        transform: { from: 'scale(0.8)', to: 'scale(1)' },
        opacity: { from: 0.8, to: 1 }
      }
    },
    {
      id: 'bounce-in',
      name: 'Bounce In',
      description: 'Playful bounce entrance effect',
      category: 'animation',
      type: 'entrance',
      duration: 800,
      easing: 'bounce',
      intensity: 'strong',
      properties: {
        transform: { from: 'scale(0.3)', to: 'scale(1)' },
        opacity: { from: 0, to: 1 }
      }
    },
    // Filter Effects
    {
      id: 'blur-focus',
      name: 'Blur to Focus',
      description: 'Transitions from blurred to sharp focus',
      category: 'filter',
      type: 'emphasis',
      duration: 1000,
      easing: 'ease-in-out',
      intensity: 'moderate',
      properties: {
        filter: { from: 'blur(10px)', to: 'blur(0px)' }
      }
    },
    {
      id: 'color-pop',
      name: 'Color Pop',
      description: 'Enhances color saturation dramatically',
      category: 'filter',
      type: 'emphasis',
      duration: 300,
      easing: 'ease-in-out',
      intensity: 'strong',
      properties: {
        filter: { from: 'saturate(1)', to: 'saturate(1.5) contrast(1.2)' }
      }
    },
    // Particle Effects
    {
      id: 'sparkle',
      name: 'Sparkle',
      description: 'Magical sparkle particles',
      category: 'particle',
      type: 'background',
      duration: 2000,
      easing: 'linear',
      intensity: 'moderate',
      properties: {
        particleCount: 50,
        particleSize: { min: 2, max: 6 },
        colors: ['#ffd700', '#ffed4e', '#fff'],
        movement: 'float'
      }
    },
    // Overlay Effects
    {
      id: 'gradient-overlay',
      name: 'Gradient Overlay',
      description: 'Smooth gradient overlay effect',
      category: 'overlay',
      type: 'background',
      duration: 1500,
      easing: 'ease-in-out',
      intensity: 'subtle',
      properties: {
        background: {
          from: 'linear-gradient(45deg, transparent, transparent)',
          to: 'linear-gradient(45deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))'
        }
      }
    }
  ]

  private presets: EffectPreset[] = [
    {
      id: 'corporate-smooth',
      name: 'Corporate Smooth',
      description: 'Professional and subtle effects for business presentations',
      category: 'corporate',
      effects: [
        this.effects.find(e => e.id === 'fade-in')!,
        this.effects.find(e => e.id === 'slide-left')!,
        this.effects.find(e => e.id === 'gradient-overlay')!
      ]
    },
    {
      id: 'creative-dynamic',
      name: 'Creative Dynamic',
      description: 'Bold and engaging effects for creative content',
      category: 'creative',
      effects: [
        this.effects.find(e => e.id === 'bounce-in')!,
        this.effects.find(e => e.id === 'color-pop')!,
        this.effects.find(e => e.id === 'sparkle')!
      ]
    },
    {
      id: 'educational-engaging',
      name: 'Educational Engaging',
      description: 'Friendly and attention-grabbing effects for learning content',
      category: 'educational',
      effects: [
        this.effects.find(e => e.id === 'zoom-in')!,
        this.effects.find(e => e.id === 'bounce-in')!,
        this.effects.find(e => e.id === 'blur-focus')!
      ]
    }
  ]

  getEffects(): VideoEffect[] {
    return this.effects
  }

  getEffectById(id: string): VideoEffect | undefined {
    return this.effects.find(effect => effect.id === id)
  }

  getEffectsByCategory(category: VideoEffect['category']): VideoEffect[] {
    return this.effects.filter(effect => effect.category === category)
  }

  getEffectsByType(type: VideoEffect['type']): VideoEffect[] {
    return this.effects.filter(effect => effect.type === type)
  }

  getPresets(): EffectPreset[] {
    return this.presets
  }

  getPresetById(id: string): EffectPreset | undefined {
    return this.presets.find(preset => preset.id === id)
  }

  getPresetsByCategory(category: EffectPreset['category']): EffectPreset[] {
    return this.presets.filter(preset => preset.category === category)
  }

  addEffect(effect: VideoEffect): void {
    this.effects.push(effect)
  }

  addPreset(preset: EffectPreset): void {
    this.presets.push(preset)
  }

  removeEffect(id: string): boolean {
    const index = this.effects.findIndex(effect => effect.id === id)
    if (index !== -1) {
      this.effects.splice(index, 1)
      return true
    }
    return false
  }

  removePreset(id: string): boolean {
    const index = this.presets.findIndex(preset => preset.id === id)
    if (index !== -1) {
      this.presets.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Apply effect to an element
   */
  applyEffect(element: HTMLElement, effectId: string): Promise<void> {
    const effect = this.getEffectById(effectId)
    if (!effect) {
      return Promise.reject(new Error(`Effect ${effectId} not found`))
    }

    return new Promise((resolve) => {
      const animation = element.animate(
        [
          this.convertPropertiesToKeyframe(effect.properties, 'from'),
          this.convertPropertiesToKeyframe(effect.properties, 'to')
        ],
        {
          duration: effect.duration,
          easing: effect.easing,
          fill: 'forwards'
        }
      )

      animation.onfinish = () => resolve()
    })
  }

  private convertPropertiesToKeyframe(properties: any, direction: 'from' | 'to'): any {
    const keyframe: any = {}
    
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'object' && value !== null && direction in value) {
        keyframe[key] = (value as any)[direction]
      }
    }
    
    return keyframe
  }
}

export const effectsLibrary = new EffectsLibrary()
export default effectsLibrary