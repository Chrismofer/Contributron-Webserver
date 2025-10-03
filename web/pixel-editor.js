// Pixel Editor for Contributron
class PixelEditor {
    constructor() {
        this.canvasGrid = document.getElementById('canvas-grid');
        this.brushLevels = document.getElementById('brush-levels');
        this.currentBrush = 0;
        this.pixels = [];
        this.isMouseDown = false;
        
        // Pattern properties
        this.waveAngle = 46;
        this.wavePeriod = 0.57;
        this.waveOffsetX = 0;
        this.waveOffsetY = 0;
        
        this.diagonalCopies = 53;
        this.diagonalPeriod = 7;
        this.diagonalOffsetX = 0;
        this.diagonalOffsetY = 0;
        
        this.checkerboardCopies = 53;
        this.checkerboardPeriod = 2;
        this.checkerboardOffsetX = 0;
        this.checkerboardOffsetY = 0;
        
        this.sineThickness = 2;
        this.sineAmplitude = 3;
        this.sinePeriod = 10;
        this.sineLinearity = 1.0;
        
        // PNG pattern properties
        this.pngCopies = 1;
        this.pngSpacing = 10;
        this.pngOffsetX = 0;
        this.pngOffsetY = 0;
        this.currentPngData = null;
        
        // Pattern inversion
        this.isInverted = false;
        
        // Image transformation properties
        this.originalImageData = null;
        this.imageScale = 1.0;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.imageBrightness = 0;
        this.imageContrast = 0;
        this.imageCopies = 1;
        this.imageSpacing = 10;
        
        // Text overlay properties
        this.overlayText = '';
        this.textXOffset = 0;
        this.textYOffset = 0;
        this.selectedFont = 'u8g2_font_5x7';
        this.canvasBackup = null; // Store canvas state before text overlay
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.setupTabs();
        this.setupForms();
        this.currentRepoId = null; // Track current generated repo
        this.currentRepoName = null;
        this.updateFillButtonText(); // Set initial button text
        
        // Auto-load example patterns dropdown
        this.loadExampleList();
    }
    
