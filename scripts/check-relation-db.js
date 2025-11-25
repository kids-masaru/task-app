const { Client } = require('@notionhq/client');

// Initialize Notion clients
const notion1 = new Client({ auth: process.env.NOTION_API_KEY });
const notion2 = new Client({ auth: process.env.NOTION_API_KEY_2 });

async function checkDatabase(notion, dbId, name) {
    try {
        console.log(`\n=== Checking ${name} ===`);
        console.log(`Database ID: ${dbId}`);

        const response = await notion.request({
            path: `databases/${dbId}`,
            method: 'get',
        });

        console.log(`✓ Database found: ${response.title?.[0]?.plain_text || 'Untitled'}`);
        console.log(`Properties:`, Object.keys(response.properties).join(', '));

        return response;
    } catch (error) {
        console.error(`✗ Error:`, error.message);
        return null;
    }
}

async function main() {
    console.log('Checking relation databases...\n');

    // Check relation DB 1
    const relationDb1 = process.env.NOTION_RELATION_DB_1;
    if (relationDb1) {
        await checkDatabase(notion1, relationDb1, 'Relation DB 1 (kintone★商談)');
    } else {
        console.log('NOTION_RELATION_DB_1 not set');
    }

    // Check relation DB 2
    const relationDb2 = process.env.NOTION_RELATION_DB_2;
    if (relationDb2) {
        await checkDatabase(notion2, relationDb2, 'Relation DB 2 (クライアントDB)');
    } else {
        console.log('NOTION_RELATION_DB_2 not set');
    }
}

main().catch(console.error);
