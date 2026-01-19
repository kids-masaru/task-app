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

        // Debug logging
        console.log('Kintone Config Check:', {
            hasToken: !!API_TOKEN,
            appId: APP_ID,
            baseUrl: BASE_URL,
            targetDate: date
        });

        if (!API_TOKEN || !APP_ID || !BASE_URL) {
            return NextResponse.json({
                error: 'Kintone configuration missing',
                details: {
                    hasToken: !!API_TOKEN,
                    hasAppId: !!APP_ID,
                    hasBaseUrl: !!BASE_URL
                }
            }, { status: 500 });
        }

        // Try a simpler query first to see if connection works, then the full query
        // Query: Status=Call/Mail, User=Izaki, Date=TargetDate
        const query = `対応日 = "${date}" and 対応者 like "井﨑優" and (新規営業件名 in ("架電、メール", "アポ架電（担当者通電）"))`;

        const url = `${BASE_URL}/k/v1/records.json?app=${APP_ID}&query=${encodeURIComponent(query)}&totalCount=true&limit=1`;

        console.log('Fetching Kintone URL:', url); // Be careful not to log full URL if it has token (it's in header so OK)

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

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
