// ========== GERENCIADOR DE ESTILOS AVANÇADOS PPTX ==========

export class PPTXStyleManager {
  constructor() {
    this.defaultStyles = this.initializeDefaultStyles();
    this.customStyles = new Map();
    this.styleGroups = new Map();
    this.transitions = new Map();
    this.animations = new Map();
  }

  initializeDefaultStyles() {
    return {
      fills: this.createDefaultFills(),
      effects: this.createDefaultEffects(),
      transitions: this.createDefaultTransitions(),
      animations: this.createDefaultAnimations()
    };
  }

  createDefaultFills() {
    return {
      solid: (color) => ({
        type: 'solid',
        color: this.validateColor(color)
      }),
      
      gradient: (stops, angle = 0) => ({
        type: 'gradient',
        angle: this.validateAngle(angle),
        stops: this.validateGradientStops(stops)
      }),
      
      pattern: (fg, bg, pattern) => ({
        type: 'pattern',
        foreground: this.validateColor(fg),
        background: this.validateColor(bg),
        pattern: this.validatePattern(pattern)
      }),
      
      picture: (src, options = {}) => ({
        type: 'picture',
        src: src,
        stretch: options.stretch || 'uniform',
        transparency: this.validateTransparency(options.transparency)
      })
    };
  }

  createDefaultEffects() {
    return {
      shadow: (options = {}) => ({
        type: 'shadow',
        color: this.validateColor(options.color || '#000000'),
        alpha: this.validateTransparency(options.alpha || 0.5),
        blur: this.validateBlur(options.blur || 5),
        distance: options.distance || 3,
        angle: this.validateAngle(options.angle || 45)
      }),
      
      glow: (options = {}) => ({
        type: 'glow',
        color: this.validateColor(options.color || '#000000'),
        alpha: this.validateTransparency(options.alpha || 0.5),
        size: this.validateSize(options.size || 5)
      }),
      
      reflection: (options = {}) => ({
        type: 'reflection',
        distance: options.distance || 0,
        alpha: this.validateTransparency(options.alpha || 0.5),
        blur: this.validateBlur(options.blur || 0),
        fadeDirection: options.fadeDirection || 'down'
      }),
      
      softEdge: (options = {}) => ({
        type: 'softEdge',
        radius: this.validateSize(options.radius || 5)
      })
    };
  }

  createDefaultTransitions() {
    return {
      fade: (duration = 1) => ({
        type: 'fade',
        duration: this.validateDuration(duration)
      }),
      
      push: (direction = 'right', duration = 1) => ({
        type: 'push',
        direction: this.validateDirection(direction),
        duration: this.validateDuration(duration)
      }),
      
      wipe: (direction = 'right', duration = 1) => ({
        type: 'wipe',
        direction: this.validateDirection(direction),
        duration: this.validateDuration(duration)
      }),
      
      split: (direction = 'vertical', duration = 1) => ({
        type: 'split',
        direction: this.validateSplitDirection(direction),
        duration: this.validateDuration(duration)
      })
    };
  }

  createDefaultAnimations() {
    return {
      entrance: {
        fadeIn: (duration = 1, delay = 0) => ({
          type: 'entrance',
          effect: 'fade',
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        }),
        
        flyIn: (direction = 'right', duration = 1, delay = 0) => ({
          type: 'entrance',
          effect: 'fly',
          direction: this.validateDirection(direction),
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        })
      },
      
      emphasis: {
        pulse: (duration = 1, delay = 0) => ({
          type: 'emphasis',
          effect: 'pulse',
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        }),
        
        spin: (duration = 1, delay = 0, spins = 1) => ({
          type: 'emphasis',
          effect: 'spin',
          spins: spins,
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        })
      },
      
      exit: {
        fadeOut: (duration = 1, delay = 0) => ({
          type: 'exit',
          effect: 'fade',
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        }),
        
        flyOut: (direction = 'right', duration = 1, delay = 0) => ({
          type: 'exit',
          effect: 'fly',
          direction: this.validateDirection(direction),
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        })
      },
      
      motion: {
        path: (path, duration = 1, delay = 0) => ({
          type: 'motion',
          effect: 'path',
          path: this.validatePath(path),
          duration: this.validateDuration(duration),
          delay: this.validateDelay(delay)
        })
      }
    };
  }

