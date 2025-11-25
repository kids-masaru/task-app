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
    console.log('Loaded .env.local\n');
} catch (e) {
    console.error('Failed to load .env.local:', e.message);
    process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const relationDbId = process.env.NOTION_RELATION_DB_1;

async function testV1Path() {
    const cleanDbId = relationDbId.replace(/-/g, '');

    console.log(`Testing path: v1/databases/${cleanDbId}/query\n`);

    try {
        const response = await notion.request({
            path: `v1/databases/${cleanDbId}/query`,
            method: 'POST',
            body: {
                page_size: 10
            }
        });

        console.log('✓ SUCCESS!');
        console.log(`Found ${response.results.length} pages\n`);

        if (response.results.length > 0) {
            const firstPage = response.results[0];
            console.log('First page properties:', Object.keys(firstPage.properties).join(', '));

            // Test title extraction
            const title = firstPage.properties.Name?.title?.[0]?.text?.content ||
                firstPage.properties.名前?.title?.[0]?.text?.content ||
                'Untitled';
            console.log('First page title:', title);
        }

    } catch (error) {
        console.error('✗ FAILED');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('\nFull error details:');
        console.error(JSON.stringify(error, null, 2));
    }
}

testV1Path();
