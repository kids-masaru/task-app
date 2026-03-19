import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, LayoutGrid, List as ListIcon, RefreshCw, Activity, X } from 'lucide-react';
import { Settings, DatabaseSettings, SortOption, PropertyFilter } from '@/hooks/useSettings';
import ViewConfigDrawer from './ViewConfigDrawer';
import TaskDetailModal from './TaskDetailModal';
import ListView from './ListView';
import FilterBar from './FilterBar';
import SyncStatusWidget from '../widgets/SyncStatusWidget';

interface DashboardProps {
    settings: Settings;
    onOpenSettings: () => void;
    onUpdateDatabaseSettings: (dbId: string, settings: Partial<DatabaseSettings>) => void;
}

export default function Dashboard({ settings, onOpenSettings, onUpdateDatabaseSettings }: DashboardProps) {
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalTask, setModalTask] = useState<any | null>(null);
    const [filterText, setFilterText] = useState('');
    const [visibleProperties, setVisibleProperties] = useState<string[]>([]);
    const [propertyFilters, setPropertyFilters] = useState<PropertyFilter[]>([]);
    const [sort, setSort] = useState<SortOption>({ property: 'last_edited_time', direction: 'descending' });
    const [isWidgetsOnTop, setIsWidgetsOnTop] = useState(true);
    const [showViewSettings, setShowViewSettings] = useState(false);
    const [showSyncPopup, setShowSyncPopup] = useState(false);

    // Set initial active tab (only databases)
    useEffect(() => {
        if (!activeTabId && settings.databases.length > 0) {
            setActiveTabId(settings.databases[0].id);
        }
    }, [settings.databases, activeTabId]);

    // Load all settings when active tab changes
    useEffect(() => {
        if (activeTabId) {
            const dbSettings = settings.databaseSettings[activeTabId] || {};
            setVisibleProperties(dbSettings.visibleProperties || []);
            setPropertyFilters(dbSettings.propertyFilters || []);
            setSort(dbSettings.sort || { property: 'Last edited time', direction: 'descending' });
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
                            property: (sort.property === 'created_time' || sort.property === 'last_edited_time' || sort.property === 'Last edited time') ? undefined : sort.property,
                            timestamp: sort.property === 'created_time' ? 'created_time' : (sort.property === 'last_edited_time' || sort.property === 'Last edited time' ? 'last_edited_time' : undefined),
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

    const handleUpdateViewSettings = async (newSettings: Partial<DatabaseSettings>) => {
        if (!activeDatabase) return;
        
        const updatedVisibleProperties = newSettings.visibleProperties !== undefined ? newSettings.visibleProperties : visibleProperties;
        const updatedPropertyFilters = newSettings.propertyFilters !== undefined ? newSettings.propertyFilters : propertyFilters;
        const updatedSort = newSettings.sort !== undefined ? newSettings.sort : sort;

        if (newSettings.visibleProperties !== undefined) setVisibleProperties(newSettings.visibleProperties);
        if (newSettings.propertyFilters !== undefined) setPropertyFilters(newSettings.propertyFilters);
        if (newSettings.sort !== undefined) setSort(newSettings.sort);
        
        onUpdateDatabaseSettings(activeDatabase.id, newSettings);

        // Sync to Notion Description
        try {
            const configPayload = {
                visibleProperties: updatedVisibleProperties,
                propertyFilters: updatedPropertyFilters,
                sort: updatedSort
            };
            const configString = `#CONFIG_START#${JSON.stringify(configPayload)}#CONFIG_END#`;
            
            await fetch('/api/notion/meta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${settings.apiKey}`,
                },
                body: JSON.stringify({
                    database_id: activeDatabase.id,
                    description: configString
                }),
            });
            console.log('[Sync] Settings synced to Notion');
        } catch (e) {
            console.error('[Sync] Failed to sync to Notion', e);
        }
    };

    // Notion Sync on Load
    useEffect(() => {
        const syncFromNotion = async () => {
            if (!activeDatabase || !settings.apiKey) return;
            try {
                const res = await fetch('/api/notion/meta', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${settings.apiKey}`,
                    },
                    body: JSON.stringify({ database_id: activeDatabase.id }),
                });
                const meta = await res.json();
                if (meta.parsedConfig) {
                    console.log('[Sync] Loaded settings from Notion:', meta.parsedConfig);
                    const config = meta.parsedConfig;
                    if (config.visibleProperties) setVisibleProperties(config.visibleProperties);
                    if (config.propertyFilters) setPropertyFilters(config.propertyFilters);
                    if (config.sort) setSort(config.sort);
                    
                    onUpdateDatabaseSettings(activeDatabase.id, config);
                }
            } catch (e) {
                console.error('[Sync] Failed to load from Notion', e);
            }
        };

        syncFromNotion();
    }, [activeTabId, settings.apiKey]); // Run once when tab or API key changes

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

            // Force ListView for all databases to meet the Ergonomic/Single-Column requirement
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
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-xl border-b border-gray-100 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-shrink">
                    <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">Tasks</h1>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    {settings.notionSyncLogDbId && (
                        <div className="relative">
                            <button
                                onClick={() => setShowSyncPopup(!showSyncPopup)}
                                className={`p-2.5 shadow-sm border rounded-full transition-all hover:shadow-md active:scale-90 ${
                                    showSyncPopup ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-600'
                                }`}
                                title="Kintone Sync Status"
                            >
                                <Activity className="w-4 h-4" />
                            </button>
                            
                            {showSyncPopup && (
                                <>
                                    <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setShowSyncPopup(false)} />
                                    {/* Mobile: Center fixed, Desktop: Right aligned absolute */}
                                    <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-3 sm:w-[380px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <SyncStatusWidget apiKey={settings.apiKey} logDatabaseId={settings.notionSyncLogDbId} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleRefresh}
                        className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-full transition-all hover:shadow-md active:scale-90"
                        title="Refresh Data"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {/* Settings button hidden per user request */}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {isWidgetsOnTop ? (
                    <>
                        {renderWidgets()}

                        {/* Database Section */}
                        <div className="px-4">

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
                                    />
                                    
                                    <ViewConfigDrawer
                                        isOpen={showViewSettings}
                                        onClose={() => setShowViewSettings(false)}
                                        data={data}
                                        settings={activeDatabase ? (settings.databaseSettings[activeDatabase.id] || {
                                            visibleProperties,
                                            propertyFilters,
                                            sort
                                        }) : {
                                            visibleProperties: [],
                                            propertyFilters: [],
                                            sort: { property: 'Last edited time', direction: 'descending' }
                                        }}
                                        onUpdateSettings={handleUpdateViewSettings}
                                    />
                                </div>
                            )}

                            {renderDatabaseContent()}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Database Section */}
                        <div className="px-4 mb-8">

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
                                    />
                                    
                                    <ViewConfigDrawer
                                        isOpen={showViewSettings}
                                        onClose={() => setShowViewSettings(false)}
                                        data={data}
                                        settings={activeDatabase ? (settings.databaseSettings[activeDatabase.id] || {
                                            visibleProperties,
                                            propertyFilters,
                                            sort
                                        }) : {
                                            visibleProperties: [],
                                            propertyFilters: [],
                                            sort: { property: 'Last edited time', direction: 'descending' }
                                        }}
                                        onUpdateSettings={handleUpdateViewSettings}
                                    />
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
