/**
 * Exportador HTML para o PPTX Studio
 * Implementa a exportação para apresentações web interativas
 */
class HTMLExporter {
    constructor() {
        this.path = require('path');
        this.fs = require('fs').promises;
        this.handlebars = require('handlebars');
        this.esbuild = require('esbuild');
    }

    /**
     * Exporta apresentação para HTML
     */
    async exportToHTML(presentation, config) {
        // Gera arquivos da apresentação
        const files = await this.generatePresentationFiles(presentation, config);
        
        // Define caminho de saída
        const outputDir = this.path.join(
            config.outputDir,
            presentation.name || 'presentation'
        );
        
        // Cria diretório de saída
        await this.fs.mkdir(outputDir, { recursive: true });
        
        // Salva arquivos
        await Promise.all([
            // HTML principal
            this.fs.writeFile(
                this.path.join(outputDir, 'index.html'),
                files.html
            ),
            
            // JavaScript
            this.fs.writeFile(
                this.path.join(outputDir, 'presentation.js'),
                files.js
            ),
            
            // CSS
            this.fs.writeFile(
                this.path.join(outputDir, 'styles.css'),
                files.css
            )
        ]);
        
        // Copia recursos
        if (files.resources.length > 0) {
            const resourcesDir = this.path.join(outputDir, 'resources');
            await this.fs.mkdir(resourcesDir, { recursive: true });
            
            await Promise.all(
                files.resources.map(resource =>
                    this.fs.copyFile(resource.src, this.path.join(resourcesDir, resource.dest))
                )
            );
        }
        
        // Bundle JavaScript
        if (config.bundleJS) {
            await this.bundleJavaScript(outputDir);
        }
        
        return {
            filePath: outputDir,
            format: 'html',
            files: await this.getDirectorySize(outputDir)
        };
    }

    /**
     * Gera arquivos da apresentação
     */
    async generatePresentationFiles(presentation, config) {
        // Carrega templates
        const [htmlTemplate, jsTemplate, cssTemplate] = await Promise.all([
            this.fs.readFile(this.path.join(__dirname, 'templates', 'html-template.html'), 'utf8'),
            this.fs.readFile(this.path.join(__dirname, 'templates', 'presentation-template.js'), 'utf8'),
            this.fs.readFile(this.path.join(__dirname, 'templates', 'styles-template.css'), 'utf8')
        ]);
        
        // Compila templates
        const compileHTML = this.handlebars.compile(htmlTemplate);
        const compileJS = this.handlebars.compile(jsTemplate);
        const compileCSS = this.handlebars.compile(cssTemplate);
        
        // Processa slides
        const slides = await Promise.all(
            presentation.slides.map(slide => this.processSlide(slide, config))
        );
        
        // Coleta recursos
        const resources = new Set();
        slides.forEach(slide => {
            slide.resources.forEach(resource => resources.add(resource));
        });
        
        // Gera arquivos
        return {
            html: compileHTML({
                title: presentation.title || 'Presentation',
                theme: presentation.theme || {}
            }),
            
            js: compileJS({
                slides: slides.map(slide => slide.data),
                config: {
                    autoPlay: config.autoPlay || false,
                    loop: config.loop || false,
                    transitionDuration: config.transitionDuration || 1000,
                    preserveAnimations: config.preserveAnimations !== false
                }
            }),
            
            css: compileCSS({
                theme: presentation.theme || {}
            }),
            
            resources: Array.from(resources)
        };
    }

    /**
     * Processa slide para formato web
     */
    async processSlide(slide, config) {
        const resources = new Set();
        
        // Processa background
        const background = await this.processBackground(slide.background, config, resources);
        
        // Processa elementos
        const elements = await Promise.all(
            slide.elements.map(element => this.processElement(element, config, resources))
        );
        
        return {
            data: {
                background,
                elements,
                transition: slide.transition || {},
                animations: slide.animations || []
            },
            resources: Array.from(resources)
        };
    }

