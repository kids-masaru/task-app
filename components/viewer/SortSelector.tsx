import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

interface SortOption {
    property: string;
    direction: 'ascending' | 'descending';
}

interface SortSelectorProps {
    properties: string[];
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
}

export default function SortSelector({ properties, currentSort, onSortChange }: SortSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSortClick = (property: string) => {
        if (currentSort.property === property) {
            // Toggle direction
            onSortChange({
                property,
                direction: currentSort.direction === 'ascending' ? 'descending' : 'ascending'
            });
        } else {
            // New property, default to ascending (or descending for dates? let's stick to ascending default)
            onSortChange({
                property,
                direction: 'ascending'
            });
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <span>Sort</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2 max-h-80 overflow-y-auto">
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Sort by
                        </div>
                        {properties.map(property => (
                            <button
                                key={property}
                                onClick={() => handleSortClick(property)}
                                className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded text-left group"
                            >
                                <span className="text-sm text-gray-700 truncate">{property}</span>
                                {currentSort.property === property && (
                                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                                        {currentSort.direction === 'ascending' ? 'Asc' : 'Desc'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
