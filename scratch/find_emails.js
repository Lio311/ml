import fs from 'fs';
import path from 'path';

const searchDir = './app';

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                getFiles(name, files);
            }
        } else {
            if (name.endsWith('.js') || name.endsWith('.mjs') || name.endsWith('.ts')) {
                files.push(name);
            }
        }
    }
    return files;
}

const files = getFiles(searchDir);
const results = [];

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('sendEmail') || content.includes('lib/email')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('sendEmail') || line.includes('getTemplate') || line.includes('email.js')) {
                results.push({
                    file,
                    lineNum: idx + 1,
                    text: line.trim()
                });
            }
        });
    }
}

console.log(JSON.stringify(results, null, 2));
