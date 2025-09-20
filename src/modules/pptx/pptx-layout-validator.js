/**
 * Sistema de validação e correção automática de layouts para PPTX
 */
class PPTXLayoutValidator {
    constructor(config = {}) {
        // Configurações padrão
        this.gridSize = config.gridSize || 8; // Tamanho da grade para alinhamento
        this.alignmentThreshold = config.alignmentThreshold || 5; // Limite para considerar elementos alinhados
        this.minSpacing = config.minSpacing || 10; // Espaçamento mínimo entre elementos
        this.proportionThreshold = config.proportionThreshold || 0.1; // Tolerância para proporções
        
        // Inicializa regras de validação
        this.validationRules = new Map();
        this.initializeRules();
        
        // Referência para o gerenciador de temas
        this.themeManager = config.themeManager || null;
    }

    /**
     * Obtém elementos irmãos do elemento atual
     */
    getSiblingElements(element) {
        // Implementação depende da estrutura do slide
        return element.parent ? element.parent.children.filter(e => e !== element) : [];
    }

    /**
     * Obtém elementos similares ao elemento atual
     */
    getSimilarElements(element) {
        // Elementos do mesmo tipo no mesmo slide
        return this.getSiblingElements(element).filter(e => e.type === element.type);
    }

    /**
     * Obtém cores usadas no elemento
     */
    getElementColors(element) {
        const colors = new Set();
        
        if (element.fill) colors.add(element.fill);
        if (element.stroke) colors.add(element.stroke);
        if (element.textColor) colors.add(element.textColor);
        
        return Array.from(colors);
    }

    /**
     * Obtém fontes usadas no elemento
     */
    getElementFonts(element) {
        const fonts = new Set();
        
        if (element.fontFamily) fonts.add(element.fontFamily);
        
        // Procura fontes em subelementos de texto
        if (element.textElements) {
            element.textElements.forEach(text => {
                if (text.fontFamily) fonts.add(text.fontFamily);
            });
        }
        
        return Array.from(fonts);
    }

    /**
     * Obtém estilos usados no elemento
     */
    getElementStyles(element) {
        const styles = new Set();
        
        if (element.style) styles.add(element.style);
        
        // Procura estilos em subelementos
        if (element.children) {
            element.children.forEach(child => {
                if (child.style) styles.add(child.style);
            });
        }
        
        return Array.from(styles);
    }

    /**
     * Define a cor de um elemento
     */
    setElementColor(element, color) {
        if (element.fill) element.fill = color;
        if (element.stroke) element.stroke = color;
        if (element.textColor) element.textColor = color;
    }

    /**
     * Define a fonte de um elemento
     */
    setElementFont(element, font) {
        if (element.fontFamily) element.fontFamily = font;
        
        // Atualiza fontes em subelementos de texto
        if (element.textElements) {
            element.textElements.forEach(text => {
                if (text.fontFamily) text.fontFamily = font;
            });
        }
    }

    /**
     * Define o estilo de um elemento
     */
    setElementStyle(element, style) {
        if (element.style) element.style = style;
        
        // Atualiza estilos em subelementos
        if (element.children) {
            element.children.forEach(child => {
                if (child.style) child.style = style;
            });
        }
    }

    /**
     * Uniformiza estilos entre dois elementos
     */
    matchElementStyles(source, target) {
        // Copia cores
        const colors = this.getElementColors(source);
        colors.forEach(color => this.setElementColor(target, color));
        
        // Copia fontes
        const fonts = this.getElementFonts(source);
        fonts.forEach(font => this.setElementFont(target, font));
        
        // Copia estilos
        const styles = this.getElementStyles(source);
        styles.forEach(style => this.setElementStyle(target, style));
    }

    /**
     * Obtém o gerenciador de temas
     */
    getThemeManager() {
        if (!this.themeManager) {
            throw new Error('Theme manager não configurado');
        }
        return this.themeManager;
    }

    /**
     * Obtém a cor do tema mais próxima
     */
    getNearestThemeColor(color) {
        return this.getThemeManager().getNearestColor(color);
    }

    /**
     * Obtém a fonte do tema correspondente
     */
    getThemeFont(font) {
        return this.getThemeManager().getMatchingFont(font);
    }

    /**
     * Obtém o estilo do tema correspondente
     */
    getThemeStyle(style) {
        return this.getThemeManager().getMatchingStyle(style);
    }

