import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('[Notion API] Missing Authorization header');
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    console.log(`[Notion API] Received token (masked): ${token.slice(0, 5)}***`);

    // リクエストボディを取得（一度だけ）
    const body = await req.json();
    const { database_id: rawDatabaseId, filter, sorts } = body;

    console.log(`[Notion API] Request body:`, JSON.stringify(body));
    console.log(`[Notion API] Raw database_id input:`, rawDatabaseId);

    if (!rawDatabaseId) {
      console.log('[Notion API] Missing database_id');
      return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
    }

    // データベース ID 正規化
    const cleaned = rawDatabaseId.replace(/-/g, '').split('?')[0];
    const match = cleaned.match(/([a-f0-9]{32})/i);
    const databaseId = match ? match[1] : cleaned;
    if (match) {
      console.log(`[Notion API] Extracted database ID: ${databaseId}`);
    } else {
      console.log(`[Notion API] Could not extract 32-char ID, using raw value: ${databaseId}`);
    }

    // Notion APIを呼び出してデータベースのレコードを取得
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: filter,
        sorts: sorts,
      }),
    });

    const data = await notionResponse.json();

    if (!notionResponse.ok) {
      console.error('[Notion API] Error from Notion:', data);
      return NextResponse.json(data, { status: notionResponse.status });
    }

    console.log(`[Notion API] Success: Fetched ${data.results?.length || 0} items`);
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Notion API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}