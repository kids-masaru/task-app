import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const API_TOKEN = process.env.KINTONE_API_TOKEN;
        const APP_ID = process.env.KINTONE_APP_ID;
        const BASE_URL = process.env.KINTONE_BASE_URL;

        if (!API_TOKEN || !APP_ID || !BASE_URL) {
            return NextResponse.json({ error: 'Kintone configuration missing' }, { status: 500 });
        }

        // Query: Status=Call/Mail, User=Izaki, Date=TargetDate
        // Field Codes based on kintone_notion_app:
        // 対応者 (rich_text?), 新規営業件名 (rich_text?), 対応日 (date)
        // Note: '新規営業件名' might be 'rich_text' or 'drop_down' or 'radio_button'.
        // Given previous code: "新規営業件名": {"type": "rich_text", "field": "新規営業件名"}
        // For rich_text/text fields, we use 'like' or 'in' might not work as expected if it's not a selection field.
        // But 'in' works for Dropdown/Radio/Checkboxes.
        // If it's a string field, we might need 'like "架電" or like "メール"'.
        // Let's try 'in' first assuming it's a selection, or constructing a query with 'like'.
        // User said: "架電、メール" OR "アポ架電（担当者通電）".

        const query = `対応日 = "${date}" and 対応者 like "井﨑優" and (新規営業件名 in ("架電、メール", "アポ架電（担当者通電）"))`;

        // fetch only 1 record (limit 1) with 'totalCount=true' to get count efficiently?
        // Kintone GET /k/v1/records supports totalCount.

        const url = `${BASE_URL}/k/v1/records.json?app=${APP_ID}&query=${encodeURIComponent(query)}&totalCount=true&limit=1`;

        const response = await fetch(url, {
            headers: {
                'X-Cybozu-API-Token': API_TOKEN,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Kintone API Error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch from Kintone', details: errorData }, { status: response.status });
        }

        const data = await response.json();
        const count = data.totalCount ? parseInt(data.totalCount, 10) : 0;

        return NextResponse.json({ count });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
