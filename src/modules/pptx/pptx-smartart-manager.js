/**
 * Sistema de suporte a SmartArt e diagramas para PPTX
 */
class PPTXSmartArtManager {
    constructor(config = {}) {
        // Configurações padrão
        this.templates = new Map();
        this.converters = new Map();
        this.layouts = new Map();
        
        // Inicializa templates e conversores padrão
        this.initializeTemplates();
        this.initializeConverters();
        this.initializeLayouts();
    }

    /**
     * Inicializa templates padrão de SmartArt
     */
    initializeTemplates() {
        // Lista básica
        this.addTemplate('basicList', {
            type: 'list',
            layout: 'vertical',
            createStructure: (data) => ({
                type: 'list',
                items: data.map(item => ({
                    text: item,
                    level: 0
                }))
            })
        });

        // Hierarquia
        this.addTemplate('hierarchy', {
            type: 'hierarchy',
            layout: 'topDown',
            createStructure: (data) => ({
                type: 'tree',
                root: this.createTreeNode(data)
            })
        });

        // Ciclo
        this.addTemplate('cycle', {
            type: 'cycle',
            layout: 'circular',
            createStructure: (data) => ({
                type: 'cycle',
                steps: data.map(step => ({
                    text: step,
                    position: 'circular'
                }))
            })
        });

        // Processo
        this.addTemplate('process', {
            type: 'process',
            layout: 'horizontal',
            createStructure: (data) => ({
                type: 'process',
                steps: data.map(step => ({
                    text: step,
                    direction: 'forward'
                }))
            })
        });

        // Matriz
        this.addTemplate('matrix', {
            type: 'matrix',
            layout: 'grid',
            createStructure: (data) => ({
                type: 'grid',
                cells: this.createMatrixCells(data)
            })
        });
    }

    /**
     * Inicializa conversores para diferentes formatos
     */
    initializeConverters() {
        // Converter de lista para SmartArt
        this.addConverter('list', {
            canConvert: (data) => Array.isArray(data),
            convert: (data) => this.convertListToSmartArt(data)
        });

        // Converter de árvore para SmartArt
        this.addConverter('tree', {
            canConvert: (data) => data.hasOwnProperty('children'),
            convert: (data) => this.convertTreeToSmartArt(data)
        });

        // Converter de dados tabulares para SmartArt
        this.addConverter('table', {
            canConvert: (data) => Array.isArray(data) && data[0] && Array.isArray(data[0]),
            convert: (data) => this.convertTableToSmartArt(data)
        });

        // Converter de fluxograma para SmartArt
        this.addConverter('flowchart', {
            canConvert: (data) => data.hasOwnProperty('steps'),
            convert: (data) => this.convertFlowchartToSmartArt(data)
        });

        // Converter de organograma para SmartArt
        this.addConverter('orgchart', {
            canConvert: (data) => data.hasOwnProperty('position'),
            convert: (data) => this.convertOrgchartToSmartArt(data)
        });
    }

    /**
     * Inicializa layouts padrão de SmartArt
     */
    initializeLayouts() {
        // Layout de lista
        this.addLayout('list', {
            vertical: {
                arrange: (items) => this.arrangeVerticalList(items)
            },
            horizontal: {
                arrange: (items) => this.arrangeHorizontalList(items)
            }
        });

        // Layout de hierarquia
        this.addLayout('hierarchy', {
            topDown: {
                arrange: (nodes) => this.arrangeTopDownHierarchy(nodes)
            },
            bottomUp: {
                arrange: (nodes) => this.arrangeBottomUpHierarchy(nodes)
            }
        });

        // Layout de ciclo
        this.addLayout('cycle', {
            circular: {
                arrange: (steps) => this.arrangeCircularCycle(steps)
            },
            linear: {
                arrange: (steps) => this.arrangeLinearCycle(steps)
            }
        });

        // Layout de processo
        this.addLayout('process', {
            horizontal: {
                arrange: (steps) => this.arrangeHorizontalProcess(steps)
            },
            vertical: {
                arrange: (steps) => this.arrangeVerticalProcess(steps)
            }
        });

        // Layout de matriz
        this.addLayout('matrix', {
            grid: {
                arrange: (cells) => this.arrangeGridMatrix(cells)
            },
            pyramid: {
                arrange: (cells) => this.arrangePyramidMatrix(cells)
            }
        });
    }

    /**
     * Adiciona um novo template
     */
    addTemplate(name, template) {
        this.templates.set(name, template);
    }

    /**
     * Adiciona um novo conversor
     */
    addConverter(name, converter) {
        this.converters.set(name, converter);
    }

    /**
     * Adiciona um novo layout
     */
    addLayout(name, layout) {
        this.layouts.set(name, layout);
    }

    /**
     * Cria nó para estrutura de árvore
     */
    createTreeNode(data) {
        return {
            text: data.text,
            children: Array.isArray(data.children) 
                ? data.children.map(child => this.createTreeNode(child))
                : []
        };
    }

    /**
     * Cria células para estrutura de matriz
     */
    createMatrixCells(data) {
        const cells = [];
        for (let i = 0; i < data.length; i++) {
            const row = [];
            for (let j = 0; j < data[i].length; j++) {
                row.push({
                    text: data[i][j],
                    position: { row: i, col: j }
                });
            }
            cells.push(row);
        }
        return cells;
    }

    /**
     * Converte lista para SmartArt
     */
    convertListToSmartArt(data) {
        const template = this.templates.get('basicList');
        return template.createStructure(data);
    }