    createCanvas() {
        // Create 7x53 grid (371 pixels total)
        this.pixels = Array(7).fill().map(() => Array(53).fill(0));
        
        // Create main canvas
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                const pixel = document.createElement('div');
                pixel.className = 'pixel level-0';
                pixel.dataset.row = row;
                pixel.dataset.col = col;
                
                // Mouse events for painting
                pixel.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.isMouseDown = true;
                    this.paintPixel(row, col);
                });
                
                pixel.addEventListener('mouseenter', () => {
                    if (this.isMouseDown) {
                        this.paintPixel(row, col);
                    }
                });
                
                pixel.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.erasePixel(row, col);
                });
                
                this.canvasGrid.appendChild(pixel);
            }
        }
        
        // Create mini view
        this.createMiniView();
        
        // Global mouse up event
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
    }
    
    createMiniView() {
        this.miniViewGrid = document.getElementById('mini-view-grid');
        
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                const miniPixel = document.createElement('div');
                miniPixel.className = 'mini-pixel level-0';
                miniPixel.dataset.row = row;
                miniPixel.dataset.col = col;
                this.miniViewGrid.appendChild(miniPixel);
            }
        }
    }
    
    setupEventListeners() {
        // Brush level selection
        this.brushLevels.addEventListener('click', (e) => {
            if (e.target.classList.contains('brush-level')) {
                // Remove active class from all levels
                this.brushLevels.querySelectorAll('.brush-level').forEach(level => {
                    level.classList.remove('active');
                });
                
                // Add active class to clicked level
                e.target.classList.add('active');
                this.currentBrush = parseInt(e.target.dataset.level);
                this.updateFillButtonText();
            }
        });
        
        // Tool buttons
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });
        
        document.getElementById('fill-btn').addEventListener('click', () => {
            this.fillCanvas();
        });
        
        document.getElementById('random-btn').addEventListener('click', () => {
            this.randomPattern();
        });
        
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportPNG();
        });
        
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importImage(e.target.files[0]);
        });
        
        document.getElementById('example-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadExamplePattern(e.target.value);
            }
        });
        
        document.getElementById('invert-btn').addEventListener('click', () => {
            this.toggleInvert();
        });
        
        // Example patterns
        document.querySelectorAll('.example-pattern').forEach(button => {
            button.addEventListener('click', (e) => {
                const pattern = e.target.dataset.pattern;
                this.loadExamplePattern(pattern);
            });
        });

        // Image transformation sliders
        document.getElementById('scale-slider').addEventListener('input', (e) => {
            this.imageScale = parseFloat(e.target.value);
            document.getElementById('scale-value').textContent = this.imageScale.toFixed(1);
            this.applyImageTransform();
        });

        document.getElementById('x-offset-slider').addEventListener('input', (e) => {
            this.imageOffsetX = parseInt(e.target.value);
            document.getElementById('x-offset-value').textContent = this.imageOffsetX;
            this.applyImageTransform();
        });

        document.getElementById('y-offset-slider').addEventListener('input', (e) => {
            this.imageOffsetY = parseInt(e.target.value);
            document.getElementById('y-offset-value').textContent = this.imageOffsetY;
            this.applyImageTransform();
        });

        document.getElementById('brightness-slider').addEventListener('input', (e) => {
            this.imageBrightness = parseInt(e.target.value);
            document.getElementById('brightness-value').textContent = this.imageBrightness;
            this.applyImageTransform();
        });

        document.getElementById('contrast-slider').addEventListener('input', (e) => {
            this.imageContrast = parseInt(e.target.value);
            document.getElementById('contrast-value').textContent = this.imageContrast;
            this.applyImageTransform();
        });

        document.getElementById('image-copies-slider').addEventListener('input', (e) => {
            this.imageCopies = parseInt(e.target.value);
            document.getElementById('image-copies-value').textContent = this.imageCopies;
            this.applyImageTransform();
        });

        document.getElementById('image-spacing-slider').addEventListener('input', (e) => {
            this.imageSpacing = parseInt(e.target.value);
            document.getElementById('image-spacing-value').textContent = this.imageSpacing;
            this.applyImageTransform();
        });

        document.getElementById('reset-transform-btn').addEventListener('click', () => {
            this.resetImageTransform();
        });

        // Pattern control sliders - update automatically
        this.setupPatternControls();
        
        // Text overlay controls
        document.getElementById('overlay-text').addEventListener('input', (e) => {
            this.overlayText = e.target.value;
            this.applyTextOverlay();
        });
        
        const xOffsetSlider = document.getElementById('text-x-offset');
        const yOffsetSlider = document.getElementById('text-y-offset');
        
        if (xOffsetSlider) {
            xOffsetSlider.addEventListener('input', (e) => {
                this.textXOffset = parseInt(e.target.value);
                document.getElementById('text-x-value').textContent = this.textXOffset;
                console.log('X offset changed to:', this.textXOffset);
                this.applyTextOverlay();
            });
        } else {
            console.error('text-x-offset element not found');
        }
        
        if (yOffsetSlider) {
            yOffsetSlider.addEventListener('input', (e) => {
                this.textYOffset = parseInt(e.target.value);
                document.getElementById('text-y-value').textContent = this.textYOffset;
                console.log('Y offset changed to:', this.textYOffset);
                this.applyTextOverlay();
            });
        } else {
            console.error('text-y-offset element not found');
        }
        
        const fontSelector = document.getElementById('text-font-select');
        if (fontSelector) {
            fontSelector.addEventListener('change', (e) => {
                this.selectedFont = e.target.value;
                console.log('Font changed to:', this.selectedFont);
                this.applyTextOverlay();
            });
        } else {
            console.error('text-font-select element not found');
        }
    }
    
    setupTabs() {
        // No tabs needed anymore - simplified interface
    }
    
    setupForms() {
        // Handle editor form submission
        const editorForm = document.getElementById('editor-form');
        if (editorForm) {
            editorForm.addEventListener('submit', (e) => this.handleFormSubmit(e, 'editor'));
        }

        // Handle push to GitHub button
        const pushButton = document.getElementById('push-to-github-btn');
        if (pushButton) {
            pushButton.addEventListener('click', (e) => this.handlePushToGitHub(e));
        }
    }
    
    paintPixel(row, col) {
        // Clear text overlay backup when manually editing
        this.canvasBackup = null;
        this.pixels[row][col] = this.currentBrush;
        this.updatePixelDisplay(row, col);
    }
    
    erasePixel(row, col) {
        // Clear text overlay backup when manually editing
        this.canvasBackup = null;
        this.pixels[row][col] = 0;
        this.updatePixelDisplay(row, col);
    }
    
    updatePixelDisplay(row, col) {
        const pixelElement = this.canvasGrid.children[row * 53 + col];
        const miniPixelElement = this.miniViewGrid.children[row * 53 + col];
        const level = this.isInverted ? (4 - this.pixels[row][col]) : this.pixels[row][col];
        
        pixelElement.className = `pixel level-${level}`;
        miniPixelElement.className = `mini-pixel level-${level}`;
    }
    
    toggleInvert() {
        this.isInverted = !this.isInverted;
        
        // Update button appearance
        const invertBtn = document.getElementById('invert-btn');
        if (this.isInverted) {
            invertBtn.textContent = '🔄 Invert Pattern (ON)';
            invertBtn.style.backgroundColor = '#238636';
        } else {
            invertBtn.textContent = '🔄 Invert Pattern';
            invertBtn.style.backgroundColor = '';
        }
        
        // Refresh all pixel displays
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    updateFillButtonText() {
        const fillBtn = document.getElementById('fill-btn');
        const brushPercentages = ['0%', '25%', '50%', '75%', '100%'];
        
        // Clear existing content
        fillBtn.innerHTML = '';
        
        // Add bucket icon and text
        const text = document.createTextNode('🪣 Fill All with ');
        fillBtn.appendChild(text);
        
        // Create colored square
        const colorSquare = document.createElement('span');
        colorSquare.className = `brush-level level-${this.currentBrush}`;
        colorSquare.style.display = 'inline-block';
        colorSquare.style.width = '12px';
        colorSquare.style.height = '12px';
        colorSquare.style.margin = '0 4px';
        colorSquare.style.verticalAlign = 'middle';
        fillBtn.appendChild(colorSquare);
        
        // Add level percentage
        const levelText = document.createTextNode(`(${brushPercentages[this.currentBrush]})`);
        fillBtn.appendChild(levelText);
    }
    
    setupPatternControls() {
        // Wave controls
        document.getElementById('wave-angle-slider').addEventListener('input', (e) => {
            this.waveAngle = parseInt(e.target.value);
            document.getElementById('wave-angle-value').textContent = this.waveAngle;
            this.drawParametricWave();
        });

        document.getElementById('wave-period-slider').addEventListener('input', (e) => {
            this.wavePeriod = parseFloat(e.target.value);
            const displayValue = this.wavePeriod < 0.01 ? this.wavePeriod.toFixed(3) : 
                                 this.wavePeriod < 0.1 ? this.wavePeriod.toFixed(3) : 
                                 this.wavePeriod < 1 ? this.wavePeriod.toFixed(2) : 
                                 this.wavePeriod.toFixed(1);
            document.getElementById('wave-period-value').textContent = displayValue;
            this.drawParametricWave();
        });

        document.getElementById('wave-x-slider').addEventListener('input', (e) => {
            this.waveOffsetX = parseInt(e.target.value);
            document.getElementById('wave-x-value').textContent = this.waveOffsetX;
            this.drawParametricWave();
        });

        document.getElementById('wave-y-slider').addEventListener('input', (e) => {
            this.waveOffsetY = parseInt(e.target.value);
            document.getElementById('wave-y-value').textContent = this.waveOffsetY;
            this.drawParametricWave();
        });

        // Diagonal controls
        document.getElementById('diagonal-copies-slider').addEventListener('input', (e) => {
            this.diagonalCopies = parseInt(e.target.value);
            document.getElementById('diagonal-copies-value').textContent = this.diagonalCopies;
            this.drawDiagonal();
        });

        document.getElementById('diagonal-period-slider').addEventListener('input', (e) => {
            this.diagonalPeriod = parseInt(e.target.value);
            document.getElementById('diagonal-period-value').textContent = this.diagonalPeriod;
            this.drawDiagonal();
        });

        document.getElementById('diagonal-x-slider').addEventListener('input', (e) => {
            this.diagonalOffsetX = parseInt(e.target.value);
            document.getElementById('diagonal-x-value').textContent = this.diagonalOffsetX;
            this.drawDiagonal();
        });

        document.getElementById('diagonal-y-slider').addEventListener('input', (e) => {
            this.diagonalOffsetY = parseInt(e.target.value);
            document.getElementById('diagonal-y-value').textContent = this.diagonalOffsetY;
            this.drawDiagonal();
        });

        // Checkerboard controls
        document.getElementById('checkerboard-copies-slider').addEventListener('input', (e) => {
            this.checkerboardCopies = parseInt(e.target.value);
            document.getElementById('checkerboard-copies-value').textContent = this.checkerboardCopies;
            this.drawCheckerboard();
        });

        document.getElementById('checkerboard-period-slider').addEventListener('input', (e) => {
            this.checkerboardPeriod = parseInt(e.target.value);
            document.getElementById('checkerboard-period-value').textContent = this.checkerboardPeriod;
            this.drawCheckerboard();
        });

        document.getElementById('checkerboard-x-slider').addEventListener('input', (e) => {
            this.checkerboardOffsetX = parseInt(e.target.value);
            document.getElementById('checkerboard-x-value').textContent = this.checkerboardOffsetX;
            this.drawCheckerboard();
        });

        document.getElementById('checkerboard-y-slider').addEventListener('input', (e) => {
            this.checkerboardOffsetY = parseInt(e.target.value);
            document.getElementById('checkerboard-y-value').textContent = this.checkerboardOffsetY;
            this.drawCheckerboard();
        });

        // Sine wave pattern controls
        document.getElementById('sine-thickness-slider').addEventListener('input', (e) => {
            this.sineThickness = parseInt(e.target.value);
            document.getElementById('sine-thickness-value').textContent = this.sineThickness;
            this.drawSineWave();
        });

        document.getElementById('sine-amplitude-slider').addEventListener('input', (e) => {
            this.sineAmplitude = parseFloat(e.target.value);
            document.getElementById('sine-amplitude-value').textContent = this.sineAmplitude;
            this.drawSineWave();
        });

        document.getElementById('sine-period-slider').addEventListener('input', (e) => {
            this.sinePeriod = parseFloat(e.target.value);
            document.getElementById('sine-period-value').textContent = this.sinePeriod;
            this.drawSineWave();
        });

        document.getElementById('sine-linearity-slider').addEventListener('input', (e) => {
            this.sineLinearity = parseFloat(e.target.value);
            document.getElementById('sine-linearity-value').textContent = this.sineLinearity;
            this.drawSineWave();
        });

        // PNG pattern controls
        document.getElementById('png-copies-slider').addEventListener('input', (e) => {
            this.pngCopies = parseInt(e.target.value);
            document.getElementById('png-copies-value').textContent = this.pngCopies;
            this.drawPNG();
        });

        document.getElementById('png-spacing-slider').addEventListener('input', (e) => {
            this.pngSpacing = parseInt(e.target.value);
            document.getElementById('png-spacing-value').textContent = this.pngSpacing;
            this.drawPNG();
        });

        document.getElementById('png-x-slider').addEventListener('input', (e) => {
            this.pngOffsetX = parseInt(e.target.value);
            document.getElementById('png-x-value').textContent = this.pngOffsetX;
            this.drawPNG();
        });

        document.getElementById('png-y-slider').addEventListener('input', (e) => {
            this.pngOffsetY = parseInt(e.target.value);
            document.getElementById('png-y-value').textContent = this.pngOffsetY;
            this.drawPNG();
        });
    }
    
    clearCanvas() {
        // Clear text overlay backup when clearing canvas
        this.canvasBackup = null;
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.pixels[row][col] = 0;
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    fillCanvas() {
        // Clear text overlay backup when filling canvas
        this.canvasBackup = null;
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.pixels[row][col] = this.currentBrush;
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    randomPattern() {
        // Clear text overlay backup when generating random pattern
        this.canvasBackup = null;
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.pixels[row][col] = Math.floor(Math.random() * 5);
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    loadExamplePattern(pattern) {
        // Clear text overlay backup when loading new pattern
        this.canvasBackup = null;
        // Hide all pattern controls first
        document.getElementById('wave-controls').style.display = 'none';
        document.getElementById('diagonal-controls').style.display = 'none';
        document.getElementById('checkerboard-controls').style.display = 'none';
        document.getElementById('sine-wave-controls').style.display = 'none';
        document.getElementById('png-controls').style.display = 'none';
        
        switch (pattern) {
            case 'wave':
                document.getElementById('wave-controls').style.display = 'block';
                this.drawParametricWave();
                break;
            case 'diagonal':
                document.getElementById('diagonal-controls').style.display = 'block';
                this.drawDiagonal();
                break;
            case 'checkerboard':
                document.getElementById('checkerboard-controls').style.display = 'block';
                this.drawCheckerboard();
                break;
            case 'sine-wave':
                document.getElementById('sine-wave-controls').style.display = 'block';
                this.drawSineWave();
                break;
            default:
                // If it's not a built-in pattern, try to load it as a PNG file
                if (pattern.endsWith('.png')) {
                    this.loadExamplePNG(pattern);
                }
                break;
        }
    }
    
    async loadExampleList() {
        try {
            const response = await fetch('/api/examples');
            const examples = await response.json();
            const select = document.getElementById('example-select');
            
            // Clear existing options (except first one)
            select.innerHTML = '<option value="">Load PNG Example...</option>';
            
            // Add options for each example file
            examples.forEach(filename => {
                const option = document.createElement('option');
                option.value = filename;
                option.textContent = filename.replace('.png', '').replace(/[-_]/g, ' ');
                select.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading example list:', error);
            alert('Failed to load example patterns');
        }
    }
    
    async loadExamplePNG(filename) {
        try {
            // Hide all pattern controls when loading a PNG
            document.getElementById('wave-controls').style.display = 'none';
            document.getElementById('diagonal-controls').style.display = 'none';
            document.getElementById('checkerboard-controls').style.display = 'none';
            document.getElementById('sine-wave-controls').style.display = 'none';
            
            // Show PNG translation controls
            document.getElementById('png-controls').style.display = 'block';
            
            // Load the PNG file directly
            const response = await fetch(`/examples/${filename}`);
            const blob = await response.blob();
            
            // Create image element to get pixel data
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    
                    // Store the PNG data for translation
                    this.currentPngData = {
                        width: img.width,
                        height: img.height,
                        data: imageData.data
                    };
                    
                    // Reset PNG pattern properties
                    this.pngCopies = 1;
                    this.pngSpacing = 10;
                    this.pngOffsetX = 0;
                    this.pngOffsetY = 0;
                    document.getElementById('png-copies-slider').value = 1;
                    document.getElementById('png-spacing-slider').value = 10;
                    document.getElementById('png-x-slider').value = 0;
                    document.getElementById('png-y-slider').value = 0;
                    document.getElementById('png-copies-value').textContent = '1';
                    document.getElementById('png-spacing-value').textContent = '10';
                    document.getElementById('png-x-value').textContent = '0';
                    document.getElementById('png-y-value').textContent = '0';
                    
                    // Draw the PNG
                    this.drawPNG();
                    resolve();
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(blob);
            });
            
        } catch (error) {
            console.error('Error loading example PNG:', error);
            alert('Failed to load example pattern: ' + filename);
        }
    }
    
    drawPNG() {
        if (!this.currentPngData) return;
        
        // Clear canvas first
        this.clearCanvas();
        
        const { width, height, data } = this.currentPngData;
        
        // Draw multiple copies of the PNG pattern with spacing
        let copyCount = 0;
        for (let col = this.pngOffsetX; col < 53 && copyCount < this.pngCopies; col += this.pngSpacing) {
            // Draw each copy of the PNG
            for (let y = 0; y < height && y < 7; y++) {
                for (let x = 0; x < width; x++) {
                    // Calculate target position for this copy
                    const targetX = col + x;
                    const targetY = y + this.pngOffsetY;
                    
                    // Skip if outside grid bounds
                    if (targetX < 0 || targetX >= 53 || targetY < 0 || targetY >= 7) continue;
                    
                    // Get pixel data (RGBA)
                    const pixelIndex = (y * width + x) * 4;
                    const r = data[pixelIndex];
                    const g = data[pixelIndex + 1];
                    const b = data[pixelIndex + 2];
                    const a = data[pixelIndex + 3];
                    
                    // Skip transparent pixels
                    if (a === 0) continue;
                    
                    // Convert to grayscale and map to 0-4 intensity levels
                    const gray = (r * 0.299 + g * 0.587 + b * 0.114);
                    const intensity = Math.round((gray / 255) * 4);
                    
                    this.pixels[targetY][targetX] = intensity;
                    this.updatePixelDisplay(targetY, targetX);
                }
            }
            copyCount++;
        }
    }
    
    drawParametricWave() {
        // Clear canvas first
        this.clearCanvas();
        
        // Convert angle to radians
        const angleRad = (this.waveAngle * Math.PI) / 180;
        
        // Calculate direction vector for the wave
        const dirX = Math.cos(angleRad);
        const dirY = Math.sin(angleRad);
        
        // Center of the grid with offsets
        const centerX = 26 + this.waveOffsetX; // 53/2 - 0.5
        const centerY = 3 + this.waveOffsetY;  // 7/2 - 0.5
        
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                // Translate coordinates to center around the middle of the grid
                const x = col - centerX;
                const y = row - centerY;
                
                // Calculate the position along the wave direction from center
                const t = (x * dirX + y * dirY) * this.wavePeriod;
                
                // Create wave that oscillates from 0 to 4, with peaks reaching exactly 4
                const sineValue = Math.sin(t + Math.PI / 2); // -1 to 1
                const wave = (sineValue + 1) * 2; // 0 to 4
                const intensity = Math.max(0, Math.min(4, Math.round(wave)));
                
                this.pixels[row][col] = intensity;
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    drawDiagonal() {
        // Clear canvas first
        this.clearCanvas();
        
        // Create diagonal lines based on copies count
        for (let copyIndex = 0; copyIndex < this.diagonalCopies; copyIndex++) {
            const lineOffset = copyIndex * this.diagonalPeriod;
            for (let col = 0; col < 53; col++) {
                for (let row = 0; row < 7; row++) {
                    const adjustedRow = row - this.diagonalOffsetY;
                    const adjustedCol = col - this.diagonalOffsetX;
                    if ((adjustedRow + adjustedCol - lineOffset) % (this.diagonalPeriod * this.diagonalCopies) === 0) {
                        this.pixels[row][col] = 4;
                        this.updatePixelDisplay(row, col);
                    }
                }
            }
        }
    }
    
    drawCheckerboard() {
        // Clear canvas first
        this.clearCanvas();
        
        // Create checkerboard pattern - iterate over entire grid
        for (let col = 0; col < 53; col++) {
            for (let row = 0; row < 7; row++) {
                // Calculate position relative to offset
                const relativeRow = row - this.checkerboardOffsetY;
                const relativeCol = col - this.checkerboardOffsetX;
                
                // Use a robust method that works with negative numbers
                // Add a large offset to make everything positive, then use modulo
                const LARGE_OFFSET = 1000;
                const checkRowIndex = Math.floor((relativeRow + LARGE_OFFSET) / this.checkerboardPeriod);
                const checkColIndex = Math.floor((relativeCol + LARGE_OFFSET) / this.checkerboardPeriod);
                
                // Calculate which copy this is (for limiting copies)
                const copyIndex = Math.floor(relativeCol / this.checkerboardPeriod);
                
                // Only draw if within bounds and within copy limit
                if (relativeCol >= 0 && copyIndex < this.checkerboardCopies) {
                    // Create checkerboard pattern
                    this.pixels[row][col] = (checkRowIndex + checkColIndex) % 2 === 0 ? 3 : 0;
                    this.updatePixelDisplay(row, col);
                }
            }
        }
    }
    
    drawSineWave() {
        // Clear canvas first
        this.clearCanvas();
        
        // Draw sine wave across the width of the grid like an oscilloscope
        for (let col = 0; col < 53; col++) {
            // Apply logarithmic scaling for non-linear frequency sweep
            // When linearity = 1.0: linear scaling (normal)
            // When linearity > 1.0: logarithmic scaling (tight on left, wide on right)
            // When linearity < 1.0: exponential scaling (wide on left, tight on right)
            
            let normalizedCol;
            if (this.sineLinearity === 1.0) {
                // Linear case - no scaling needed
                normalizedCol = col / 53;
            } else {
                // Apply power scaling for logarithmic/exponential effect
                normalizedCol = Math.pow(col / 53, this.sineLinearity);
            }
            
            // Calculate the sine wave position using the scaled position
            // Map scaled position to angle (0 to period cycles across the width)
            const angle = normalizedCol * (2 * Math.PI * (53 / this.sinePeriod));
            const sineValue = Math.sin(angle);
            
            // Convert sine value (-1 to 1) to row position (0 to 6)
            // Center the wave vertically at row 3 (middle of 7 rows)
            const centerRow = 3;
            const waveRow = centerRow + (sineValue * this.sineAmplitude);
            
            // Draw the wave with specified thickness
            const halfThickness = Math.floor(this.sineThickness / 2);
            
            for (let thickOffset = -halfThickness; thickOffset <= halfThickness; thickOffset++) {
                const targetRow = Math.round(waveRow) + thickOffset;
                
                // Make sure we're within grid bounds
                if (targetRow >= 0 && targetRow < 7) {
                    // Create oscilloscope-like intensity - brighter at center, dimmer at edges
                    const distanceFromCenter = Math.abs(waveRow - targetRow);
                    let intensity;
                    
                    if (distanceFromCenter < 0.5) {
                        intensity = 4; // Brightest at the exact wave line
                    } else if (distanceFromCenter < 1) {
                        intensity = 3; // Medium intensity near the line
                    } else if (distanceFromCenter < 1.5) {
                        intensity = 2; // Lower intensity for thickness
                    } else {
                        intensity = 1; // Minimal intensity for anti-aliasing effect
                    }
                    
                    this.pixels[targetRow][col] = intensity;
                    this.updatePixelDisplay(targetRow, col);
                }
            }
        }
    }
    
    exportPNG() {
        // Create a canvas element for export
        const canvas = document.createElement('canvas');
        canvas.width = 53;
        canvas.height = 7;
        const ctx = canvas.getContext('2d');
        
        // Create ImageData for grayscale pixel manipulation
        const imageData = ctx.createImageData(53, 7);
        const exportData = imageData.data;
        
        // Map levels to grayscale values (0-255)
        const levelToGray = [0, 64, 128, 192, 255];
        
        // Fill the ImageData with grayscale pixels
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                const level = this.pixels[row][col];
                const gray = levelToGray[level];
                const index = (row * 53 + col) * 4;
                
                // Set RGB to same value for grayscale
                exportData[index] = gray;     // Red
                exportData[index + 1] = gray; // Green  
                exportData[index + 2] = gray; // Blue
                exportData[index + 3] = 255;  // Alpha (fully opaque)
            }
        }
        
        // Put the ImageData on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'contributron-pattern.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
    
    importImage(file) {
        if (!file) return;
        
        // Clear text overlay backup when importing new image
        this.canvasBackup = null;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                console.log(`📸 Importing image: ${img.width}×${img.height}`);
                
                // Store the original image for transformations
                this.originalImageData = img;
                
                // Reset transform values
                this.imageScale = 1.0;
                this.imageOffsetX = 0;
                this.imageOffsetY = 0;
                this.imageBrightness = 0;
                this.imageContrast = 0;
                this.imageCopies = 1;
                this.imageSpacing = 10;
                
                // Update slider values
                document.getElementById('scale-slider').value = '1.0';
                document.getElementById('scale-value').textContent = '1.0';
                document.getElementById('x-offset-slider').value = '0';
                document.getElementById('x-offset-value').textContent = '0';
                document.getElementById('y-offset-slider').value = '0';
                document.getElementById('y-offset-value').textContent = '0';
                document.getElementById('brightness-slider').value = '0';
                document.getElementById('brightness-value').textContent = '0';
                document.getElementById('contrast-slider').value = '0';
                document.getElementById('contrast-value').textContent = '0';
                document.getElementById('image-copies-slider').value = '1';
                document.getElementById('image-copies-value').textContent = '1';
                document.getElementById('image-spacing-slider').value = '10';
                document.getElementById('image-spacing-value').textContent = '10';
                
                // Hide all pattern controls when importing regular image
                document.getElementById('wave-controls').style.display = 'none';
                document.getElementById('diagonal-controls').style.display = 'none';
                document.getElementById('checkerboard-controls').style.display = 'none';
                document.getElementById('png-controls').style.display = 'none';

                // Show transform controls
                document.getElementById('image-transform-controls').style.display = 'block';
                
                // Apply initial transform
                this.applyImageTransform();
                
                console.log('✅ Image imported with transform controls');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    applyImageTransform() {
        if (!this.originalImageData) return;
        
        // Clear current canvas
        this.clearCanvas();
        
        // Create canvas for the original image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas to original image size
        canvas.width = this.originalImageData.width;
        canvas.height = this.originalImageData.height;
        
        // Draw original image at full size
        ctx.drawImage(this.originalImageData, 0, 0);
        
        // Get the original image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate aspect ratios
        const originalWidth = this.originalImageData.width;
        const originalHeight = this.originalImageData.height;
        const originalAspectRatio = originalWidth / originalHeight;
        const gridAspectRatio = 53 / 7; // ~7.57
        
        // Determine how to fit the image while preserving aspect ratio
        let fitWidth, fitHeight;
        if (originalAspectRatio > gridAspectRatio) {
            // Image is wider than grid - fit to width
            fitWidth = 52;
            fitHeight = 52 / originalAspectRatio;
        } else {
            // Image is taller than grid - fit to height
            fitHeight = 7;
            fitWidth = 7 * originalAspectRatio;
        }
        
        // Calculate the dimensions of a single copy (scaled uniformly)
        const singleCopyWidth = fitWidth * this.imageScale;
        const singleCopyHeight = fitHeight * this.imageScale;
        
        // Draw multiple copies with spacing
        for (let copyIndex = 0; copyIndex < this.imageCopies; copyIndex++) {
            // Calculate the starting position for this copy
            const copyStartX = copyIndex * this.imageSpacing + this.imageOffsetX;
            
            // Apply to pixel grid for this copy
            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 53; col++) {
                    // Calculate position relative to this copy's center
                    const copyRelativeX = col - (copyStartX + singleCopyWidth / 2);
                    const copyRelativeY = row - (3.5 + this.imageOffsetY);
                    
                    // Map to fitted image coordinates
                    const fitX = copyRelativeX + (singleCopyWidth / 2);
                    const fitY = copyRelativeY + (singleCopyHeight / 2);
                    
                    // Check if we're within the fitted image bounds for this copy
                    if (fitX >= 0 && fitX < singleCopyWidth && fitY >= 0 && fitY < singleCopyHeight) {
                        // Map to original image coordinates
                        const sourceX = Math.floor((fitX / singleCopyWidth) * originalWidth);
                        const sourceY = Math.floor((fitY / singleCopyHeight) * originalHeight);
                        
                        // Check bounds and sample pixel
                        if (sourceX >= 0 && sourceX < originalWidth && sourceY >= 0 && sourceY < originalHeight) {
                            const pixelIndex = (sourceY * originalWidth + sourceX) * 4;
                            let r = data[pixelIndex];
                            let g = data[pixelIndex + 1];
                            let b = data[pixelIndex + 2];
                            
                            // Apply brightness adjustment (-100 to +100)
                            const brightnessAdjust = this.imageBrightness * 2.55; // Convert to 0-255 range
                            r = Math.max(0, Math.min(255, r + brightnessAdjust));
                            g = Math.max(0, Math.min(255, g + brightnessAdjust));
                            b = Math.max(0, Math.min(255, b + brightnessAdjust));
                            
                            // Apply contrast adjustment (-100 to +100)
                            const contrastFactor = (259 * (this.imageContrast + 255)) / (255 * (259 - this.imageContrast));
                            r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
                            g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
                            b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
                            
                            // Convert to grayscale
                            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                            
                            // Map to our 5 levels (0-4 for different commit intensities)
                            const level = Math.floor(gray / 51); // 0-255 -> 0-4
                            
                            // Only set pixel if it's within grid bounds and not already set by a previous copy
                            if (col >= 0 && col < 53 && row >= 0 && row < 7 && this.pixels[row][col] === 0) {
                                this.pixels[row][col] = Math.min(4, level);
                            }
                        }
                    }
                }
            }
        }
        
        // Update display
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.updatePixelDisplay(row, col);
            }
        }
    }

    resetImageTransform() {
        this.imageScale = 1.0;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.imageBrightness = 0;
        this.imageContrast = 0;
        this.imageCopies = 1;
        this.imageSpacing = 10;
        
        // Update sliders
        document.getElementById('scale-slider').value = '1.0';
        document.getElementById('scale-value').textContent = '1.0';
        document.getElementById('x-offset-slider').value = '0';
        document.getElementById('x-offset-value').textContent = '0';
        document.getElementById('y-offset-slider').value = '0';
        document.getElementById('y-offset-value').textContent = '0';
        document.getElementById('brightness-slider').value = '0';
        document.getElementById('brightness-value').textContent = '0';
        document.getElementById('contrast-slider').value = '0';
        document.getElementById('contrast-value').textContent = '0';
        document.getElementById('image-copies-slider').value = '1';
        document.getElementById('image-copies-value').textContent = '1';
        document.getElementById('image-spacing-slider').value = '10';
        document.getElementById('image-spacing-value').textContent = '10';
        
        // Reapply transform
        this.applyImageTransform();
    }
    
    async handleFormSubmit(e, formType) {
        e.preventDefault();
        
        const output = document.getElementById('output');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const instructions = document.getElementById('instructions');
        const downloadLink = document.getElementById('download-link');
        
        // Show loading state
        output.classList.add('show');
        loading.style.display = 'block';
        result.style.display = 'none';
        
        try {
            // Export the canvas as a grayscale image
            const canvas = document.createElement('canvas');
            canvas.width = 52;
            canvas.height = 7;
            const ctx = canvas.getContext('2d');
            
            // Create ImageData for grayscale pixel manipulation
            const imageData = ctx.createImageData(53, 7);
            const pixelData = imageData.data;
            
            const levelToGray = [0, 64, 128, 192, 255];
            
            // Fill the ImageData with grayscale pixels
            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 53; col++) {
                    const level = this.pixels[row][col];
                    const gray = levelToGray[level];
                    const index = (row * 53 + col) * 4;
                    
                    // Set RGB to same value for grayscale
                    pixelData[index] = gray;     // Red
                    pixelData[index + 1] = gray; // Green  
                    pixelData[index + 2] = gray; // Blue
                    pixelData[index + 3] = 255;  // Alpha (fully opaque)
                }
            }
            
            // Put the ImageData on the canvas
            ctx.putImageData(imageData, 0, 0);
            
            // Convert canvas to blob as PNG
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            
            // Create form data
            const formData = new FormData();
            const email = document.getElementById('editor-email').value;
            const repoName = document.getElementById('editor-repo-name').value;
            
            console.log('Form values - email:', email, 'repo-name:', repoName);
            
            formData.append('email', email);
            formData.append('repo-name', repoName);
            formData.append('auto-push', 'false'); // Never auto-push, use separate button
            formData.append('image', blob, 'pattern.png');
            
            // Store repo name for later push
            this.currentRepoName = repoName;
            
            // Start the generation process
            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.repoId) {
                // Store the repo ID for later push
                this.currentRepoId = data.repoId;
                // Start listening to progress updates
                this.listenToProgress(data.repoId, loading, result, this.currentRepoName);
            } else {
                throw new Error(data.error || 'Failed to start generation process');
            }
            
        } catch (error) {
            loading.style.display = 'none';
            result.style.display = 'block';
            result.innerHTML = `
                <h3 style="color: #f85149;">❌ Error</h3>
                <p>Failed to start generation: ${error.message}</p>
            `;
        }
    }

    listenToProgress(repoId, loading, result, repoName) {
        const loadingText = loading.querySelector('p');
        const eventSource = new EventSource(`/progress/${repoId}`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Progress update:', data);
                
                switch (data.type) {
                    case 'connected':
                        loadingText.textContent = 'Connected to progress stream...';
                        break;
                        
                    case 'progress':
                        if (data.percentage !== undefined) {
                            // Show progress with percentage bar
                            loadingText.innerHTML = `
                                ${data.message}
                                <div style="background-color: #f0f0f0; border-radius: 10px; padding: 3px; margin-top: 8px; width: 100%;">
                                    <div style="background-color: #28a745; height: 20px; border-radius: 7px; width: ${data.percentage}%; transition: width 0.3s ease;"></div>
                                </div>
                                <small style="color: #666; margin-top: 4px; display: block;">
                                    ${data.currentDate ? `Current date: ${data.currentDate}` : ''}
                                </small>
                            `;
                        } else {
                            loadingText.textContent = data.message;
                        }
                        break;
                        
                    case 'warning':
                        loadingText.innerHTML = `⚠️ ${data.message}`;
                        break;
                        
                    case 'success':
                        loadingText.textContent = data.message;
                        break;
                        
                    case 'complete':
                        loading.style.display = 'none';
                        result.style.display = 'block';
                        
                        // Show success and enable push button
                        result.innerHTML = `
                            <h3>✅ Repository Generated Successfully!</h3>
                            <p>Your local repository with pre-dated commits has been created!</p>
                            <p><strong>Next steps:</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Use the "Push to GitHub" button below, or</li>
                                <li>Download the ZIP and push manually</li>
                            </ul>
                            <a href="${data.downloadUrl}" class="download-link">📦 Download Repository ZIP</a>
                        `;
                        
                        // Enable the push to GitHub button
                        const pushButton = document.getElementById('push-to-github-btn');
                        const helpText = document.getElementById('push-help-text');
                        if (pushButton) {
                            pushButton.disabled = false;
                            pushButton.style.background = '#238636';
                            pushButton.style.color = 'white';
                        }
                        if (helpText) {
                            helpText.textContent = 'Fill in your GitHub credentials above and click to push';
                        }
                        
                        eventSource.close();
                        break;
                        
                    case 'error':
                        loading.style.display = 'none';
                        result.style.display = 'block';
                        result.innerHTML = `
                            <h3 style="color: #f85149;">❌ Error</h3>
                            <p>${data.message}</p>
                        `;
                        eventSource.close();
                        break;
                }
            } catch (err) {
                console.error('Error parsing progress data:', err);
            }
        };
        
        eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            eventSource.close();
            
            loading.style.display = 'none';
            result.style.display = 'block';
            result.innerHTML = `
                <h3 style="color: #f85149;">❌ Connection Error</h3>
                <p>Lost connection to progress stream. The generation might still be running in the background.</p>
                <p>Please check back in a few minutes or try refreshing the page.</p>
            `;
        };
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            eventSource.close();
        });
    }

    async handlePushToGitHub(e) {
        e.preventDefault();
        
        // Check if we have a generated repo
        if (!this.currentRepoId) {
            alert('❌ Error: No repository has been generated yet!\n\nPlease generate a local repository first by clicking "Generate Local Repo with Pre-dated Commits".');
            return;
        }

        const githubUsername = document.getElementById('editor-github-username').value.trim();
        const githubToken = document.getElementById('editor-github-token').value.trim();

        if (!githubUsername || !githubToken) {
            alert('❌ Error: Missing GitHub credentials!\n\nPlease fill in both your GitHub username and Personal Access Token.');
            return;
        }

        const pushButton = document.getElementById('push-to-github-btn');
        const originalText = pushButton.textContent;
        
        try {
            // Update button to show loading state
            pushButton.disabled = true;
            pushButton.textContent = '🚀 Pushing...';
            pushButton.style.background = '#30363d';

            const response = await fetch('/push-to-github', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    repoId: this.currentRepoId,
                    username: githubUsername,
                    token: githubToken
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                const result = document.getElementById('result');
                result.innerHTML = `
                    <h3>✅ Success! Repository Pushed to GitHub!</h3>
                    <p>Your pixel art has been successfully pushed to GitHub!</p>
                    <p><strong>Repository:</strong> <a href="${data.url}" target="_blank" style="color: #58a6ff;">${data.url}</a></p>
                    <p><strong>Branch:</strong> ${data.branch}</p>
                    <p>🎉 Your contribution graph will update within a few minutes!</p>
                    <a href="/download/${this.currentRepoId}" class="download-link">📦 Download Backup ZIP</a>
                `;

                // Update button to show success
                pushButton.textContent = '✅ Pushed Successfully!';
                pushButton.style.background = '#238636';
            } else {
                throw new Error(data.error || 'Push failed');
            }

        } catch (error) {
            console.error('Push failed:', error);
            alert(`❌ Push Failed: ${error.message}\n\nYou can try again or download the ZIP and push manually.`);
            
            // Reset button
            pushButton.disabled = false;
            pushButton.textContent = originalText;
            pushButton.style.background = '#238636';
        }
    }
    
    // Text overlay functionality
    backupCanvas() {
        // Create a deep copy of the current pixels array
        this.canvasBackup = [];
        for (let row = 0; row < 7; row++) {
            this.canvasBackup[row] = [...this.pixels[row]];
        }
    }
    
    restoreCanvas() {
        if (this.canvasBackup) {
            // Restore pixels from backup
            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 53; col++) {
                    this.pixels[row][col] = this.canvasBackup[row][col];
                }
            }
            // Update the display
            for (let row = 0; row < 7; row++) {
                for (let col = 0; col < 53; col++) {
                    this.updatePixelDisplay(row, col);
                }
            }
        }
    }
    
    applyTextOverlay() {
        if (!this.overlayText.trim()) {
            // If no text, restore to original state if backup exists
            if (this.canvasBackup) {
                this.restoreCanvas();
                this.canvasBackup = null; // Clear backup when no text
            }
            return;
        }
        
        // If we don't have a backup yet, create one
        if (!this.canvasBackup) {
            this.backupCanvas();
        } else {
            // Restore to clean state before applying new text position
            this.restoreCanvas();
        }
        
        // Apply text overlay on clean canvas
        this.renderTextOnCanvas(this.overlayText.trim());
    }
    
    getU8g2Font(fontName) {
        // Real U8g2 fonts with authentic bitmap data based on actual u8g2 font files
        const fonts = {
            'u8g2_font_micro_mr': {
                width: 3,
                height: 5,
                spacing: 1,
                chars: {
                    'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
                    'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
                    'C': [[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
                    'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
                    'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
                    'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
                    'G': [[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
                    'H': [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
                    'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
                    'J': [[0,0,1],[0,0,1],[0,0,1],[1,0,1],[0,1,0]],
                    'K': [[1,0,1],[1,1,0],[1,0,0],[1,1,0],[1,0,1]],
                    'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
                    'M': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
                    'N': [[1,0,1],[1,1,1],[1,1,1],[1,1,1],[1,0,1]],
                    'O': [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
                    'P': [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
                    'Q': [[0,1,0],[1,0,1],[1,0,1],[1,1,1],[0,1,1]],
                    'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
                    'S': [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
                    'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
                    'U': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
                    'V': [[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
                    'W': [[1,0,1],[1,0,1],[1,1,1],[1,1,1],[1,0,1]],
                    'X': [[1,0,1],[0,1,0],[0,1,0],[0,1,0],[1,0,1]],
                    'Y': [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
                    'Z': [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
                    '0': [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
                    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
                    '2': [[0,1,0],[1,0,1],[0,0,1],[0,1,0],[1,1,1]],
                    '3': [[1,1,0],[0,0,1],[0,1,0],[0,0,1],[1,1,0]],
                    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
                    '5': [[1,1,1],[1,0,0],[1,1,0],[0,0,1],[1,1,0]],
                    '6': [[0,1,1],[1,0,0],[1,1,0],[1,0,1],[0,1,0]],
                    '7': [[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
                    '8': [[0,1,0],[1,0,1],[0,1,0],[1,0,1],[0,1,0]],
                    '9': [[0,1,0],[1,0,1],[0,1,1],[0,0,1],[1,1,0]],
                    ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
                    '.': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,1,0]],
                    ',': [[0,0,0],[0,0,0],[0,0,0],[0,1,0],[1,0,0]],
                    '!': [[0,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
                    '?': [[0,1,0],[1,0,1],[0,0,1],[0,1,0],[0,1,0]],
                    ':': [[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]],
                    '-': [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
                    '+': [[0,0,0],[0,1,0],[1,1,1],[0,1,0],[0,0,0]],
                    '=': [[0,0,0],[1,1,1],[0,0,0],[1,1,1],[0,0,0]]
                }
            },
            'u8g2_font_threepix_tr': {
                width: 3,
                height: 3,
                spacing: 1,
                chars: {
                    'A': [[1,1,1],[1,0,1],[1,1,1]],
                    'B': [[1,1,0],[1,1,0],[1,1,1]],
                    'C': [[1,1,1],[1,0,0],[1,1,1]],
                    'D': [[1,1,0],[1,0,1],[1,1,0]],
                    'E': [[1,1,1],[1,1,0],[1,1,1]],
                    'F': [[1,1,1],[1,1,0],[1,0,0]],
                    'G': [[1,1,1],[1,0,1],[1,1,1]],
                    'H': [[1,0,1],[1,1,1],[1,0,1]],
                    'I': [[1,1,1],[0,1,0],[1,1,1]],
                    'J': [[1,1,1],[0,0,1],[1,1,1]],
                    'K': [[1,0,1],[1,1,0],[1,0,1]],
                    'L': [[1,0,0],[1,0,0],[1,1,1]],
                    'M': [[1,0,1],[1,1,1],[1,0,1]],
                    'N': [[1,1,0],[1,0,1],[1,0,1]],
                    'O': [[1,1,1],[1,0,1],[1,1,1]],
                    'P': [[1,1,1],[1,1,1],[1,0,0]],
                    'Q': [[1,1,1],[1,0,1],[1,1,0]],
                    'R': [[1,1,0],[1,1,0],[1,0,1]],
                    'S': [[1,1,1],[0,1,0],[1,1,1]],
                    'T': [[1,1,1],[0,1,0],[0,1,0]],
                    'U': [[1,0,1],[1,0,1],[1,1,1]],
                    'V': [[1,0,1],[1,0,1],[0,1,0]],
                    'W': [[1,0,1],[1,1,1],[1,0,1]],
                    'X': [[1,0,1],[0,1,0],[1,0,1]],
                    'Y': [[1,0,1],[0,1,0],[0,1,0]],
                    'Z': [[1,1,1],[0,1,0],[1,1,1]],
                    '0': [[1,1,1],[1,0,1],[1,1,1]],
                    '1': [[0,1,0],[0,1,0],[0,1,0]],
                    '2': [[1,1,1],[0,1,1],[1,1,1]],
                    '3': [[1,1,1],[0,1,1],[1,1,1]],
                    '4': [[1,0,1],[1,1,1],[0,0,1]],
                    '5': [[1,1,1],[1,1,0],[1,1,1]],
                    '6': [[1,1,1],[1,1,0],[1,1,1]],
                    '7': [[1,1,1],[0,0,1],[0,0,1]],
                    '8': [[1,1,1],[1,1,1],[1,1,1]],
                    '9': [[1,1,1],[1,1,1],[0,0,1]],
                    ' ': [[0,0,0],[0,0,0],[0,0,0]],
                    '.': [[0,0,0],[0,0,0],[0,1,0]],
                    ',': [[0,0,0],[0,0,0],[1,0,0]],
                    '!': [[0,1,0],[0,1,0],[0,1,0]],
                    '?': [[1,1,1],[0,1,0],[0,1,0]],
                    ':': [[0,0,0],[0,1,0],[0,1,0]],
                    '-': [[0,0,0],[1,1,1],[0,0,0]],
                    '+': [[0,1,0],[1,1,1],[0,1,0]],
                    '=': [[0,0,0],[1,1,1],[1,1,1]]
                }
            },
            'u8g2_font_5x7_mr': {
                width: 5,
                height: 7,
                spacing: 1,
                chars: {
                    'A': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
                    'B': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
                    'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
                    'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
                    'E': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
                    'F': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
                    'G': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    'H': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
                    'I': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
                    'J': [[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    'K': [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
                    'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
                    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
                    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1]],
                    'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    'P': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
                    'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[0,1,1,1,1]],
                    'R': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0]],
                    'S': [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,1,1,1,0]],
                    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
                    'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    'V': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,1,0,1,0],[0,0,1,0,0]],
                    'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
                    'X': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
                    'Y': [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
                    'Z': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
                    '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
                    '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1]],
                    '3': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,1,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    '4': [[0,0,1,0,1],[0,1,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1]],
                    '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    '6': [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0]],
                    '8': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
                    '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[1,1,1,1,0]],
                    ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                    '.': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0]],
                    '!': [[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0]],
                    '?': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0]],
                    '-': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
                    '+': [[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0]]
                }
            }
        };
        
        // Return the micro font as fallback
        return fonts[fontName] || fonts['u8g2_font_micro_mr'];
    }
    
    renderTextOnCanvas(text) {
        const fontDef = this.getU8g2Font(this.selectedFont);
        const font = fontDef.chars;
        
        // Calculate text dimensions using font definition
        const charWidth = fontDef.width;
        const charHeight = fontDef.height;
        const spacing = fontDef.spacing;
        const textWidth = text.length * (charWidth + spacing) - spacing;
        
        // Calculate starting position - center left baseline with offsets
        let startX = 2 + this.textXOffset; // Start from left side with some padding
        let startY = Math.floor((7 - charHeight) / 2) + this.textYOffset; // Vertically centered
        
        // Render each character
        for (let i = 0; i < text.length; i++) {
            const char = text[i].toUpperCase();
            const charPattern = font[char] || font[' '];
            const charX = startX + i * (charWidth + spacing);
            
            if (charPattern) {
                for (let y = 0; y < charHeight; y++) {
                    for (let x = 0; x < charWidth; x++) {
                        const pixelX = charX + x;
                        const pixelY = startY + y;
                        
                        // Check bounds
                        if (pixelX >= 0 && pixelX < 53 && pixelY >= 0 && pixelY < 7) {
                            if (charPattern[y][x] === 1) {
                                this.pixels[pixelY][pixelX] = 4; // Use brightest level for text
                                this.updatePixelDisplay(pixelY, pixelX);
                            }
                        }
                    }
                }
            }
        }
    }
}

// Initialize the pixel editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PixelEditor();
});