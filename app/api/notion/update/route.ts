import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const body = await req.json();
        const { pageId, properties } = body;

        if (!pageId || !properties) {
            return NextResponse.json({ error: 'Missing pageId or properties' }, { status: 400 });
        }

        console.log(`[Notion API] Updating page ${pageId} with properties:`, JSON.stringify(properties));

        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ properties })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Notion API] Update Error:', data);
            return NextResponse.json({
                error: data.message || 'Notion API Update Error',
                code: data.code || 'unknown',
                status: response.status
            }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Notion API] Update Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            status: 500
        }, { status: 500 });
    }
}
