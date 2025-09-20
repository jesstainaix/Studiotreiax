import { API_BASE_URL } from '../lib/api';

export async function testAPIEndpoints() {
  try {
    // Test root endpoint
    const rootResponse = await fetch(API_BASE_URL);
    console.log('Root endpoint:', await rootResponse.json());
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    console.log('Health endpoint:', await healthResponse.json());
    
    // Test API info
    const infoResponse = await fetch(`${API_BASE_URL}/api/info`);
    console.log('API info:', await infoResponse.json());
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}