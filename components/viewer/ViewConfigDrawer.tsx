import React, { useMemo, useState, useEffect } from 'react';
import { X, ArrowUpDown, Eye, Filter, Check, ChevronDown, GripVertical, Save } from 'lucide-react';
import { DatabaseSettings, SortOption, PropertyFilter } from '@/hooks/useSettings';

interface ViewConfigDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    settings: DatabaseSettings;
    onUpdateSettings: (settings: Partial<DatabaseSettings>) => void;
}

export default function ViewConfigDrawer({ isOpen, onClose, data, settings, onUpdateSettings }: ViewConfigDrawerProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Extract available properties from data
    const availableProperties = useMemo(() => {
        if (data.length === 0) return [];
        const props = new Set<string>();
        data.slice(0, 5).forEach(item => {
            Object.keys(item.properties).forEach(key => props.add(key));
        });
        return Array.from(props).sort();
    }, [data]);

    const propertyTypes = useMemo(() => {
        if (data.length === 0) return {};
        const types: Record<string, string> = {};
        const firstItem = data[0];
        Object.entries(firstItem.properties).forEach(([key, val]: [string, any]) => {
            types[key] = val?.type || 'unknown';
        });
        return types;
    }, [data]);

    if (!isOpen) return null;

    const toggleProperty = (prop: string) => {
        const current = settings.visibleProperties || [];
        if (current.includes(prop)) {
            onUpdateSettings({ visibleProperties: current.filter(p => p !== prop) });
        } else {
            onUpdateSettings({ visibleProperties: [...current, prop] });
        }
    };

    const handleSortChange = (prop: string) => {
        const current = settings.sort;
        if (current?.property === prop) {
            onUpdateSettings({
                sort: {
                    property: prop,
                    direction: current.direction === 'ascending' ? 'descending' : 'ascending'
                }
            });
        } else {
            onUpdateSettings({
                sort: { property: prop, direction: 'ascending' }
            });
        }
    };

    const getSelectOptions = (propertyName: string) => {
        const values = new Set<string>();
        data.forEach(item => {
            const prop = item.properties[propertyName] as any;
            if (!prop) return;
            if (prop.type === 'select' && prop.select?.name) values.add(prop.select.name);
            if (prop.type === 'status' && prop.status?.name) values.add(prop.status.name);
            if (prop.type === 'multi_select' && prop.multi_select) {
                prop.multi_select.forEach((tag: any) => values.add(tag.name));
            }
        });
        return Array.from(values).sort();
    };

    const toggleFilterValue = (propName: string, value: string) => {
        const filters = settings.propertyFilters || [];
        const existing = filters.find(f => f.propertyName === propName);
        const type = propertyTypes[propName];

        let newFilters;
        if (existing) {
            const newValues = existing.values?.includes(value)
                ? existing.values.filter(v => v !== value)
                : [...(existing.values || []), value];
            
            if (newValues.length === 0) {
                newFilters = filters.filter(f => f.propertyName !== propName);
            } else {
                newFilters = filters.map(f => f.propertyName === propName ? { ...f, values: newValues } : f);
            }
        } else {
            newFilters = [...filters, { propertyName: propName, propertyType: type, condition: 'in', values: [value] }];
        }
        onUpdateSettings({ propertyFilters: newFilters });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Save className="w-5 h-5 text-blue-600" />
                        View Options
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
                    {/* Sort Section */}
                    <section>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Sort By
                        </h3>
                        <div className="grid grid-cols-1 gap-1">
                            {availableProperties.map(prop => (
                                <button
                                    key={prop}
                                    onClick={() => handleSortChange(prop)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                                        settings.sort?.property === prop 
                                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' 
                                        : 'hover:bg-gray-50 text-gray-600'
                                    }`}
                                >
                                    <span className="truncate">{prop}</span>
                                    {settings.sort?.property === prop && (
                                        <span className="text-[10px] font-bold uppercase">
                                            {settings.sort.direction === 'ascending' ? 'Asc' : 'Desc'}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Properties Section */}
                    <section>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" />
                            Display Properties
                        </h3>
                        <div className="space-y-1">
                            {availableProperties.map(prop => (
                                <label
                                    key={prop}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={settings.visibleProperties?.includes(prop)}
                                        onChange={() => toggleProperty(prop)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ${settings.visibleProperties?.includes(prop) ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {prop}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Filters Section */}
                    <section>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                        </h3>
                        <div className="space-y-6">
                            {availableProperties.filter(p => ['select', 'status', 'multi_select'].includes(propertyTypes[p])).map(prop => {
                                const options = getSelectOptions(prop);
                                const activeFilter = settings.propertyFilters?.find(f => f.propertyName === prop);
                                
                                return (
                                    <div key={prop} className="space-y-2">
                                        <div className="text-xs font-bold text-gray-900">{prop}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {options.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => toggleFilterValue(prop, opt)}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                                        activeFilter?.values?.includes(opt)
                                                        ? 'bg-gray-900 text-white shadow-sm'
                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
                
                <div className="p-4 border-t bg-gray-50">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
}
