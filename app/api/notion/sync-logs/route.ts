import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const body = await req.json();
    const { database_id: logDatabaseId } = body;

    if (!logDatabaseId) {
      return NextResponse.json({ error: 'Missing logDatabaseId' }, { status: 400 });
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${logDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [{ property: '日付', direction: 'descending' }],
        page_size: 10
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Simplify the response for the frontend
    const logs = data.results.map((page: any) => ({
      id: page.id,
      date: page.properties['日付']?.title?.[0]?.text?.content || 'Unknown',
      createdA: page.properties['作成件数 (App 52)']?.number || 0,
      updatedA: page.properties['更新件数 (App 52)']?.number || 0,
      createdB: page.properties['作成件数 (App 31)']?.number || 0,
      updatedB: page.properties['更新件数 (App 31)']?.number || 0,
      status: page.properties['Status']?.select?.name || 'Unknown'
    }));

    return NextResponse.json({ results: logs });
  } catch (error) {
    console.error('[Sync Logs API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
