import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useSettings } from '@/hooks/useSettings';
import { X, ExternalLink, Calendar, Tag, CheckSquare, Hash, Link as LinkIcon, Type, Settings2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
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
    const [showPropertySettings, setShowPropertySettings] = useState(false);
    const [propertySettings, setPropertySettings] = useState<{ [key: string]: { visible: boolean; order: number } }>({});

    useEffect(() => {
        if (task) {
            // Load property settings from localStorage
            const savedSettings = localStorage.getItem(`notion-property-settings-${task.id.split('-')[0]}`); // Use database ID if possible, but task ID prefix might work? No, need DB ID.
            // Actually, we don't have DB ID easily here. Let's use a generic key or try to derive it.
            // Or just use a global key for now, or per-property-set key.
            // Let's use the keys of the properties to form a signature.
            const propertyKeys = Object.keys(task.properties).sort().join(',');
            // Simple hash function that supports UTF-8 (unlike btoa)
            const simpleHash = (str: string) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return Math.abs(hash).toString(36);
            };
            const settingsKey = `notion-props-${simpleHash(propertyKeys)}`;

            const saved = localStorage.getItem(settingsKey);
            if (saved) {
                setPropertySettings(JSON.parse(saved));
            } else {
                // Default: all visible, original order
                const initialSettings: any = {};
                Object.keys(task.properties).forEach((key, index) => {
                    initialSettings[key] = { visible: true, order: index };
                });
                setPropertySettings(initialSettings);
            }

            // Fetch blocks
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

    const renderPropertyValue = (property: any) => {
        try {
            switch (property.type) {
                case 'title':
                    return (
                        <div className="flex items-start gap-2">
                            <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-900 font-medium">
                                {property.title?.[0]?.plain_text || 'Untitled'}
                            </span>
                        </div>
                    );

                case 'rich_text':
                    return (
                        <div className="flex items-start gap-2">
                            <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">
                                {property.rich_text?.map((t: any) => t.plain_text).join('') || '—'}
                            </span>
                        </div>
                    );

                case 'number':
                    return (
                        <div className="flex items-start gap-2">
                            <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{property.number ?? '—'}</span>
                        </div>
                    );

                case 'select':
                    return property.select ? (
                        <div className="flex items-start gap-2">
                            <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                    backgroundColor: property.select.color === 'default' ? '#e5e7eb' : `var(--notion-${property.select.color}-bg, #e5e7eb)`,
                                    color: property.select.color === 'default' ? '#374151' : `var(--notion-${property.select.color}-text, #374151)`,
                                }}
                            >
                                {property.select.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-gray-400">—</span>
                    );

                case 'status':
                    return property.status ? (
                        <div className="flex items-start gap-2">
                            <CheckSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                    backgroundColor: property.status.color === 'default' ? '#e5e7eb' : `var(--notion-${property.status.color}-bg, #e5e7eb)`,
                                    color: property.status.color === 'default' ? '#374151' : `var(--notion-${property.status.color}-text, #374151)`,
                                }}
                            >
                                {property.status.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-gray-400">—</span>
                    );

                case 'multi_select':
                    return (
                        <div className="flex items-start gap-2">
                            <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                                {property.multi_select?.length > 0 ? (
                                    property.multi_select.map((tag: any) => (
                                        <span
                                            key={tag.id}
                                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                            style={{
                                                backgroundColor: tag.color === 'default' ? '#e5e7eb' : `var(--notion-${tag.color}-bg, #e5e7eb)`,
                                                color: tag.color === 'default' ? '#374151' : `var(--notion-${tag.color}-text, #374151)`,
                                            }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </div>
                        </div>
                    );

                case 'date':
                    return (
                        <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">
                                {property.date?.start || '—'}
                                {property.date?.end && ` → ${property.date.end}`}
                            </span>
                        </div>
                    );

                case 'checkbox':
                    return (
                        <div className="flex items-start gap-2">
                            <CheckSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${property.checkbox ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-gray-700">{property.checkbox ? 'Yes' : 'No'}</span>
                        </div>
                    );

                case 'url':
                    return property.url ? (
                        <div className="flex items-start gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <a
                                href={property.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate"
                            >
                                {property.url}
                            </a>
                        </div>
                    ) : (
                        <span className="text-gray-400">—</span>
                    );

                case 'email':
                    return property.email ? (
                        <div className="flex items-start gap-2">
                            <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <a href={`mailto:${property.email}`} className="text-blue-600 hover:underline">
                                {property.email}
                            </a>
                        </div>
                    ) : (
                        <span className="text-gray-400">—</span>
                    );

                case 'phone_number':
                    return (
                        <div className="flex items-start gap-2">
                            <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{property.phone_number || '—'}</span>
                        </div>
                    );

                case 'created_time':
                case 'last_edited_time':
                    return (
                        <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">
                                {property[property.type] ? new Date(property[property.type]).toLocaleString('ja-JP') : '—'}
                            </span>
                        </div>
                    );

                // Add handlers for other types to prevent crashes
                case 'people':
                    return (
                        <div className="flex items-start gap-2">
                            <Type className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                                {property.people?.map((person: any) => (
                                    <span key={person.id} className="text-gray-700 bg-gray-100 px-1 rounded text-sm">
                                        {person.name || 'Unknown'}
                                    </span>
                                )) || '—'}
                            </div>
                        </div>
                    );

                case 'files':
                    return (
                        <div className="flex items-start gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                                {property.files?.map((file: any, i: number) => (
                                    <a
                                        key={i}
                                        href={file.file?.url || file.external?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        {file.name}
                                    </a>
                                )) || '—'}
                            </div>
                        </div>
                    );

                case 'relation':
                    return <RelationDisplay relations={property.relation} apiKey={settings.apiKey} />;

                case 'formula':
                    // Simple formula handling (string/number/boolean/date)
                    let formulaValue = '—';
                    if (property.formula) {
                        if (property.formula.type === 'string') formulaValue = property.formula.string;
                        else if (property.formula.type === 'number') formulaValue = String(property.formula.number);
                        else if (property.formula.type === 'boolean') formulaValue = String(property.formula.boolean);
                        else if (property.formula.type === 'date') formulaValue = property.formula.date?.start || '—';
                    }
                    return (
                        <div className="flex items-start gap-2">
                            <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{formulaValue}</span>
                        </div>
                    );

                case 'rollup':
                    // Simple rollup handling
                    return (
                        <div className="flex items-start gap-2">
                            <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">
                                {property.rollup?.type === 'array'
                                    ? `Array (${property.rollup.array.length})`
                                    : String(property.rollup?.[property.rollup?.type] || '—')}
                            </span>
                        </div>
                    );

                default:
                    return <span className="text-gray-400 text-sm">{property.type} (Unsupported)</span>;
            }
        } catch (e) {
            console.error('Error rendering property:', property, e);
            return <span className="text-red-500 text-sm">Error rendering {property.type}</span>;
        }
    };

    const togglePropertyVisibility = (key: string) => {
        const newSettings = { ...propertySettings };
        if (!newSettings[key]) return;
        newSettings[key].visible = !newSettings[key].visible;
        setPropertySettings(newSettings);
        savePropertySettings(newSettings);
    };

    const moveProperty = (key: string, direction: 'up' | 'down') => {
        const newSettings = { ...propertySettings };
        const currentOrder = newSettings[key].order;
        const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

        // Find the property at the target order
        const targetKey = Object.keys(newSettings).find(k => newSettings[k].order === targetOrder);

        if (targetKey) {
            newSettings[key].order = targetOrder;
            newSettings[targetKey].order = currentOrder;
            setPropertySettings(newSettings);
            savePropertySettings(newSettings);
        }
    };

    const savePropertySettings = (settings: any) => {
        const propertyKeys = Object.keys(task.properties).sort().join(',');
        // Simple hash function that supports UTF-8 (unlike btoa)
        const simpleHash = (str: string) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(36);
        };
        const settingsKey = `notion-props-${simpleHash(propertyKeys)}`;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    };

    const renderBlock = (block: any) => {
        switch (block.type) {
            case 'paragraph':
                return (
                    <p className="mb-2 text-gray-700 leading-relaxed">
                        {block.paragraph?.rich_text?.map((t: any, i: number) => (
                            <span key={i} className={t.annotations?.bold ? 'font-bold' : ''}>
                                {t.plain_text}
                            </span>
                        ))}
                    </p>
                );
            case 'heading_1':
                return <h1 className="text-2xl font-bold mt-6 mb-4">{block.heading_1?.rich_text?.[0]?.plain_text}</h1>;
            case 'heading_2':
                return <h2 className="text-xl font-bold mt-5 mb-3">{block.heading_2?.rich_text?.[0]?.plain_text}</h2>;
            case 'heading_3':
                return <h3 className="text-lg font-bold mt-4 mb-2">{block.heading_3?.rich_text?.[0]?.plain_text}</h3>;
            case 'bulleted_list_item':
                return (
                    <li className="ml-4 list-disc text-gray-700 mb-1">
                        {block.bulleted_list_item?.rich_text?.map((t: any, i: number) => t.plain_text).join('')}
                    </li>
                );
            case 'numbered_list_item':
                return (
                    <li className="ml-4 list-decimal text-gray-700 mb-1">
                        {block.numbered_list_item?.rich_text?.map((t: any, i: number) => t.plain_text).join('')}
                    </li>
                );
            case 'to_do':
                return (
                    <div className="flex items-start gap-2 mb-1">
                        <div className={`mt-1 w-4 h-4 border rounded ${block.to_do?.checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                            {block.to_do?.checked && <CheckSquare className="w-3 h-3 text-white" />}
                        </div>
                        <span className={block.to_do?.checked ? 'line-through text-gray-400' : 'text-gray-700'}>
                            {block.to_do?.rich_text?.map((t: any, i: number) => t.plain_text).join('')}
                        </span>
                    </div>
                );
            default:
                return null;
        }
    };

    const sortedProperties = Object.entries(task.properties)
        .sort(([keyA], [keyB]) => {
            const orderA = propertySettings[keyA]?.order ?? 0;
            const orderB = propertySettings[keyB]?.order ?? 0;
            return orderA - orderB;
        });

    const coverUrl = getCoverUrl();
    const title = getTitle();

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {task.icon?.emoji && <span className="text-2xl">{task.icon.emoji}</span>}
                        <h2 className="text-xl font-bold text-gray-900 truncate">{title}</h2>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={() => setShowPropertySettings(!showPropertySettings)}
                            className={`p-2 rounded-lg transition-colors ${showPropertySettings ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                            title="Customize Properties"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                        <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open in Notion
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Cover Image */}
                {coverUrl && (
                    <div className="w-full h-48 flex-shrink-0">
                        <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <ErrorBoundary>
                        {/* Property Settings Panel */}
                        {showPropertySettings && (
                            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customize Properties</h3>
                                <div className="space-y-2">
                                    {sortedProperties.map(([key], index) => (
                                        <div key={key} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                                            <span className="text-sm text-gray-700 font-medium">{key}</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveProperty(key, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => moveProperty(key, 'down')}
                                                    disabled={index === sortedProperties.length - 1}
                                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <div className="w-px h-4 bg-gray-200 mx-1" />
                                                <button
                                                    onClick={() => togglePropertyVisibility(key)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    {propertySettings[key]?.visible ? (
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Properties List */}
                        <div className="space-y-4 mb-8">
                            {sortedProperties.map(([key, property]) => {
                                if (!propertySettings[key]?.visible) return null;
                                return (
                                    <div key={key} className="border-b border-gray-50 pb-3 last:border-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            {key}
                                        </div>
                                        <div>{renderPropertyValue(property)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Page Content (Blocks) */}
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Content</h3>
                            {loadingBlocks ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                </div>
                            ) : blocks.length > 0 ? (
                                <div className="space-y-2">
                                    {blocks.map((block) => (
                                        <div key={block.id}>
                                            {renderBlock(block)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic">No content</p>
                            )}
                        </div>
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
}
