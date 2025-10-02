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
        this.imageCopies = 1;
        this.imageSpacing = 10;
        
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
        this.pixels[row][col] = this.currentBrush;
        this.updatePixelDisplay(row, col);
    }
    
    erasePixel(row, col) {
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
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.pixels[row][col] = 0;
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    fillCanvas() {
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.pixels[row][col] = this.currentBrush;
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    randomPattern() {
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 53; col++) {
                this.pixels[row][col] = Math.floor(Math.random() * 5);
                this.updatePixelDisplay(row, col);
            }
        }
    }
    
    loadExamplePattern(pattern) {
        // Hide all pattern controls first
        document.getElementById('wave-controls').style.display = 'none';
        document.getElementById('diagonal-controls').style.display = 'none';
        document.getElementById('checkerboard-controls').style.display = 'none';
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
                this.imageCopies = 1;
                this.imageSpacing = 10;
                
                // Update slider values
                document.getElementById('scale-slider').value = '1.0';
                document.getElementById('scale-value').textContent = '1.0';
                document.getElementById('x-offset-slider').value = '0';
                document.getElementById('x-offset-value').textContent = '0';
                document.getElementById('y-offset-slider').value = '0';
                document.getElementById('y-offset-value').textContent = '0';
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
        const gridAspectRatio = 52 / 7; // ~7.43
        
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
                            const r = data[pixelIndex];
                            const g = data[pixelIndex + 1];
                            const b = data[pixelIndex + 2];
                            
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
        this.imageCopies = 1;
        this.imageSpacing = 10;
        
        // Update sliders
        document.getElementById('scale-slider').value = '1.0';
        document.getElementById('scale-value').textContent = '1.0';
        document.getElementById('x-offset-slider').value = '0';
        document.getElementById('x-offset-value').textContent = '0';
        document.getElementById('y-offset-slider').value = '0';
        document.getElementById('y-offset-value').textContent = '0';
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
            const imageData = ctx.createImageData(52, 7);
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
}

// Initialize the pixel editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PixelEditor();
});