/**
 * Sistema de animações e transições para PPTX
 */
class PPTXAnimationManager {
    constructor(config = {}) {
        // Configurações padrão
        this.maxDuration = config.maxDuration || 60; // segundos
        this.fps = config.fps || 60;
        this.defaultEasing = config.defaultEasing || 'easeOutCubic';
        this.preloadAnimations = config.preloadAnimations !== false;
        
        // Estado interno
        this.animations = new Map();
        this.transitions = new Map();
        this.easingFunctions = this.initializeEasingFunctions();
        this.templates = this.initializeTemplates();
        this.currentAnimations = new Set();
        this.animationFrame = null;
        this.lastFrameTime = 0;
        
        // Inicializa sistemas
        this.initializeDefaultAnimations();
        this.initializeDefaultTransitions();
    }

    /**
     * Inicializa funções de easing
     */
    initializeEasingFunctions() {
        return {
            // Linear
            linear: t => t,
            
            // Quad
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            
            // Cubic
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            
            // Quart
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            
            // Elastic
            easeInElastic: t => {
                if (t === 0 || t === 1) return t;
                return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
            },
            easeOutElastic: t => {
                if (t === 0 || t === 1) return t;
                return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
            },
            
            // Bounce
            easeInBounce: t => 1 - this.easingFunctions.easeOutBounce(1 - t),
            easeOutBounce: t => {
                if (t < (1/2.75)) {
                    return 7.5625 * t * t;
                } else if (t < (2/2.75)) {
                    return 7.5625 * (t -= (1.5/2.75)) * t + 0.75;
                } else if (t < (2.5/2.75)) {
                    return 7.5625 * (t -= (2.25/2.75)) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= (2.625/2.75)) * t + 0.984375;
                }
            }
        };
    }

    /**
     * Inicializa templates de animação
     */
    initializeTemplates() {
        return {
            // Entrada
            fadeIn: {
                duration: 1,
                properties: {
                    opacity: { from: 0, to: 1 }
                }
            },
            
            slideIn: (direction) => ({
                duration: 1,
                properties: {
                    opacity: { from: 0, to: 1 },
                    transform: {
                        from: this.getDirectionOffset(direction, 100),
                        to: { x: 0, y: 0 }
                    }
                }
            }),
            
            zoomIn: {
                duration: 1,
                properties: {
                    opacity: { from: 0, to: 1 },
                    scale: { from: 0.5, to: 1 }
                }
            },
            
            // Ênfase
            pulse: {
                duration: 0.5,
                properties: {
                    scale: {
                        keyframes: [
                            { time: 0, value: 1 },
                            { time: 0.5, value: 1.1 },
                            { time: 1, value: 1 }
                        ]
                    }
                }
            },
            
            shake: {
                duration: 0.8,
                properties: {
                    transform: {
                        keyframes: [
                            { time: 0, value: { x: 0, y: 0 } },
                            { time: 0.2, value: { x: -10, y: 0 } },
                            { time: 0.4, value: { x: 10, y: 0 } },
                            { time: 0.6, value: { x: -10, y: 0 } },
                            { time: 0.8, value: { x: 10, y: 0 } },
                            { time: 1, value: { x: 0, y: 0 } }
                        ]
                    }
                }
            },
            
            // Saída
            fadeOut: {
                duration: 1,
                properties: {
                    opacity: { from: 1, to: 0 }
                }
            },
            
            slideOut: (direction) => ({
                duration: 1,
                properties: {
                    opacity: { from: 1, to: 0 },
                    transform: {
                        from: { x: 0, y: 0 },
                        to: this.getDirectionOffset(direction, 100)
                    }
                }
            }),
            
            zoomOut: {
                duration: 1,
                properties: {
                    opacity: { from: 1, to: 0 },
                    scale: { from: 1, to: 0.5 }
                }
            }
        };
    }

    /**
     * Inicializa animações padrão
     */
    initializeDefaultAnimations() {
        // Entrada
        this.createAnimation('fadeIn', this.templates.fadeIn);
        ['left', 'right', 'top', 'bottom'].forEach(direction => {
            this.createAnimation(\`slideIn\${direction.charAt(0).toUpperCase() + direction.slice(1)}\`,
                               this.templates.slideIn(direction));
        });
        this.createAnimation('zoomIn', this.templates.zoomIn);
        
        // Ênfase
        this.createAnimation('pulse', this.templates.pulse);
        this.createAnimation('shake', this.templates.shake);
        
        // Saída
        this.createAnimation('fadeOut', this.templates.fadeOut);
        ['left', 'right', 'top', 'bottom'].forEach(direction => {
            this.createAnimation(\`slideOut\${direction.charAt(0).toUpperCase() + direction.slice(1)}\`,
                               this.templates.slideOut(direction));
        });
        this.createAnimation('zoomOut', this.templates.zoomOut);
    }

    /**
     * Inicializa transições padrão
     */
    initializeDefaultTransitions() {
        // Fade
        this.createTransition('fade', {
            duration: 1,
            properties: {
                opacity: { from: 1, to: 0 }
            }
        });
        
        // Push
        ['left', 'right', 'top', 'bottom'].forEach(direction => {
            this.createTransition(\`push\${direction.charAt(0).toUpperCase() + direction.slice(1)}\`, {
                duration: 1,
                properties: {
                    transform: {
                        from: { x: 0, y: 0 },
                        to: this.getDirectionOffset(direction, 100)
                    }
                }
            });
        });
        
        // Reveal
        ['left', 'right', 'top', 'bottom'].forEach(direction => {
            this.createTransition(\`reveal\${direction.charAt(0).toUpperCase() + direction.slice(1)}\`, {
                duration: 1,
                properties: {
                    clip: {
                        from: { x: 0, y: 0, width: '100%', height: '100%' },
                        to: this.getDirectionClip(direction)
                    }
                }
            });
        });
    }

    /**
     * Cria nova animação
     */
    createAnimation(name, config) {
        this.validateAnimationConfig(config);
        this.animations.set(name, {
            ...config,
            easing: config.easing || this.defaultEasing
        });
    }

    /**
     * Cria nova transição
     */
    createTransition(name, config) {
        this.validateTransitionConfig(config);
        this.transitions.set(name, {
            ...config,
            easing: config.easing || this.defaultEasing
        });
    }

    /**
     * Valida configuração de animação
     */
    validateAnimationConfig(config) {
        if (!config.duration || config.duration > this.maxDuration) {
            throw new Error(\`Duração inválida: deve ser maior que 0 e menor que \${this.maxDuration}s\`);
        }

        if (config.properties) {
            Object.values(config.properties).forEach(prop => {
                if (prop.keyframes) {
                    this.validateKeyframes(prop.keyframes);
                } else {
                    if (prop.from === undefined || prop.to === undefined) {
                        throw new Error('Propriedades de animação devem ter valores "from" e "to"');
                    }
                }
            });
        }
    }

    /**
     * Valida configuração de transição
     */
    validateTransitionConfig(config) {
        if (!config.duration || config.duration > this.maxDuration) {
            throw new Error(\`Duração inválida: deve ser maior que 0 e menor que \${this.maxDuration}s\`);
        }

        if (!config.properties) {
            throw new Error('Transição deve ter pelo menos uma propriedade');
        }
    }

    /**
     * Valida keyframes
     */
    validateKeyframes(keyframes) {
        if (!Array.isArray(keyframes) || keyframes.length < 2) {
            throw new Error('Keyframes devem ter pelo menos 2 pontos');
        }

        keyframes.forEach(frame => {
            if (frame.time === undefined || frame.value === undefined) {
                throw new Error('Keyframe deve ter tempo e valor');
            }
            if (frame.time < 0 || frame.time > 1) {
                throw new Error('Tempo do keyframe deve estar entre 0 e 1');
            }
        });
    }

    /**
     * Obtém offset baseado na direção
     */
    getDirectionOffset(direction, distance) {
        switch (direction) {
            case 'left':
                return { x: -distance, y: 0 };
            case 'right':
                return { x: distance, y: 0 };
            case 'top':
                return { x: 0, y: -distance };
            case 'bottom':
                return { x: 0, y: distance };
            default:
                throw new Error(\`Direção inválida: \${direction}\`);
        }
    }

    /**
     * Obtém clip baseado na direção
     */
    getDirectionClip(direction) {
        switch (direction) {
            case 'left':
                return { x: '100%', y: 0, width: 0, height: '100%' };
            case 'right':
                return { x: 0, y: 0, width: 0, height: '100%' };
            case 'top':
                return { x: 0, y: '100%', height: 0, width: '100%' };
            case 'bottom':
                return { x: 0, y: 0, height: 0, width: '100%' };
            default:
                throw new Error(\`Direção inválida: \${direction}\`);
        }
    }

    /**
     * Aplica animação a um elemento
     */
    applyAnimation(element, animationName, options = {}) {
        const animation = this.animations.get(animationName);
        if (!animation) {
            throw new Error(\`Animação não encontrada: \${animationName}\`);
        }

        const config = {
            ...animation,
            ...options,
            element,
            startTime: Date.now(),
            progress: 0
        };

        this.currentAnimations.add(config);
        this.startAnimationLoop();

        return new Promise(resolve => {
            config.onComplete = resolve;
        });
    }

    /**
     * Aplica transição entre slides
     */
    applyTransition(fromSlide, toSlide, transitionName, options = {}) {
        const transition = this.transitions.get(transitionName);
        if (!transition) {
            throw new Error(\`Transição não encontrada: \${transitionName}\`);
        }

        const config = {
            ...transition,
            ...options,
            fromSlide,
            toSlide,
            startTime: Date.now(),
            progress: 0
        };

        this.currentAnimations.add(config);
        this.startAnimationLoop();

        return new Promise(resolve => {
            config.onComplete = resolve;
        });
    }

    /**
     * Inicia loop de animação
     */
    startAnimationLoop() {
        if (this.animationFrame) return;

        const animate = (timestamp) => {
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            // Atualiza animações ativas
            for (const animation of this.currentAnimations) {
                const elapsed = timestamp - animation.startTime;
                animation.progress = Math.min(elapsed / (animation.duration * 1000), 1);

                if (animation.fromSlide && animation.toSlide) {
                    this.updateTransition(animation);
                } else {
                    this.updateAnimation(animation);
                }

                if (animation.progress >= 1) {
                    this.currentAnimations.delete(animation);
                    if (animation.onComplete) {
                        animation.onComplete();
                    }
                }
            }

            // Continua loop se houver animações ativas
            if (this.currentAnimations.size > 0) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.animationFrame = null;
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * Atualiza estado de animação
     */
    updateAnimation(animation) {
        const { element, properties, progress, easing } = animation;
        const easingFunction = this.easingFunctions[easing];
        const easedProgress = easingFunction(progress);

        Object.entries(properties).forEach(([property, config]) => {
            if (config.keyframes) {
                const value = this.interpolateKeyframes(config.keyframes, easedProgress);
                this.applyPropertyValue(element, property, value);
            } else {
                const value = this.interpolateValue(config.from, config.to, easedProgress);
                this.applyPropertyValue(element, property, value);
            }
        });
    }

    /**
     * Atualiza estado de transição
     */
    updateTransition(transition) {
        const { fromSlide, toSlide, properties, progress, easing } = transition;
        const easingFunction = this.easingFunctions[easing];
        const easedProgress = easingFunction(progress);

        Object.entries(properties).forEach(([property, config]) => {
            if (property === 'clip') {
                this.applyClipTransition(fromSlide, toSlide, config, easedProgress);
            } else {
                const fromValue = this.interpolateValue(config.from, config.to, easedProgress);
                const toValue = this.interpolateValue(config.to, config.from, 1 - easedProgress);
                
                this.applyPropertyValue(fromSlide, property, fromValue);
                this.applyPropertyValue(toSlide, property, toValue);
            }
        });
    }

    /**
     * Interpola valores
     */
    interpolateValue(from, to, progress) {
        if (typeof from === 'number' && typeof to === 'number') {
            return from + (to - from) * progress;
        }
        
        if (typeof from === 'object' && typeof to === 'object') {
            const result = {};
            Object.keys(from).forEach(key => {
                result[key] = this.interpolateValue(from[key], to[key], progress);
            });
            return result;
        }
        
        return progress < 0.5 ? from : to;
    }

    /**
     * Interpola keyframes
     */
    interpolateKeyframes(keyframes, progress) {
        // Encontra keyframes relevantes
        let start = keyframes[0];
        let end = keyframes[keyframes.length - 1];
        
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (keyframes[i].time <= progress && keyframes[i + 1].time >= progress) {
                start = keyframes[i];
                end = keyframes[i + 1];
                break;
            }
        }

        // Calcula progresso local
        const localProgress = (progress - start.time) / (end.time - start.time);
        return this.interpolateValue(start.value, end.value, localProgress);
    }

    /**
     * Aplica valor de propriedade ao elemento
     */
    applyPropertyValue(element, property, value) {
        switch (property) {
            case 'opacity':
                element.style.opacity = value;
                break;
                
            case 'transform':
                element.style.transform = this.generateTransform(value);
                break;
                
            case 'scale':
                element.style.transform = \`scale(\${value})\`;
                break;
                
            case 'clip':
                element.style.clip = this.generateClip(value);
                break;
        }
    }

    /**
     * Gera string de transformação CSS
     */
    generateTransform(transform) {
        const parts = [];
        if (transform.x || transform.y) {
            parts.push(\`translate(\${transform.x}px, \${transform.y}px)\`);
        }
        if (transform.scale) {
            parts.push(\`scale(\${transform.scale})\`);
        }
        if (transform.rotate) {
            parts.push(\`rotate(\${transform.rotate}deg)\`);
        }
        return parts.join(' ');
    }

    /**
     * Gera string de clip CSS
     */
    generateClip(clip) {
        return \`rect(\${clip.y}px, \${clip.width}px, \${clip.height}px, \${clip.x}px)\`;
    }

    /**
     * Aplica transição de clip
     */
    applyClipTransition(fromSlide, toSlide, config, progress) {
        const fromClip = this.interpolateValue(config.from, config.to, progress);
        const toClip = this.interpolateValue(config.to, config.from, 1 - progress);
        
        fromSlide.style.clip = this.generateClip(fromClip);
        toSlide.style.clip = this.generateClip(toClip);
    }

    /**
     * Para todas as animações
     */
    stopAll() {
        this.currentAnimations.forEach(animation => {
            if (animation.onComplete) {
                animation.onComplete();
            }
        });
        
        this.currentAnimations.clear();
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

module.exports = PPTXAnimationManager;