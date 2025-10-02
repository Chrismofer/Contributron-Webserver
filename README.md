# 🎨 Contributron Web Server

> **Use your GitHub contribution graph to display beautiful pixel art.**

The Contributron is a web app that sets your Github's contributron graph to the image of your choice. You may manually paint the marquee, import an image and scale it to fit, etc. Then it generates a Git repository with appropriately dated commits, then pushes it to a blank Github repository of your choice.

## 🚀 Quick Start

### 1. **Draw or import Your Image**
- Click "📂 Import Image" to select any photo
- The image automatically appears on the 53×7 contribution graph grid

### 2. **Adjust the Image crop and scale**
- **Scale**: Zoom in/out to show more or less of your image
- **X Offset**: Move left/right to center the important parts
- **Y Offset**: Move up/down for perfect vertical alignment
- **Manual Editing**: Click pixels to paint with the chosen brightness

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

### GitHub Personal Access Token
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
4. Copy the token and use it in the web interface




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



## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with real-time canvas manipulation,  Node.js/Express with Server-Sent Events for progress tracking
- **Image Processing**: Jimp for client-side image transformations
- **Backend**: Rust binary for high-performance Git repository generation written by Will Sturgeon @wsturgeon


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


### Environment Variables
```bash
PORT=3000                    # Web server port (default: 3000)
```

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

- Rust implementation of PNG-to-Repo tool by Will Sturgeon @wsturgeon
- Contributron concept, JS frontend by Chris Bovee @Chrismofer


## 🎯 Roadmap, future features

- [ ] **Mobile Optimization**: Better mobile web interface



