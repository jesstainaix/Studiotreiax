/**
 * Sistema de suporte a diagramas e gráficos para PPTX
 */
class PPTXDiagramManager {
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
     * Inicializa templates padrão de diagramas
     */
    initializeTemplates() {
        // Fluxograma
        this.addTemplate('flowchart', {
            type: 'flowchart',
            createStructure: (data) => ({
                type: 'flowchart',
                nodes: this.createFlowchartNodes(data),
                connections: this.createFlowchartConnections(data)
            })
        });

        // Diagrama de sequência
        this.addTemplate('sequence', {
            type: 'sequence',
            createStructure: (data) => ({
                type: 'sequence',
                participants: this.createSequenceParticipants(data),
                messages: this.createSequenceMessages(data)
            })
        });

        // Diagrama ER
        this.addTemplate('er', {
            type: 'er',
            createStructure: (data) => ({
                type: 'er',
                entities: this.createEREntities(data),
                relationships: this.createERRelationships(data)
            })
        });

        // Mapa mental
        this.addTemplate('mindmap', {
            type: 'mindmap',
            createStructure: (data) => ({
                type: 'mindmap',
                root: this.createMindmapNode(data)
            })
        });

        // Diagrama de Venn
        this.addTemplate('venn', {
            type: 'venn',
            createStructure: (data) => ({
                type: 'venn',
                sets: this.createVennSets(data)
            })
        });
    }

    /**
     * Inicializa conversores para diferentes formatos
     */
    initializeConverters() {
        // Converter de passos para fluxograma
        this.addConverter('flowchart', {
            canConvert: (data) => data.hasOwnProperty('steps'),
            convert: (data) => this.convertToFlowchart(data)
        });

        // Converter de interações para diagrama de sequência
        this.addConverter('sequence', {
            canConvert: (data) => data.hasOwnProperty('interactions'),
            convert: (data) => this.convertToSequence(data)
        });

        // Converter de modelos para diagrama ER
        this.addConverter('er', {
            canConvert: (data) => data.hasOwnProperty('models'),
            convert: (data) => this.convertToER(data)
        });

        // Converter de ideias para mapa mental
        this.addConverter('mindmap', {
            canConvert: (data) => data.hasOwnProperty('concept'),
            convert: (data) => this.convertToMindmap(data)
        });

        // Converter de conjuntos para diagrama de Venn
        this.addConverter('venn', {
            canConvert: (data) => data.hasOwnProperty('sets'),
            convert: (data) => this.convertToVenn(data)
        });
    }

    /**
     * Inicializa layouts padrão de diagramas
     */
    initializeLayouts() {
        // Layout de fluxograma
        this.addLayout('flowchart', {
            vertical: {
                arrange: (nodes, connections) => this.arrangeFlowchartVertical(nodes, connections)
            },
            horizontal: {
                arrange: (nodes, connections) => this.arrangeFlowchartHorizontal(nodes, connections)
            }
        });

        // Layout de diagrama de sequência
        this.addLayout('sequence', {
            standard: {
                arrange: (participants, messages) => this.arrangeSequence(participants, messages)
            }
        });

        // Layout de diagrama ER
        this.addLayout('er', {
            standard: {
                arrange: (entities, relationships) => this.arrangeER(entities, relationships)
            }
        });

        // Layout de mapa mental
        this.addLayout('mindmap', {
            radial: {
                arrange: (root) => this.arrangeMindmapRadial(root)
            },
            tree: {
                arrange: (root) => this.arrangeMindmapTree(root)
            }
        });

        // Layout de diagrama de Venn
        this.addLayout('venn', {
            standard: {
                arrange: (sets) => this.arrangeVenn(sets)
            }
        });
    }

