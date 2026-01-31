const fs = require('fs');
const content = fs.readFileSync('styles.css', 'utf-8');

let braceCount = 0;
let inString = false;
let stringChar = null;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i-1] : null;

    if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (inString && char === stringChar) {
            inString = false;
        } else if (!inString) {
            inString = true;
            stringChar = char;
        }
    }

    if (!inString) {
        if (char === '{') {
            braceCount++;
        } else if (char === '}') {
            braceCount--;
        }
    }
}

if (braceCount === 0) {
    console.log('CSS is valid - all braces matched!');
} else {
    console.log('ERROR: Unmatched braces - count is ' + braceCount);
}
