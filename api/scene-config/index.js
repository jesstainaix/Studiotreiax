// Scene Configuration API Endpoints
import fs from 'fs/promises';
import path from 'path';

const SCENE_CONFIG_PATH = path.join(process.cwd(), 'project/data/scene_config.json');

// Ensure directory exists
async function ensureDirectoryExists() {
  const dir = path.dirname(SCENE_CONFIG_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Default configuration
const createDefaultConfig = () => ({
  deck_id: `deck_${Date.now()}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  scenes: [],
  defaultSettings: {
    avatarPlacement: {
      x: 0.75,
      y: 0.65,
      scale: 0.9
    },
    avatarPose: 'neutral',
    avatarConfig: {
      voice: 'br-female-adult-1',
      expression: 'neutral',
      animation: 'idle-neutral'
    }
  }
});

// GET /api/scene-config - Load scene configuration
async function handleGet(req, res) {
  try {
    await ensureDirectoryExists();
    
    try {
      const data = await fs.readFile(SCENE_CONFIG_PATH, 'utf8');
      const config = JSON.parse(data);
      res.json(config);
    } catch (error) {
      // File doesn't exist, return default
      const defaultConfig = createDefaultConfig();
      res.json(defaultConfig);
    }
  } catch (error) {
    console.error('[SceneConfigAPI] GET error:', error);
    res.status(500).json({ error: 'Failed to load scene configuration' });
  }
}

// POST /api/scene-config - Save scene configuration
async function handlePost(req, res) {
  try {
    await ensureDirectoryExists();
    
    const config = req.body;
    config.updated_at = new Date().toISOString();
    
    // Validate configuration structure
    if (!config.deck_id || !Array.isArray(config.scenes)) {
      return res.status(400).json({ error: 'Invalid configuration format' });
    }
    
    await fs.writeFile(SCENE_CONFIG_PATH, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'Configuration saved successfully' });
    
  } catch (error) {
    console.error('[SceneConfigAPI] POST error:', error);
    res.status(500).json({ error: 'Failed to save scene configuration' });
  }
}

// PUT /api/scene-config - Update scene configuration 
async function handlePut(req, res) {
  await handlePost(req, res);
}

export default {
  handleGet,
  handlePost,
  handlePut
};