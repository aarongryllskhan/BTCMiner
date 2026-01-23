/**
 * Cache Busting Script
 * Run this before deploying: node update-versions.js
 *
 * This script updates all ?v= parameters in index.html and login-screen.html
 * based on the actual file modification times.
 */

const fs = require('fs');
const path = require('path');

// Files to process
const htmlFiles = ['index.html', 'login-screen.html'];

// Generate version string from file modification time
function getVersionString(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const mtime = stats.mtime;

        // Create alphanumeric string: YYYYMMDDHHmmss
        const version = mtime.getFullYear().toString() +
            String(mtime.getMonth() + 1).padStart(2, '0') +
            String(mtime.getDate()).padStart(2, '0') +
            String(mtime.getHours()).padStart(2, '0') +
            String(mtime.getMinutes()).padStart(2, '0') +
            String(mtime.getSeconds()).padStart(2, '0');

        return version;
    } catch (error) {
        console.error(`Error getting stats for ${filePath}:`, error.message);
        return Date.now().toString(); // Fallback to current timestamp
    }
}

// Update version in HTML content
function updateVersions(htmlContent, baseDir) {
    // Match src="filename.js?v=xxx" or href="filename.css?v=xxx"
    // Also matches without existing ?v= parameter
    const scriptPattern = /src="([^"]+\.(js))(\?v=[^"]*)?"/g;
    const stylePattern = /href="([^"]+\.(css))(\?v=[^"]*)?"/g;

    let updated = htmlContent;
    let updateCount = 0;

    // Update JS files
    updated = updated.replace(scriptPattern, (match, filename, ext, oldVersion) => {
        // Skip external URLs (CDNs)
        if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('//')) {
            return match;
        }

        const filePath = path.join(baseDir, filename);
        if (fs.existsSync(filePath)) {
            const version = getVersionString(filePath);
            updateCount++;
            console.log(`  📦 ${filename} -> v=${version}`);
            return `src="${filename}?v=${version}"`;
        }
        return match;
    });

    // Update CSS files
    updated = updated.replace(stylePattern, (match, filename, ext, oldVersion) => {
        // Skip external URLs (CDNs)
        if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('//')) {
            return match;
        }

        const filePath = path.join(baseDir, filename);
        if (fs.existsSync(filePath)) {
            const version = getVersionString(filePath);
            updateCount++;
            console.log(`  🎨 ${filename} -> v=${version}`);
            return `href="${filename}?v=${version}"`;
        }
        return match;
    });

    return { content: updated, count: updateCount };
}

// Main execution
console.log('🚀 Cache Busting Script Started\n');

const baseDir = __dirname;

htmlFiles.forEach(htmlFile => {
    const htmlPath = path.join(baseDir, htmlFile);

    if (!fs.existsSync(htmlPath)) {
        console.log(`⚠️  ${htmlFile} not found, skipping...`);
        return;
    }

    console.log(`📄 Processing ${htmlFile}...`);

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const result = updateVersions(htmlContent, baseDir);

    if (result.count > 0) {
        fs.writeFileSync(htmlPath, result.content, 'utf8');
        console.log(`✅ Updated ${result.count} file references in ${htmlFile}\n`);
    } else {
        console.log(`ℹ️  No local JS/CSS files found to update in ${htmlFile}\n`);
    }
});

console.log('✨ Cache busting complete! Ready to deploy.');
