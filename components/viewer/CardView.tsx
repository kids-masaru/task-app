import React from 'react';
import { ExternalLink, Calendar, Tag } from 'lucide-react';
import { RelationDisplay } from './RelationDisplay';

interface NotionPage {
    id: string;
    url: string;
    cover?: { type: string; external?: { url: string }; file?: { url: string } } | null;
    properties: Record<string, any>;
    icon?: { type: string; emoji?: string; external?: { url: string }; file?: { url: string } } | null;
}

interface CardViewProps {
    items: NotionPage[];
    onTaskClick: (task: NotionPage) => void;
    visibleProperties?: string[];
    onStatusChange?: (pageId: string, propertyName: string, newStatus: string) => void;
    apiKey: string;
}

export default function CardView({ items, onTaskClick, visibleProperties, onStatusChange, apiKey }: CardViewProps) {
    const getTitle = (page: NotionPage) => {
        const titleProp = Object.values(page.properties).find((p) => p.id === 'title');
        if (!titleProp) return 'Untitled';
        return titleProp.title?.[0]?.plain_text || 'Untitled';
    };

    const getCoverUrl = (page: NotionPage) => {
        if (page.cover?.type === 'external') return page.cover.external?.url;
        if (page.cover?.type === 'file') return page.cover.file?.url;
        return null;
    };

    const handleStatusClick = (e: React.MouseEvent, pageId: string, propertyName: string, currentStatus: string) => {
        e.stopPropagation();
        if (!onStatusChange) return;

        // Get all unique status values from all items for this property
        const statusOptions: string[] = [];
        items.forEach(item => {
            const statusProp = item.properties[propertyName];
            if (statusProp?.type === 'status' && statusProp.status?.name) {
                if (!statusOptions.includes(statusProp.status.name)) {
                    statusOptions.push(statusProp.status.name);
                }
            }
        });

        // Cycle to the next status
        if (statusOptions.length > 0) {
            const currentIndex = statusOptions.indexOf(currentStatus);
            const nextIndex = (currentIndex + 1) % statusOptions.length;
            const newStatus = statusOptions[nextIndex];
            onStatusChange(pageId, propertyName, newStatus);
        }
    };

    const renderProperty = (key: string, property: any, pageId: string) => {
        if (!property) return null;

        switch (property.type) {
            case 'multi_select':
                return (
                    <div className="flex flex-wrap gap-1">
                        {property.multi_select.map((tag: any) => (
                            <span
                                key={tag.id}
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600"
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                );
            case 'select':
                if (!property.select) return null;
                return (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        {property.select.name}
                    </span>
                );
            case 'status':
                if (!property.status) return null;
                return (
                    <button
                        onClick={(e) => handleStatusClick(e, pageId, key, property.status.name)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors hover:opacity-80 ${property.status.name === 'Done' || property.status.name === 'Complete' || property.status.name === '完了' ? 'bg-green-100 text-green-700' :
                            property.status.name === 'In Progress' || property.status.name === 'Doing' || property.status.name === '進行中' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {property.status.name}
                    </button>
                );
            case 'date':
                if (!property.date?.start) return null;
                return (
                    <div className="flex items-center text-[10px] text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {property.date.start}
                    </div>
                );
            case 'checkbox':
                return (
                    <div className="text-[10px] text-gray-500">
                        {property.checkbox ? '☑ Yes' : '☐ No'}
                    </div>
                );
            case 'url':
                return property.url ? (
                    <a href={property.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block" onClick={e => e.stopPropagation()}>
                        {property.url}
                    </a>
                ) : null;
            case 'email':
                return property.email ? <div className="text-[10px] text-gray-500 truncate">{property.email}</div> : null;
            case 'phone_number':
                return property.phone_number ? <div className="text-[10px] text-gray-500">{property.phone_number}</div> : null;
            case 'number':
                return property.number !== null ? <div className="text-[10px] text-gray-500">{property.number}</div> : null;
            case 'rich_text':
                const text = property.rich_text?.map((t: any) => t.plain_text).join('');
                return text ? <div className="text-[10px] text-gray-500 truncate">{text}</div> : null;
            case 'relation':
                if (!property.relation || property.relation.length === 0) return null;
                return <RelationDisplay relations={property.relation} apiKey={apiKey} />;
            default:
                return null;
        }
    };

    return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 p-4">
            {items.map((page) => {
                const coverUrl = getCoverUrl(page);
                const title = getTitle(page);

                return (
                    <button
                        key={page.id}
                        onClick={() => onTaskClick(page)}
                        className="block break-inside-avoid bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 w-full text-left cursor-pointer"
                    >
                        {coverUrl && (
                            <div className="relative aspect-video w-full overflow-hidden">
                                <img
                                    src={coverUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <div className="p-3">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                                {page.icon?.emoji && <span className="mr-1">{page.icon.emoji}</span>}
                                {title}
                            </h3>

                            <div className="space-y-1.5">
                                {visibleProperties?.map(propName => {
                                    const property = page.properties[propName];
                                    if (!property || property.type === 'title') return null; // Skip title as it's already shown

                                    const content = renderProperty(propName, property, page.id);
                                    if (!content) return null;

                                    return (
                                        <div key={propName} className="flex flex-col gap-0.5">
                                            <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider">{propName}</span>
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
