// Diagnostic script to check Notion database schemas
// Run with: node scripts/check_notion_schema.js

require('dotenv').config();
const { Client } = require('@notionhq/client');

// Use environment variables for sensitive information
const DB1_ID = process.env.NOTION_DATABASE_ID_1 || '';
const DB1_KEY = process.env.NOTION_API_KEY_1 || '';

const DB2_ID = process.env.NOTION_DATABASE_ID_2 || '';
const DB2_KEY = process.env.NOTION_API_KEY_2 || '';

async function checkDatabase(name, dbId, apiKey) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking: ${name}`);
    console.log(`Database ID: ${dbId}`);
    console.log(`${'='.repeat(60)}`);

    const notion = new Client({ auth: apiKey });

    try {
        const db = await notion.databases.retrieve({ database_id: dbId });
        console.log('\n✅ databases.retrieve() succeeded');
        console.log(`Database title: ${db.title?.map(t => t.plain_text).join('') || '(no title)'}`);

        const properties = db.properties;
        if (!properties) {
            console.log('❌ properties is null/undefined!');
            console.log('Full response keys:', Object.keys(db));
            console.log('Full response:', JSON.stringify(db, null, 2).slice(0, 2000));
            return;
        }

        console.log(`\nProperties found (${Object.keys(properties).length} total):`);
        for (const [propName, propConfig] of Object.entries(properties)) {
            console.log(`  - "${propName}" → type: ${propConfig.type}`);
        }

        // Find title and date properties
        const titleProp = Object.entries(properties).find(([_, config]) => config.type === 'title');
        const dateProp = Object.entries(properties).find(([_, config]) => config.type === 'date');
        console.log(`\n📌 Title property: "${titleProp ? titleProp[0] : 'NOT FOUND'}"`);
        console.log(`📌 Date property: "${dateProp ? dateProp[0] : 'NOT FOUND'}"`);

    } catch (err) {
        console.log(`\n❌ databases.retrieve() FAILED:`);
        console.log(`  Error code: ${err.code}`);
        console.log(`  Error status: ${err.status}`);
        console.log(`  Error message: ${err.message}`);
        console.log(`  Full error:`, err);
    }
}

async function main() {
    await checkDatabase('タスクDB (DB1)', DB1_ID, DB1_KEY);
    await checkDatabase('タスク（まさる）DB (DB2)', DB2_ID, DB2_KEY);
}

main().catch(console.error);
