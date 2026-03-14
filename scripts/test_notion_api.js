require('dotenv').config();
const { Client } = require('@notionhq/client');

const DB1_ID = process.env.NOTION_DATABASE_ID_1 || '';
const DB1_KEY = process.env.NOTION_API_KEY_1 || '';

async function test() {
    const notion = new Client({ auth: DB1_KEY });

    // Step 1: Get database to find data_source_id
    const db = await notion.databases.retrieve({ database_id: DB1_ID });
    console.log('data_sources:', JSON.stringify(db.data_sources, null, 2));

    // Step 2: Try to get properties via data source
    if (db.data_sources && db.data_sources.length > 0) {
        const dsId = db.data_sources[0].id;
        console.log('\nData Source ID:', dsId);

        // Try the new data_sources API via raw HTTP
        try {
            const response = await fetch(`https://api.notion.com/v1/data_sources/${dsId}`, {
                headers: {
                    'Authorization': `Bearer ${DB1_KEY}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log('\nData Source (2022-06-28):', JSON.stringify(data, null, 2).slice(0, 3000));
        } catch (e) {
            console.log('Data source fetch failed:', e.message);
        }
    }

    // Step 3: Try retrieve with older API version header
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${DB1_ID}`, {
            headers: {
                'Authorization': `Bearer ${DB1_KEY}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        const hasProperties = !!data.properties;
        console.log('\n--- With Notion-Version 2022-06-28 ---');
        console.log('Has properties:', hasProperties);
        if (hasProperties) {
            for (const [name, config] of Object.entries(data.properties)) {
                console.log(`  - "${name}" => type: ${config.type}`);
            }
        }
    } catch (e) {
        console.log('Old version fetch failed:', e.message);
    }
}

test().catch(console.error);