    /**
     * Converte árvore para SmartArt
     */
    convertTreeToSmartArt(data) {
        const template = this.templates.get('hierarchy');
        return template.createStructure(data);
    }

    /**
     * Converte tabela para SmartArt
     */
    convertTableToSmartArt(data) {
        const template = this.templates.get('matrix');
        return template.createStructure(data);
    }

    /**
     * Converte fluxograma para SmartArt
     */
    convertFlowchartToSmartArt(data) {
        const template = this.templates.get('process');
        return template.createStructure(data.steps);
    }

    /**
     * Converte organograma para SmartArt
     */
    convertOrgchartToSmartArt(data) {
        const template = this.templates.get('hierarchy');
        return template.createStructure(data);
    }

    /**
     * Organiza lista vertical
     */
    arrangeVerticalList(items) {
        let y = 0;
        const spacing = 50;
        
        return items.map(item => {
            const position = { x: 0, y: y };
            y += spacing;
            return { ...item, position };
        });
    }

    /**
     * Organiza lista horizontal
     */
    arrangeHorizontalList(items) {
        let x = 0;
        const spacing = 100;
        
        return items.map(item => {
            const position = { x: x, y: 0 };
            x += spacing;
            return { ...item, position };
        });
    }

    /**
     * Organiza hierarquia top-down
     */
    arrangeTopDownHierarchy(nodes, level = 0, x = 0) {
        const spacing = { x: 120, y: 80 };
        const result = [];
        
        // Posiciona nó atual
        const currentNode = {
            ...nodes,
            position: { x: x, y: level * spacing.y }
        };
        result.push(currentNode);
        
        // Posiciona filhos
        if (nodes.children && nodes.children.length > 0) {
            const childrenWidth = (nodes.children.length - 1) * spacing.x;
            const startX = x - childrenWidth / 2;
            
            nodes.children.forEach((child, index) => {
                const childX = startX + index * spacing.x;
                result.push(...this.arrangeTopDownHierarchy(child, level + 1, childX));
            });
        }
        
        return result;
    }

    /**
     * Organiza hierarquia bottom-up
     */
    arrangeBottomUpHierarchy(nodes) {
        const arranged = this.arrangeTopDownHierarchy(nodes);
        // Inverte as posições Y
        const maxY = Math.max(...arranged.map(node => node.position.y));
        return arranged.map(node => ({
            ...node,
            position: {
                x: node.position.x,
                y: maxY - node.position.y
            }
        }));
    }

    /**
     * Organiza ciclo circular
     */
    arrangeCircularCycle(steps) {
        const radius = 150;
        const centerX = radius;
        const centerY = radius;
        
        return steps.map((step, index) => {
            const angle = (2 * Math.PI * index) / steps.length;
            return {
                ...step,
                position: {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle)
                }
            };
        });
    }

    /**
     * Organiza ciclo linear
     */
    arrangeLinearCycle(steps) {
        const arranged = this.arrangeHorizontalList(steps);
        // Adiciona conexão do último para o primeiro
        const first = arranged[0];
        const last = arranged[arranged.length - 1];
        arranged.push({
            type: 'connection',
            from: last.position,
            to: first.position
        });
        return arranged;
    }

    /**
     * Organiza processo horizontal
     */
    arrangeHorizontalProcess(steps) {
        return this.arrangeHorizontalList(steps);
    }

    /**
     * Organiza processo vertical
     */
    arrangeVerticalProcess(steps) {
        return this.arrangeVerticalList(steps);
    }

    /**
     * Organiza matriz em grid
     */
    arrangeGridMatrix(cells) {
        const spacing = { x: 100, y: 80 };
        const arranged = [];
        
        cells.forEach((row, i) => {
            row.forEach((cell, j) => {
                arranged.push({
                    ...cell,
                    position: {
                        x: j * spacing.x,
                        y: i * spacing.y
                    }
                });
            });
        });
        
        return arranged;
    }

    /**
     * Organiza matriz em pirâmide
     */
    arrangePyramidMatrix(cells) {
        const spacing = { x: 100, y: 80 };
        const arranged = [];
        let y = 0;
        
        cells.forEach((row, i) => {
            const rowWidth = row.length * spacing.x;
            const startX = -rowWidth / 2;
            
            row.forEach((cell, j) => {
                arranged.push({
                    ...cell,
                    position: {
                        x: startX + j * spacing.x,
                        y: y
                    }
                });
            });
            
            y += spacing.y;
        });
        
        return arranged;
    }

    /**
     * Cria SmartArt a partir de dados
     */
    createSmartArt(data, type, layout) {
        // Encontra conversor apropriado
        const converter = Array.from(this.converters.values())
            .find(conv => conv.canConvert(data));
            
        if (!converter) {
            throw new Error('Formato de dados não suportado');
        }

        // Converte dados para estrutura SmartArt
        const structure = converter.convert(data);
        
        // Aplica layout
        const layoutConfig = this.layouts.get(type);
        if (!layoutConfig || !layoutConfig[layout]) {
            throw new Error('Layout não suportado');
        }
        
        return layoutConfig[layout].arrange(structure);
    }

    /**
     * Converte dados estruturados para SmartArt
     */
    convert(data, options = {}) {
        const { type = 'list', layout = 'vertical' } = options;
        return this.createSmartArt(data, type, layout);
    }
}

module.exports = PPTXSmartArtManager;