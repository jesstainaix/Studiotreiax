import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up test artifacts
    await cleanupTestArtifacts();
    
    // Clean up test data
    await cleanupTestData();
    
    // Generate test summary
    await generateTestSummary();
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
  
  console.log('✅ Global teardown completed');
}

async function cleanupTestArtifacts() {
  console.log('🗑️ Cleaning up test artifacts...');
  
  const artifactPaths = [
    'src/test/e2e/auth-state.json',
    'test-results/temp',
    'playwright-report/temp'
  ];
  
  for (const artifactPath of artifactPaths) {
    try {
      if (fs.existsSync(artifactPath)) {
        if (fs.statSync(artifactPath).isDirectory()) {
          fs.rmSync(artifactPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(artifactPath);
        }
        console.log(`🗑️ Removed: ${artifactPath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to remove ${artifactPath}:`, error);
    }
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  // Clean up any temporary files or databases created during tests
  const tempDataPaths = [
    'temp-test-data.json',
    'test-uploads',
    'test-cache'
  ];
  
  for (const dataPath of tempDataPaths) {
    try {
      if (fs.existsSync(dataPath)) {
        if (fs.statSync(dataPath).isDirectory()) {
          fs.rmSync(dataPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(dataPath);
        }
        console.log(`🗑️ Cleaned up: ${dataPath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to clean up ${dataPath}:`, error);
    }
  }
}

async function generateTestSummary() {
  console.log('📊 Generating test summary...');
  
  try {
    const resultsPath = 'test-results/results.json';
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        success: (results.stats?.failed || 0) === 0
      };
      
      const summaryPath = 'test-results/summary.json';
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('📊 Test Summary:');
      console.log(`   Total: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Skipped: ${summary.skipped}`);
      console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log(`   Success: ${summary.success ? '✅' : '❌'}`);
      
    } else {
      console.log('⚠️ No test results found for summary generation');
    }
  } catch (error) {
    console.warn('⚠️ Failed to generate test summary:', error);
  }
}

export default globalTeardown;