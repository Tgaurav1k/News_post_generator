const path = require('path');
// Load env from Backend/.env first, then fall back to project root .env
const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: backendEnvPath });
require('dotenv').config({ path: rootEnvPath });
const express = require('express');
const axios = require('axios');
const https = require('https');
let GoogleGenerativeAI;
 
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Validation
const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = process.env.NANO_BANANA_BASE_URL || 'https://api.nanobanana.ai/v1';
// Allow endpoint customization from env to match provider docs
const NANO_BANANA_APP_ID = process.env.NANO_BANANA_APP_ID || '';
const NANO_BANANA_ENDPOINT_PATH = process.env.NANO_BANANA_ENDPOINT_PATH || '/generate';
const USE_GEMINI = (process.env.USE_GEMINI || 'false').toLowerCase() === 'true';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash-image-preview';
// Fallback placeholders are OPT-IN; keep off by default
const FALLBACK_PLACEHOLDER = (process.env.FALLBACK_PLACEHOLDER || 'false').toLowerCase() === 'true';
const ALLOW_INSECURE_TLS = (process.env.ALLOW_INSECURE_TLS || 'false').toLowerCase() === 'true';

// Dev-only: allow insecure TLS globally if explicitly enabled
if (ALLOW_INSECURE_TLS) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

if (!USE_GEMINI && !NANO_BANANA_API_KEY) {
    console.error('ERROR: NANO_BANANA_API_KEY is not set in environment variables');
    console.error('Checked env files:', { backendEnvPath, rootEnvPath });
    process.exit(1);
}
if (USE_GEMINI) {
    try {
        GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    } catch (e) {
        console.error('ERROR: @google/generative-ai is not installed. Run npm i @google/generative-ai');
        process.exit(1);
    }
    if (!GOOGLE_API_KEY) {
        console.error('ERROR: GOOGLE_API_KEY (or GEMINI_API_KEY) is not set');
        process.exit(1);
    }
}

// Style variations for diverse outputs
const styleVariants = [
    'photojournalistic documentary style with dramatic lighting',
    'bold graphic poster design with strong typography',
    'isometric infographic illustration with clean lines',
    'newspaper halftone print aesthetic with vintage feel',
    'minimal typography with negative space and modern design',
    'vibrant collage with mixed media elements',
    'cinematic wide angle photography with depth',
    'modern editorial magazine layout with creative composition'
];

const colorPalettes = [
    'warm tones, golden hour lighting',
    'cool blue palette with high contrast',
    'high contrast black and white',
    'soft pastel colors',
    'vibrant saturated colors with energy',
    'muted earth tones and natural colors',
    'neon accents with dark background',
    'monochromatic scheme'
];

const compositions = [
    'centered composition',
    'rule of thirds with dynamic angles',
    'asymmetric layout',
    'symmetrical balance',
    'diagonal leading lines',
    'close-up detail focus',
    'wide environmental context',
    'layered depth composition'
];

// Generate varied prompt
function generateVariedPrompt(baseHeadline, index, totalCount) {
    const styleIndex = index % styleVariants.length;
    const colorIndex = index % colorPalettes.length;
    const compIndex = index % compositions.length;
    
    const style = styleVariants[styleIndex];
    const colors = colorPalettes[colorIndex];
    const comp = compositions[compIndex];
    
    return `Instagram square post for news headline: "${baseHeadline}". ${style}, ${colors}, ${comp}. Professional, eye-catching, social media optimized, 1:1 aspect ratio, high quality`;
}
// Generate negative prompt variations
function generateNegativePrompt(index) {
    const baseNegative = 'blurry, low quality, distorted, text errors, watermark, signature';
    const variations = [
        ', oversaturated, too bright',
        ', dull colors, flat lighting',
        ', cluttered, messy composition',
        ', generic stock photo feel',
        ', amateur, unprofessional',
        ', dark, underexposed',
        ', washed out, faded',
        ', chaotic, confusing layout'
    ];
    
    return baseNegative + variations[index % variations.length];
}

