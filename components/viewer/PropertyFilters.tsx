import React, { useMemo, useState } from 'react';
import { Calendar, Tag, CheckSquare, Filter, X } from 'lucide-react';

export interface PropertyFilter {
    propertyName: string;
    propertyType: string;
    condition: string;
    values?: string[];
}

interface PropertyFiltersProps {
    data: any[];
    activeFilters: PropertyFilter[];
    onFilterChange: (filters: PropertyFilter[]) => void;
    selectedFilterProperties?: string[];
}

export default function PropertyFilters({ data, activeFilters, onFilterChange, selectedFilterProperties = [] }: PropertyFiltersProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Extract available properties from data
    const availableProperties = useMemo(() => {
        if (data.length === 0) return [];

        const properties: any[] = [];
        const sampleItem = data[0];

        for (const [key, prop] of Object.entries(sampleItem.properties)) {
            const typedProp = prop as any;
            if (!typedProp) continue;

            properties.push({
                name: key,
                type: typedProp.type,
            });
        }

        return properties;
    }, [data]);

    // Filter to only show selected filter properties (if any selected)
    const filteredAvailableProperties = useMemo(() => {
        if (selectedFilterProperties.length === 0) {
            // Show all filterable properties if none selected
            return availableProperties;
        }
        return availableProperties.filter(prop => selectedFilterProperties.includes(prop.name));
    }, [availableProperties, selectedFilterProperties]);

    // Extract unique values for select/multi-select properties
    const getSelectOptions = (propertyName: string) => {
        const values = new Set<string>();

        data.forEach(item => {
            const prop = item.properties[propertyName] as any;
            if (!prop) return;

            if (prop.type === 'select' && prop.select?.name) {
                values.add(prop.select.name);
            }
            if (prop.type === 'status' && prop.status?.name) {
                values.add(prop.status.name);
            }
            if (prop.type === 'multi_select' && prop.multi_select) {
                prop.multi_select.forEach((tag: any) => values.add(tag.name));
            }
        });

        return Array.from(values).sort();
    };

    const addFilter = (propertyName: string, propertyType: string, condition: string, values?: string[]) => {
        const newFilter: PropertyFilter = {
            propertyName,
            propertyType,
            condition,
            values,
        };

        // Remove existing filter for this property
        const updatedFilters = activeFilters.filter(f => f.propertyName !== propertyName);

        onFilterChange([...updatedFilters, newFilter]);
    };

    const removeFilter = (propertyName: string) => {
        onFilterChange(activeFilters.filter(f => f.propertyName !== propertyName));
    };

    const clearAllFilters = () => {
        onFilterChange([]);
    };

    const getActiveFilter = (propertyName: string) => {
        return activeFilters.find(f => f.propertyName === propertyName);
    };

    const toggleSelectValue = (propertyName: string, propertyType: string, value: string) => {
        const currentFilter = getActiveFilter(propertyName);
        const currentValues = currentFilter?.values || [];

        let newValues: string[];
        if (currentValues.includes(value)) {
            newValues = currentValues.filter(v => v !== value);
        } else {
            newValues = [...currentValues, value];
        }

        if (newValues.length === 0) {
            removeFilter(propertyName);
        } else {
            addFilter(propertyName, propertyType, 'in', newValues);
        }
    };

    return (
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Filters</span>
                        {activeFilters.length > 0 && (
                            <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">
                                {activeFilters.length}
                            </span>
                        )}
                    </div>
                    {activeFilters.length > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {filteredAvailableProperties.map(prop => {
                        const activeFilter = getActiveFilter(prop.name);

                        // Date filter
                        if (prop.type === 'date') {
                            return (
                                <div key={prop.name} className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-600">{prop.name}:</span>
                                    <select
                                        value={activeFilter?.condition || ''}
                                        onChange={(e) => {
                                            if (e.target.value === '') {
                                                removeFilter(prop.name);
                                            } else {
                                                addFilter(prop.name, prop.type, e.target.value);
                                            }
                                        }}
                                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    >
                                        <option value="">All</option>
                                        <option value="today">Today</option>
                                        <option value="this_week">This Week</option>
                                        <option value="this_month">This Month</option>
                                        <option value="past">Past</option>
                                        <option value="future">Future</option>
                                    </select>
                                </div>
                            );
                        }

                        // Select/Multi-select/Status filter
                        if (prop.type === 'select' || prop.type === 'multi_select' || prop.type === 'status') {
                            const options = getSelectOptions(prop.name);
                            if (options.length === 0) return null;

                            const isOpen = openDropdown === prop.name;

                            return (
                                <div key={prop.name} className="relative">
                                    <button
                                        onClick={() => setOpenDropdown(isOpen ? null : prop.name)}
                                        className={`flex items-center gap-2 text-xs border rounded px-2 py-1 transition-colors ${isOpen ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Tag className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-gray-600">{prop.name}</span>
                                        {activeFilter && (
                                            <span className="bg-gray-900 text-white px-1.5 rounded-full">
                                                {activeFilter.values?.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Dropdown */}
                                    {isOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setOpenDropdown(null)}
                                            />
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                                                <div className="p-2 max-h-60 overflow-y-auto">
                                                    {options.map(option => (
                                                        <label
                                                            key={option}
                                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={activeFilter?.values?.includes(option) || false}
                                                                onChange={() => toggleSelectValue(prop.name, prop.type, option)}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <span className="text-xs text-gray-700">{option}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        }

                        // Checkbox filter
                        if (prop.type === 'checkbox') {
                            return (
                                <div key={prop.name} className="flex items-center gap-2">
                                    <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-600">{prop.name}:</span>
                                    <select
                                        value={activeFilter?.condition || ''}
                                        onChange={(e) => {
                                            if (e.target.value === '') {
                                                removeFilter(prop.name);
                                            } else {
                                                addFilter(prop.name, prop.type, e.target.value);
                                            }
                                        }}
                                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900"
                                    >
                                        <option value="">All</option>
                                        <option value="checked">Checked</option>
                                        <option value="unchecked">Unchecked</option>
                                    </select>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}
