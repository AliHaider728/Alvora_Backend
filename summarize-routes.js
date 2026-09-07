const fs = require('fs');
const routes = JSON.parse(fs.readFileSync('all-routes.json', 'utf8'));

let doc = "";
for (const [filename, content] of Object.entries(routes)) {
  doc += `\n\n### FILE: ${filename}\n`;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/router\.(get|post|put|delete|patch)\s*\(/)) {
      doc += `- **Endpoint**: \`${line.trim()}\`\n`;
      // look ahead a few lines for some context (e.g. req.body)
      let ctx = [];
      for(let j=i+1; j < i+20 && j < lines.length; j++) {
        if(lines[j].match(/router\./)) break; // stop if next route
        if(lines[j].includes('req.body') || lines[j].includes('req.params') || lines[j].includes('req.query')) {
            ctx.push("  - " + lines[j].trim());
        }
      }
      if(ctx.length) {
         doc += ctx.join("\n") + "\n";
      }
    }
  }
}
fs.writeFileSync('route-summary.md', doc);
