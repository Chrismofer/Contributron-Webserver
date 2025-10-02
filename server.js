const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

// Try to load Jimp, with fallback
let Jimp;
try {
    Jimp = require('jimp');
    console.log('✅ Jimp loaded successfully for image processing');
} catch (error) {
    console.log('⚠️  Jimp not available, image processing will be disabled');
    console.log('   Install with: npm install jimp');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Image processing function
async function processImageForContributron(inputPath, outputPath) {
    if (!Jimp) {
        throw new Error('Jimp not available for image processing');
    }
    
    try {
        console.log('📸 Processing image for Contributron format:', inputPath);
        
        // Load the image
        const image = await Jimp.read(inputPath);
        
        console.log(`Original image size: ${image.bitmap.width}x${image.bitmap.height}`);
        
        // Convert to grayscale and resize to 52x7 (contributron format)
        const processed = image
            .greyscale()  // Convert to monochrome
            .resize(52, 7)  // Resize to contributron dimensions (52 weeks x 7 days)
            .contrast(0.5)  // Increase contrast
            .posterize(2);  // Reduce to 2 colors (black/white)
        
        // Save the processed image
        await processed.writeAsync(outputPath);
        
        console.log('✅ Image processed successfully to 52x7 format:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('❌ Image processing failed:', error.message);
        throw error;
    }
}

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Accept image files only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Store generated repositories temporarily
const generatedRepos = new Map();

// Store active generation processes
const activeGenerations = new Map();

// Function to push repository to GitHub
async function pushToGitHub(repoPath, repoName, username, token) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Create the GitHub repository URL with authentication
    const repoUrl = `https://${token}@github.com/${username}/${repoName}.git`;
    
    try {
        // Change to repo directory and execute git commands
        const options = { cwd: repoPath };
        
        console.log(`Setting up remote for ${username}/${repoName}`);
        
        // Remove existing remote if it exists
        try {
            await execAsync('git remote remove origin', options);
        } catch (err) {
            // Ignore if remote doesn't exist
        }
        
        // Add remote origin with token authentication
        await execAsync(`git remote add origin ${repoUrl}`, options);
        
        // Get current branch name - try multiple methods
        let currentBranch = 'main';
        try {
            const { stdout: branchName } = await execAsync('git branch --show-current', options);
            if (branchName.trim()) {
                currentBranch = branchName.trim();
            }
        } catch (err) {
            // Fallback: try to get branch from git status
            try {
                const { stdout: statusOutput } = await execAsync('git status --porcelain -b', options);
                const branchMatch = statusOutput.match(/^## (.+?)(?:\.\.\.|$)/m);
                if (branchMatch) {
                    currentBranch = branchMatch[1];
                }
            } catch (err2) {
                console.warn('Could not detect branch, using default:', currentBranch);
            }
        }
        
        console.log(`Detected branch: ${currentBranch}`);
        
        // If we don't have a proper branch (e.g., detached HEAD), create main
        if (!currentBranch || currentBranch === 'HEAD' || currentBranch.includes('no branch')) {
            console.log('No proper branch detected, creating main branch');
            await execAsync('git checkout -b main', options);
            currentBranch = 'main';
        }
        
        // Check what the remote default branch is
        let remoteBranch = 'main'; // Default assumption
        try {
            const { stdout: remoteInfo } = await execAsync('git ls-remote --symref origin HEAD', options);
            const remoteMatch = remoteInfo.match(/ref: refs\/heads\/([^\s]+)/);
            if (remoteMatch) {
                remoteBranch = remoteMatch[1];
            }
        } catch (err) {
            console.log('Could not detect remote default branch, assuming main');
        }
        
        console.log(`Local branch: ${currentBranch}, Remote branch: ${remoteBranch}`);
        
        // Push to GitHub with better error handling
        // If branches don't match, push local branch to remote branch
        const pushCommand = currentBranch === remoteBranch 
            ? `git push -u origin ${currentBranch}`
            : `git push -u origin ${currentBranch}:${remoteBranch}`;
            
        console.log(`Pushing with command: ${pushCommand}`);
        const { stdout, stderr } = await execAsync(pushCommand, options);
        
        return {
            success: true,
            branch: currentBranch,
            url: `https://github.com/${username}/${repoName}`,
            output: stdout
        };
        
    } catch (error) {
        console.error('Git push error:', error);
        
        // Provide more helpful error messages
        if (error.message.includes('403') || error.message.includes('Permission denied')) {
            throw new Error(`GitHub authentication failed. Please check:
1. Your Personal Access Token is valid and has 'repo' permissions
2. The repository '${repoName}' exists on GitHub under your account
3. Your token hasn't expired

Create the repository manually on GitHub first, or check your token at: https://github.com/settings/tokens`);
        } else if (error.message.includes('404')) {
            throw new Error(`Repository '${username}/${repoName}' not found. Please create it on GitHub first.`);
        } else {
            throw new Error(`Failed to push to GitHub: ${error.message}`);
        }
    }
}

// Serve static files
app.use(express.static('web'));
app.use('/examples', express.static('examples'));
app.use(express.json());

// API endpoint to list example patterns
app.get('/api/examples', async (req, res) => {
    console.log('📋 Examples API called');
    try {
        const examplesDir = path.join(__dirname, 'examples');
        console.log('📁 Reading directory:', examplesDir);
        const files = await fs.readdir(examplesDir);
        console.log('📄 Found files:', files);
        const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
        console.log('🖼️ PNG files:', pngFiles);
        res.json(pngFiles);
    } catch (error) {
        console.error('❌ Error reading examples directory:', error);
        res.status(500).json({ error: error.message });
    }
});

// Server-Sent Events endpoint for progress updates
app.get('/progress/:repoId', (req, res) => {
    const repoId = req.params.repoId;
    
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Store the response object for this generation
    if (!activeGenerations.has(repoId)) {
        activeGenerations.set(repoId, { clients: [] });
    }
    activeGenerations.get(repoId).clients.push(res);
    
    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Progress stream connected' })}\n\n`);
    
    // Clean up on client disconnect
    req.on('close', () => {
        const generation = activeGenerations.get(repoId);
        if (generation) {
            const index = generation.clients.indexOf(res);
            if (index > -1) {
                generation.clients.splice(index, 1);
            }
            if (generation.clients.length === 0) {
                activeGenerations.delete(repoId);
            }
        }
    });
});

// Function to send progress updates to all clients for a repo
function sendProgress(repoId, type, message, data = {}) {
    const generation = activeGenerations.get(repoId);
    if (generation) {
        const progressData = { type, message, ...data };
        const dataString = `data: ${JSON.stringify(progressData)}\n\n`;
        
        generation.clients.forEach(client => {
            try {
                client.write(dataString);
            } catch (err) {
                console.warn('Failed to send progress update:', err.message);
            }
        });
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main generation endpoint
app.post('/generate', upload.single('image'), async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        console.log('Received file:', req.file ? req.file.originalname : 'No file');
        
        const { 
            email, 
            'repo-name': repoName,
            'github-username': githubUsername,
            'github-token': githubToken,
            'auto-push': autoPush
        } = req.body;
        const imageFile = req.file;
        const name = 'contributron'; // Fixed name for all repositories

        if (!imageFile) {
            console.log('Error: No image file uploaded');
            return res.status(400).json({ 
                success: false, 
                error: 'No image file uploaded' 
            });
        }

        if (!email || !repoName) {
            console.log('Error: Missing fields - email:', !!email, 'repoName:', !!repoName);
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: email or repo-name' 
            });
        }

        // Clean the repository name - extract just the name part if it's a URL
        let cleanRepoName = repoName.trim();
        
        // If it's a GitHub URL, extract just the repository name
        const githubUrlMatch = cleanRepoName.match(/github\.com\/[^\/]+\/([^\/\?#]+)/);
        if (githubUrlMatch) {
            cleanRepoName = githubUrlMatch[1];
        }
        
        // Remove any remaining invalid characters for folder names
        cleanRepoName = cleanRepoName.replace(/[<>:"/\\|?*]/g, '-');
        
        // Ensure it's not empty after cleaning
        if (!cleanRepoName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid repository name' 
            });
        }
        
        console.log('Cleaned repo name:', cleanRepoName);

        // Generate unique ID for this request
        const repoId = uuidv4();
        const outputDir = path.join('generated', repoId);
        const repoPath = path.join(outputDir, cleanRepoName);

        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Build the contributron command
        const contributronPath = process.platform === 'win32' 
            ? path.join(process.cwd(), 'target', 'release', 'contributron.exe')
            : path.join(process.cwd(), 'target', 'release', 'contributron');

        const command = `"${contributronPath}" --repo "${repoPath}" --image "${imageFile.path}" --name "${name}" --email "${email}"`;

        // Return immediately with repo ID for progress tracking
        res.json({ 
            success: true, 
            repoId,
            message: 'Generation started, connect to progress stream for updates'
        });

        // Process asynchronously with progress updates
        processGeneration(repoId, contributronPath, imageFile, repoPath, cleanRepoName, name, email, githubUsername, githubToken, autoPush, outputDir)
            .catch(error => {
                console.error('Generation failed:', error);
                sendProgress(repoId, 'error', `Generation failed: ${error.message}`);
            });

    } catch (error) {
        console.error('Request processing error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Async function to handle the generation process with progress updates
async function processGeneration(repoId, contributronPath, imageFile, repoPath, cleanRepoName, name, email, githubUsername, githubToken, autoPush, outputDir) {
    try {
        sendProgress(repoId, 'progress', 'Preparing uploaded image...');
        
        // Simply ensure the image file has the correct extension
        const finalImagePath = imageFile.path + '.png';
        await fs.rename(imageFile.path, finalImagePath);
        
        console.log('✅ Using uploaded image:', finalImagePath);
        
        sendProgress(repoId, 'progress', 'Starting commit generation...');
        
        // Update the command to use the processed image file
        const commandWithExt = `"${contributronPath}" --repo "${repoPath}" --image "${finalImagePath}" --name "${name}" --email "${email}"`;
        
        console.log(`Executing: ${commandWithExt}`);

        // Execute the contributron CLI with progress updates
        await new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const process = spawn(contributronPath, [
                '--repo', repoPath,
                '--image', finalImagePath,
                '--name', name,
                '--email', email
            ]);

            let output = '';
            let commitCount = 0;

            process.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log('Contributron stdout:', text);
                
                // Count commits being generated (look for commit-like patterns)
                const commitMatches = text.match(/commit|creating|generating/gi);
                if (commitMatches) {
                    commitCount += commitMatches.length;
                    sendProgress(repoId, 'progress', `Generating commits... (${commitCount} processed)`);
                }
            });

            process.stderr.on('data', (data) => {
                const text = data.toString();
                console.error('Contributron stderr:', text);
                // Don't send every stderr as error, some might be progress info
                if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
                    sendProgress(repoId, 'warning', `Warning: ${text.trim()}`);
                }
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Contributron exited with code ${code}`));
                } else {
                    sendProgress(repoId, 'progress', 'Commit generation completed!');
                    resolve();
                }
            });

            process.on('error', (error) => {
                reject(error);
            });
        });

        // Clean up the renamed image file
        try {
            await fs.unlink(imagePathWithExt);
        } catch (err) {
            console.warn('Failed to cleanup renamed image:', err.message);
        }

        // No auto-push - always generate local repo only
        sendProgress(repoId, 'success', 'Local repository generated successfully!');

        // Store the repo info for download
        generatedRepos.set(repoId, {
            repoPath,
            repoName: cleanRepoName,
            createdAt: new Date(),
            name: 'contributron',
            email,
            pushResult: null // Will be set when user manually pushes
        });

        // Send final completion status
        sendProgress(repoId, 'complete', 'Generation process completed!', { 
            repoId, 
            downloadUrl: `/download/${repoId}`
        });

        // Schedule cleanup of generated repo after 1 hour
        setTimeout(async () => {
            try {
                await fs.rm(outputDir, { recursive: true, force: true });
                generatedRepos.delete(repoId);
                console.log(`Cleaned up repo ${repoId}`);
            } catch (err) {
                console.warn(`Failed to cleanup repo ${repoId}:`, err.message);
            }
        }, 60 * 60 * 1000); // 1 hour

    } catch (error) {
        console.error('Generation process error:', error);
        sendProgress(repoId, 'error', `Generation failed: ${error.message}`);
        throw error;
    }
}

// New endpoint for separate push to GitHub
app.post('/push-to-github', express.json(), async (req, res) => {
    try {
        const { repoId, username, token } = req.body;

        if (!repoId || !username || !token) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: repoId, username, or token'
            });
        }

        // Check if the repo exists
        const repoInfo = generatedRepos.get(repoId);
        if (!repoInfo) {
            return res.status(404).json({
                success: false,
                error: 'Repository not found. It may have expired or never existed.'
            });
        }

        console.log(`Manual push requested for repo ${repoId} by user ${username}`);

        // Push to GitHub
        const pushResult = await pushToGitHub(repoInfo.repoPath, repoInfo.repoName, username, token);
        
        console.log('Manual push successful:', pushResult);

        // Update the stored repo info
        repoInfo.pushResult = pushResult;
        generatedRepos.set(repoId, repoInfo);

        res.json({
            success: true,
            ...pushResult
        });

    } catch (error) {
        console.error('Manual push failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download endpoint
app.get('/download/:repoId', async (req, res) => {
    try {
        const { repoId } = req.params;
        const repoInfo = generatedRepos.get(repoId);

        if (!repoInfo) {
            return res.status(404).json({ 
                success: false, 
                error: 'Repository not found or expired' 
            });
        }

        const { repoPath, repoName } = repoInfo;

        // Check if repo exists
        try {
            await fs.access(repoPath);
        } catch {
            return res.status(404).json({ 
                success: false, 
                error: 'Repository files not found' 
            });
        }

        // Set headers for zip download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${repoName}.zip"`);

        // Create zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Failed to create archive' });
            }
        });

        // Pipe archive to response
        archive.pipe(res);

        // Add the entire repository directory to the archive
        archive.directory(repoPath, repoName);

        // Finalize the archive
        await archive.finalize();

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
});

// List generated repositories (for debugging)
app.get('/repos', (req, res) => {
    const repos = Array.from(generatedRepos.entries()).map(([id, info]) => ({
        id,
        repoName: info.repoName,
        createdAt: info.createdAt,
        name: info.name
    }));

    res.json({ repos });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                error: 'File too large. Maximum size is 5MB.' 
            });
        }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Contributron web server running on http://localhost:${PORT}`);
    console.log(`📁 Make sure to build the Rust binary first: cargo build --release`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;