import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useSettings } from '@/hooks/useSettings';
import { X, ExternalLink, Calendar, Tag, CheckSquare, Hash, Link as LinkIcon, Type, Settings2, ChevronDown, ChevronUp, Eye, EyeOff, Info } from 'lucide-react';
import { RelationDisplay } from './RelationDisplay';

interface NotionPage {
    id: string;
    url: string;
    properties: Record<string, any>;
    icon?: { type: string; emoji?: string; external?: { url: string }; file?: { url: string } } | null;
    cover?: { type: string; external?: { url: string }; file?: { url: string } } | null;
}
interface TaskDetailModalProps {
    task: NotionPage | null;
    onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
    const { settings } = useSettings();
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [showAllProperties, setShowAllProperties] = useState(false);

    useEffect(() => {
        if (task) {
            setLoadingBlocks(true);
            fetch(`/api/notion/blocks?block_id=${task.id}`, {
                headers: {
                    'Authorization': `Bearer ${settings.apiKey}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.results) {
                        setBlocks(data.results);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingBlocks(false));
        } else {
            setBlocks([]);
        }
    }, [task]);

    if (!task) return null;

    const getCoverUrl = () => {
        if (task.cover?.type === 'external') return task.cover.external?.url;
        if (task.cover?.type === 'file') return task.cover.file?.url;
        return null;
    };

    const getTitle = () => {
        const titleProp = Object.values(task.properties).find((p) => p.id === 'title');
        if (!titleProp) return 'Untitled';
        return titleProp.title?.[0]?.plain_text || 'Untitled';
    };

    const renderPropertyValue = (key: string, property: any) => {
        try {
            switch (property.type) {
                case 'status':
                    return property.status ? (
                        <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                                backgroundColor: property.status.color === 'default' ? '#f3f4f6' : `var(--notion-${property.status.color}-bg, #f3f4f6)`,
                                color: property.status.color === 'default' ? '#4b5563' : `var(--notion-${property.status.color}-text, #4b5563)`,
                            }}
                        >
                            {property.status.name}
                        </span>
                    ) : null;

                case 'relation':
                    return <RelationDisplay relations={property.relation} apiKey={settings.apiKey} />;

                case 'date':
                    return property.date?.start ? (
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{property.date.start}</span>
                        </div>
                    ) : null;

                case 'rich_text':
                    const text = property.rich_text?.map((t: any) => t.plain_text).join('');
                    return text ? <p className="text-gray-700 text-sm leading-relaxed">{text}</p> : null;

                case 'url':
                    return property.url ? (
                        <a href={property.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {property.url}
                        </a>
                    ) : null;

                default:
                    // For "Show All" mode, render simpler fallback
                    return <span className="text-gray-600 text-sm">{String(property[property.type] || '')}</span>;
            }
        } catch (e) {
            return null;
        }
    };

    const renderBlock = (block: any) => {
        const text = (arr: any[]) => arr?.map((t: any, i: number) => (
            <span key={i} className={`${t.annotations?.bold ? 'font-bold' : ''} ${t.annotations?.italic ? 'italic' : ''} ${t.annotations?.strikethrough ? 'line-through' : ''}`}>
                {t.plain_text}
            </span>
        ));

        switch (block.type) {
            case 'paragraph':
                return <p className="mb-4 text-gray-700 leading-relaxed min-h-[1em]">{text(block.paragraph?.rich_text)}</p>;
            case 'heading_1':
                return <h1 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">{text(block.heading_1?.rich_text)}</h1>;
            case 'heading_2':
                return <h2 className="text-xl font-bold mt-6 mb-3">{text(block.heading_2?.rich_text)}</h2>;
            case 'heading_3':
                return <h3 className="text-lg font-bold mt-4 mb-2">{text(block.heading_3?.rich_text)}</h3>;
            case 'bulleted_list_item':
                return <li className="ml-5 list-disc text-gray-700 mb-2">{text(block.bulleted_list_item?.rich_text)}</li>;
            case 'numbered_list_item':
                return <li className="ml-5 list-decimal text-gray-700 mb-2">{text(block.numbered_list_item?.rich_text)}</li>;
            case 'to_do':
                return (
                    <div className="flex items-start gap-3 mb-2">
                        <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${block.to_do?.checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                            {block.to_do?.checked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`leading-relaxed ${block.to_do?.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {text(block.to_do?.rich_text)}
                        </span>
                    </div>
                );
            case 'image':
                const imgUrl = block.image?.file?.url || block.image?.external?.url;
                return imgUrl ? <img src={imgUrl} className="rounded-xl my-6 w-full shadow-sm" alt="Page content" /> : null;
            case 'divider':
                return <hr className="my-8 border-gray-100" />;
            default:
                return null;
        }
    };

    const coverUrl = getCoverUrl();
    const title = getTitle();

    // Key properties we want to show at the top
    const priorityProps = Object.entries(task.properties).filter(([key, prop]) => 
        ['status', 'relation', 'date'].includes(prop.type) || key.toLowerCase().includes('期限')
    );

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header Pull Bar (Mobile) */}
                <div className="sm:hidden flex justify-center p-3">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                </div>

                <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-10 custom-scrollbar">
                    {/* Cover & Title */}
                    <div className="pt-4 mb-8">
                        {coverUrl && (
                            <div className="w-full h-32 sm:h-48 rounded-[1.5rem] overflow-hidden mb-6">
                                <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    {task.icon?.emoji && <span className="text-3xl">{task.icon.emoji}</span>}
                                    <div className="flex flex-wrap gap-2">
                                        {priorityProps.map(([key, prop]) => (
                                            <div key={key}>{renderPropertyValue(key, prop)}</div>
                                        ))}
                                    </div>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                    {title}
                                </h1>
                            </div>
                            <button onClick={onClose} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Notion Content */}
                    <div className="space-y-1">
                        {loadingBlocks ? (
                            <div className="space-y-3 py-4">
                                <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
                            </div>
                        ) : blocks.length > 0 ? (
                            <ErrorBoundary>
                                <div className="prose prose-blue max-w-none">
                                    {blocks.map(block => (
                                        <div key={block.id}>{renderBlock(block)}</div>
                                    ))}
                                </div>
                            </ErrorBoundary>
                        ) : (
                            <p className="text-gray-400 italic py-10 text-center">No content</p>
                        )}
                    </div>

                    {/* Metadata Toggle */}
                    <div className="mt-12 border-t border-gray-100 pt-6">
                        <button 
                            onClick={() => setShowAllProperties(!showAllProperties)}
                            className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                        >
                            <Info className="w-4 h-4" />
                            {showAllProperties ? 'Hide Details' : 'Show All Properties'}
                        </button>

                        {showAllProperties && (
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 transition-all animate-in fade-in slide-in-from-top-2">
                                {Object.entries(task.properties).map(([key, prop]) => (
                                    <div key={key} className="space-y-1">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key}</div>
                                        <div className="break-all">{renderPropertyValue(key, prop) || <span className="text-gray-300">—</span>}</div>
                                    </div>
                                ))}
                                <div className="col-span-full pt-4 mt-2 border-t border-gray-200">
                                    <a href={task.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        OPEN IN NOTION
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
