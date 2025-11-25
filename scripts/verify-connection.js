const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local manually
try {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.local')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log('Loaded .env.local');
} catch (e) {
    console.error('Could not load .env.local:', e.message);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function check() {
    const dbId = process.env.NOTION_RELATION_DB_1;
    console.log(`Checking Relation DB 1: ${dbId}`);

    if (!dbId) {
        console.error('NOTION_RELATION_DB_1 is not set');
        return;
    }

    // Format ID
    const formattedId = dbId.length === 32 ?
        `${dbId.slice(0, 8)}-${dbId.slice(8, 12)}-${dbId.slice(12, 16)}-${dbId.slice(16, 20)}-${dbId.slice(20)}` :
        dbId;

    try {
        console.log('notion.databases methods:', Object.keys(notion.databases));

        console.log('Testing notion.request...');
        const response = await notion.request({
            path: `databases/${formattedId}/query`,
            method: 'post',
            body: { page_size: 10 }
        });

        console.log('✓ Success! Queried database via notion.request. Results:', response.results.length);
        if (response.results.length > 0) {
            const firstPage = response.results[0];
            console.log('Sample page properties:', Object.keys(firstPage.properties).join(', '));
        }
    } catch (error) {
        console.error('✗ Failed:', error.message);
        if (error.code === 'object_not_found') {
            console.log('\nPossible Cause: The Notion Integration is not added to this database.');
            console.log('Solution: Open the database in Notion -> ... menu -> Connections -> Add your integration.');
        }
    }
}

check();
