import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Eye, Check, ChevronDown, GripVertical } from 'lucide-react';

interface PropertySelectorProps {
    data: any[];
    visibleProperties: string[];
    onChange: (properties: string[]) => void;
}

export default function PropertySelector({ data, visibleProperties, onChange }: PropertySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [localVisibleProperties, setLocalVisibleProperties] = useState(visibleProperties);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync local state with props
    useEffect(() => {
        setLocalVisibleProperties(visibleProperties);
    }, [visibleProperties]);

    // Extract available properties from data
    const availableProperties = useMemo(() => {
        if (data.length === 0) return [];

        const properties = new Set<string>();
        // Check first few items to get all possible properties
        data.slice(0, 5).forEach(item => {
            Object.keys(item.properties).forEach(key => properties.add(key));
        });

        // Convert to array and sort
        return Array.from(properties).sort();
    }, [data]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleProperty = (property: string) => {
        if (visibleProperties.includes(property)) {
            onChange(visibleProperties.filter(p => p !== property));
        } else {
            onChange([...visibleProperties, property]);
        }
    };

    const selectAll = () => {
        onChange(availableProperties);
    };

    const deselectAll = () => {
        onChange([]);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox and some other browsers to initiate drag
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newProperties = [...localVisibleProperties];
        const draggedItem = newProperties[draggedIndex];
        newProperties.splice(draggedIndex, 1);
        newProperties.splice(index, 0, draggedItem);

        setLocalVisibleProperties(newProperties);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        // Commit the change to parent
        onChange(localVisibleProperties);
    };

    if (availableProperties.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                <Eye className="w-4 h-4 text-gray-500" />
                <span>Properties</span>
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                    {visibleProperties.length}/{availableProperties.length}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b border-gray-100 flex justify-between">
                        <button
                            onClick={selectAll}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-50"
                        >
                            Deselect All
                        </button>
                    </div>

                    {/* Visible properties with drag & drop */}
                    {localVisibleProperties.length > 0 && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">
                                Visible Properties (Drag to reorder)
                            </div>
                            <div className="space-y-1">
                                {localVisibleProperties.map((property, index) => (
                                    <div
                                        key={property}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-move group ${draggedIndex === index ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <GripVertical className="w-3 h-3 text-gray-400" />
                                        <div
                                            className="w-4 h-4 flex items-center justify-center transition-colors bg-blue-600 border-blue-600 text-white rounded cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleProperty(property);
                                            }}
                                        >
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm text-gray-700 truncate select-none flex-1">{property}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All available properties */}
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {availableProperties.length > visibleProperties.length && (
                            <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">
                                Available Properties
                            </div>
                        )}
                        {availableProperties
                            .filter(prop => !visibleProperties.includes(prop))
                            .map(property => (
                                <label
                                    key={property}
                                    onClick={() => toggleProperty(property)}
                                    className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer group"
                                >
                                    <div className="w-4 h-4 rounded border flex items-center justify-center transition-colors border-gray-300 bg-white group-hover:border-gray-400">
                                    </div>
                                    <span className="text-sm text-gray-700 truncate select-none">{property}</span>
                                </label>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
