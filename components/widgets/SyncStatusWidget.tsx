import React, { useState, useEffect } from 'react';
import { RefreshCcw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface SyncLog {
    id: string;
    date: string;
    createdA: number;
    updatedA: number;
    createdB: number;
    updatedB: number;
    status: string;
}

interface SyncStatusWidgetProps {
    apiKey: string;
    logDatabaseId: string;
}

export default function SyncStatusWidget({ apiKey, logDatabaseId }: SyncStatusWidgetProps) {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        if (!apiKey || !logDatabaseId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/notion/sync-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ database_id: logDatabaseId }),
            });
            const data = await res.json();
            if (res.ok) {
                setLogs(data.results || []);
            } else {
                throw new Error(data.error || 'Failed to fetch sync logs');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [apiKey, logDatabaseId]);

    const latestLog = logs[0];
    const weeklyTotal = logs.slice(0, 7).reduce((acc, log) => acc + log.createdA + log.updatedA + log.createdB + log.updatedB, 0);

    if (loading && logs.length === 0) return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
                <div className="h-8 bg-gray-100 rounded" />
                <div className="h-8 bg-gray-100 rounded" />
            </div>
        </div>
    );

    if (!logDatabaseId) return null;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Kintone Sync Status
                </h3>
                {latestLog && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        latestLog.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {latestLog.status}
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {latestLog ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Last Sync: {(() => {
                                        const now = new Date();
                                        const syncDate = new Date(latestLog.date);
                                        const diffDays = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24));
                                        if (diffDays === 0) return 'Today';
                                        if (diffDays === 1) return 'Yesterday';
                                        return latestLog.date;
                                    })()}
                                </div>
                                <div className="text-xl font-black text-gray-900 leading-tight">
                                    {latestLog.createdA + latestLog.updatedA + latestLog.createdB + latestLog.updatedB} <span className="text-xs font-normal text-gray-400">items</span>
                                </div>
                            </div>
                            <button onClick={fetchLogs} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <RefreshCcw className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                            <div className="p-2 rounded-xl bg-gray-50">
                                <div className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">App 52 (Sales)</div>
                                <div className="text-sm font-bold text-gray-700">+{latestLog.createdA} / {latestLog.updatedA}</div>
                            </div>
                            <div className="p-2 rounded-xl bg-gray-50">
                                <div className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">App 31 (Projects)</div>
                                <div className="text-sm font-bold text-gray-700">+{latestLog.createdB} / {latestLog.updatedB}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium bg-blue-50/50 p-2 rounded-lg">
                            <Clock className="w-3 h-3 text-blue-500" />
                            Weekly Sync Total: <span className="font-bold text-blue-700">{weeklyTotal}</span> items
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <div className="text-xs text-gray-400">No sync logs found</div>
                    </div>
                )}
            </div>
            
            {error && (
                <div className="mt-4 p-2 bg-red-50 rounded-lg text-[9px] text-red-600 font-medium">
                    {error}
                </div>
            )}
        </div>
    );
}
