const fs = require('fs');
const path = require('path');
const dir = './src/mysql-routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

let routes = {};
for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  routes[f] = content;
}
fs.writeFileSync('all-routes.json', JSON.stringify(routes, null, 2));