    /**
     * Inicializa as regras de validação padrão
     */
    initializeRules() {
        // Regras de alinhamento
        this.addRule('alignment', {
            validate: (element) => {
                return {
                    isValid: this.validateAlignment(element),
                    fixes: this.suggestAlignmentFixes(element)
                };
            },
            fix: (element, fixes) => this.applyAlignmentFixes(element, fixes)
        });

        // Regras de espaçamento
        this.addRule('spacing', {
            validate: (element) => {
                return {
                    isValid: this.validateSpacing(element),
                    fixes: this.suggestSpacingFixes(element)
                };
            },
            fix: (element, fixes) => this.applySpacingFixes(element, fixes)
        });

        // Regras de proporção
        this.addRule('proportion', {
            validate: (element) => {
                return {
                    isValid: this.validateProportion(element),
                    fixes: this.suggestProportionFixes(element)
                };
            },
            fix: (element, fixes) => this.applyProportionFixes(element, fixes)
        });

        // Regras de consistência visual
        this.addRule('visualConsistency', {
            validate: (element) => {
                return {
                    isValid: this.validateVisualConsistency(element),
                    fixes: this.suggestConsistencyFixes(element)
                };
            },
            fix: (element, fixes) => this.applyConsistencyFixes(element, fixes)
        });
    }

    /**
     * Adiciona uma nova regra de validação
     */
    addRule(name, rule) {
        this.validationRules.set(name, rule);
    }

    /**
     * Valida um elemento ou slide inteiro
     */
    validate(element) {
        const results = new Map();
        
        for (const [name, rule] of this.validationRules) {
            results.set(name, rule.validate(element));
        }

        return {
            isValid: Array.from(results.values()).every(r => r.isValid),
            details: results
        };
    }

    /**
     * Aplica correções automáticas com base nos resultados da validação
     */
    applyFixes(element, validationResults) {
        const fixes = [];

        for (const [name, result] of validationResults.details) {
            if (!result.isValid) {
                const rule = this.validationRules.get(name);
                const fixResult = rule.fix(element, result.fixes);
                fixes.push(fixResult);
            }
        }

        return fixes;
    }

    /**
     * Valida alinhamento de elementos
     */
    validateAlignment(element) {
        const issues = [];
        const { x, y, width, height } = element;
        
        // Verifica alinhamento horizontal
        if (x % this.gridSize !== 0) {
            issues.push({
                type: 'horizontalAlignment',
                current: x,
                ideal: Math.round(x / this.gridSize) * this.gridSize
            });
        }

        // Verifica alinhamento vertical
        if (y % this.gridSize !== 0) {
            issues.push({
                type: 'verticalAlignment',
                current: y,
                ideal: Math.round(y / this.gridSize) * this.gridSize
            });
        }

        // Verifica alinhamento com outros elementos
        const siblings = this.getSiblingElements(element);
        for (const sibling of siblings) {
            if (Math.abs(element.x - sibling.x) < this.alignmentThreshold) {
                issues.push({
                    type: 'elementAlignment',
                    direction: 'horizontal',
                    element1: element,
                    element2: sibling
                });
            }
            if (Math.abs(element.y - sibling.y) < this.alignmentThreshold) {
                issues.push({
                    type: 'elementAlignment',
                    direction: 'vertical',
                    element1: element,
                    element2: sibling
                });
            }
        }

        return issues.length === 0;
    }

    /**
     * Sugere correções de alinhamento
     */
    suggestAlignmentFixes(element) {
        const fixes = [];
        const issues = [];
        
        // Analisa problemas de alinhamento
        if (!this.validateAlignment(element)) {
            const alignmentIssues = this.getAlignmentIssues(element);
            issues.push(...alignmentIssues);
        }

        // Gera sugestões de correção
        for (const issue of issues) {
            switch (issue.type) {
                case 'horizontalAlignment':
                    fixes.push({
                        type: 'adjustX',
                        from: issue.current,
                        to: issue.ideal,
                        description: `Ajustar posição horizontal de ${issue.current} para ${issue.ideal}`
                    });
                    break;
                    
                case 'verticalAlignment':
                    fixes.push({
                        type: 'adjustY',
                        from: issue.current,
                        to: issue.ideal,
                        description: `Ajustar posição vertical de ${issue.current} para ${issue.ideal}`
                    });
                    break;
                    
                case 'elementAlignment':
                    fixes.push({
                        type: 'alignElements',
                        direction: issue.direction,
                        elements: [issue.element1, issue.element2],
                        description: `Alinhar elementos no eixo ${issue.direction}`
                    });
                    break;
            }
        }

        return fixes;
    }

