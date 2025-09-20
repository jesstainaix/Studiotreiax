/**
 * Sistema de pré-visualização em tempo real de slides PPTX
 */
class PPTXPreviewManager {
    constructor(config = {}) {
        // Configurações padrão
        this.canvas = null;
        this.ctx = null;
        this.slides = [];
        this.currentSlide = 0;
        this.scale = config.scale || 1;
        this.width = config.width || 960;
        this.height = config.height || 540;
        this.backgroundColor = config.backgroundColor || '#FFFFFF';
        this.renderQueue = new Map();
        this.observers = new Set();
        
        // Inicializa o sistema de renderização
        this.initializeRenderer();
    }

    /**
     * Inicializa o sistema de renderização
     */
    initializeRenderer() {
        // Cria canvas para renderização
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.ctx = this.canvas.getContext('2d');
        
        // Configura escala
        this.ctx.scale(this.scale, this.scale);
        
        // Configura sistema de renderização assíncrona
        this.setupRenderLoop();
    }

    /**
     * Configura loop de renderização assíncrona
     */
    setupRenderLoop() {
        let animationFrame = null;
        let lastRenderTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        const renderLoop = (timestamp) => {
            if (timestamp - lastRenderTime >= frameInterval) {
                this.processRenderQueue();
                lastRenderTime = timestamp;
            }
            
            animationFrame = requestAnimationFrame(renderLoop);
        };
        
        animationFrame = requestAnimationFrame(renderLoop);
    }

    /**
     * Processa fila de renderização
     */
    processRenderQueue() {
        for (const [elementId, element] of this.renderQueue) {
            this.renderElement(element);
            this.renderQueue.delete(elementId);
        }
        
        // Notifica observadores
        this.notifyObservers();
    }

    /**
     * Adiciona slide para pré-visualização
     */
    addSlide(slide) {
        this.slides.push(slide);
        this.requestRender();
    }

    /**
     * Remove slide da pré-visualização
     */
    removeSlide(index) {
        this.slides.splice(index, 1);
        this.requestRender();
    }

    /**
     * Atualiza slide existente
     */
    updateSlide(index, slide) {
        this.slides[index] = slide;
        this.requestRender();
    }

