import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const { searchParams } = new URL(req.url);
        const blockId = searchParams.get('block_id');

        if (!blockId) {
            return NextResponse.json({ error: 'Missing block_id' }, { status: 400 });
        }

        const requestUrl = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`;

        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({
                error: data.message || 'Notion API Error',
                code: data.code || 'unknown',
                status: response.status
            }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Notion Blocks API] Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            status: 500
        }, { status: 500 });
    }
}
