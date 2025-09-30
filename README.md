# 📸 Instagram Post Generator

Transform news headlines into stunning visual Instagram posts using AI! This application leverages Google Gemini AI and multiple image generation APIs to create engaging, social media-ready content.

## ✨ Features

- **🎯 AI-Powered Generation**: Uses Google Gemini 2.5 Flash AI model for intelligent content creation
- **🎨 Multiple Visual Styles**: Choose from Realistic, 3D, Animated, or Infographic styles
- **📱 Instagram Optimized**: Perfect 1:1 aspect ratio for Instagram posts
- **⚡ Batch Generation**: Generate 1-9 unique variations simultaneously
- **🎭 Dynamic Variations**: Each generation includes different compositions, color palettes, and styles
- **🚀 Fast & Efficient**: Parallel processing for multiple image generation
- **📊 Professional Quality**: High-resolution, social media-ready outputs

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **AI Integration**: Google Gemini 2.5 Flash Image Preview
- **Image Generation**: NanoBanana API (with Google Gemini fallback)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Environment**: dotenv for configuration

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14.0.0 or higher)
- npm or yarn package manager
- Google Gemini API key
- NanoBanana API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tgaurav1k/News_post_generator.git
   cd News_post_generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `Backend/` directory:
   ```env
   # Required: Google Gemini API Key
   GOOGLE_API_KEY=your_gemini_api_key_here
   
   # Optional: NanoBanana API (for additional image generation)
   NANO_BANANA_API_KEY=your_nanobanana_api_key_here
   NANO_BANANA_BASE_URL=https://api.nanobanana.ai/v1
   
   # Optional: Configuration
   USE_GEMINI=true
   GEMINI_MODEL=models/gemini-2.5-flash-image-preview
   FALLBACK_PLACEHOLDER=false
   ALLOW_INSECURE_TLS=false
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 How to Use

1. **Enter a News Headline**: Paste or type any news headline in the text area
2. **Select Image Count**: Choose how many variations you want (1-9)
3. **Pick Visual Style**: Select from:
   - **Realistic**: Photojournalistic style with natural lighting
   - **Animated**: Cartoon illustration with bold outlines
   - **3D**: High-quality 3D renders with studio lighting
   - **Infographic**: Clean vector design with clear hierarchy
4. **Generate**: Click the generate button and wait for your AI-powered posts!

## 🎨 Style Variations

The application automatically generates diverse variations using:

- **8 Style Variants**: From photojournalistic to modern editorial layouts
- **8 Color Palettes**: From warm tones to high contrast black & white
- **8 Compositions**: From centered to asymmetric layouts with dynamic angles

## 🔧 API Endpoints

### POST `/api/generate`
Generate Instagram posts from a headline.

**Request Body:**
```json
{
  "headline": "Your news headline here",
  "count": 4,
  "style": "realistic"
}
```

**Response:**
```json
{
  "images": [
    {
      "url": "generated_image_url",
      "prompt": "generation_prompt",
      "seed": 12345,
      "index": 0
    }
  ],
  "requested": 4,
  "generated": 4
}
```

### GET `/health`
Health check endpoint to verify API configuration.

## 🌐 Deployment

### Environment Variables for Production

```env
PORT=3000
GOOGLE_API_KEY=your_production_gemini_key
USE_GEMINI=true
FALLBACK_PLACEHOLDER=false
ALLOW_INSECURE_TLS=false
```

### Deploy to Heroku

1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git:
   ```bash
   git push heroku main
   ```

### Deploy to Vercel/Netlify

The frontend can be deployed as static files, while the backend needs a Node.js hosting solution.

## 🔑 API Keys Setup

### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GOOGLE_API_KEY`

### NanoBanana API (Optional)
1. Sign up at [NanoBanana](https://nanobanana.ai)
2. Get your API key
3. Add it to your `.env` file as `NANO_BANANA_API_KEY`

## 📁 Project Structure

```
instagram_post/
├── Backend/
│   ├── server.js          # Main server file
│   └── .env               # Environment variables
├── public/
│   ├── index.html         # Main application interface
│   ├── script.js          # Frontend JavaScript
│   └── styles.css         # Application styling
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🚨 Troubleshooting

### Common Issues

1. **"API Key not configured"**
   - Ensure your `.env` file is in the `Backend/` directory
   - Verify your Google Gemini API key is correct

2. **"Port already in use"**
   - The app will automatically try ports 3000, 3001, 3002, etc.
   - Or set a custom port: `PORT=8080 npm start`

3. **"No images generated"**
   - Check your internet connection
   - Verify API keys are valid
   - Enable `FALLBACK_PLACEHOLDER=true` for testing

4. **TLS Certificate Errors**
   - For development only: set `ALLOW_INSECURE_TLS=true`
   - Never use this in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful image generation capabilities
- NanoBanana for additional AI image generation options
- The open-source community for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Tgaurav1k/News_post_generator/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---

**⭐ Star this repository if you found it helpful!**

**🔗 Live Demo**: [Add your deployed URL here]

**📱 Connect with me**: [Your LinkedIn/Portfolio links]
