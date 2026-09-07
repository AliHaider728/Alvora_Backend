const fs = require('fs');
let code = fs.readFileSync('src/mysql-routes/bundles.ts', 'utf8');
if (!code.includes("import * as fs from 'fs';")) {
  code = code.replace(/import \{ Router \} from 'express';/, "import { Router } from 'express';\nimport * as fs from 'fs';");
  code = code.replace(/res\.status\(500\)\.json\(\{ error: 'Failed to fetch bundle' \}\);/g, 
    "fs.appendFileSync('debug.log', 'BUNDLE ERROR: ' + (error && error.stack ? error.stack : String(error)) + '\\n'); res.status(500).json({ error: 'Failed to fetch bundle' });");
  fs.writeFileSync('src/mysql-routes/bundles.ts', code);
}

let code2 = fs.readFileSync('src/mysql-routes/categories.ts', 'utf8');
if (!code2.includes("import * as fs from 'fs';")) {
  code2 = code2.replace(/import \{ Router, Request, Response \} from 'express';/, "import { Router, Request, Response } from 'express';\nimport * as fs from 'fs';");
  code2 = code2.replace(/res\.status\(500\)\.json\(\{ error: 'Could not load categories' \}\);/g, 
    "fs.appendFileSync('debug.log', 'CAT ERROR: ' + (error && error.stack ? error.stack : String(error)) + '\\n'); res.status(500).json({ error: 'Could not load categories' });");
  fs.writeFileSync('src/mysql-routes/categories.ts', code2);
}
