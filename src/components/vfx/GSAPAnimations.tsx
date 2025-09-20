import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'entrada' | 'saida' | 'texto' | 'objeto' | 'transicao';
  duration: number;
  easing: string;
  preview: string;
}

const animationTemplates: AnimationTemplate[] = [
  {
    id: 'fadeIn',
    name: 'Fade In',
    description: 'Aparição suave com opacidade',
    category: 'entrada',
    duration: 1,
    easing: 'power2.out',
    preview: 'opacity: 0 → 1'
  },
  {
    id: 'slideInLeft',
    name: 'Slide In Left',
    description: 'Entrada deslizando da esquerda',
    category: 'entrada',
    duration: 0.8,
    easing: 'back.out(1.7)',
    preview: 'x: -100 → 0'
  },
  {
    id: 'bounceIn',
    name: 'Bounce In',
    description: 'Entrada com efeito de salto',
    category: 'entrada',
    duration: 1.2,
    easing: 'bounce.out',
    preview: 'scale: 0 → 1.1 → 1'
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Texto aparecendo letra por letra',
    category: 'texto',
    duration: 2,
    easing: 'none',
    preview: 'chars reveal progressively'
  },
  {
    id: 'rotateIn',
    name: 'Rotate In',
    description: 'Entrada com rotação',
    category: 'entrada',
    duration: 1,
    easing: 'power3.out',
    preview: 'rotation: 180 → 0'
  },
  {
    id: 'scaleUp',
    name: 'Scale Up',
    description: 'Crescimento suave',
    category: 'objeto',
    duration: 0.6,
    easing: 'power2.out',
    preview: 'scale: 0.8 → 1'
  },
  {
    id: 'slideOut',
    name: 'Slide Out',
    description: 'Saída deslizando para direita',
    category: 'saida',
    duration: 0.5,
    easing: 'power2.in',
    preview: 'x: 0 → 100'
  },
  {
    id: 'morphTransition',
    name: 'Morph Transition',
    description: 'Transição com deformação',
    category: 'transicao',
    duration: 1.5,
    easing: 'elastic.out(1, 0.3)',
    preview: 'shape morphing'
  }
];

interface GSAPAnimationsProps {
  onAnimationSelect?: (animation: AnimationTemplate) => void;
  targetElement?: HTMLElement | null;
}

export const GSAPAnimations: React.FC<GSAPAnimationsProps> = ({
  onAnimationSelect,
  targetElement
}) => {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationTemplate | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState([1]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const previewRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const categories = ['all', 'entrada', 'saida', 'texto', 'objeto', 'transicao'];

  const filteredAnimations = selectedCategory === 'all' 
    ? animationTemplates 
    : animationTemplates.filter(anim => anim.category === selectedCategory);

  const playAnimation = (animation: AnimationTemplate, element?: HTMLElement) => {
    const target = element || previewRef.current;
    if (!target) return;

    // Kill existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Reset element
    gsap.set(target, { clearProps: 'all' });

    // Create new timeline
    timelineRef.current = gsap.timeline({
      onComplete: () => setIsPlaying(false)
    });

    const tl = timelineRef.current;
    const animDuration = duration[0];

    switch (animation.id) {
      case 'fadeIn':
        gsap.set(target, { opacity: 0 });
        tl.to(target, { opacity: 1, duration: animDuration, ease: animation.easing });
        break;

      case 'slideInLeft':
        gsap.set(target, { x: -100, opacity: 0 });
        tl.to(target, { x: 0, opacity: 1, duration: animDuration, ease: animation.easing });
        break;

      case 'bounceIn':
        gsap.set(target, { scale: 0, opacity: 0 });
        tl.to(target, { scale: 1.1, opacity: 1, duration: animDuration * 0.6, ease: 'power2.out' })
          .to(target, { scale: 1, duration: animDuration * 0.4, ease: 'bounce.out' });
        break;

      case 'typewriter':
        if (target.textContent) {
          const text = target.textContent;
          target.textContent = '';
          tl.to({}, {
            duration: animDuration,
            ease: 'none',
            onUpdate: function() {
              const progress = this.progress();
              const currentLength = Math.floor(text.length * progress);
              target.textContent = text.substring(0, currentLength) + (progress < 1 ? '|' : '');
            }
          });
        }
        break;

      case 'rotateIn':
        gsap.set(target, { rotation: 180, opacity: 0 });
        tl.to(target, { rotation: 0, opacity: 1, duration: animDuration, ease: animation.easing });
        break;

      case 'scaleUp':
        gsap.set(target, { scale: 0.8, opacity: 0.8 });
        tl.to(target, { scale: 1, opacity: 1, duration: animDuration, ease: animation.easing });
        break;

      case 'slideOut':
        tl.to(target, { x: 100, opacity: 0, duration: animDuration, ease: animation.easing });
        break;

      case 'morphTransition':
        tl.to(target, { 
          scaleX: 1.2, 
          scaleY: 0.8, 
          duration: animDuration * 0.3, 
          ease: 'power2.out' 
        })
        .to(target, { 
          scaleX: 0.9, 
          scaleY: 1.1, 
          duration: animDuration * 0.4, 
          ease: 'power2.inOut' 
        })
        .to(target, { 
          scaleX: 1, 
          scaleY: 1, 
          duration: animDuration * 0.3, 
          ease: animation.easing 
        });
        break;

      default:
        tl.to(target, { opacity: 1, duration: animDuration });
    }

    setIsPlaying(true);
  };

  const resetPreview = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    if (previewRef.current) {
      gsap.set(previewRef.current, { clearProps: 'all' });
    }
    setIsPlaying(false);
  };

  const handleAnimationSelect = (animation: AnimationTemplate) => {
    setSelectedAnimation(animation);
    setDuration([animation.duration]);
    onAnimationSelect?.(animation);
  };

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎬</span>
            GSAP Animation Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Categoria:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Todas' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Animation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnimations.map(animation => (
              <Card 
                key={animation.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAnimation?.id === animation.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleAnimationSelect(animation)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{animation.name}</h3>
                    <p className="text-sm text-gray-600">{animation.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Categoria: {animation.category}</span>
                      <span>Duração: {animation.duration}s</span>
                    </div>
                    <div className="text-xs bg-gray-100 p-2 rounded">
                      {animation.preview}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {selectedAnimation && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {selectedAnimation.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Duration Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração: {duration[0]}s</label>
              <Slider
                value={duration}
                onValueChange={setDuration}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Preview Element */}
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <div 
                ref={previewRef}
                className="w-20 h-20 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold"
              >
                {selectedAnimation.category === 'texto' ? 'Texto Exemplo' : 'VFX'}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => playAnimation(selectedAnimation)}
                disabled={isPlaying}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {isPlaying ? 'Reproduzindo...' : 'Reproduzir'}
              </Button>
              <Button
                onClick={resetPreview}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            {/* Apply to Target */}
            {targetElement && (
              <Button
                onClick={() => playAnimation(selectedAnimation, targetElement)}
                className="w-full"
                variant="default"
              >
                Aplicar ao Elemento Selecionado
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GSAPAnimations;