  // Métodos de validação
  validateColor(color) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(color)) {
      throw new Error(`Cor inválida: ${color}. Use formato hexadecimal (#RRGGBB ou #RGB)`);
    }
    return color;
  }

  validateTransparency(alpha) {
    if (alpha < 0 || alpha > 1) {
      throw new Error(`Transparência inválida: ${alpha}. Use valor entre 0 e 1`);
    }
    return alpha;
  }

  validateAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  validateGradientStops(stops) {
    if (!Array.isArray(stops) || stops.length < 2) {
      throw new Error('Gradiente deve ter pelo menos 2 pontos de parada');
    }
    return stops.map(stop => ({
      position: this.validateTransparency(stop.position),
      color: this.validateColor(stop.color)
    }));
  }

  validatePattern(pattern) {
    const validPatterns = [
      'diagonal1', 'diagonal2', 'cross',
      'horizontal', 'vertical', 'dots'
    ];
    if (!validPatterns.includes(pattern)) {
      throw new Error(`Padrão inválido: ${pattern}`);
    }
    return pattern;
  }

  validateBlur(blur) {
    if (blur < 0 || blur > 100) {
      throw new Error(`Desfoque inválido: ${blur}. Use valor entre 0 e 100`);
    }
    return blur;
  }

  validateSize(size) {
    if (size < 0 || size > 100) {
      throw new Error(`Tamanho inválido: ${size}. Use valor entre 0 e 100`);
    }
    return size;
  }

  validateDuration(duration) {
    if (duration < 0 || duration > 60) {
      throw new Error(`Duração inválida: ${duration}. Use valor entre 0 e 60 segundos`);
    }
    return duration;
  }

  validateDelay(delay) {
    if (delay < 0 || delay > 60) {
      throw new Error(`Atraso inválido: ${delay}. Use valor entre 0 e 60 segundos`);
    }
    return delay;
  }

  validateDirection(direction) {
    const validDirections = ['left', 'right', 'up', 'down'];
    if (!validDirections.includes(direction)) {
      throw new Error(`Direção inválida: ${direction}`);
    }
    return direction;
  }

  validateSplitDirection(direction) {
    const validDirections = ['horizontal', 'vertical'];
    if (!validDirections.includes(direction)) {
      throw new Error(`Direção de divisão inválida: ${direction}`);
    }
    return direction;
  }

  validatePath(path) {
    // Validar formato do caminho SVG
    if (typeof path !== 'string' || !path.trim().startsWith('M')) {
      throw new Error('Caminho inválido. Use formato SVG path');
    }
    return path;
  }

  // Métodos de aplicação de estilos
  applyStyleToShape(shape, styles) {
    const xml = [];

    if (styles.fill) {
      xml.push(this.generateFillXML(styles.fill));
    }

    if (styles.effects) {
      xml.push(this.generateEffectsXML(styles.effects));
    }

    if (styles.animations) {
      xml.push(this.generateAnimationsXML(styles.animations));
    }

    return xml.join('\\n');
  }

  generateFillXML(fill) {
    switch (fill.type) {
      case 'solid':
        return `<a:solidFill><a:srgbClr val="${fill.color.substring(1)}"/></a:solidFill>`;
      
      case 'gradient':
        return this.generateGradientXML(fill);
      
      case 'pattern':
        return this.generatePatternXML(fill);
      
      case 'picture':
        return this.generatePictureFillXML(fill);
      
      default:
        throw new Error(`Tipo de preenchimento desconhecido: ${fill.type}`);
    }
  }

  generateGradientXML(gradient) {
    const stops = gradient.stops.map((stop, index) => `
      <a:gs pos="${Math.round(stop.position * 100000)}">
        <a:srgbClr val="${stop.color.substring(1)}"/>
      </a:gs>
    `).join('');

    return `
      <a:gradFill rotWithShape="1">
        <a:gsLst>${stops}</a:gsLst>
        <a:lin ang="${gradient.angle * 60000}" scaled="0"/>
      </a:gradFill>
    `;
  }

  generatePatternXML(pattern) {
    return `
      <a:pattFill prst="${pattern.pattern}">
        <a:fgClr><a:srgbClr val="${pattern.foreground.substring(1)}"/></a:fgClr>
        <a:bgClr><a:srgbClr val="${pattern.background.substring(1)}"/></a:bgClr>
      </a:pattFill>
    `;
  }

  generatePictureFillXML(picture) {
    return `
      <a:blipFill>
        <a:blip r:embed="${picture.src}">
          <a:alphaModFix amt="${Math.round((1 - picture.transparency) * 100000)}"/>
        </a:blip>
        <a:stretch><a:fillRect/></a:stretch>
      </a:blipFill>
    `;
  }

  generateEffectsXML(effects) {
    const xmlEffects = [];

    if (effects.shadow) {
      xmlEffects.push(this.generateShadowXML(effects.shadow));
    }

    if (effects.glow) {
      xmlEffects.push(this.generateGlowXML(effects.glow));
    }

    if (effects.reflection) {
      xmlEffects.push(this.generateReflectionXML(effects.reflection));
    }

    if (effects.softEdge) {
      xmlEffects.push(this.generateSoftEdgeXML(effects.softEdge));
    }

    return `<a:effectLst>${xmlEffects.join('')}</a:effectLst>`;
  }

  generateShadowXML(shadow) {
    return `
      <a:outerShdw blurRad="${shadow.blur * 12700}" dist="${shadow.distance * 12700}" 
                   dir="${shadow.angle * 60000}" algn="ctr" rotWithShape="0">
        <a:srgbClr val="${shadow.color.substring(1)}">
          <a:alpha val="${Math.round(shadow.alpha * 100000)}"/>
        </a:srgbClr>
      </a:outerShdw>
    `;
  }

  generateGlowXML(glow) {
    return `
      <a:glow rad="${glow.size * 12700}">
        <a:srgbClr val="${glow.color.substring(1)}">
          <a:alpha val="${Math.round(glow.alpha * 100000)}"/>
        </a:srgbClr>
      </a:glow>
    `;
  }

  generateReflectionXML(reflection) {
    return `
      <a:reflection algn="${reflection.fadeDirection}" blurRad="${reflection.blur * 12700}" 
                    stA="${Math.round(reflection.alpha * 100000)}" endA="0" 
                    dist="${reflection.distance * 12700}" dir="0" sy="-100000" fadeDir="5400000"/>
    `;
  }

  generateSoftEdgeXML(softEdge) {
    return `<a:softEdge rad="${softEdge.radius * 12700}"/>`;
  }

  generateAnimationsXML(animations) {
    return animations.map(anim => {
      switch (anim.type) {
        case 'entrance':
          return this.generateEntranceAnimationXML(anim);
        case 'emphasis':
          return this.generateEmphasisAnimationXML(anim);
        case 'exit':
          return this.generateExitAnimationXML(anim);
        case 'motion':
          return this.generateMotionAnimationXML(anim);
        default:
          throw new Error(`Tipo de animação desconhecido: ${anim.type}`);
      }
    }).join('\\n');
  }

  generateEntranceAnimationXML(anim) {
    return `
      <p:par>
        <p:cTn id="${this.getNextAnimationId()}" dur="${anim.duration * 1000}" 
               fill="hold" restart="whenNotActive">
          <p:stCondLst>
            <p:cond delay="${anim.delay * 1000}"/>
          </p:stCondLst>
          <p:childTnLst>
            <p:set>
              <p:cBhvr>
                <p:cTn dur="1" fill="hold"/>
                <p:tgtEl><p:spTgt spid="${anim.targetId}"/></p:tgtEl>
                <p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>
              </p:cBhvr>
              <p:show/>
            </p:set>
          </p:childTnLst>
        </p:cTn>
      </p:par>
    `;
  }

  // ID único para animações
  #animationIdCounter = 1;
  getNextAnimationId() {
    return this.#animationIdCounter++;
  }

  /**
   * Cria um novo estilo composto
   */
  createStyle(name, options) {
    const style = {
      fills: options.fills || [],
      effects: options.effects || [],
      transitions: options.transitions || [],
      animations: options.animations || [],
      metadata: options.metadata || {}
    };

    this.validateStyle(style);
    this.customStyles.set(name, style);
    return style;
  }

  /**
   * Valida estilo composto
   */
  validateStyle(style) {
    // Valida preenchimentos
    style.fills.forEach(fill => {
      switch (fill.type) {
        case 'solid':
          this.validateColor(fill.color);
          break;
        case 'gradient':
          this.validateGradientStops(fill.stops);
          this.validateAngle(fill.angle);
          break;
        case 'pattern':
          this.validatePattern(fill.pattern);
          this.validateColor(fill.foreground);
          this.validateColor(fill.background);
          break;
        case 'picture':
          if (!fill.src) {
            throw new Error('Origem da imagem é obrigatória para preenchimento com imagem');
          }
          break;
      }
    });

    // Valida efeitos
    style.effects.forEach(effect => {
      switch (effect.type) {
        case 'shadow':
          this.validateColor(effect.color);
          this.validateTransparency(effect.alpha);
          this.validateBlur(effect.blur);
          break;
        case 'glow':
          this.validateColor(effect.color);
          this.validateTransparency(effect.alpha);
          this.validateSize(effect.size);
          break;
        case 'reflection':
          this.validateTransparency(effect.alpha);
          this.validateBlur(effect.blur);
          break;
        case 'softEdge':
          this.validateSize(effect.radius);
          break;
      }
    });

    // Valida transições
    style.transitions.forEach(transition => {
      this.validateDuration(transition.duration);
      if (transition.direction) {
        this.validateDirection(transition.direction);
      }
    });

    // Valida animações
    style.animations.forEach(animation => {
      this.validateDuration(animation.duration);
      this.validateDelay(animation.delay || 0);
      switch (animation.type) {
        case 'entrance':
        case 'exit':
          if (animation.direction) {
            this.validateDirection(animation.direction);
          }
          break;
        case 'motion':
          if (animation.path) {
            this.validatePath(animation.path);
          }
          break;
      }
    });
  }

  /**
   * Cria um grupo de estilos relacionados
   */
  createStyleGroup(name, styles) {
    if (!Array.isArray(styles)) {
      throw new Error('Grupo de estilos deve ser um array');
    }

    const group = new Map();
    styles.forEach(style => {
      if (!this.customStyles.has(style)) {
        throw new Error(`Estilo não encontrado: ${style}`);
      }
      group.set(style, this.customStyles.get(style));
    });

    this.styleGroups.set(name, group);
    return group;
  }

  /**
   * Cria uma transição personalizada
   */
  createTransition(name, options) {
    const transition = {
      type: options.type || 'custom',
      duration: this.validateDuration(options.duration || 1),
      easing: options.easing || 'linear',
      properties: options.properties || {},
      metadata: options.metadata || {}
    };

    this.validateTransitionProperties(transition.properties);
    this.transitions.set(name, transition);
    return transition;
  }

  /**
   * Valida propriedades de transição
   */
  validateTransitionProperties(properties) {
    const validProperties = [
      'opacity', 'scale', 'rotate', 'translate',
      'skew', 'filter', 'transform'
    ];

    Object.keys(properties).forEach(prop => {
      if (!validProperties.includes(prop)) {
        throw new Error(`Propriedade de transição inválida: ${prop}`);
      }
    });
  }

  /**
   * Cria uma animação personalizada
   */
  createAnimation(name, options) {
    const animation = {
      type: options.type || 'custom',
      duration: this.validateDuration(options.duration || 1),
      delay: this.validateDelay(options.delay || 0),
      easing: options.easing || 'linear',
      keyframes: options.keyframes || [],
      metadata: options.metadata || {}
    };

    this.validateKeyframes(animation.keyframes);
    this.animations.set(name, animation);
    return animation;
  }

  /**
   * Valida keyframes de animação
   */
  validateKeyframes(keyframes) {
    if (!Array.isArray(keyframes) || keyframes.length === 0) {
      throw new Error('Animação deve ter pelo menos um keyframe');
    }

    keyframes.forEach(keyframe => {
      if (typeof keyframe.offset !== 'number' || keyframe.offset < 0 || keyframe.offset > 1) {
        throw new Error('Offset do keyframe deve ser um número entre 0 e 1');
      }

      this.validateTransitionProperties(keyframe.properties || {});
    });
  }

  /**
   * Aplica estilo composto a um elemento
   */
  applyCompositeStyle(element, styleName) {
    const style = this.customStyles.get(styleName);
    if (!style) {
      throw new Error(`Estilo não encontrado: ${styleName}`);
    }

    const xml = [];

    // Aplica preenchimentos
    style.fills.forEach(fill => {
      xml.push(this.generateFillXML(fill));
    });

    // Aplica efeitos
    style.effects.forEach(effect => {
      xml.push(this.generateEffectsXML({ [effect.type]: effect }));
    });

    // Aplica transições
    style.transitions.forEach(transition => {
      xml.push(this.generateTransitionXML(transition));
    });

    // Aplica animações
    style.animations.forEach(animation => {
      xml.push(this.generateAnimationsXML([animation]));
    });

    return xml.join('\\n');
  }

  /**
   * Gera XML para transição personalizada
   */
  generateTransitionXML(transition) {
    return `
      <p:transition>
        <p:${transition.type} dur="${transition.duration * 1000}">
          ${this.generateTransitionPropertiesXML(transition.properties)}
        </p:${transition.type}>
      </p:transition>
    `;
  }

  /**
   * Gera XML para propriedades de transição
   */
  generateTransitionPropertiesXML(properties) {
    const xml = [];

    Object.entries(properties).forEach(([prop, value]) => {
      switch (prop) {
        case 'opacity':
          xml.push(`<a:alpha val="${Math.round(value * 100000)}"/>`);
          break;
        case 'scale':
          xml.push(`<a:scale x="${Math.round(value.x * 100000)}" y="${Math.round(value.y * 100000)}"/>`);
          break;
        case 'rotate':
          xml.push(`<a:rot ang="${Math.round(value * 60000)}"/>`);
          break;
        case 'translate':
          xml.push(`<a:off x="${Math.round(value.x)}" y="${Math.round(value.y)}"/>`);
          break;
      }
    });

    return xml.join('\\n');
  }
}