    /**
     * Processa background do slide
     */
    async processBackground(background, config, resources) {
        if (!background) return null;

        if (typeof background === 'string') {
            // Cor sólida
            return { type: 'color', value: background };
        }

        switch (background.type) {
            case 'image':
                // Processa imagem
                const processedPath = await this.processResource(background.src, config);
                const fileName = this.path.basename(processedPath);
                resources.add({
                    src: processedPath,
                    dest: fileName
                });
                
                return {
                    type: 'image',
                    src: \`resources/\${fileName}\`,
                    style: background.style || {}
                };
                
            case 'gradient':
                // Gradiente
                return {
                    type: 'gradient',
                    colors: background.colors || [],
                    angle: background.angle || 45
                };
                
            default:
                return null;
        }
    }

    /**
     * Processa elemento do slide
     */
    async processElement(element, config, resources) {
        switch (element.type) {
            case 'text':
                return this.processTextElement(element);
                
            case 'image':
                return this.processImageElement(element, config, resources);
                
            case 'shape':
                return this.processShapeElement(element);
                
            case 'chart':
                return this.processChartElement(element);
                
            case 'table':
                return this.processTableElement(element);
                
            case 'media':
                return this.processMediaElement(element, config, resources);
                
            default:
                return null;
        }
    }

    /**
     * Processa elemento de texto
     */
    processTextElement(element) {
        return {
            type: 'text',
            content: element.text || '',
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                height: \`\${element.height || 'auto'}\`,
                fontSize: \`\${element.fontSize || 18}px\`,
                fontFamily: element.fontFamily || 'Arial',
                color: element.color || '#000000',
                fontWeight: element.bold ? 'bold' : 'normal',
                fontStyle: element.italic ? 'italic' : 'normal',
                textDecoration: element.underline ? 'underline' : 'none',
                textAlign: element.align || 'left',
                lineHeight: element.lineHeight || 1.2,
                opacity: element.opacity || 1,
                transform: element.rotation ? \`rotate(\${element.rotation}deg)\` : 'none'
            },
            animation: element.animation || null
        };
    }

    /**
     * Processa elemento de imagem
     */
    async processImageElement(element, config, resources) {
        const processedPath = await this.processResource(element.src, config);
        const fileName = this.path.basename(processedPath);
        resources.add({
            src: processedPath,
            dest: fileName
        });
        
        return {
            type: 'image',
            src: \`resources/\${fileName}\`,
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                height: \`\${element.height || 'auto'}\`,
                objectFit: element.fit || 'contain',
                opacity: element.opacity || 1,
                transform: element.rotation ? \`rotate(\${element.rotation}deg)\` : 'none'
            },
            animation: element.animation || null
        };
    }

    /**
     * Processa elemento de forma
     */
    processShapeElement(element) {
        return {
            type: 'shape',
            shape: element.shape || 'rect',
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                height: \`\${element.height || 'auto'}\`,
                backgroundColor: element.fill || '#000000',
                border: element.stroke ? \`\${element.stroke.width}px \${element.stroke.style} \${element.stroke.color}\` : 'none',
                transform: \`
                    \${element.flipHorizontal ? 'scaleX(-1)' : ''}
                    \${element.flipVertical ? 'scaleY(-1)' : ''}
                    \${element.rotation ? \`rotate(\${element.rotation}deg)\` : ''}
                \`,
                opacity: element.opacity || 1
            },
            animation: element.animation || null
        };
    }

    /**
     * Processa elemento de gráfico
     */
    processChartElement(element) {
        return {
            type: 'chart',
            chartType: element.chartType || 'bar',
            data: element.data || {},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: element.showLegend !== false,
                        position: element.legendPosition || 'top'
                    },
                    title: {
                        display: element.showTitle !== false,
                        text: element.title || ''
                    }
                }
            },
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                height: \`\${element.height || 'auto'}\`
            },
            animation: element.animation || null
        };
    }

    /**
     * Processa elemento de tabela
     */
    processTableElement(element) {
        return {
            type: 'table',
            data: element.data || [],
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                fontSize: \`\${element.fontSize || 12}px\`,
                fontFamily: element.fontFamily || 'Arial',
                border: element.border ? \`\${element.border.width}px \${element.border.style} \${element.border.color}\` : '1px solid #000000',
                borderCollapse: 'collapse'
            },
            cellStyle: {
                padding: '8px',
                textAlign: element.align || 'left',
                verticalAlign: element.verticalAlign || 'middle',
                fontWeight: element.bold ? 'bold' : 'normal',
                fontStyle: element.italic ? 'italic' : 'normal'
            },
            animation: element.animation || null
        };
    }

    /**
     * Processa elemento de mídia
     */
    async processMediaElement(element, config, resources) {
        const processedPath = await this.processResource(element.src, config);
        const fileName = this.path.basename(processedPath);
        resources.add({
            src: processedPath,
            dest: fileName
        });
        
        return {
            type: element.type, // 'video' ou 'audio'
            src: \`resources/\${fileName}\`,
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                height: \`\${element.height || 'auto'}\`
            },
            options: {
                autoplay: element.autoPlay || false,
                loop: element.loop || false,
                controls: element.controls !== false,
                muted: element.muted || false
            },
            animation: element.animation || null
        };
    }

    /**
     * Processa recurso (imagem/mídia)
     */
    async processResource(src, config) {
        if (!src) return null;

        // Verifica se é recurso processado
        if (src.endsWith('.processed')) {
            return src;
        }

        // Usa recurso original se não houver processamento
        if (!config.processResources) {
            return src;
        }

        // Retorna recurso processado
        const processedPath = src + '.processed';
        if (await this.fileExists(processedPath)) {
            return processedPath;
        }

        return src;
    }

    /**
     * Bundle JavaScript com esbuild
     */
    async bundleJavaScript(outputDir) {
        await this.esbuild.build({
            entryPoints: [this.path.join(outputDir, 'presentation.js')],
            bundle: true,
            minify: true,
            sourcemap: true,
            target: ['es2020'],
            outfile: this.path.join(outputDir, 'presentation.min.js'),
            define: {
                'process.env.NODE_ENV': '"production"'
            }
        });
    }

    /**
     * Verifica se arquivo existe
     */
    async fileExists(path) {
        try {
            await this.fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Obtém tamanho do diretório
     */
    async getDirectorySize(dir) {
        let size = 0;
        const files = await this.fs.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
            const path = this.path.join(dir, file.name);
            
            if (file.isDirectory()) {
                size += await this.getDirectorySize(path);
            } else {
                const stats = await this.fs.stat(path);
                size += stats.size;
            }
        }
        
        return size;
    }
}

module.exports = HTMLExporter;