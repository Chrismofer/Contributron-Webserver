# 🎨 Contributron Web Server

> **Use your GitHub contribution graph to display beautiful pixel art.**

The Contributron is a web app that sets your Github's contributron graph to the image of your choice. 
You may manually compose the image, import from a file, scale it to fit, composite the image with text or other patterns, etc. 
Then it generates a Git repository with appropriately dated commits, then pushes it to the blank Github repository of your choice.

Make your contributions display show whatever you want:

<img width="966" height="275" alt="kq7Iz8E" src="https://github.com/user-attachments/assets/d30a4692-774c-41c0-8009-1e400768e87f" />

<img width="1249" height="212" alt="image" src="https://github.com/user-attachments/assets/66ff9002-4370-4c30-87b3-6f3d29154aff" />


![giphy](https://github.com/user-attachments/assets/d5dd3526-63fd-4ee6-8bae-dd697ccf6403)



## 🚀 Quick Start

### 1. **Draw or import Your Image**
- Click "📂 Import Image" to select any photo
- The image automatically appears on the 53×7 contribution graph grid

### 2. **Adjust the Image crop and scale**
- **Scale**: Zoom in/out to crop more or less of your image
- **X Offset**: Move left/right
- **Y Offset**: Move up/down
- **Manual Editing**: Click pixels to paint with the chosen brush color

### 3. **Generate Repository**
- Enter your GitHub email address
- Enter the GitHub repository name. (It must be a blank repository or else commit conflicts will probably occur.)
- Click "🚀 Generate Repository"
- Watch real-time progress as commits are generated. Some systems are faster than others at this.

### 4. **Push to GitHub**
- Enter your GitHub username
- Enter your 'classic' Personal Access Token with Repo privileges ([Create one here](https://github.com/settings/tokens))
- Click "📤 Push to GitHub".
- Your contribution graph art will appear on your GitHub profile!

### GitHub Personal Access Token
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories)
4. Copy the token and use it in the web interface





The web interface looks like this:

<img width="1614" height="1257" alt="image" src="https://github.com/user-attachments/assets/152ce46c-be0b-4cf0-ac1f-b7e2e77f5edf" />




Other contributron examples:

<img width="1305" height="237" alt="nVCcaQC" src="https://github.com/user-attachments/assets/fb09c3c1-f1b8-440a-b65a-0a231a447853" />

<img width="1279" height="231" alt="27VbGo6" src="https://github.com/user-attachments/assets/20d96694-ea87-43d1-a83c-6509adc5539a" />

<img width="1302" height="252" alt="ji4z8t6" src="https://github.com/user-attachments/assets/9f93040f-59ee-4310-ab4f-2b325859251b" />

<img width="1274" height="235" alt="HwtYlcq" src="https://github.com/user-attachments/assets/d3713d9e-5d1b-4a2e-a1d8-b2754c872893" />




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
- **Frontend**: Vanilla JavaScript with real-time canvas manipulation,  Node.js/Express with Server-Sent Events for progress tracking, Jimp for client-side image transformations
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

- Rust implementation of repo commit generation by Will Sturgeon @wsturgeon
- Contributron concept, JS frontend by Chris Bovee @Chrismofer


## 🎯 Roadmap, future features

- **Mobile Optimization**: Better mobile web interface
- **Mobile Optimization**: Better mobile web interface


