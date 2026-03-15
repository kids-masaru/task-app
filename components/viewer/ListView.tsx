import React from 'react';
import { FileText, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { RelationDisplay } from './RelationDisplay';

interface NotionPage {
    id: string;
    url: string;
    properties: Record<string, any>;
    icon?: { type: string; emoji?: string; external?: { url: string }; file?: { url: string } } | null;
}

interface ListViewProps {
    items: NotionPage[];
    onTaskClick: (task: NotionPage) => void;
    visibleProperties?: string[];
    onStatusChange?: (pageId: string, propertyName: string, newStatus: string) => void;
    apiKey: string;
}

export default function ListView({ items, onTaskClick, onStatusChange, apiKey }: ListViewProps) {
    const getTitle = (page: NotionPage) => {
        const titleProp = Object.values(page.properties).find((p) => p.id === 'title');
        if (!titleProp) return 'Untitled';
        return titleProp.title?.[0]?.plain_text || 'Untitled';
    };

    const getStatusInfo = (page: NotionPage) => {
        const statusProp = Object.entries(page.properties).find(([_, p]) => p.type === 'status');
        if (!statusProp) return null;
        return {
            name: statusProp[0],
            value: statusProp[1].status?.name,
            options: [] // We'll derive this if needed, but for simple toggle we'll just check if it's "Done"
        };
    };

    const isDone = (statusValue: string | undefined) => {
        if (!statusValue) return false;
        const doneKeywords = ['Done', 'Complete', '完了', '済み'];
        return doneKeywords.includes(statusValue);
    };

    const handleToggleStatus = (e: React.MouseEvent, page: NotionPage) => {
        e.stopPropagation();
        if (!onStatusChange) return;

        const status = getStatusInfo(page);
        if (!status) return;

        // Simple toggle logic: if Done -> In Progress (or Todo), if not Done -> Done
        // For the sake of UX, we'll try to find "In Progress" or "Todo" in the dataset or fallback to common names
        const nextStatus = isDone(status.value) ? 'In Progress' : 'Done';
        onStatusChange(page.id, status.name, nextStatus);
    };

    return (
        <div className="flex flex-col gap-3 p-4 max-w-3xl mx-auto">
            {items.map((page) => {
                const title = getTitle(page);
                const status = getStatusInfo(page);
                const done = isDone(status?.value);
                
                // Get Relation for subtitle
                const relationProp = Object.entries(page.properties).find(([_, p]) => p.type === 'relation');

                return (
                    <div
                        key={page.id}
                        onClick={() => onTaskClick(page)}
                        className={`group flex items-center p-4 bg-white rounded-2xl shadow-sm border transition-all cursor-pointer ${
                            done ? 'bg-gray-50/50 border-transparent opacity-75' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md active:scale-[0.98]'
                        }`}
                    >
                        {/* Status Toggle Area */}
                        <button
                            onClick={(e) => handleToggleStatus(e, page)}
                            className="mr-4 flex-shrink-0 transition-transform active:scale-90"
                        >
                            {done ? (
                                <CheckCircle2 className="w-7 h-7 text-green-500 fill-green-50" />
                            ) : (
                                <Circle className="w-7 h-7 text-gray-300 group-hover:text-blue-400 transition-colors" />
                            )}
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {page.icon?.emoji && <span className="text-lg">{page.icon.emoji}</span>}
                                <h3 className={`font-semibold text-gray-900 text-[15px] leading-snug truncate ${done ? 'line-through text-gray-400' : ''}`}>
                                    {title}
                                </h3>
                            </div>
                            
                            {/* Subtitle / Context info */}
                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                {relationProp && (
                                    <div className="flex items-center gap-1">
                                        <RelationDisplay relations={relationProp[1].relation} apiKey={apiKey} />
                                    </div>
                                )}
                                {status && !done && (
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium">
                                        {status.value}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Detail Arrow */}
                        <div className="ml-4 text-gray-300 group-hover:text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
