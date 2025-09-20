import React from 'react';
import { useAIScriptCorrection } from './hooks/useAIScriptCorrection';

const TestAIComponent: React.FC = () => {
  const { actions, analyses, errors } = useAIScriptCorrection();

  return (
    <div>
      <h1>Test AI Component</h1>
      <p>Analyses: {analyses.length}</p>
      <p>Errors: {errors.length}</p>
      <button onClick={() => actions.analyzeScript('test.js', 'console.log("test");', 'javascript')}>
        Test Analyze
      </button>
    </div>
  );
};

export default TestAIComponent;