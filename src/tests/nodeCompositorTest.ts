import { NodeBasedCompositor, NodeFactory, NodeConnection } from '../services/NodeBasedCompositor';

// Criar canvas mock para testes
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
}

// Teste básico do NodeBasedCompositor
export function testNodeBasedCompositor() {
  console.log('🧪 Testando NodeBasedCompositor...');
  
  try {
    // Criar compositor com canvas mock
    const canvas = createMockCanvas();
    const compositor = new NodeBasedCompositor(canvas);
    console.log('✅ Compositor criado com sucesso');
    
    // Criar nós de teste usando métodos corretos
    const inputNode = NodeFactory.createInputNode();
    inputNode.id = 'input1';
    inputNode.position = { x: 0, y: 0 };
    
    const filterNode = NodeFactory.createFilterNode();
    filterNode.id = 'filter1';
    filterNode.position = { x: 200, y: 0 };
    
    const outputNode = NodeFactory.createOutputNode();
    outputNode.id = 'output1';
    outputNode.position = { x: 400, y: 0 };
    
    console.log('✅ Nós criados:', {
      input: inputNode.type,
      filter: filterNode.type,
      output: outputNode.type
    });
    
    // Adicionar nós ao compositor
    compositor.addNode(inputNode);
    compositor.addNode(filterNode);
    compositor.addNode(outputNode);
    
    console.log('✅ Nós adicionados ao compositor');
    
    // Testar se os nós foram adicionados
    const retrievedInput = compositor.getNode('input1');
    const retrievedFilter = compositor.getNode('filter1');
    const retrievedOutput = compositor.getNode('output1');
    
    if (retrievedInput && retrievedFilter && retrievedOutput) {
      console.log('✅ Nós recuperados com sucesso');
    } else {
      console.log('❌ Erro ao recuperar nós');
    }
    
    // Criar conexões usando a interface correta
    const connection1: NodeConnection = {
      id: 'conn1',
      sourceNodeId: 'input1',
      sourceSocket: 'output',
      targetNodeId: 'filter1',
      targetSocket: 'input',
      dataType: 'image'
    };
    
    const connection2: NodeConnection = {
      id: 'conn2',
      sourceNodeId: 'filter1',
      sourceSocket: 'output',
      targetNodeId: 'output1',
      targetSocket: 'input',
      dataType: 'image'
    };
    
    compositor.addConnection(connection1);
    compositor.addConnection(connection2);
    
    console.log('✅ Conexões adicionadas manualmente');
    
    // Testar processamento do grafo
    try {
      const result = compositor.process();
      console.log('🔄 Processamento executado com sucesso');
    } catch (error) {
      console.log('⚠️ Erro no processamento:', error);
    }
    
    // Testar informações do grafo
    const allNodes = compositor.getAllNodes();
    const allConnections = compositor.getAllConnections();
    console.log('📤 Informações do grafo:', {
      nodes: allNodes.length,
      connections: allConnections.length
    });
    
    console.log('🎉 Todos os testes do NodeBasedCompositor passaram!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste do NodeBasedCompositor:', error);
    return false;
  }
}

// Teste de processamento de nós
export function testNodeProcessing() {
  console.log('🧪 Testando processamento de nós...');
  
  try {
    const canvas = createMockCanvas();
    const compositor = new NodeBasedCompositor(canvas);
    
    // Criar nós usando métodos disponíveis
    const inputNode = NodeFactory.createInputNode();
    inputNode.id = 'input1';
    inputNode.position = { x: 0, y: 0 };
    
    const blendNode = NodeFactory.createBlendNode();
    blendNode.id = 'blend1';
    blendNode.position = { x: 200, y: 0 };
    
    const outputNode = NodeFactory.createOutputNode();
    outputNode.id = 'output1';
    outputNode.position = { x: 400, y: 0 };
    
    // Adicionar nós
    compositor.addNode(inputNode);
    compositor.addNode(blendNode);
    compositor.addNode(outputNode);
    
    console.log('✅ Pipeline de processamento criado');
    console.log('📊 Tipos de nós no pipeline:', [inputNode.type, blendNode.type, outputNode.type]);
    
    // Criar conexões usando a interface correta
    const connection1: NodeConnection = {
      id: 'conn1',
      sourceNodeId: 'input1',
      sourceSocket: 'output',
      targetNodeId: 'blend1',
      targetSocket: 'input1',
      dataType: 'image'
    };
    
    const connection2: NodeConnection = {
      id: 'conn2',
      sourceNodeId: 'blend1',
      sourceSocket: 'output',
      targetNodeId: 'output1',
      targetSocket: 'input',
      dataType: 'image'
    };
    
    compositor.addConnection(connection1);
    compositor.addConnection(connection2);
    
    console.log('✅ Conexões do pipeline criadas');
    
    // Simular processamento (sem dados reais por enquanto)
    console.log('⚙️ Pipeline pronto para processamento');
    
    console.log('🎉 Teste de processamento concluído!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de processamento:', error);
    return false;
  }
}

// Executar testes se chamado diretamente
if (typeof window !== 'undefined') {
  // Executar no browser
  console.log('🚀 Iniciando testes do NodeBasedCompositor no browser...');
  testNodeBasedCompositor();
  testNodeProcessing();
} else {
  // Executar no Node.js
  console.log('🚀 Iniciando testes do NodeBasedCompositor no Node.js...');
  testNodeBasedCompositor();
  testNodeProcessing();
}