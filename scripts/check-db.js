const fs = require('fs');
const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function checkDatabase() {
    try {
        console.log(`Searching...`);
        // Try search endpoint
        const response = await notion.request({
            path: 'search',
            method: 'post',
            body: {
                filter: {
                    value: 'page',
                    property: 'object'
                },
                page_size: 3
            }
        });
        console.log("Search successful, writing file...");
        fs.writeFileSync('db-data.json', JSON.stringify(response, null, 2));
        console.log("Wrote db-data.json");
    } catch (error) {
        console.error("Error caught:", error.message);
        fs.writeFileSync('db-error.json', JSON.stringify(error, null, 2));
    }
}

checkDatabase();
