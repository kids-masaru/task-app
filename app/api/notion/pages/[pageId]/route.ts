import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const { pageId } = await params;
        if (!pageId) {
            return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
        }

        console.log(`[Notion API] Fetching page details for: ${pageId}`);

        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Notion API] Error fetching page:', data);
            return NextResponse.json({
                error: data.message || 'Notion API Error',
                code: data.code || 'unknown',
                status: response.status
            }, { status: response.status });
        }

        console.log('[Notion API] ✅ Page fetched successfully');
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Notion API] Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            status: 500
        }, { status: 500 });
    }
}
