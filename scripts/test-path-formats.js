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
const relationDbId = process.env.NOTION_RELATION_DB_1;

async function testDifferentPaths() {
    console.log('Testing different path formats for notion.request\n');
    console.log('Database ID:', relationDbId, '\n');

    const cleanDbId = relationDbId.replace(/-/g, '');
    const formattedDbId = relationDbId.length === 32 ?
        `${relationDbId.slice(0, 8)}-${relationDbId.slice(8, 12)}-${relationDbId.slice(12, 16)}-${relationDbId.slice(16, 20)}-${relationDbId.slice(20)}` :
        relationDbId;

    const pathsToTest = [
        `databases/${cleanDbId}/query`,
        `v1/databases/${cleanDbId}/query`,
        `databases/${formattedDbId}/query`,
        `v1/databases/${formattedDbId}/query`,
        `databases/${relationDbId}/query`,
        `v1/databases/${relationDbId}/query`
    ];

    for (const testPath of pathsToTest) {
        console.log(`Testing path: "${testPath}"`);
        try {
            const response = await notion.request({
                path: testPath,
                method: 'post',
                body: { page_size: 5 }
            });
            console.log(`✓ SUCCESS! Found ${response.results.length} pages\n`);
            return testPath; // Return the working path
        } catch (error) {
            console.log(`✗ Failed: ${error.message}\n`);
        }
    }

    console.log('All paths failed. Trying databases.query method instead...\n');

    // Try the databases.query method
    try {
        const response = await notion.databases.query({
            database_id: relationDbId,
            page_size: 5
        });
        console.log(`✓ SUCCESS with databases.query! Found ${response.results.length} pages`);
        console.log('Use notion.databases.query instead of notion.request\n');
    } catch (error) {
        console.log(`✗ databases.query also failed: ${error.message}`);
    }
}

testDifferentPaths();
