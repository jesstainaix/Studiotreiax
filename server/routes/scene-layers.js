// Backend API routes for scene layers persistence
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const SCENE_LAYERS_FILE = path.join(__dirname, '../../project/data/scene_layers.json');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load layers for a specific scene
router.get('/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    
    // Read the scene layers file
    const data = await fs.readFile(SCENE_LAYERS_FILE, 'utf8');
    const sceneLayersData = JSON.parse(data);
    
    // Find the scene
    const sceneData = sceneLayersData.scenes.find(s => s.scene_id === sceneId);
    
    if (sceneData) {
      res.json(sceneData.layers);
    } else {
      res.status(404).json({ error: 'Scene not found' });
    }
  } catch (error) {
    console.error('Error loading scene layers:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Scene layers file not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Save layers for a specific scene
router.put('/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const layers = req.body;
    
    // Validate the layers array
    if (!Array.isArray(layers)) {
      return res.status(400).json({ error: 'Layers must be an array' });
    }
    
    let sceneLayersData;
    
    try {
      // Try to read existing file
      const data = await fs.readFile(SCENE_LAYERS_FILE, 'utf8');
      sceneLayersData = JSON.parse(data);
    } catch (error) {
      // Create new structure if file doesn't exist
      sceneLayersData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        project_id: 'heygen-default',
        scenes: [],
        global_settings: {
          canvas_size: { width: 1920, height: 1080, aspect_ratio: '16:9' },
          default_styles: {
            text: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '1rem',
              color: '#374151',
              textAlign: 'left',
              lineHeight: 1.4
            },
            animations: { default_duration: 1000, default_easing: 'ease-out' }
          },
          grid_settings: { snap_to_grid: true, grid_size: 0.05, show_grid: false }
        }
      };
    }
    
    // Update or add scene data
    const sceneIndex = sceneLayersData.scenes.findIndex(s => s.scene_id === sceneId);
    const sceneData = {
      slide_id: parseInt(sceneId.replace('scene-', '')) + 1,
      scene_id: sceneId,
      layers: layers.map(layer => ({
        ...layer,
        updatedAt: new Date().toISOString()
      }))
    };
    
    if (sceneIndex >= 0) {
      sceneLayersData.scenes[sceneIndex] = sceneData;
    } else {
      sceneLayersData.scenes.push(sceneData);
    }
    
    sceneLayersData.updated_at = new Date().toISOString();
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(SCENE_LAYERS_FILE), { recursive: true });
    
    // Write the updated data
    await fs.writeFile(SCENE_LAYERS_FILE, JSON.stringify(sceneLayersData, null, 2));
    
    res.json({ success: true, layersCount: layers.length });
  } catch (error) {
    console.error('Error saving scene layers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save complete scene layers data (for bulk operations)
router.post('/save', async (req, res) => {
  try {
    const sceneLayersData = req.body;
    
    // Validate required fields
    if (!sceneLayersData.version || !sceneLayersData.scenes) {
      return res.status(400).json({ error: 'Invalid scene layers data structure' });
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(SCENE_LAYERS_FILE), { recursive: true });
    
    // Write the data
    await fs.writeFile(SCENE_LAYERS_FILE, JSON.stringify(sceneLayersData, null, 2));
    
    res.json({ success: true, scenesCount: sceneLayersData.scenes.length });
  } catch (error) {
    console.error('Error saving complete scene layers data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export scene layers as JSON
router.get('/:sceneId/export', async (req, res) => {
  try {
    const { sceneId } = req.params;
    
    const data = await fs.readFile(SCENE_LAYERS_FILE, 'utf8');
    const sceneLayersData = JSON.parse(data);
    
    const sceneData = sceneLayersData.scenes.find(s => s.scene_id === sceneId);
    
    if (sceneData) {
      res.setHeader('Content-Disposition', `attachment; filename="scene-${sceneId}-layers.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json(sceneData.layers);
    } else {
      res.status(404).json({ error: 'Scene not found' });
    }
  } catch (error) {
    console.error('Error exporting scene layers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import scene layers from JSON
router.post('/:sceneId/import', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { layers } = req.body;
    
    if (!Array.isArray(layers)) {
      return res.status(400).json({ error: 'Layers must be an array' });
    }
    
    // Validate layer structure
    for (const layer of layers) {
      if (!layer.type || !layer.name) {
        return res.status(400).json({ error: 'Invalid layer structure' });
      }
    }
    
    // Use the PUT endpoint logic to save
    req.body = layers;
    return router.handle({ ...req, method: 'PUT' }, res);
  } catch (error) {
    console.error('Error importing scene layers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all layers for a scene
router.delete('/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    
    const data = await fs.readFile(SCENE_LAYERS_FILE, 'utf8');
    const sceneLayersData = JSON.parse(data);
    
    // Remove the scene
    sceneLayersData.scenes = sceneLayersData.scenes.filter(s => s.scene_id !== sceneId);
    sceneLayersData.updated_at = new Date().toISOString();
    
    await fs.writeFile(SCENE_LAYERS_FILE, JSON.stringify(sceneLayersData, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scene layers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;