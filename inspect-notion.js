const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
try {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.error('Failed to load .env.local:', e.message);
    process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

console.log('Inspecting Notion Client...\n');
console.log('notion object keys:', Object.keys(notion));
console.log('\nnotion.databases:', notion.databases);
console.log('\nnotion.databases keys:', notion.databases ? Object.keys(notion.databases) : 'undefined');
console.log('\nnotion.databases.query:', notion.databases?.query);
console.log('\nnotion.request:', notion.request);

// Try to find package version
try {
    const packageJson = require('@notionhq/client/package.json');
    console.log('\n@notionhq/client version:', packageJson.version);
} catch (e) {
    console.log('\nCould not read package version');
}