    /**
     * Navega para slide específico
     */
    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
            this.requestRender();
        }
    }

    /**
     * Solicita renderização
     */
    requestRender() {
        this.clearCanvas();
        this.renderCurrentSlide();
    }

    /**
     * Limpa o canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Renderiza o slide atual
     */
    renderCurrentSlide() {
        const slide = this.slides[this.currentSlide];
        if (!slide) return;

        // Renderiza elementos do slide
        for (const element of slide.elements) {
            this.queueElementRender(element);
        }
    }

    /**
     * Adiciona elemento à fila de renderização
     */
    queueElementRender(element) {
        this.renderQueue.set(element.id, element);
    }

    /**
     * Renderiza um elemento específico
     */
    renderElement(element) {
        switch (element.type) {
            case 'text':
                this.renderText(element);
                break;
            case 'shape':
                this.renderShape(element);
                break;
            case 'image':
                this.renderImage(element);
                break;
            case 'chart':
                this.renderChart(element);
                break;
            case 'smartart':
                this.renderSmartArt(element);
                break;
            case 'diagram':
                this.renderDiagram(element);
                break;
        }
    }

    /**
     * Renderiza elemento de texto
     */
    renderText(element) {
        this.ctx.save();
        
        // Configura estilo do texto
        this.ctx.font = \`\${element.fontSize}px \${element.fontFamily}\`;
        this.ctx.fillStyle = element.color;
        this.ctx.textAlign = element.align || 'left';
        
        // Aplica transformações
        this.ctx.translate(element.x, element.y);
        if (element.rotation) {
            this.ctx.rotate(element.rotation * Math.PI / 180);
        }
        
        // Renderiza texto
        if (element.wordWrap) {
            this.renderWrappedText(element);
        } else {
            this.ctx.fillText(element.text, 0, 0);
        }
        
        this.ctx.restore();
    }

    /**
     * Renderiza texto com quebra de linha
     */
    renderWrappedText(element) {
        const words = element.text.split(' ');
        const lineHeight = element.fontSize * 1.2;
        let line = '';
        let y = 0;
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > element.width) {
                this.ctx.fillText(line, 0, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        this.ctx.fillText(line, 0, y);
    }

    /**
     * Renderiza forma geométrica
     */
    renderShape(element) {
        this.ctx.save();
        
        // Configura estilo da forma
        this.ctx.fillStyle = element.fill;
        this.ctx.strokeStyle = element.stroke;
        this.ctx.lineWidth = element.strokeWidth || 1;
        
        // Aplica transformações
        this.ctx.translate(element.x, element.y);
        if (element.rotation) {
            this.ctx.rotate(element.rotation * Math.PI / 180);
        }
        
        // Renderiza forma específica
        switch (element.shape) {
            case 'rectangle':
                this.renderRectangle(element);
                break;
            case 'ellipse':
                this.renderEllipse(element);
                break;
            case 'triangle':
                this.renderTriangle(element);
                break;
            case 'polygon':
                this.renderPolygon(element);
                break;
        }
        
        this.ctx.restore();
    }

    /**
     * Renderiza retângulo
     */
    renderRectangle(element) {
        if (element.radius) {
            // Retângulo com cantos arredondados
            this.ctx.beginPath();
            this.ctx.roundRect(0, 0, element.width, element.height, element.radius);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            // Retângulo normal
            this.ctx.fillRect(0, 0, element.width, element.height);
            this.ctx.strokeRect(0, 0, element.width, element.height);
        }
    }

    /**
     * Renderiza elipse
     */
    renderEllipse(element) {
        this.ctx.beginPath();
        this.ctx.ellipse(
            element.width / 2, 
            element.height / 2,
            element.width / 2,
            element.height / 2,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.stroke();
    }

    /**
     * Renderiza triângulo
     */
    renderTriangle(element) {
        this.ctx.beginPath();
        this.ctx.moveTo(element.width / 2, 0);
        this.ctx.lineTo(element.width, element.height);
        this.ctx.lineTo(0, element.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    /**
     * Renderiza polígono
     */
    renderPolygon(element) {
        this.ctx.beginPath();
        element.points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    /**
     * Renderiza imagem
     */
    renderImage(element) {
        if (element.image) {
            this.ctx.save();
            
            // Aplica transformações
            this.ctx.translate(element.x, element.y);
            if (element.rotation) {
                this.ctx.rotate(element.rotation * Math.PI / 180);
            }
            
            // Renderiza imagem
            this.ctx.drawImage(
                element.image,
                0, 0,
                element.width,
                element.height
            );
            
            this.ctx.restore();
        }
    }

    /**
     * Renderiza gráfico
     */
    renderChart(element) {
        // Implementa renderização específica para cada tipo de gráfico
        switch (element.chartType) {
            case 'bar':
                this.renderBarChart(element);
                break;
            case 'line':
                this.renderLineChart(element);
                break;
            case 'pie':
                this.renderPieChart(element);
                break;
            case 'scatter':
                this.renderScatterChart(element);
                break;
        }
    }

    /**
     * Renderiza gráfico de barras
     */
    renderBarChart(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        
        const barWidth = element.width / element.data.length;
        const maxValue = Math.max(...element.data);
        
        element.data.forEach((value, index) => {
            const barHeight = (value / maxValue) * element.height;
            const x = index * barWidth;
            const y = element.height - barHeight;
            
            this.ctx.fillStyle = element.colors[index] || element.defaultColor;
            this.ctx.fillRect(x, y, barWidth * 0.8, barHeight);
        });
        
        this.ctx.restore();
    }

    /**
     * Renderiza gráfico de linha
     */
    renderLineChart(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        
        const step = element.width / (element.data.length - 1);
        const maxValue = Math.max(...element.data);
        
        this.ctx.beginPath();
        element.data.forEach((value, index) => {
            const x = index * step;
            const y = element.height - (value / maxValue) * element.height;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.strokeStyle = element.lineColor;
        this.ctx.lineWidth = element.lineWidth || 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * Renderiza gráfico de pizza
     */
    renderPieChart(element) {
        this.ctx.save();
        this.ctx.translate(element.x + element.width/2, element.y + element.height/2);
        
        const total = element.data.reduce((sum, value) => sum + value, 0);
        let startAngle = 0;
        
        element.data.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, Math.min(element.width, element.height)/2, 
                        startAngle, startAngle + sliceAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = element.colors[index] || element.defaultColor;
            this.ctx.fill();
            
            startAngle += sliceAngle;
        });
        
        this.ctx.restore();
    }

    /**
     * Renderiza gráfico de dispersão
     */
    renderScatterChart(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        
        const maxX = Math.max(...element.data.map(point => point.x));
        const maxY = Math.max(...element.data.map(point => point.y));
        
        element.data.forEach(point => {
            const x = (point.x / maxX) * element.width;
            const y = element.height - (point.y / maxY) * element.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, element.pointRadius || 4, 0, Math.PI * 2);
            this.ctx.fillStyle = point.color || element.defaultColor;
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }

    /**
     * Renderiza SmartArt
     */
    renderSmartArt(element) {
        // Delega renderização para o gerenciador de SmartArt
        if (element.smartArtManager) {
            element.smartArtManager.render(this.ctx, element);
        }
    }

    /**
     * Renderiza diagrama
     */
    renderDiagram(element) {
        // Delega renderização para o gerenciador de diagramas
        if (element.diagramManager) {
            element.diagramManager.render(this.ctx, element);
        }
    }

    /**
     * Adiciona observador para atualizações
     */
    addObserver(observer) {
        this.observers.add(observer);
    }

    /**
     * Remove observador
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Notifica observadores sobre mudanças
     */
    notifyObservers() {
        for (const observer of this.observers) {
            observer.update(this.canvas);
        }
    }

    /**
     * Retorna o canvas atual
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Atualiza configurações
     */
    updateConfig(config) {
        // Atualiza configurações
        if (config.scale) {
            this.scale = config.scale;
            this.canvas.width = this.width * this.scale;
            this.canvas.height = this.height * this.scale;
            this.ctx.scale(this.scale, this.scale);
        }
        
        if (config.width) {
            this.width = config.width;
            this.canvas.width = this.width * this.scale;
        }
        
        if (config.height) {
            this.height = config.height;
            this.canvas.height = this.height * this.scale;
        }
        
        if (config.backgroundColor) {
            this.backgroundColor = config.backgroundColor;
        }
        
        // Solicita nova renderização
        this.requestRender();
    }
}

module.exports = PPTXPreviewManager;