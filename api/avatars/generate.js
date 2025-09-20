// Avatar Generation API Proxy (Server-side)
// Using global fetch (Node 18+)

// Server-side avatar provider implementation
class ServerAvatarProviderManager {
  constructor() {
    this.providers = {
      mock: this.mockProvider.bind(this),
      reallusion: this.reallusionProvider.bind(this),
      did: this.didProvider.bind(this)
    };
  }

  async generateAvatar(request) {
    const { provider = 'mock', ...avatarRequest } = request;
    
    // Add userId if not provided
    if (!avatarRequest.userId) {
      avatarRequest.userId = 'user_' + Date.now();
    }
    
    // Try primary provider first, then fallbacks
    const providers = [provider, 'mock'];
    
    for (const providerId of providers) {
      try {
        console.log(`[ServerAvatarManager] Attempting generation with: ${providerId}`);
        const result = await this.providers[providerId](avatarRequest);
        return result;
      } catch (error) {
        console.warn(`[ServerAvatarManager] Provider ${providerId} failed:`, error.message);
        if (providerId === 'mock') {
          throw error; // If mock fails, we have a real problem
        }
        continue;
      }
    }
  }

  async mockProvider(request) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const timestamp = Date.now();
    const userId = request.userId || 'anonymous';
    const avatarId = `avatar_custom_${userId}_${timestamp}`;
    
    return {
      avatarId,
      status: 'completed',
      providerId: 'mock',
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: 2000 + Math.random() * 3000,
        source_photo: request.photoUrl || request.photoBase64 ? 'provided' : 'none',
        model_version: 'mock-v1.0',
        quality: request.quality || 'medium',
        tags: request.tags || ['custom']
      },
      assets: {
        thumbnail: `/api/avatars/mock/${avatarId}/thumbnail.jpg`,
        model_3d: `/api/avatars/mock/${avatarId}/model.glb`,
        textures: []
      },
      animations: ['idle-neutral', 'presenting', 'confident'],
      voice_profiles: ['br-female-adult-1', 'br-male-adult-1']
    };
  }

  async reallusionProvider(request) {
    const apiKey = process.env.REALLUSION_API_KEY;
    if (!apiKey) {
      throw new Error('Reallusion API key not configured');
    }

    const reallusionRequest = {
      photo_data: request.photoBase64 || null,
      photo_url: request.photoUrl || null,
      gender: request.gender || 'auto_detect',
      quality: this.mapQualityToReallusion(request.quality),
      generate_3d_model: true,
      generate_animations: true,
      style: request.style || 'realistic'
    };

    const response = await fetch('https://api.reallusion.com/v1/avatars/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reallusionRequest)
    });

    if (!response.ok) {
      throw new Error(`Reallusion API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Poll for completion
    const jobId = data.job_id;
    const result = await this.pollReallusionJob(jobId, apiKey);
    
    return this.mapReallusionResponse(result, request.userId);
  }

  async didProvider(request) {
    const apiKey = process.env.DID_API_KEY;
    if (!apiKey) {
      throw new Error('D-ID API key not configured');
    }

    const didRequest = {
      source_url: request.photoUrl || null,
      source_image: request.photoBase64 || null,
      script: {
        type: 'text',
        input: 'Olá! Eu sou seu novo avatar digital.',
        provider: {
          type: 'microsoft',
          voice_id: 'pt-BR-FranciscaNeural'
        }
      },
      config: {
        result_format: 'mp4'
      }
    };

    const response = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(didRequest)
    });

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Poll for completion
    const talkId = data.id;
    const result = await this.pollDIdJob(talkId, apiKey);
    
    return this.mapDIdResponse(result, request.userId);
  }

  async pollReallusionJob(jobId, apiKey, maxAttempts = 30) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch(`https://api.reallusion.com/v1/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!response.ok) {
        throw new Error(`Job status check failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'completed') {
        return data.result;
      } else if (data.status === 'failed') {
        throw new Error(`Avatar generation failed: ${data.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
    
    throw new Error('Generation timeout');
  }

  async pollDIdJob(talkId, apiKey, maxAttempts = 30) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        headers: { 'Authorization': `Basic ${apiKey}` }
      });

      if (!response.ok) {
        throw new Error(`Talk status check failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'done') {
        return data;
      } else if (data.status === 'error') {
        throw new Error(`Avatar generation failed: ${data.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
    
    throw new Error('Generation timeout');
  }

  mapQualityToReallusion(quality) {
    const map = { 'low': 'draft', 'medium': 'standard', 'high': 'premium' };
    return map[quality] || 'standard';
  }

  mapReallusionResponse(data, userId) {
    const timestamp = Date.now();
    const avatarId = `avatar_custom_${userId}_${timestamp}`;
    
    return {
      avatarId,
      status: 'completed',
      providerId: 'reallusion',
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: data.processing_time_ms || 5000,
        source_photo: 'provided',
        model_version: 'reallusion-v1',
        quality: data.quality || 'medium',
        tags: ['custom', 'reallusion']
      },
      assets: {
        thumbnail: data.preview_url || data.assets?.thumbnail,
        model_3d: data.model_url || data.assets?.model_3d,
        textures: data.assets?.textures || []
      },
      animations: data.animations || ['idle', 'presenting'],
      voice_profiles: data.voice_profiles || ['br-female-adult-1']
    };
  }

  mapDIdResponse(data, userId) {
    const timestamp = Date.now();
    const avatarId = `avatar_custom_${userId}_${timestamp}`;
    
    return {
      avatarId,
      status: 'completed',
      providerId: 'did',
      metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: data.duration || 3000,
        source_photo: 'provided',
        model_version: 'did-v1',
        quality: 'medium',
        tags: ['custom', 'did', 'talking']
      },
      assets: {
        thumbnail: data.source_url || '/api/placeholder/avatar.jpg',
        video_url: data.result_url,
        textures: []
      },
      animations: ['talking', 'lip_sync'],
      voice_profiles: ['pt-BR-FranciscaNeural']
    };
  }
}

// API handler
const serverAvatarManager = new ServerAvatarProviderManager();

async function handlePost(req, res) {
  try {
    const result = await serverAvatarManager.generateAvatar(req.body);
    res.json(result);
  } catch (error) {
    console.error('[AvatarGenerateAPI] Error:', error);
    res.status(500).json({ 
      error: 'Avatar generation failed', 
      message: error.message 
    });
  }
}

export default {
  handlePost
};