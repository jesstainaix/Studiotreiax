/**
 * Exportador PDF para o PPTX Studio
 * Implementa a exportação para formato PDF com alta fidelidade
 */
class PDFExporter {
    constructor() {
        this.puppeteer = require('puppeteer');
        this.path = require('path');
        this.fs = require('fs').promises;
        this.handlebars = require('handlebars');
    }

    /**
     * Exporta apresentação para PDF
     */
    async exportToPDF(presentation, config) {
        // Gera HTML temporário
        const htmlPath = await this.generateHTML(presentation, config);
        
        // Configura browser
        const browser = await this.puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            // Abre página
            const page = await browser.newPage();
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 2
            });

            // Carrega apresentação
            await page.goto(\`file:\${htmlPath}\`, {
                waitUntil: 'networkidle0'
            });

            // Define caminho de saída
            const outputPath = this.path.join(
                config.outputDir,
                \`\${presentation.name || 'presentation'}.pdf\`
            );

            // Exporta PDF
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0.4in',
                    right: '0.4in',
                    bottom: '0.4in',
                    left: '0.4in'
                },
                displayHeaderFooter: true,
                headerTemplate: this.generateHeader(presentation),
                footerTemplate: this.generateFooter(),
                preferCSSPageSize: true
            });

            // Limpa arquivos temporários
            await this.fs.unlink(htmlPath);

            return {
                filePath: outputPath,
                format: 'pdf',
                size: await this.getFileSize(outputPath)
            };

        } finally {
            await browser.close();
        }
    }

    /**
     * Gera arquivo HTML temporário
     */
    async generateHTML(presentation, config) {
        // Carrega template
        const templatePath = this.path.join(__dirname, 'templates', 'pdf-template.html');
        const template = await this.fs.readFile(templatePath, 'utf8');
        
        // Compila template
        const compile = this.handlebars.compile(template);
        
        // Processa slides
        const slides = await Promise.all(
            presentation.slides.map(slide => this.processSlide(slide, config))
        );
        
        // Gera HTML
        const html = compile({
            title: presentation.title || 'Presentation',
            theme: presentation.theme || {},
            slides: slides
        });
        
        // Salva HTML temporário
        const htmlPath = this.path.join(config.tempDir, \`\${Date.now()}.html\`);
        await this.fs.writeFile(htmlPath, html);
        
        return htmlPath;
    }

    /**
     * Processa slide para HTML
     */
    async processSlide(slide, config) {
        // Processa background
        const background = await this.processBackground(slide.background, config);
        
        // Processa elementos
        const elements = await Promise.all(
            slide.elements.map(element => this.processElement(element, config))
        );
        
        return {
            background,
            elements,
            notes: slide.notes || ''
        };
    }

    /**
     * Processa background do slide
     */
    async processBackground(background, config) {
        if (!background) return null;

        if (typeof background === 'string') {
            // Cor sólida
            return { type: 'color', value: background };
        }

        switch (background.type) {
            case 'image':
                // Imagem
                const imagePath = await this.processResource(background.src, config);
                return {
                    type: 'image',
                    src: await this.getDataUrl(imagePath),
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
    async processElement(element, config) {
        switch (element.type) {
            case 'text':
                return this.processTextElement(element);
                
            case 'image':
                return this.processImageElement(element, config);
                
            case 'shape':
                return this.processShapeElement(element);
                
            case 'chart':
                return this.processChartElement(element);
                
            case 'table':
                return this.processTableElement(element);
                
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
            }
        };
    }

    /**
     * Processa elemento de imagem
     */
    async processImageElement(element, config) {
        const imagePath = await this.processResource(element.src, config);
        
        return {
            type: 'image',
            src: await this.getDataUrl(imagePath),
            style: {
                position: 'absolute',
                left: \`\${element.x || 0}%\`,
                top: \`\${element.y || 0}%\`,
                width: \`\${element.width || 100}%\`,
                height: \`\${element.height || 'auto'}\`,
                objectFit: element.fit || 'contain',
                opacity: element.opacity || 1,
                transform: element.rotation ? \`rotate(\${element.rotation}deg)\` : 'none'
            }
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
            }
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
            }
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
            }
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
     * Converte arquivo para Data URL
     */
    async getDataUrl(filePath) {
        if (!filePath) return '';
        
        const buffer = await this.fs.readFile(filePath);
        const mimeType = this.getMimeType(filePath);
        return \`data:\${mimeType};base64,\${buffer.toString('base64')}\`;
    }

    /**
     * Obtém MIME type do arquivo
     */
    getMimeType(filePath) {
        const ext = this.path.extname(filePath).toLowerCase();
        
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.png':
                return 'image/png';
            case '.gif':
                return 'image/gif';
            case '.svg':
                return 'image/svg+xml';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * Gera cabeçalho do PDF
     */
    generateHeader(presentation) {
        return \`
            <div style="
                font-size: 8px;
                padding: 5px 10px;
                border-bottom: 1px solid #ddd;
            ">
                \${presentation.title || ''}
                <span style="float: right;">
                    \${presentation.author || ''}
                </span>
            </div>
        \`;
    }

    /**
     * Gera rodapé do PDF
     */
    generateFooter() {
        return \`
            <div style="
                font-size: 8px;
                padding: 5px 10px;
                border-top: 1px solid #ddd;
                text-align: center;
            ">
                Página <span class="pageNumber"></span> de <span class="totalPages"></span>
            </div>
        \`;
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
     * Obtém tamanho do arquivo
     */
    async getFileSize(path) {
        const stats = await this.fs.stat(path);
        return stats.size;
    }
}

module.exports = PDFExporter;