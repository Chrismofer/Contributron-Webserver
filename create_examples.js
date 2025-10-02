// Script to create example PNG files
const Jimp = require('jimp');
const path = require('path');

async function createExamplePNGs() {
    const examplesDir = path.join(__dirname, 'examples');
    
    // Simple heart pattern
    const heartData = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0],
        [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
        [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
        [0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 255],
        [0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 255, 255],
        [0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 255]
    ];
    
    // Create heart pattern
    const heartImage = new Jimp(53, 7, 0x000000ff);
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 53; x++) {
            const gray = heartData[y][x];
            heartImage.setPixelColor(Jimp.rgbaToInt(gray, gray, gray, 255), x, y);
        }
    }
    await heartImage.writeAsync(path.join(examplesDir, 'heart-pattern.png'));
    
    // Simple diagonal pattern
    const diagonalImage = new Jimp(53, 7, 0x000000ff);
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 53; x++) {
            if ((x + y) % 8 === 0) {
                diagonalImage.setPixelColor(0xffffffff, x, y);
            }
        }
    }
    await diagonalImage.writeAsync(path.join(examplesDir, 'diagonal-lines.png'));
    
    // Checkerboard pattern
    const checkerImage = new Jimp(53, 7, 0x000000ff);
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 53; x++) {
            const checkX = Math.floor(x / 4);
            const checkY = Math.floor(y / 2);
            if ((checkX + checkY) % 2 === 0) {
                checkerImage.setPixelColor(0xc0c0c0ff, x, y);
            }
        }
    }
    await checkerImage.writeAsync(path.join(examplesDir, 'checkerboard.png'));
    
    // Wave pattern
    const waveImage = new Jimp(53, 7, 0x000000ff);
    for (let x = 0; x < 53; x++) {
        const y = Math.round(3 + 2 * Math.sin(x / 8));
        if (y >= 0 && y < 7) {
            waveImage.setPixelColor(0xffffffff, x, y);
        }
    }
    await waveImage.writeAsync(path.join(examplesDir, 'sine-wave.png'));
    
    // Random dots pattern
    const dotsImage = new Jimp(53, 7, 0x000000ff);
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * 53);
        const y = Math.floor(Math.random() * 7);
        const gray = Math.floor(Math.random() * 256);
        dotsImage.setPixelColor(Jimp.rgbaToInt(gray, gray, gray, 255), x, y);
    }
    await dotsImage.writeAsync(path.join(examplesDir, 'random-dots.png'));
    
    console.log('✅ Example PNG files created successfully!');
}

createExamplePNGs().catch(console.error);