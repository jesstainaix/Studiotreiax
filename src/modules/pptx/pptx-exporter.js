/**
 * Exportador PPTX para o PPTX Studio
 * Implementa a exportação para formato PPTX nativo
 */
class PPTXExporter {
    constructor() {
        this.pptxgen = require('pptxgenjs');
        this.path = require('path');
        this.fs = require('fs').promises;
    }

    /**
     * Exporta apresentação para PPTX
     */
    async exportToPPTX(presentation, config) {
        const pptx = new this.pptxgen();
        
        // Configura metadados
        this.configureMetadata(pptx, presentation);
        
        // Configura tema
        this.configureTheme(pptx, presentation);
        
        // Processa cada slide
        for (const slide of presentation.slides) {
            await this.processSlide(pptx, slide, config);
        }
        
        // Define caminho de saída
        const outputPath = this.path.join(
            config.outputDir,
            `${presentation.name || 'presentation'}.pptx`
        );
        
        // Salva apresentação
        await pptx.writeFile({ fileName: outputPath });
        
        return {
            filePath: outputPath,
            format: 'pptx',
            size: await this.getFileSize(outputPath)
        };
    }

    /**
     * Configura metadados da apresentação
     */
    configureMetadata(pptx, presentation) {
        pptx.author = presentation.author || '';
        pptx.company = presentation.company || '';
        pptx.revision = presentation.revision || '1';
        pptx.subject = presentation.subject || '';
        pptx.title = presentation.title || '';
    }

    /**
     * Configura tema da apresentação
     */
    configureTheme(pptx, presentation) {
        if (presentation.theme) {
            pptx.theme = {
                headFontFace: presentation.theme.headingFont || 'Arial',
                bodyFontFace: presentation.theme.bodyFont || 'Arial',
                colors: {
                    accent1: presentation.theme.accent1 || '4472C4',
                    accent2: presentation.theme.accent2 || 'ED7D31',
                    accent3: presentation.theme.accent3 || 'A5A5A5',
                    accent4: presentation.theme.accent4 || 'FFC000',
                    accent5: presentation.theme.accent5 || '5B9BD5',
                    accent6: presentation.theme.accent6 || '70AD47'
                }
            };
        }
    }

    /**
     * Processa slide individual
     */
    async processSlide(pptx, slide, config) {
        const pptxSlide = pptx.addSlide();
        
        // Configura layout
        if (slide.layout) {
            pptxSlide.layout = slide.layout;
        }
        
        // Configura background
        if (slide.background) {
            await this.processBackground(pptxSlide, slide.background, config);
        }
        
        // Processa elementos
        for (const element of slide.elements) {
            await this.processElement(pptxSlide, element, config);
        }
        
        // Configura transição
        if (slide.transition && config.preserveAnimations) {
            this.processTransition(pptxSlide, slide.transition);
        }
        
        // Configura animações
        if (slide.animations && config.preserveAnimations) {
            this.processAnimations(pptxSlide, slide.animations);
        }
    }

    /**
     * Processa background do slide
     */
    async processBackground(slide, background, config) {
        if (typeof background === 'string') {
            // Cor sólida
            slide.background = { fill: background };
        } else if (background.type === 'image') {
            // Imagem
            const imagePath = await this.processResource(background.src, config);
            slide.background = { path: imagePath };
        } else if (background.type === 'gradient') {
            // Gradiente
            slide.background = {
                gradient: {
                    colors: background.colors,
                    angle: background.angle || 45
                }
            };
        }
    }

    /**
     * Processa elemento individual do slide
     */
    async processElement(slide, element, config) {
        switch (element.type) {
            case 'text':
                await this.processTextElement(slide, element);
                break;
            
            case 'image':
                await this.processImageElement(slide, element, config);
                break;
            
            case 'shape':
                await this.processShapeElement(slide, element);
                break;
            
            case 'chart':
                await this.processChartElement(slide, element);
                break;
            
            case 'table':
                await this.processTableElement(slide, element);
                break;
            
            case 'media':
                await this.processMediaElement(slide, element, config);
                break;
        }
    }

    /**
     * Processa elemento de texto
     */
    async processTextElement(slide, element) {
        const options = {
            x: element.x || 0,
            y: element.y || 0,
            w: element.width || '100%',
            h: element.height || 'auto',
            fontSize: element.fontSize || 18,
            fontFace: element.fontFamily || 'Arial',
            color: element.color || '000000',
            bold: element.bold || false,
            italic: element.italic || false,
            underline: element.underline || false,
            align: element.align || 'left',
            valign: element.verticalAlign || 'top',
            margin: element.margin || 0,
            lineSpacing: element.lineHeight || 1,
            rotation: element.rotation || 0,
            opacity: element.opacity || 1
        };

        if (element.style) {
            Object.assign(options, this.processTextStyle(element.style));
        }

        slide.addText(element.text || '', options);
    }