    /**
     * Aplica correções de alinhamento
     */
    applyAlignmentFixes(element, fixes) {
        const applied = [];

        for (const fix of fixes) {
            switch (fix.type) {
                case 'adjustX':
                    element.x = fix.to;
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'adjustY':
                    element.y = fix.to;
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'alignElements':
                    const [el1, el2] = fix.elements;
                    if (fix.direction === 'horizontal') {
                        el2.x = el1.x;
                    } else {
                        el2.y = el1.y;
                    }
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;
            }
        }

        return {
            type: 'alignment',
            applied
        };
    }

    /**
     * Valida espaçamento entre elementos
     */
    validateSpacing(element) {
        const issues = [];
        const siblings = this.getSiblingElements(element);
        
        for (const sibling of siblings) {
            // Calcula distâncias
            const horizontalSpace = Math.abs(element.x + element.width - sibling.x);
            const verticalSpace = Math.abs(element.y + element.height - sibling.y);
            
            // Verifica espaçamento horizontal
            if (horizontalSpace > 0 && horizontalSpace < this.minSpacing) {
                issues.push({
                    type: 'horizontalSpacing',
                    elements: [element, sibling],
                    current: horizontalSpace,
                    required: this.minSpacing
                });
            }
            
            // Verifica espaçamento vertical
            if (verticalSpace > 0 && verticalSpace < this.minSpacing) {
                issues.push({
                    type: 'verticalSpacing',
                    elements: [element, sibling],
                    current: verticalSpace,
                    required: this.minSpacing
                });
            }
            
            // Verifica sobreposição
            if (this.checkOverlap(element, sibling)) {
                issues.push({
                    type: 'overlap',
                    elements: [element, sibling]
                });
            }
        }
        
        return issues.length === 0;
    }

    /**
     * Sugere correções de espaçamento
     */
    suggestSpacingFixes(element) {
        const fixes = [];
        const issues = [];
        
        // Analisa problemas de espaçamento
        if (!this.validateSpacing(element)) {
            const spacingIssues = this.getSpacingIssues(element);
            issues.push(...spacingIssues);
        }

        // Gera sugestões de correção
        for (const issue of issues) {
            switch (issue.type) {
                case 'horizontalSpacing':
                    fixes.push({
                        type: 'adjustHorizontalSpacing',
                        elements: issue.elements,
                        adjustment: issue.required - issue.current,
                        description: `Ajustar espaçamento horizontal para ${issue.required}px`
                    });
                    break;
                    
                case 'verticalSpacing':
                    fixes.push({
                        type: 'adjustVerticalSpacing',
                        elements: issue.elements,
                        adjustment: issue.required - issue.current,
                        description: `Ajustar espaçamento vertical para ${issue.required}px`
                    });
                    break;
                    
                case 'overlap':
                    fixes.push({
                        type: 'resolveOverlap',
                        elements: issue.elements,
                        description: 'Resolver sobreposição de elementos'
                    });
                    break;
            }
        }

        return fixes;
    }

    /**
     * Aplica correções de espaçamento
     */
    applySpacingFixes(element, fixes) {
        const applied = [];

        for (const fix of fixes) {
            switch (fix.type) {
                case 'adjustHorizontalSpacing':
                    const [el1, el2] = fix.elements;
                    el2.x += fix.adjustment;
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'adjustVerticalSpacing':
                    const [elem1, elem2] = fix.elements;
                    elem2.y += fix.adjustment;
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'resolveOverlap':
                    const [element1, element2] = fix.elements;
                    this.resolveElementOverlap(element1, element2);
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;
            }
        }

        return {
            type: 'spacing',
            applied
        };
    }

    /**
     * Verifica sobreposição entre elementos
     */
    checkOverlap(element1, element2) {
        return !(element1.x + element1.width < element2.x ||
                element2.x + element2.width < element1.x ||
                element1.y + element1.height < element2.y ||
                element2.y + element2.height < element1.y);
    }

