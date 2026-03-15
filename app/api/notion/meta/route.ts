import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const body = await req.json();
    const { database_id: rawDatabaseId, description } = body;

    if (!rawDatabaseId) {
      return NextResponse.json({ error: 'Missing database_id' }, { status: 400 });
    }

    const databaseId = rawDatabaseId.replace(/-/g, '').split('?')[0].match(/([a-f0-9]{32})/i)?.[1] || rawDatabaseId;

    if (description !== undefined) {
      // UPDATE Database Description
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: [{ text: { content: description } }]
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      // GET Database Meta
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      
      let config = null;
      if (data.description && data.description.length > 0) {
        const text = data.description.map((d: any) => d.plain_text).join('');
        try {
          const match = text.match(/#CONFIG_START#([\s\S]*?)#CONFIG_END#/);
          if (match) {
            config = JSON.parse(match[1]);
          }
        } catch (e) {
          console.error('[Notion Meta] Failed to parse config from description');
        }
      }
      
      return NextResponse.json({ ...data, parsedConfig: config });
    }
  } catch (error) {
    console.error('[Notion Meta API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
