import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, LayoutGrid, List as ListIcon, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Settings } from '@/hooks/useSettings';
import CardView from './CardView';
import ListView from './ListView';
import TaskDetailModal from './TaskDetailModal';
import FilterBar from './FilterBar';
import PropertyFilters, { PropertyFilter } from './PropertyFilters';
import PropertySelector from './PropertySelector';
import SortSelector from './SortSelector';
import FilterPropertySelector from './FilterPropertySelector';

interface DashboardProps {
    settings: Settings;
    onOpenSettings: () => void;
    onUpdateDatabaseSettings: (dbId: string, settings: { visibleProperties?: string[]; filterProperties?: string[] }) => void;
}

export default function Dashboard({ settings, onOpenSettings, onUpdateDatabaseSettings }: DashboardProps) {
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalTask, setModalTask] = useState<any | null>(null);
    const [filterText, setFilterText] = useState('');
    const [propertyFilters, setPropertyFilters] = useState<PropertyFilter[]>([]);
    const [visibleProperties, setVisibleProperties] = useState<string[]>([]);
    const [filterProperties, setFilterProperties] = useState<string[]>([]);
    const [sort, setSort] = useState<{ property: string; direction: 'ascending' | 'descending' }>({
        property: 'created_time',
        direction: 'descending'
    });
    const [isWidgetsOnTop, setIsWidgetsOnTop] = useState(true);
    const [showViewSettings, setShowViewSettings] = useState(false);

    // Set initial active tab (only databases)
    useEffect(() => {
        if (!activeTabId && settings.databases.length > 0) {
            setActiveTabId(settings.databases[0].id);
        }
    }, [settings.databases, activeTabId]);

    // Load visible properties from settings when active tab changes
    useEffect(() => {
        if (activeTabId && settings.databaseSettings?.[activeTabId]?.visibleProperties) {
            setVisibleProperties(settings.databaseSettings[activeTabId].visibleProperties!);
        } else {
            setVisibleProperties([]);
        }
    }, [activeTabId, settings.databaseSettings]);

    // Load filter properties from settings when active tab changes
    useEffect(() => {
        if (activeTabId && settings.databaseSettings?.[activeTabId]?.filterProperties) {
            setFilterProperties(settings.databaseSettings[activeTabId].filterProperties!);
        } else {
            // Default to all filterable properties
            setFilterProperties([]);
        }
    }, [activeTabId, settings.databaseSettings]);

    const activeDatabase = settings.databases.find((db) => db.id === activeTabId);

    const fetchData = useCallback(async () => {
        if (!activeDatabase || !settings.apiKey) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/notion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${settings.apiKey}`,
                },
                body: JSON.stringify({
                    database_id: activeDatabase.id,
                    // Add sorts or filters if needed
                    sorts: [
                        {
                            property: sort.property === 'created_time' ? undefined : sort.property,
                            timestamp: sort.property === 'created_time' ? 'created_time' : undefined,
                            direction: sort.direction,
                        },
                    ],
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to fetch data');
            }

            setData(json.results);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeDatabase, settings.apiKey, sort]);

    useEffect(() => {
        if (activeDatabase) {
            fetchData();
        }
    }, [fetchData, activeDatabase]);

    const handleRefresh = () => {
        fetchData();
    };

    const updateTaskStatus = async (pageId: string, propertyName: string, newStatus: string) => {
        // Optimistic update
        setData(prevData => prevData.map(item => {
            if (item.id === pageId) {
                return {
                    ...item,
                    properties: {
                        ...item.properties,
                        [propertyName]: {
                            ...item.properties[propertyName],
                            status: {
                                ...item.properties[propertyName].status,
                                name: newStatus
                            }
                        }
                    }
                };
            }
            return item;
        }));

        try {
            const res = await fetch('/api/notion/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${settings.apiKey}`,
                },
                body: JSON.stringify({
                    pageId,
                    properties: {
                        [propertyName]: {
                            status: {
                                name: newStatus
                            }
                        }
                    }
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            // Revert on error (could be improved)
            // For now just log
        }
    };

    const handleVisiblePropertiesChange = (properties: string[]) => {
        setVisibleProperties(properties);
        // Persist to local settings
        if (activeDatabase) {
            onUpdateDatabaseSettings(activeDatabase.id, { visibleProperties: properties });
        }
    };

    const handleFilterPropertiesChange = (properties: string[]) => {
        setFilterProperties(properties);
        // Persist to local settings
        if (activeDatabase) {
            onUpdateDatabaseSettings(activeDatabase.id, { filterProperties: properties });
        }
    };

    // Apply property filters first
    const propertyFilteredData = data.filter((item) => {
        if (propertyFilters.length === 0) return true;

        return propertyFilters.every(filter => {
            const prop = item.properties[filter.propertyName] as any;
            if (!prop) return false;

            // Date filter
            if (filter.propertyType === 'date') {
                if (!prop.date?.start) return false;
                const itemDate = new Date(prop.date.start);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch (filter.condition) {
                    case 'today':
                        return itemDate.toDateString() === today.toDateString();
                    case 'this_week':
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay());
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 7);
                        return itemDate >= weekStart && itemDate < weekEnd;
                    case 'this_month':
                        return itemDate.getMonth() === today.getMonth() &&
                            itemDate.getFullYear() === today.getFullYear();
                    case 'past':
                        return itemDate < today;
                    case 'future':
                        return itemDate > today;
                    default:
                        return true;
                }
            }

            // Select/Multi-select/Status filter
            if (filter.propertyType === 'select' || filter.propertyType === 'multi_select' || filter.propertyType === 'status') {
                if (!filter.values || filter.values.length === 0) return true;

                if (prop.type === 'select') {
                    return filter.values.includes(prop.select?.name);
                }
                if (prop.type === 'status') {
                    return filter.values.includes(prop.status?.name);
                }
                if (prop.type === 'multi_select') {
                    return prop.multi_select.some((tag: any) =>
                        filter.values!.includes(tag.name)
                    );
                }
            }

            // Checkbox filter
            if (filter.propertyType === 'checkbox') {
                if (filter.condition === 'checked') {
                    return prop.checkbox === true;
                }
                if (filter.condition === 'unchecked') {
                    return prop.checkbox === false;
                }
            }

            return true;
        });
    });

    // Then apply text search filter
    const filteredData = propertyFilteredData.filter((item) => {
        if (!filterText) return true;

        const searchLower = filterText.toLowerCase();

        // Search in all properties
        for (const [key, prop] of Object.entries(item.properties)) {
            if (!prop) continue;

            const typedProp = prop as any;

            // Title
            if (typedProp.type === 'title' && typedProp.title) {
                const titleText = typedProp.title.map((t: any) => t.plain_text).join('').toLowerCase();
                if (titleText.includes(searchLower)) return true;
            }

            // Rich text
            if (typedProp.type === 'rich_text' && typedProp.rich_text) {
                const text = typedProp.rich_text.map((t: any) => t.plain_text).join('').toLowerCase();
                if (text.includes(searchLower)) return true;
            }

            // Select
            if (typedProp.type === 'select' && typedProp.select?.name) {
                if (typedProp.select.name.toLowerCase().includes(searchLower)) return true;
            }

            // Status
            if (typedProp.type === 'status' && typedProp.status?.name) {
                if (typedProp.status.name.toLowerCase().includes(searchLower)) return true;
            }

            // Multi-select
            if (typedProp.type === 'multi_select' && typedProp.multi_select) {
                const hasMatch = typedProp.multi_select.some((tag: any) =>
                    tag.name.toLowerCase().includes(searchLower)
                );
                if (hasMatch) return true;
            }

            // Number, email, phone, url
            if (['number', 'email', 'phone_number', 'url'].includes(typedProp.type)) {
                const value = String(typedProp[typedProp.type] || '').toLowerCase();
                if (value.includes(searchLower)) return true;
            }
        }

        return false;
    });

    const renderWidgets = () => {
        if (settings.widgets.length === 0) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-6">
                {settings.widgets.map((widget) => (
                    <div key={widget.id} className="w-full h-80 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <iframe
                            src={widget.url}
                            className="w-full h-full border-0"
                            title={widget.name}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ))}
            </div>
        );
    };

    const renderDatabaseContent = () => {
        if (!settings.apiKey && settings.databases.length > 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <p>Please configure your Notion API Key in settings.</p>
                    <button onClick={onOpenSettings} className="mt-4 text-blue-600 font-medium">
                        Open Settings
                    </button>
                </div>
            );
        }

        if (activeDatabase) {
            if (loading) {
                return (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                );
            }

            if (error) {
                return (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl mt-4 border border-red-100 flex justify-between items-center">
                        <span>Error: {error}</span>
                        <button
                            onClick={handleRefresh}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                );
            }

            if (activeDatabase.viewType === 'list') {
                return (
                    <ListView
                        items={filteredData}
                        onTaskClick={setModalTask}
                        visibleProperties={visibleProperties}
                        onStatusChange={updateTaskStatus}
                        apiKey={settings.apiKey}
                    />
                );
            }
            return (
                <CardView
                    items={filteredData}
                    onTaskClick={setModalTask}
                    visibleProperties={visibleProperties}
                    onStatusChange={updateTaskStatus}
                    apiKey={settings.apiKey}
                />
            );
        }

        if (settings.databases.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <LayoutGrid className="w-12 h-12 mb-2 opacity-20" />
                    <p>No databases configured.</p>
                    <button onClick={onOpenSettings} className="mt-4 text-blue-600 font-medium">
                        Add Content
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsWidgetsOnTop(!isWidgetsOnTop)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Swap Layout"
                    >
                        <ArrowUpDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Refresh Data"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <SettingsIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {isWidgetsOnTop ? (
                    <>
                        {renderWidgets()}

                        {/* Database Section */}
                        <div className="px-4">
                            {/* Tabs */}
                            {settings.databases.length > 0 && (
                                <div className="mb-4 overflow-x-auto no-scrollbar">
                                    <div className="flex gap-2">
                                        {settings.databases.map((db) => (
                                            <button
                                                key={db.id}
                                                onClick={() => setActiveTabId(db.id)}
                                                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTabId === db.id
                                                    ? 'bg-gray-900 text-white shadow-md'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {db.viewType === 'card' ? (
                                                    <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                                                ) : (
                                                    <ListIcon className="w-3.5 h-3.5 mr-1.5" />
                                                )}
                                                {db.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Filter Bar */}
                            {activeDatabase && (
                                <div className="mb-4">
                                    <FilterBar
                                        filterText={filterText}
                                        onFilterChange={setFilterText}
                                        resultCount={filteredData.length}
                                        totalCount={data.length}
                                        onToggleSettings={() => setShowViewSettings(!showViewSettings)}
                                        isSettingsOpen={showViewSettings}
                                    >
                                        {showViewSettings && (
                                            <>
                                                <PropertySelector
                                                    data={data}
                                                    visibleProperties={visibleProperties}
                                                    onChange={handleVisiblePropertiesChange}
                                                />
                                                <SortSelector
                                                    properties={data.length > 0 ? Object.keys(data[0].properties) : []}
                                                    currentSort={sort}
                                                    onSortChange={setSort}
                                                />
                                                <FilterPropertySelector
                                                    availableProperties={data.length > 0 ?
                                                        Object.entries(data[0].properties).map(([name, prop]: [string, any]) => ({
                                                            name,
                                                            type: prop.type
                                                        })) : []
                                                    }
                                                    selectedFilterProperties={filterProperties}
                                                    onChange={handleFilterPropertiesChange}
                                                />
                                            </>
                                        )}
                                    </FilterBar>
                                    {showViewSettings && (
                                        <PropertyFilters
                                            data={data}
                                            activeFilters={propertyFilters}
                                            onFilterChange={setPropertyFilters}
                                            selectedFilterProperties={filterProperties}
                                        />
                                    )}
                                </div>
                            )}

                            {renderDatabaseContent()}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Database Section */}
                        <div className="px-4 mb-8">
                            {/* Tabs */}
                            {settings.databases.length > 0 && (
                                <div className="mb-4 overflow-x-auto no-scrollbar">
                                    <div className="flex gap-2">
                                        {settings.databases.map((db) => (
                                            <button
                                                key={db.id}
                                                onClick={() => setActiveTabId(db.id)}
                                                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTabId === db.id
                                                    ? 'bg-gray-900 text-white shadow-md'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {db.viewType === 'card' ? (
                                                    <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                                                ) : (
                                                    <ListIcon className="w-3.5 h-3.5 mr-1.5" />
                                                )}
                                                {db.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Filter Bar */}
                            {activeDatabase && (
                                <div className="mb-4">
                                    <FilterBar
                                        filterText={filterText}
                                        onFilterChange={setFilterText}
                                        resultCount={filteredData.length}
                                        totalCount={data.length}
                                        onToggleSettings={() => setShowViewSettings(!showViewSettings)}
                                        isSettingsOpen={showViewSettings}
                                    >
                                        {showViewSettings && (
                                            <>
                                                <PropertySelector
                                                    data={data}
                                                    visibleProperties={visibleProperties}
                                                    onChange={handleVisiblePropertiesChange}
                                                />
                                                <SortSelector
                                                    properties={data.length > 0 ? Object.keys(data[0].properties) : []}
                                                    currentSort={sort}
                                                    onSortChange={setSort}
                                                />
                                                <FilterPropertySelector
                                                    availableProperties={data.length > 0 ?
                                                        Object.entries(data[0].properties).map(([name, prop]: [string, any]) => ({
                                                            name,
                                                            type: prop.type
                                                        })) : []
                                                    }
                                                    selectedFilterProperties={filterProperties}
                                                    onChange={handleFilterPropertiesChange}
                                                />
                                            </>
                                        )}
                                    </FilterBar>
                                    {showViewSettings && (
                                        <PropertyFilters
                                            data={data}
                                            activeFilters={propertyFilters}
                                            onFilterChange={setPropertyFilters}
                                            selectedFilterProperties={filterProperties}
                                        />
                                    )}
                                </div>
                            )}

                            {renderDatabaseContent()}
                        </div>

                        {renderWidgets()}
                    </>
                )}
            </main>

            {/* Task Detail Modal */}
            <TaskDetailModal task={modalTask} onClose={() => setModalTask(null)} />
        </div>
    );
}