    /**
     * Resolve sobreposição entre elementos
     */
    resolveElementOverlap(element1, element2) {
        const overlapX = Math.min(
            Math.abs(element1.x + element1.width - element2.x),
            Math.abs(element2.x + element2.width - element1.x)
        );
        
        const overlapY = Math.min(
            Math.abs(element1.y + element1.height - element2.y),
            Math.abs(element2.y + element2.height - element1.y)
        );

        if (overlapX < overlapY) {
            // Ajusta posição horizontal
            if (element1.x < element2.x) {
                element2.x = element1.x + element1.width + this.minSpacing;
            } else {
                element1.x = element2.x + element2.width + this.minSpacing;
            }
        } else {
            // Ajusta posição vertical
            if (element1.y < element2.y) {
                element2.y = element1.y + element1.height + this.minSpacing;
            } else {
                element1.y = element2.y + element2.height + this.minSpacing;
            }
        }
    }

    /**
     * Valida proporções dos elementos
     */
    validateProportion(element) {
        const issues = [];
        
        // Verifica proporção áurea (1.618)
        const goldenRatio = 1.618;
        const currentRatio = element.width / element.height;
        
        if (Math.abs(currentRatio - goldenRatio) < this.proportionThreshold) {
            issues.push({
                type: 'goldenRatio',
                current: currentRatio,
                ideal: goldenRatio
            });
        }

        // Verifica proporções padrão (4:3, 16:9, etc)
        const standardRatios = [
            { name: '4:3', value: 4/3 },
            { name: '16:9', value: 16/9 },
            { name: '1:1', value: 1 }
        ];

        for (const ratio of standardRatios) {
            if (Math.abs(currentRatio - ratio.value) < this.proportionThreshold) {
                issues.push({
                    type: 'standardRatio',
                    ratioName: ratio.name,
                    current: currentRatio,
                    ideal: ratio.value
                });
            }
        }

        // Verifica proporção relativa a outros elementos
        const siblings = this.getSiblingElements(element);
        for (const sibling of siblings) {
            const relativeRatio = element.width / sibling.width;
            if (this.isCommonRatio(relativeRatio)) {
                issues.push({
                    type: 'relativeRatio',
                    element1: element,
                    element2: sibling,
                    ratio: relativeRatio
                });
            }
        }

        return issues.length === 0;
    }

    /**
     * Verifica se é uma proporção comum
     */
    isCommonRatio(ratio) {
        const commonRatios = [0.5, 1, 1.5, 2, 3];
        return commonRatios.some(r => Math.abs(ratio - r) < this.proportionThreshold);
    }

    /**
     * Sugere correções de proporção
     */
    suggestProportionFixes(element) {
        const fixes = [];
        const issues = [];
        
        // Analisa problemas de proporção
        if (!this.validateProportion(element)) {
            const proportionIssues = this.getProportionIssues(element);
            issues.push(...proportionIssues);
        }

        // Gera sugestões de correção
        for (const issue of issues) {
            switch (issue.type) {
                case 'goldenRatio':
                    fixes.push({
                        type: 'adjustToGoldenRatio',
                        element: element,
                        currentRatio: issue.current,
                        targetRatio: issue.ideal,
                        description: 'Ajustar para proporção áurea (1.618)'
                    });
                    break;
                    
                case 'standardRatio':
                    fixes.push({
                        type: 'adjustToStandardRatio',
                        element: element,
                        ratioName: issue.ratioName,
                        currentRatio: issue.current,
                        targetRatio: issue.ideal,
                        description: `Ajustar para proporção padrão ${issue.ratioName}`
                    });
                    break;
                    
                case 'relativeRatio':
                    fixes.push({
                        type: 'adjustRelativeRatio',
                        elements: [issue.element1, issue.element2],
                        targetRatio: this.getNearestCommonRatio(issue.ratio),
                        description: `Ajustar proporção relativa entre elementos`
                    });
                    break;
            }
        }

        return fixes;
    }

    /**
     * Encontra a proporção comum mais próxima
     */
    getNearestCommonRatio(ratio) {
        const commonRatios = [0.5, 1, 1.5, 2, 3];
        return commonRatios.reduce((prev, curr) => 
            Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
        );
    }

