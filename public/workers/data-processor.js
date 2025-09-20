// Data Processor Worker
// Handles data processing tasks in background

class DataProcessor {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    this.isInitialized = true;
    return true;
  }

  async processData(data, options = {}) {
    try {
      const { operation, params } = options;
      
      switch (operation) {
        case 'sort':
          return this.sortData(data, params);
        case 'filter':
          return this.filterData(data, params);
        case 'transform':
          return this.transformData(data, params);
        case 'aggregate':
          return this.aggregateData(data, params);
        case 'validate':
          return this.validateData(data, params);
        case 'parse':
          return this.parseData(data, params);
        default:
          return data;
      }
    } catch (error) {
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }

  sortData(data, params) {
    const { field, order = 'asc' } = params;
    
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for sorting');
    }
    
    return data.sort((a, b) => {
      const aVal = field ? a[field] : a;
      const bVal = field ? b[field] : b;
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }

  filterData(data, params) {
    const { condition, field, value } = params;
    
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for filtering');
    }
    
    return data.filter(item => {
      const itemValue = field ? item[field] : item;
      
      switch (condition) {
        case 'equals':
          return itemValue === value;
        case 'contains':
          return String(itemValue).includes(value);
        case 'greater':
          return itemValue > value;
        case 'less':
          return itemValue < value;
        case 'exists':
          return itemValue !== undefined && itemValue !== null;
        default:
          return true;
      }
    });
  }

  transformData(data, params) {
    const { mapping } = params;
    
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for transformation');
    }
    
    return data.map(item => {
      const transformed = {};
      
      for (const [newKey, oldKey] of Object.entries(mapping)) {
        transformed[newKey] = item[oldKey];
      }
      
      return transformed;
    });
  }

  aggregateData(data, params) {
    const { groupBy, aggregations } = params;
    
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for aggregation');
    }
    
    const groups = {};
    
    // Group data
    data.forEach(item => {
      const key = groupBy ? item[groupBy] : 'all';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    // Apply aggregations
    const result = {};
    
    for (const [key, items] of Object.entries(groups)) {
      result[key] = {};
      
      for (const [aggKey, aggConfig] of Object.entries(aggregations)) {
        const { field, operation } = aggConfig;
        const values = items.map(item => item[field]).filter(val => val !== undefined);
        
        switch (operation) {
          case 'sum':
            result[key][aggKey] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[key][aggKey] = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'count':
            result[key][aggKey] = values.length;
            break;
          case 'min':
            result[key][aggKey] = Math.min(...values);
            break;
          case 'max':
            result[key][aggKey] = Math.max(...values);
            break;
        }
      }
    }
    
    return result;
  }

  validateData(data, params) {
    const { schema } = params;
    const errors = [];
    
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    data.forEach((item, index) => {
      for (const [field, rules] of Object.entries(schema)) {
        const value = item[field];
        
        if (rules.required && (value === undefined || value === null)) {
          errors.push(`Item ${index}: Field '${field}' is required`);
        }
        
        if (value !== undefined && rules.type) {
          const actualType = typeof value;
          if (actualType !== rules.type) {
            errors.push(`Item ${index}: Field '${field}' should be ${rules.type}, got ${actualType}`);
          }
        }
        
        if (value !== undefined && rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(String(value))) {
            errors.push(`Item ${index}: Field '${field}' does not match pattern`);
          }
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  parseData(data, params) {
    const { format, options = {} } = params;
    
    try {
      switch (format) {
        case 'json':
          return typeof data === 'string' ? JSON.parse(data) : data;
        case 'csv':
          return this.parseCSV(data, options);
        case 'xml':
          return this.parseXML(data, options);
        default:
          return data;
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format}: ${error.message}`);
    }
  }

  parseCSV(csvText, options) {
    const { delimiter = ',', hasHeader = true } = options;
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];
    
    const headers = hasHeader ? lines[0].split(delimiter) : null;
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    return dataLines.map(line => {
      const values = line.split(delimiter);
      
      if (headers) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim();
        });
        return obj;
      }
      
      return values.map(val => val.trim());
    });
  }

  parseXML(xmlText, options) {
    // Simple XML parsing - in a real implementation, you'd use DOMParser
    // This is a basic implementation for demonstration
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error('Invalid XML');
    }
    
    return this.xmlToObject(doc.documentElement);
  }

  xmlToObject(node) {
    const obj = {};
    
    // Handle attributes
    if (node.attributes) {
      for (const attr of node.attributes) {
        obj[`@${attr.name}`] = attr.value;
      }
    }
    
    // Handle child nodes
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim();
        if (text) {
          obj['#text'] = text;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childObj = this.xmlToObject(child);
        
        if (obj[child.nodeName]) {
          if (!Array.isArray(obj[child.nodeName])) {
            obj[child.nodeName] = [obj[child.nodeName]];
          }
          obj[child.nodeName].push(childObj);
        } else {
          obj[child.nodeName] = childObj;
        }
      }
    }
    
    return obj;
  }
}

const processor = new DataProcessor();

self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'init':
        const initialized = processor.init();
        self.postMessage({ type: 'init', success: initialized, id });
        break;
        
      case 'process':
        const result = await processor.processData(data.data, data.options);
        self.postMessage({ type: 'process', result, id });
        break;
        
      case 'cancel':
        self.postMessage({ type: 'cancelled', id });
        break;
        
      default:
        throw new Error(`Unknown command: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message, 
      id 
    });
  }
};

self.onerror = function(error) {
  self.postMessage({ 
    type: 'error', 
    error: `Worker error: ${error.message}` 
  });
};