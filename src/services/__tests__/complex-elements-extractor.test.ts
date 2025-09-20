import { ComplexElementsExtractor, TableElement, ChartElement, SmartArtElement } from '../complex-elements-extractor';

describe('ComplexElementsExtractor', () => {
  let extractor: ComplexElementsExtractor;
  
  beforeEach(() => {
    extractor = new ComplexElementsExtractor();
  });

  describe('extractTables', () => {
    it('should extract table data correctly', () => {
      const mockTableElement = {
        tagName: 'table',
        rows: [
          { cells: [{ textContent: 'Header 1' }, { textContent: 'Header 2' }] },
          { cells: [{ textContent: 'Data 1' }, { textContent: 'Data 2' }] },
          { cells: [{ textContent: 'Data 3' }, { textContent: 'Data 4' }] }
        ],
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'table-1',
            'class': 'data-table',
            'data-rows': '3',
            'data-cols': '2'
          };
          return attrs[attr] || null;
        }
      };

      const result = extractor.extractTables([mockTableElement as any]);
      
      expect(result).toHaveLength(1);
      
      const table = result[0];
      expect(table.id).toBe('table-1');
      expect(table.rows).toBe(3);
      expect(table.columns).toBe(2);
      expect(table.headers).toEqual(['Header 1', 'Header 2']);
      expect(table.data).toHaveLength(2);
      expect(table.data[0]).toEqual(['Data 1', 'Data 2']);
      expect(table.data[1]).toEqual(['Data 3', 'Data 4']);
    });

    it('should handle tables without headers', () => {
      const mockTableElement = {
        tagName: 'table',
        rows: [
          { cells: [{ textContent: 'Data 1' }, { textContent: 'Data 2' }] },
          { cells: [{ textContent: 'Data 3' }, { textContent: 'Data 4' }] }
        ],
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'table-2',
            'data-has-header': 'false'
          };
          return attrs[attr] || null;
        }
      };

      const result = extractor.extractTables([mockTableElement as any]);
      
      expect(result).toHaveLength(1);
      
      const table = result[0];
      expect(table.headers).toEqual([]);
      expect(table.data).toHaveLength(2);
      expect(table.hasHeader).toBe(false);
    });

    it('should extract table styling information', () => {
      const mockTableElement = {
        tagName: 'table',
        rows: [
          { cells: [{ textContent: 'Header 1' }] },
          { cells: [{ textContent: 'Data 1' }] }
        ],
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'styled-table',
            'style': 'border: 1px solid #000; background-color: #f0f0f0;'
          };
          return attrs[attr] || null;
        },
        style: {
          border: '1px solid #000',
          backgroundColor: '#f0f0f0',
          fontSize: '14px'
        }
      };

      const result = extractor.extractTables([mockTableElement as any]);
      
      expect(result).toHaveLength(1);
      
      const table = result[0];
      expect(table.styling).toBeDefined();
      expect(table.styling?.border).toBe('1px solid #000');
      expect(table.styling?.backgroundColor).toBe('#f0f0f0');
    });
  });

  describe('extractCharts', () => {
    it('should extract chart data correctly', () => {
      const mockChartElement = {
        tagName: 'div',
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'chart-1',
            'data-chart-type': 'bar',
            'data-chart-title': 'Sales Data',
            'data-chart-data': JSON.stringify({
              labels: ['Q1', 'Q2', 'Q3', 'Q4'],
              datasets: [{
                label: 'Sales',
                data: [100, 150, 200, 175]
              }]
            })
          };
          return attrs[attr] || null;
        },
        querySelector: (selector: string) => {
          if (selector === '.chart-title') {
            return { textContent: 'Sales Data' };
          }
          return null;
        }
      };

      const result = extractor.extractCharts([mockChartElement as any]);
      
      expect(result).toHaveLength(1);
      
      const chart = result[0];
      expect(chart.id).toBe('chart-1');
      expect(chart.type).toBe('bar');
      expect(chart.title).toBe('Sales Data');
      expect(chart.data.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
      expect(chart.data.datasets[0].data).toEqual([100, 150, 200, 175]);
    });

    it('should handle different chart types', () => {
      const chartTypes = ['line', 'pie', 'doughnut', 'scatter', 'area'];
      
      chartTypes.forEach((type, index) => {
        const mockChartElement = {
          tagName: 'div',
          getAttribute: (attr: string) => {
            const attrs: Record<string, string> = {
              'id': `chart-${index}`,
              'data-chart-type': type,
              'data-chart-title': `${type} Chart`
            };
            return attrs[attr] || null;
          },
          querySelector: () => null
        };

        const result = extractor.extractCharts([mockChartElement as any]);
        
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(type);
        expect(result[0].title).toBe(`${type} Chart`);
      });
    });

    it('should extract chart configuration options', () => {
      const mockChartElement = {
        tagName: 'canvas',
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'configured-chart',
            'data-chart-type': 'line',
            'data-chart-options': JSON.stringify({
              responsive: true,
              plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
              },
              scales: {
                x: { display: true },
                y: { display: true, beginAtZero: true }
              }
            })
          };
          return attrs[attr] || null;
        },
        querySelector: () => null
      };

      const result = extractor.extractCharts([mockChartElement as any]);
      
      expect(result).toHaveLength(1);
      
      const chart = result[0];
      expect(chart.options).toBeDefined();
      expect(chart.options?.responsive).toBe(true);
      expect(chart.options?.plugins?.legend?.display).toBe(true);
    });
  });

  describe('extractSmartArt', () => {
    it('should extract SmartArt hierarchy correctly', () => {
      const mockSmartArtElement = {
        tagName: 'div',
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'smartart-1',
            'data-smartart-type': 'hierarchy',
            'data-smartart-layout': 'organizational-chart'
          };
          return attrs[attr] || null;
        },
        querySelectorAll: (selector: string) => {
          if (selector === '.smartart-node') {
            return [
              {
                getAttribute: (attr: string) => attr === 'data-level' ? '0' : 'node-1',
                textContent: 'CEO',
                querySelector: () => ({ textContent: 'Chief Executive Officer' })
              },
              {
                getAttribute: (attr: string) => attr === 'data-level' ? '1' : 'node-2',
                textContent: 'CTO',
                querySelector: () => ({ textContent: 'Chief Technology Officer' })
              },
              {
                getAttribute: (attr: string) => attr === 'data-level' ? '1' : 'node-3',
                textContent: 'CFO',
                querySelector: () => ({ textContent: 'Chief Financial Officer' })
              }
            ];
          }
          return [];
        }
      };

      const result = extractor.extractSmartArt([mockSmartArtElement as any]);
      
      expect(result).toHaveLength(1);
      
      const smartArt = result[0];
      expect(smartArt.id).toBe('smartart-1');
      expect(smartArt.type).toBe('hierarchy');
      expect(smartArt.layout).toBe('organizational-chart');
      expect(smartArt.nodes).toHaveLength(3);
      
      const ceoNode = smartArt.nodes.find(node => node.text === 'CEO');
      expect(ceoNode).toBeDefined();
      expect(ceoNode?.level).toBe(0);
      expect(ceoNode?.description).toBe('Chief Executive Officer');
    });

    it('should extract process SmartArt correctly', () => {
      const mockSmartArtElement = {
        tagName: 'div',
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'process-smartart',
            'data-smartart-type': 'process',
            'data-smartart-layout': 'basic-process'
          };
          return attrs[attr] || null;
        },
        querySelectorAll: (selector: string) => {
          if (selector === '.smartart-node') {
            return [
              {
                getAttribute: (attr: string) => {
                  const attrs: Record<string, string> = {
                    'id': 'step-1',
                    'data-step': '1'
                  };
                  return attrs[attr] || null;
                },
                textContent: 'Planning',
                querySelector: () => ({ textContent: 'Define project scope and objectives' })
              },
              {
                getAttribute: (attr: string) => {
                  const attrs: Record<string, string> = {
                    'id': 'step-2',
                    'data-step': '2'
                  };
                  return attrs[attr] || null;
                },
                textContent: 'Development',
                querySelector: () => ({ textContent: 'Build and implement solution' })
              },
              {
                getAttribute: (attr: string) => {
                  const attrs: Record<string, string> = {
                    'id': 'step-3',
                    'data-step': '3'
                  };
                  return attrs[attr] || null;
                },
                textContent: 'Testing',
                querySelector: () => ({ textContent: 'Validate and verify results' })
              }
            ];
          }
          return [];
        }
      };

      const result = extractor.extractSmartArt([mockSmartArtElement as any]);
      
      expect(result).toHaveLength(1);
      
      const smartArt = result[0];
      expect(smartArt.type).toBe('process');
      expect(smartArt.nodes).toHaveLength(3);
      
      const planningNode = smartArt.nodes.find(node => node.text === 'Planning');
      expect(planningNode).toBeDefined();
      expect(planningNode?.step).toBe(1);
    });

    it('should extract relationships between SmartArt nodes', () => {
      const mockSmartArtElement = {
        tagName: 'div',
        getAttribute: (attr: string) => {
          const attrs: Record<string, string> = {
            'id': 'relationship-smartart',
            'data-smartart-type': 'relationship'
          };
          return attrs[attr] || null;
        },
        querySelectorAll: (selector: string) => {
          if (selector === '.smartart-node') {
            return [
              {
                getAttribute: (attr: string) => attr === 'id' ? 'node-a' : null,
                textContent: 'Node A',
                querySelector: () => null
              },
              {
                getAttribute: (attr: string) => attr === 'id' ? 'node-b' : null,
                textContent: 'Node B',
                querySelector: () => null
              }
            ];
          }
          if (selector === '.smartart-connection') {
            return [
              {
                getAttribute: (attr: string) => {
                  const attrs: Record<string, string> = {
                    'data-from': 'node-a',
                    'data-to': 'node-b',
                    'data-type': 'arrow'
                  };
                  return attrs[attr] || null;
                }
              }
            ];
          }
          return [];
        }
      };

      const result = extractor.extractSmartArt([mockSmartArtElement as any]);
      
      expect(result).toHaveLength(1);
      
      const smartArt = result[0];
      expect(smartArt.relationships).toHaveLength(1);
      expect(smartArt.relationships[0].from).toBe('node-a');
      expect(smartArt.relationships[0].to).toBe('node-b');
      expect(smartArt.relationships[0].type).toBe('arrow');
    });
  });

  describe('extractAll', () => {
    it('should extract all complex elements from a slide', () => {
      const mockSlideElement = {
        querySelectorAll: (selector: string) => {
          if (selector === 'table') {
            return [{
              tagName: 'table',
              rows: [{ cells: [{ textContent: 'Header' }] }],
              getAttribute: () => 'table-1'
            }];
          }
          if (selector === '[data-chart-type]') {
            return [{
              tagName: 'div',
              getAttribute: (attr: string) => {
                const attrs: Record<string, string> = {
                  'id': 'chart-1',
                  'data-chart-type': 'bar'
                };
                return attrs[attr] || null;
              },
              querySelector: () => null
            }];
          }
          if (selector === '[data-smartart-type]') {
            return [{
              tagName: 'div',
              getAttribute: (attr: string) => {
                const attrs: Record<string, string> = {
                  'id': 'smartart-1',
                  'data-smartart-type': 'process'
                };
                return attrs[attr] || null;
              },
              querySelectorAll: () => []
            }];
          }
          return [];
        }
      };

      const result = extractor.extractAll(mockSlideElement as any);
      
      expect(result.tables).toHaveLength(1);
      expect(result.charts).toHaveLength(1);
      expect(result.smartArt).toHaveLength(1);
      expect(result.totalElements).toBe(3);
    });
  });

  describe('validation', () => {
    it('should validate table structure', () => {
      const validTable: TableElement = {
        id: 'valid-table',
        rows: 3,
        columns: 2,
        headers: ['Col1', 'Col2'],
        data: [['A', 'B'], ['C', 'D']],
        hasHeader: true,
        styling: {}
      };

      const invalidTable: Partial<TableElement> = {
        id: 'invalid-table',
        rows: 0,
        columns: -1
      };

      expect(extractor.validateTable(validTable)).toBe(true);
      expect(extractor.validateTable(invalidTable as TableElement)).toBe(false);
    });

    it('should validate chart structure', () => {
      const validChart: ChartElement = {
        id: 'valid-chart',
        type: 'bar',
        title: 'Test Chart',
        data: {
          labels: ['A', 'B'],
          datasets: [{ label: 'Data', data: [1, 2] }]
        },
        options: {}
      };

      const invalidChart: Partial<ChartElement> = {
        id: 'invalid-chart',
        type: 'unknown' as any
      };

      expect(extractor.validateChart(validChart)).toBe(true);
      expect(extractor.validateChart(invalidChart as ChartElement)).toBe(false);
    });

    it('should validate SmartArt structure', () => {
      const validSmartArt: SmartArtElement = {
        id: 'valid-smartart',
        type: 'process',
        layout: 'basic-process',
        nodes: [
          { id: 'node-1', text: 'Step 1', level: 0 }
        ],
        relationships: []
      };

      const invalidSmartArt: Partial<SmartArtElement> = {
        id: 'invalid-smartart',
        type: 'unknown' as any,
        nodes: []
      };

      expect(extractor.validateSmartArt(validSmartArt)).toBe(true);
      expect(extractor.validateSmartArt(invalidSmartArt as SmartArtElement)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle malformed table elements gracefully', () => {
      const malformedElement = {
        tagName: 'table',
        rows: null,
        getAttribute: () => null
      };

      const result = extractor.extractTables([malformedElement as any]);
      expect(result).toHaveLength(0);
    });

    it('should handle invalid chart data gracefully', () => {
      const invalidChartElement = {
        tagName: 'div',
        getAttribute: (attr: string) => {
          if (attr === 'data-chart-data') {
            return 'invalid-json{';
          }
          return null;
        },
        querySelector: () => null
      };

      const result = extractor.extractCharts([invalidChartElement as any]);
      expect(result).toHaveLength(0);
    });

    it('should handle missing SmartArt nodes gracefully', () => {
      const emptySmartArtElement = {
        tagName: 'div',
        getAttribute: () => 'smartart-empty',
        querySelectorAll: () => []
      };

      const result = extractor.extractSmartArt([emptySmartArtElement as any]);
      expect(result).toHaveLength(1);
      expect(result[0].nodes).toHaveLength(0);
    });
  });
});