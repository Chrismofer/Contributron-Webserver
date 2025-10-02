# 🎨 Contributron Web

> **Transform any image into beautiful GitHub contribution graph pixel art**

Contributron Web is a powerful web interface for creating GitHub contribution graph art from any image. Upload a photo, adjust the positioning and scale, and generate a Git repository that creates stunning pixel art on your GitHub profile when pushed.

![Contributron Demo](https://img.shields.io/badge/Contributron-Web%20Interface-blue?style=for-the-badge&logo=github)

## ✨ Features

### 🖼️ **Smart Image Processing**
- **Any Size, Any Format**: Upload images of any dimensions (JPEG, PNG, etc.)
- **Aspect Ratio Preservation**: Images maintain their proportions without stretching
- **Real-time Preview**: See exactly how your image will look on the contribution graph
- **Interactive Editing**: Paint and edit pixels manually with 5 intensity levels

### 🎛️ **Advanced Transform Controls**
- **Scale Slider**: Zoom in/out (0.1× to 5.0×) to show more or less of your image
- **X/Y Offset Sliders**: Pan around your image to focus on the perfect area
- **Reset Button**: Instantly return to default positioning
- **Live Updates**: All changes update the preview in real-time

### 🚀 **One-Click Generation**
- **Automated Git Repository**: Generates complete Git history with proper dates
- **GitHub Integration**: Direct push to GitHub with Personal Access Token
- **Progress Tracking**: Real-time progress updates with Server-Sent Events
- **Smart Branch Handling**: Automatically handles main/master branch differences

### 🎯 **Perfect GitHub Integration**
- **52×7 Grid**: Matches GitHub's contribution graph exactly (52 weeks × 7 days)
- **Multiple Commit Levels**: 5 different commit intensities for detailed artwork
- **Proper Dating**: Commits are backdated to create the pattern over a full year
- **Branch Compatibility**: Works with both new and existing repositories

## 🚀 Quick Start

### Prerequisites
- **Node.js** (16.0.0 or higher)
- **Rust** (latest stable)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/contributron-web.git
   cd contributron-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the Rust binary**
   ```bash
   cargo build --release
   ```

4. **Start the web server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 How to Use

### 1. **Import Your Image**
- Click "📂 Import Image" and select any photo
- The image automatically appears on the 52×7 contribution graph grid
- Transform controls appear for fine-tuning

### 2. **Adjust the Image**
- **Scale**: Zoom in/out to show more or less of your image
- **X Offset**: Move left/right to center the important parts
- **Y Offset**: Move up/down for perfect vertical alignment
- **Manual Editing**: Click pixels to paint with different intensities

### 3. **Generate Repository**
- Enter your GitHub email address
- Enter the GitHub repository name (will be created if it doesn't exist)
- Click "🚀 Generate Repository"
- Watch real-time progress as commits are generated

### 4. **Push to GitHub**
- Enter your GitHub username
- Enter your Personal Access Token ([Create one here](https://github.com/settings/tokens))
- Click "📤 Push to GitHub"
- Your contribution graph art will appear on your GitHub profile!

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with real-time canvas manipulation
- **Backend**: Node.js/Express with Server-Sent Events for progress tracking
- **Core Engine**: Rust binary for high-performance Git repository generation
- **Image Processing**: Jimp for client-side image transformations

### File Structure
```
contributron-web/
├── src/                    # Rust source code
├── web/                    # Frontend files
│   ├── index.html         # Main web interface
│   ├── pixel-editor.js    # Canvas and image processing
│   └── styles.css         # UI styling
├── server.js              # Node.js web server
├── package.json           # Node.js dependencies
├── Cargo.toml            # Rust dependencies
└── README.md             # This file
```

### Dependencies
- **Node.js**: Express, Multer, Jimp, UUID, Archiver
- **Rust**: Clap, Git2, Chrono, Image processing libraries

## 🎨 Examples

### Portrait Photos
Perfect for profile pictures or artistic portraits. The aspect ratio is preserved, creating beautiful vertical compositions.

### Landscape Images
Great for logos, text, or wide scenic images. Automatically letterboxes to fit the contribution graph format.

### Pixel Art
Already pixelated images work exceptionally well, creating crisp, defined patterns on your contribution graph.

## 🔧 Configuration

### GitHub Personal Access Token
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
4. Copy the token and use it in the web interface

### Environment Variables
```bash
PORT=3000                    # Web server port (default: 3000)
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Setup
```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build Rust binary for development
cargo build

# Run tests
cargo test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Contributron concept and Rust implementation
- GitHub for the amazing contribution graph feature
- The open-source community for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/contributron-web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/contributron-web/discussions)
- **Documentation**: Check the `/docs` folder for detailed guides

## 🎯 Roadmap

- [ ] **Multiple Image Support**: Combine multiple images into one pattern
- [ ] **Animation Support**: Create animated contribution graphs
- [ ] **Custom Color Schemes**: Different intensity color palettes
- [ ] **Batch Processing**: Process multiple repositories at once
- [ ] **Mobile Optimization**: Better mobile web interface
- [ ] **API Endpoints**: REST API for programmatic access

---

**Made with ❤️ for the GitHub community**

Transform your GitHub profile with beautiful pixel art that tells your story!