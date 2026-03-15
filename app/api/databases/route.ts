import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Read multiple databases from environment variables
        const databases = [
            {
                id: process.env.NOTION_DATABASE_ID,
                name: process.env.NOTION_DATABASE_NAME_1 || 'タスクDB',
                relationDbId: process.env.NOTION_RELATION_DB_1 || process.env.NEXT_PUBLIC_RELATION_DB_1
            }
        ].filter(db => db.id); // Filter out undefined databases

        return NextResponse.json({ databases });
    } catch (error: any) {
        console.error('Error fetching databases:', error);
        return NextResponse.json({ databases: [] });
    }
}