// API endpoint to generate images
app.post('/api/generate', async (req, res) => {
    try {
        const { headline, count, style } = req.body;
        console.log('[REQUEST] /api/generate payload:', { headline, count, style, FALLBACK_PLACEHOLDER, baseUrl: NANO_BANANA_BASE_URL });

        // Validation
        if (!headline || typeof headline !== 'string' || !headline.trim()) {
            return res.status(400).json({ error: 'Headline is required and must be a non-empty string' });
        }

        if (!count || typeof count !== 'number' || count < 1 || count > 9) {
            return res.status(400).json({ error: 'Count must be a number between 1 and 9' });
        }

        console.log(`Generating ${count} images for headline: "${headline}"`);

        // Generate all image requests in parallel
        const imagePromises = [];
        for (let i = 0; i < count; i++) {
            const stylePrefix = buildStylePrefix(style);
            const prompt = `${stylePrefix} ${generateVariedPrompt(headline, i, count)}`;
            const negativePrompt = generateNegativePrompt(i);
            const seed = Math.floor(Math.random() * 1000000) + i * 1000;

            imagePromises.push(
                USE_GEMINI
                    ? generateWithGemini(prompt, negativePrompt, seed, i)
                    : generateSingleImage(prompt, negativePrompt, seed, i)
            );
        }

        // Wait for all images to complete
        const t0 = Date.now();
        const results = await Promise.allSettled(imagePromises);
        const elapsedMs = Date.now() - t0;
        console.log(`[RESULTS] allSettled in ${elapsedMs}ms ->`, results.map(r => r.status));

        // Process results
        const images = [];
        const errors = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                images.push(result.value);
            } else {
                console.error(`Image ${index + 1} failed:`, result.reason);
                errors.push(`Image ${index + 1}: ${result.reason}`);
            }
        });

        // If no images succeeded, return error
        if (images.length === 0) {
            console.error('[RESULTS] 0 images succeeded. Errors:', errors);
            return res.status(500).json({ 
                error: 'Failed to generate any images', 
                details: errors 
            });
        }

        // If some images failed, log warning but return successful ones
        if (errors.length > 0) {
            console.warn(`Generated ${images.length}/${count} images successfully. Failures: ${errors.join(', ')}`);
        }

        res.json({ 
            images,
            requested: count,
            generated: images.length
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Map dropdown style to prompting prefix
function buildStylePrefix(style) {
    switch ((style || '').toLowerCase()) {
        case 'realistic':
            return 'Photojournalistic, natural lighting, candid, 50mm lens.';
        case 'animated':
            return 'Cartoon illustration, bold outlines, flat shading.';
        case '3d':
            return 'High-quality 3D render, studio lighting, soft shadows.';
        case 'infographic':
            return 'Clean vector icons, clear hierarchy, readable labels.';
        default:
            return '';
    }
}

// Generate a single image
async function generateSingleImage(prompt, negativePrompt, seed, index) {
    try {
        // Helper to perform one request attempt with optional insecure TLS
        async function requestOnce(allowInsecure) {
            const start = Date.now();
            console.log(`[GEN:${index}] POST ${NANO_BANANA_BASE_URL}/generate`, { seed, allowInsecure });
            const httpsAgent = allowInsecure
                ? new https.Agent({ rejectUnauthorized: false, checkServerIdentity: () => undefined })
                : undefined;
            // Build endpoint URL flexibly: <BASE>/<APP_ID?><ENDPOINT_PATH>
            const base = NANO_BANANA_BASE_URL.replace(/\/$/, '');
            const appSeg = NANO_BANANA_APP_ID ? `/${NANO_BANANA_APP_ID.replace(/^\//, '')}` : '';
            const pathSeg = `/${NANO_BANANA_ENDPOINT_PATH.replace(/^\//, '')}`;
            const endpointUrl = `${base}${appSeg}${pathSeg}`;
            const response = await axios.post(
                endpointUrl,
                {
                    prompt,
                    negative_prompt: negativePrompt,
                    // Use smaller defaults to reduce provider timeouts during testing
                    width: 512,
                    height: 512,
                    seed,
                    num_inference_steps: 20,
                    guidance_scale: 7.5
                },
                {
                    headers: {
                        'Authorization': `Bearer ${NANO_BANANA_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000, // 60 second timeout
                    httpsAgent
                }
            );
            console.log(`[GEN:${index}] success in ${Date.now() - start}ms`);
            return response;
        }

        // First attempt honors env (secure by default)
        let response;
        try {
            response = await requestOnce(ALLOW_INSECURE_TLS);
        } catch (firstErr) {
            const isAltName = firstErr?.code === 'ERR_TLS_CERT_ALTNAME_INVALID';
            // Auto-retry once with insecure TLS if certificate host mismatch occurs
            if (!ALLOW_INSECURE_TLS && isAltName) {
                console.warn(`[GEN:${index}] TLS altname error detected. Retrying once with insecure TLS...`);
                response = await requestOnce(true);
            } else {
                throw firstErr;
            }
        }

        // Extract image URL from response
        // Adjust based on actual API response format
        const imageUrl = response.data?.image_url || response.data?.url || response.data?.output;

        if (!imageUrl) {
            throw new Error('No image URL in API response');
        }

        return {
            url: imageUrl,
            prompt,
            seed,
            index
        };

    } catch (error) {
        // If allowed, fall back to a placeholder image so the UI can still work
        if (FALLBACK_PLACEHOLDER) {
            const text = encodeURIComponent(`Seed ${seed}`);
            const placeholderUrl = `https://placehold.co/1024x1024/png?text=${text}`;
            console.warn('[FALLBACK] Using placeholder for index', index, '| reason:', error?.message || error);
            return {
                url: placeholderUrl,
                prompt,
                seed,
                index,
            };
        }

        if (error.response) {
            console.error(`[GEN:${index}] API error`, { status: error.response.status, data: error.response.data });
            throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            // request made but no response
            const timedOut = error.code === 'ECONNABORTED';
            console.error(`[GEN:${index}] No response from API`, { code: error.code, timedOut });
            throw new Error('No response from image generation API');
        } else {
            console.error(`[GEN:${index}] Setup error`, { message: error.message });
            throw new Error(`Request setup error: ${error.message}`);
        }
    }
}

// Generate image via Google Gemini (returns data URL)
async function generateWithGemini(prompt, negativePrompt, seed, index) {
    const start = Date.now();
    try {
        console.log(`[GEN-GEMINI:${index}] ${GEMINI_MODEL}`);
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const response = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `${prompt}\nNegative: ${negativePrompt}\nSeed: ${seed}` }
                    ]
                }
            ]
        });

        // Try common output shapes for image-capable Gemini preview models
        const result = response.response;
        // Prefer a binary part (inlineData) if present
        let base64 = null;
        const parts = result?.candidates?.[0]?.content?.parts || result?.candidates?.[0]?.content || [];
        for (const part of parts) {
            if (part?.inlineData?.data) {
                base64 = part.inlineData.data;
                break;
            }
            if (part?.fileData?.mimeType && part?.fileData?.data) {
                base64 = part.fileData.data;
                break;
            }
        }

        if (!base64) {
            throw new Error('No image data in Gemini response');
        }

        const dataUrl = `data:image/png;base64,${base64}`;
        console.log(`[GEN-GEMINI:${index}] success in ${Date.now() - start}ms`);
        return { url: dataUrl, prompt, seed, index };
    } catch (error) {
        console.error(`[GEN-GEMINI:${index}] error`, error?.message || error);
        throw new Error(error?.message || 'Gemini generation failed');
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        apiConfigured: !!NANO_BANANA_API_KEY
    });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server with auto port fallback
function startServer(preferredPort, remainingAttempts = 5) {
    const server = app.listen(preferredPort, () => {
        console.log(`✅ Server running on http://localhost:${preferredPort}`);
        console.log(`🔑 API Key configured: ${NANO_BANANA_API_KEY ? 'Yes' : 'No'}`);
        console.log(`🌐 Base URL: ${NANO_BANANA_BASE_URL}`);
        if (FALLBACK_PLACEHOLDER) {
            console.log('🖼️  Placeholder fallback is ENABLED');
        }
        if (ALLOW_INSECURE_TLS) {
            console.log('🔐 Insecure TLS is ENABLED for dev (certs not verified)');
        }
    });

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE' && remainingAttempts > 0) {
            const nextPort = Number(preferredPort) + 1;
            console.warn(`⚠️  Port ${preferredPort} in use. Retrying on ${nextPort}... (${remainingAttempts - 1} attempts left)`);
            startServer(nextPort, remainingAttempts - 1);
        } else {
            console.error('❌ Failed to start server:', err);
            process.exit(1);
        }
    });
}

startServer(PORT);

module.exports = app;