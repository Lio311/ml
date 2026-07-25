const fs = require('fs');
const readline = require('readline');
const transcriptPath = 'C:\\Users\\Lior\\.gemini\\antigravity\\brain\\ca6a30f9-1b94-4851-a50e-9731e50308f3\\.system_generated\\logs\\transcript.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(transcriptPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('BORNTOSTANDOUT')) {
      const parsed = JSON.parse(line);
      if (parsed.type === 'PLANNER_RESPONSE' && parsed.content) {
         console.log(parsed.content.substring(0, 300));
      }
    }
  }
}

processLineByLine();