    /**
     * Cria nós de fluxograma
     */
    createFlowchartNodes(data) {
        return data.steps.map((step, index) => ({
            id: \`node_\${index}\`,
            text: step.text,
            type: step.type || 'process',
            position: { x: 0, y: 0 } // Posição inicial, será ajustada pelo layout
        }));
    }

    /**
     * Cria conexões de fluxograma
     */
    createFlowchartConnections(data) {
        const connections = [];
        for (let i = 0; i < data.steps.length - 1; i++) {
            connections.push({
                from: \`node_\${i}\`,
                to: \`node_\${i + 1}\`,
                type: data.steps[i].connectionType || 'arrow'
            });
        }
        return connections;
    }

    /**
     * Cria participantes de diagrama de sequência
     */
    createSequenceParticipants(data) {
        const participants = new Set();
        data.interactions.forEach(interaction => {
            participants.add(interaction.from);
            participants.add(interaction.to);
        });
        return Array.from(participants).map((name, index) => ({
            id: \`participant_\${index}\`,
            name: name,
            position: { x: index * 150, y: 0 }
        }));
    }

    /**
     * Cria mensagens de diagrama de sequência
     */
    createSequenceMessages(data) {
        return data.interactions.map((interaction, index) => ({
            id: \`message_\${index}\`,
            text: interaction.message,
            from: interaction.from,
            to: interaction.to,
            type: interaction.type || 'sync'
        }));
    }

    /**
     * Cria entidades de diagrama ER
     */
    createEREntities(data) {
        return data.models.map((model, index) => ({
            id: \`entity_\${index}\`,
            name: model.name,
            attributes: model.attributes,
            position: { x: 0, y: 0 }
        }));
    }

    /**
     * Cria relacionamentos de diagrama ER
     */
    createERRelationships(data) {
        return data.relationships.map((rel, index) => ({
            id: \`relationship_\${index}\`,
            name: rel.name,
            from: rel.from,
            to: rel.to,
            cardinality: rel.cardinality
        }));
    }

    /**
     * Cria nó de mapa mental
     */
    createMindmapNode(data) {
        return {
            text: data.concept,
            children: data.ideas ? data.ideas.map(idea => this.createMindmapNode(idea)) : [],
            position: { x: 0, y: 0 }
        };
    }

    /**
     * Cria conjuntos de diagrama de Venn
     */
    createVennSets(data) {
        return data.sets.map((set, index) => ({
            id: \`set_\${index}\`,
            name: set.name,
            elements: set.elements,
            position: { x: 0, y: 0 },
            radius: 100
        }));
    }

    /**
     * Organiza fluxograma verticalmente
     */
    arrangeFlowchartVertical(nodes, connections) {
        const spacing = { y: 100 };
        let y = 0;
        
        // Posiciona nós
        nodes.forEach(node => {
            node.position.y = y;
            y += spacing.y;
        });
        
        return { nodes, connections };
    }

    /**
     * Organiza fluxograma horizontalmente
     */
    arrangeFlowchartHorizontal(nodes, connections) {
        const spacing = { x: 150 };
        let x = 0;
        
        // Posiciona nós
        nodes.forEach(node => {
            node.position.x = x;
            x += spacing.x;
        });
        
        return { nodes, connections };
    }

    /**
     * Organiza diagrama de sequência
     */
    arrangeSequence(participants, messages) {
        const spacing = { x: 150, y: 50 };
        let y = 100; // Espaço inicial para participantes
        
        // Organiza mensagens
        messages.forEach(message => {
            message.position = { y: y };
            y += spacing.y;
        });
        
        return { participants, messages };
    }

    /**
     * Organiza diagrama ER
     */
    arrangeER(entities, relationships) {
        const spacing = { x: 200, y: 150 };
        const cols = Math.ceil(Math.sqrt(entities.length));
        
        // Posiciona entidades em grid
        entities.forEach((entity, index) => {
            entity.position = {
                x: (index % cols) * spacing.x,
                y: Math.floor(index / cols) * spacing.y
            };
        });
        
        return { entities, relationships };
    }

    /**
     * Organiza mapa mental radialmente
     */
    arrangeMindmapRadial(root) {
        const centerX = 300;
        const centerY = 300;
        const radius = 150;
        
        function arrangeNode(node, angle, level) {
            node.position = {
                x: centerX + radius * level * Math.cos(angle),
                y: centerY + radius * level * Math.sin(angle)
            };
            
            if (node.children) {
                const childAngleStep = 2 * Math.PI / node.children.length;
                node.children.forEach((child, index) => {
                    arrangeNode(child, angle + index * childAngleStep, level + 1);
                });
            }
        }
        
        arrangeNode(root, 0, 0);
        return root;
    }

    /**
     * Organiza mapa mental em árvore
     */
    arrangeMindmapTree(root) {
        const spacing = { x: 150, y: 80 };
        
        function arrangeNode(node, x, y) {
            node.position = { x, y };
            
            if (node.children) {
                const totalWidth = (node.children.length - 1) * spacing.x;
                const startX = x - totalWidth / 2;
                
                node.children.forEach((child, index) => {
                    arrangeNode(child, startX + index * spacing.x, y + spacing.y);
                });
            }
        }
        
        arrangeNode(root, 300, 50);
        return root;
    }

    /**
     * Organiza diagrama de Venn
     */
    arrangeVenn(sets) {
        const center = { x: 300, y: 300 };
        const radius = 100;
        
        switch (sets.length) {
            case 2:
                // Dois conjuntos
                sets[0].position = { x: center.x - radius/2, y: center.y };
                sets[1].position = { x: center.x + radius/2, y: center.y };
                break;
                
            case 3:
                // Três conjuntos
                sets[0].position = { x: center.x - radius, y: center.y + radius };
                sets[1].position = { x: center.x + radius, y: center.y + radius };
                sets[2].position = { x: center.x, y: center.y - radius };
                break;
                
            default:
                // Posicionamento circular para mais conjuntos
                sets.forEach((set, index) => {
                    const angle = (2 * Math.PI * index) / sets.length;
                    set.position = {
                        x: center.x + radius * Math.cos(angle),
                        y: center.y + radius * Math.sin(angle)
                    };
                });
        }
        
        return sets;
    }

    /**
     * Converte dados para fluxograma
     */
    convertToFlowchart(data) {
        const template = this.templates.get('flowchart');
        return template.createStructure(data);
    }

    /**
     * Converte dados para diagrama de sequência
     */
    convertToSequence(data) {
        const template = this.templates.get('sequence');
        return template.createStructure(data);
    }

    /**
     * Converte dados para diagrama ER
     */
    convertToER(data) {
        const template = this.templates.get('er');
        return template.createStructure(data);
    }

    /**
     * Converte dados para mapa mental
     */
    convertToMindmap(data) {
        const template = this.templates.get('mindmap');
        return template.createStructure(data);
    }

    /**
     * Converte dados para diagrama de Venn
     */
    convertToVenn(data) {
        const template = this.templates.get('venn');
        return template.createStructure(data);
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
     * Converte dados estruturados para diagrama
     */
    convert(data, options = {}) {
        const { type = 'flowchart', layout = 'vertical' } = options;
        
        // Encontra conversor apropriado
        const converter = Array.from(this.converters.values())
            .find(conv => conv.canConvert(data));
            
        if (!converter) {
            throw new Error('Formato de dados não suportado');
        }

        // Converte dados para estrutura de diagrama
        const structure = converter.convert(data);
        
        // Aplica layout
        const layoutConfig = this.layouts.get(type);
        if (!layoutConfig || !layoutConfig[layout]) {
            throw new Error('Layout não suportado');
        }
        
        return layoutConfig[layout].arrange(structure);
    }
}

module.exports = PPTXDiagramManager;