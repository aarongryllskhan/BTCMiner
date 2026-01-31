const fs = require('fs');
const content = fs.readFileSync('styles.css', 'utf-8');
const lines = content.split('\n');

let braceCount = 0;
let inString = false;
let stringChar = null;

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i-1] : null;

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
                if (braceCount > 100) {
                    console.log('Line ' + (lineNum + 1) + ': { (count now: ' + braceCount + ')');
                }
            } else if (char === '}') {
                braceCount--;
                if (braceCount < 0) {
                    console.log('ERROR at line ' + (lineNum + 1) + ': } makes count negative: ' + braceCount);
                    console.log('Context: ' + line.trim().substring(0, 80));
                }
            }
        }
    }
}

console.log('Final brace count: ' + braceCount);