    /**
     * Processa elemento de imagem
     */
    async processImageElement(slide, element, config) {
        const imagePath = await this.processResource(element.src, config);
        
        const options = {
            path: imagePath,
            x: element.x || 0,
            y: element.y || 0,
            w: element.width || '100%',
            h: element.height || 'auto',
            sizing: {
                type: element.fit || 'contain',
                w: element.width || '100%',
                h: element.height || 'auto'
            },
            opacity: element.opacity || 1,
            rotate: element.rotation || 0
        };

        slide.addImage(options);
    }

    /**
     * Processa elemento de forma
     */
    async processShapeElement(slide, element) {
        const options = {
            x: element.x || 0,
            y: element.y || 0,
            w: element.width || '100%',
            h: element.height || 'auto',
            fill: element.fill || '000000',
            line: element.stroke ? {
                color: element.stroke.color || '000000',
                width: element.stroke.width || 1,
                dashType: element.stroke.style || 'solid'
            } : undefined,
            flipH: element.flipHorizontal || false,
            flipV: element.flipVertical || false,
            rotate: element.rotation || 0,
            opacity: element.opacity || 1
        };

        slide.addShape(element.shape || 'rect', options);
    }

    /**
     * Processa elemento de gráfico
     */
    async processChartElement(slide, element) {
        const options = {
            x: element.x || 0,
            y: element.y || 0,
            w: element.width || '100%',
            h: element.height || 'auto',
            chartColors: element.colors || undefined,
            showLegend: element.showLegend || true,
            showTitle: element.showTitle || true,
            title: element.title || '',
            legendPos: element.legendPosition || 'r'
        };

        const chartData = this.processChartData(element.data);
        slide.addChart(element.chartType || 'bar', chartData, options);
    }

    /**
     * Processa elemento de tabela
     */
    async processTableElement(slide, element) {
        const options = {
            x: element.x || 0,
            y: element.y || 0,
            w: element.width || '100%',
            colW: element.columnWidths || undefined,
            border: element.border ? {
                type: element.border.style || 'solid',
                color: element.border.color || '000000',
                pt: element.border.width || 1
            } : undefined,
            autoPage: element.autoPage || false,
            fontSize: element.fontSize || 12,
            fontFace: element.fontFamily || 'Arial',
            bold: element.bold || false,
            italic: element.italic || false,
            align: element.align || 'left',
            valign: element.verticalAlign || 'middle'
        };

        slide.addTable(element.data || [], options);
    }

    /**
     * Processa elemento de mídia
     */
    async processMediaElement(slide, element, config) {
        const mediaPath = await this.processResource(element.src, config);
        
        const options = {
            x: element.x || 0,
            y: element.y || 0,
            w: element.width || '100%',
            h: element.height || 'auto',
            path: mediaPath,
            autoPlay: element.autoPlay || false,
            loop: element.loop || false,
            controls: element.controls || true
        };

        if (element.type === 'video') {
            slide.addMedia('video', options);
        } else if (element.type === 'audio') {
            slide.addMedia('audio', options);
        }
    }

    /**
     * Processa transição do slide
     */
    processTransition(slide, transition) {
        slide.transition = {
            type: transition.type || 'fade',
            duration: transition.duration || 1,
            direction: transition.direction,
            timing: transition.timing || 'ease'
        };
    }

    /**
     * Processa animações do slide
     */
    processAnimations(slide, animations) {
        animations.forEach((animation, index) => {
            const options = {
                type: animation.type || 'fade',
                duration: animation.duration || 1,
                delay: animation.delay || 0,
                timing: animation.timing || 'ease',
                direction: animation.direction,
                sequence: index + 1
            };

            slide.animation = options;
        });
    }

    /**
     * Processa estilo de texto
     */
    processTextStyle(style) {
        return {
            fontFace: style.fontFamily,
            fontSize: style.fontSize,
            bold: style.bold,
            italic: style.italic,
            underline: style.underline,
            color: style.color,
            align: style.align,
            valign: style.verticalAlign,
            lineSpacing: style.lineHeight,
            bulletType: style.bulletType,
            indent: style.indent,
            paragraphSpacing: style.paragraphSpacing,
            shadow: style.shadow ? {
                type: style.shadow.type,
                color: style.shadow.color,
                blur: style.shadow.blur,
                offset: style.shadow.offset,
                angle: style.shadow.angle
            } : undefined
        };
    }

    /**
     * Processa dados de gráfico
     */
    processChartData(data) {
        if (!data || !data.labels || !data.datasets) {
            return [];
        }

        return data.datasets.map(dataset => ({
            name: dataset.label,
            labels: data.labels,
            values: dataset.data
        }));
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

module.exports = PPTXExporter;