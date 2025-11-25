import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const relationDbId = searchParams.get('relationDbId');
        const mainDbId = searchParams.get('mainDbId');

        if (!relationDbId) {
            return NextResponse.json({ pages: [] });
        }

        // Select API key based on main database
        let apiKey = process.env.NOTION_API_KEY;
        if (mainDbId === process.env.NOTION_DATABASE_ID_2 && process.env.NOTION_API_KEY_2) {
            apiKey = process.env.NOTION_API_KEY_2;
        }

        // Remove hyphens for Notion API (expects 32-char ID without hyphens)
        const cleanDbId = relationDbId.replace(/-/g, '');

        // Fetch all pages with pagination and filtering
        const allPages: any[] = [];
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            // Use fetch directly to call Notion API (avoiding SDK compatibility issues)
            const notionApiUrl = `https://api.notion.com/v1/databases/${cleanDbId}/query`;

            // Only apply filter for the first database (タスクDB)
            const shouldFilter = mainDbId === process.env.NOTION_DATABASE_ID;

            const requestBody: any = {
                page_size: 100,
                start_cursor: startCursor,
            };

            // Add filter only for タスクDB
            if (shouldFilter) {
                requestBody.filter = {
                    property: '営業担当',
                    rich_text: {
                        equals: '井﨑 優'
                    }
                };
            }

            const notionResponse = await fetch(notionApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!notionResponse.ok) {
                const errorData = await notionResponse.json();
                throw new Error(`Notion API error: ${errorData.message || notionResponse.statusText}`);
            }

            const response = await notionResponse.json();
            allPages.push(...response.results);

            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        // Extract page ID and title
        const pages = allPages.map((page: any) => ({
            id: page.id,
            title: page.properties.Name?.title?.[0]?.text?.content ||
                page.properties.名前?.title?.[0]?.text?.content ||
                'Untitled'
        }));

        return NextResponse.json({ pages });
    } catch (error: any) {
        console.error('Error fetching relation pages:', error);
        return NextResponse.json({ pages: [], error: error.message }, { status: 500 });
    }
}
