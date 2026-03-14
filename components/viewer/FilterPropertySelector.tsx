import React, { useState, useRef, useEffect } from 'react';
import { Filter, Check, ChevronDown } from 'lucide-react';

interface FilterPropertySelectorProps {
    availableProperties: Array<{ name: string; type: string }>;
    selectedFilterProperties: string[];
    onChange: (properties: string[]) => void;
}

export default function FilterPropertySelector({ availableProperties, selectedFilterProperties, onChange }: FilterPropertySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter to only show filterable property types
    const filterableProperties = availableProperties.filter(prop =>
        ['select', 'multi_select', 'status', 'date', 'checkbox'].includes(prop.type)
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleProperty = (propertyName: string) => {
        if (selectedFilterProperties.includes(propertyName)) {
            onChange(selectedFilterProperties.filter(p => p !== propertyName));
        } else {
            onChange([...selectedFilterProperties, propertyName]);
        }
    };

    if (filterableProperties.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                <Filter className="w-4 h-4 text-gray-500" />
                <span>Filter Options</span>
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                    {selectedFilterProperties.length}/{filterableProperties.length}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 px-2 py-1">
                            Select properties to filter by
                        </div>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                        {filterableProperties.map(prop => (
                            <label
                                key={prop.name}
                                onClick={() => toggleProperty(prop.name)}
                                className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer group"
                            >
                                <div className={`
                                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                                    ${selectedFilterProperties.includes(prop.name)
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 bg-white group-hover:border-gray-400'}
                                `}>
                                    {selectedFilterProperties.includes(prop.name) && <Check className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="text-sm text-gray-700 truncate select-none">{prop.name}</span>
                                    <span className="text-xs text-gray-400 ml-2">{prop.type}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
