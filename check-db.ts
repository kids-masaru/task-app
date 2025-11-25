import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

console.log("Notion Client Keys:", Object.keys(notion));
if (notion.databases) {
    console.log("Notion Databases Keys:", Object.keys(notion.databases));
} else {
    console.log("Notion Databases is undefined");
}

async function checkDatabase() {
    try {
        if (!databaseId) throw new Error("No Database ID");
        console.log(`Checking Database ID: ${databaseId}`);
        const response = await notion.databases.retrieve({ database_id: databaseId });

        console.log("--- Database Properties ---");
        Object.keys(response.properties).forEach(key => {
            console.log(`Property Name: "${key}" (Type: ${response.properties[key].type})`);
        });
        console.log("---------------------------");

    } catch (error: any) {
        console.error("Error:", error.body || error.message);
    }
}

async function checkData() {
    try {
        if (!databaseId) throw new Error("No Database ID");
        console.log(`\nQuerying Database...`);
        const response = await notion.databases.query({
            database_id: databaseId,
            page_size: 3,
        });

        console.log("--- Sample Data (First 3 Pages) ---");
        response.results.forEach((page: any, index) => {
            console.log(`\n[Page ${index + 1}] ID: ${page.id}`);
            const props = page.properties;
            Object.keys(props).forEach(key => {
                const prop = props[key];
                let value = "N/A";
                // Simple extraction for common types
                if (prop.type === 'title') value = prop.title?.[0]?.plain_text || "";
                else if (prop.type === 'rich_text') value = prop.rich_text?.[0]?.plain_text || "";
                else if (prop.type === 'number') value = prop.number;
                else if (prop.type === 'select') value = prop.select?.name;
                else if (prop.type === 'status') value = prop.status?.name;
                else if (prop.type === 'date') value = `${prop.date?.start} -> ${prop.date?.end}`;
                else if (prop.type === 'checkbox') value = prop.checkbox;
                else if (prop.type === 'url') value = prop.url;

                console.log(`  ${key}: ${value} (${prop.type})`);
            });
        });
        console.log("-----------------------------------");

    } catch (error: any) {
        console.error("Error querying data:", error.body || error.message);
    }
}

// async function main() {
//     await checkDatabase();
//     await checkData();
// }

// main();

console.log("Notion Client:", notion);
console.log("Databases property:", notion.databases);
if (notion.databases) {
    console.log("Retrieve method:", notion.databases.retrieve);
}

async function main() {
    if (notion.databases && notion.databases.retrieve) {
        await checkDatabase();
    } else {
        console.error("notion.databases.retrieve is missing!");
    }
}

main();
