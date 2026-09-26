const fs = require('fs');
const filePath = 'D:/Alvora/backend/src/lib/metaConversionsApi.ts';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('event_source_url')) {
  content = content.replace(
    /action_source:\s*"website",/g,
    'action_source: "website",\n    event_source_url: req.headers.referer || "https://alvora.pk/checkout",'
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Added event_source_url to metaConversionsApi.ts");
} else {
  console.log("event_source_url already exists");
}