    /**
     * Aplica correções de proporção
     */
    applyProportionFixes(element, fixes) {
        const applied = [];

        for (const fix of fixes) {
            switch (fix.type) {
                case 'adjustToGoldenRatio':
                case 'adjustToStandardRatio':
                    const newWidth = element.height * fix.targetRatio;
                    element.width = newWidth;
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'adjustRelativeRatio':
                    const [el1, el2] = fix.elements;
                    el2.width = el1.width / fix.targetRatio;
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;
            }
        }

        return {
            type: 'proportion',
            applied
        };
    }

    /**
     * Valida consistência visual
     */
    validateVisualConsistency(element) {
        const issues = [];
        const themeManager = this.getThemeManager();
        
        // Verifica cores
        const elementColors = this.getElementColors(element);
        for (const color of elementColors) {
            if (!themeManager.isThemeColor(color)) {
                issues.push({
                    type: 'nonThemeColor',
                    element: element,
                    color: color
                });
            }
        }

        // Verifica fontes
        const elementFonts = this.getElementFonts(element);
        for (const font of elementFonts) {
            if (!themeManager.isThemeFont(font)) {
                issues.push({
                    type: 'nonThemeFont',
                    element: element,
                    font: font
                });
            }
        }

        // Verifica estilos
        const elementStyles = this.getElementStyles(element);
        for (const style of elementStyles) {
            if (!themeManager.isThemeStyle(style)) {
                issues.push({
                    type: 'nonThemeStyle',
                    element: element,
                    style: style
                });
            }
        }

        // Verifica consistência com elementos similares
        const similarElements = this.getSimilarElements(element);
        for (const similar of similarElements) {
            if (!this.areVisuallyConsistent(element, similar)) {
                issues.push({
                    type: 'inconsistentStyling',
                    element1: element,
                    element2: similar
                });
            }
        }

        return issues.length === 0;
    }

    /**
     * Verifica se dois elementos são visualmente consistentes
     */
    areVisuallyConsistent(element1, element2) {
        // Compara propriedades visuais
        return this.compareColors(element1, element2) &&
               this.compareFonts(element1, element2) &&
               this.compareStyles(element1, element2);
    }

    /**
     * Sugere correções de consistência visual
     */
    suggestConsistencyFixes(element) {
        const fixes = [];
        const issues = [];
        
        // Analisa problemas de consistência
        if (!this.validateVisualConsistency(element)) {
            const consistencyIssues = this.getConsistencyIssues(element);
            issues.push(...consistencyIssues);
        }

        // Gera sugestões de correção
        for (const issue of issues) {
            switch (issue.type) {
                case 'nonThemeColor':
                    fixes.push({
                        type: 'adjustColor',
                        element: element,
                        color: issue.color,
                        suggestion: this.getNearestThemeColor(issue.color),
                        description: 'Ajustar para cor do tema mais próxima'
                    });
                    break;
                    
                case 'nonThemeFont':
                    fixes.push({
                        type: 'adjustFont',
                        element: element,
                        font: issue.font,
                        suggestion: this.getThemeFont(issue.font),
                        description: 'Ajustar para fonte do tema'
                    });
                    break;
                    
                case 'nonThemeStyle':
                    fixes.push({
                        type: 'adjustStyle',
                        element: element,
                        style: issue.style,
                        suggestion: this.getThemeStyle(issue.style),
                        description: 'Ajustar para estilo do tema'
                    });
                    break;
                    
                case 'inconsistentStyling':
                    fixes.push({
                        type: 'matchStyles',
                        elements: [issue.element1, issue.element2],
                        description: 'Uniformizar estilos entre elementos similares'
                    });
                    break;
            }
        }

        return fixes;
    }

    /**
     * Aplica correções de consistência visual
     */
    applyConsistencyFixes(element, fixes) {
        const applied = [];

        for (const fix of fixes) {
            switch (fix.type) {
                case 'adjustColor':
                    this.setElementColor(fix.element, fix.suggestion);
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'adjustFont':
                    this.setElementFont(fix.element, fix.suggestion);
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'adjustStyle':
                    this.setElementStyle(fix.element, fix.suggestion);
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;

                case 'matchStyles':
                    const [el1, el2] = fix.elements;
                    this.matchElementStyles(el1, el2);
                    applied.push({
                        description: fix.description,
                        success: true
                    });
                    break;
            }
        }

        return {
            type: 'visualConsistency',
            applied
        };
    }
}

module.exports = PPTXLayoutValidator;