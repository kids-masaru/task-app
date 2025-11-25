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
    console.log('✓ Loaded .env.local\n');
} catch (e) {
    console.error('Failed to load .env.local:', e.message);
    process.exit(1);
}

// Format database ID with hyphens
function formatDatabaseId(id) {
    const clean = id.replace(/-/g, '');
    if (clean.length === 32) {
        return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
    }
    return id;
}

async function testRelationPagesFetch() {
    console.log('Testing Relation Pages Fetch (simulating API route)\n');
    console.log('='.repeat(50));

    const relationDbId = process.env.NOTION_RELATION_DB_1;
    const mainDbId = process.env.NOTION_DATABASE_ID;

    console.log(`Relation DB ID: ${relationDbId}`);
    console.log(`Main DB ID: ${mainDbId}`);
    console.log(`API Key: ${process.env.NOTION_API_KEY ? 'Set (***' + process.env.NOTION_API_KEY.slice(-4) + ')' : 'NOT SET'}\n`);

    if (!relationDbId) {
        console.error('ERROR: NOTION_RELATION_DB_1 is not set');
        return;
    }

    // Select API key (same logic as route.ts)
    let apiKey = process.env.NOTION_API_KEY;
    if (mainDbId === process.env.NOTION_DATABASE_ID_2 && process.env.NOTION_API_KEY_2) {
        apiKey = process.env.NOTION_API_KEY_2;
        console.log('Using API Key 2\n');
    }

    const notion = new Client({ auth: apiKey });
    const formattedDbId = formatDatabaseId(relationDbId);

    console.log(`Formatted DB ID: ${formattedDbId}\n`);
    console.log('Calling notion.request...\n');

    try {
        const response = await notion.request({
            path: `databases/${formattedDbId}/query`,
            method: 'post',
            body: {
                page_size: 100,
            },
        });

        console.log('✓ SUCCESS!\n');
        console.log(`Total pages found: ${response.results.length}\n`);

        // Extract pages (same logic as route.ts)
        const pages = response.results.map((page) => ({
            id: page.id,
            title: page.properties.Name?.title?.[0]?.text?.content ||
                page.properties.名前?.title?.[0]?.text?.content ||
                'Untitled'
        }));

        console.log('Pages:');
        pages.forEach((page, i) => {
            console.log(`  ${i + 1}. ${page.title} (${page.id})`);
        });

    } catch (error) {
        console.error('✗ FAILED!\n');
        console.error('Error:', error.message);
        console.error('Error code:', error.code);
        console.error('\nFull error:', error);
    }
}

testRelationPagesFetch();
