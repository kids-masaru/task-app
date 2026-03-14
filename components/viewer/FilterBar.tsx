import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
    filterText: string;
    onFilterChange: (text: string) => void;
    resultCount: number;
    totalCount: number;
    children?: React.ReactNode;
    onToggleSettings?: () => void;
    isSettingsOpen?: boolean;
}

export default function FilterBar({ filterText, onFilterChange, resultCount, totalCount, children, onToggleSettings, isSettingsOpen }: FilterBarProps) {
    return (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={filterText}
                            onChange={(e) => onFilterChange(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                        />
                        {filterText && (
                            <button
                                onClick={() => onFilterChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                    {onToggleSettings && (
                        <button
                            onClick={onToggleSettings}
                            className={`p-2 rounded-lg border transition-colors ${isSettingsOpen
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            title="View Settings"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    )}
                    {children}
                </div>
                {filterText && (
                    <div className="mt-2 text-xs text-gray-500">
                        Showing {resultCount} of {totalCount} tasks
                    </div>
                )}
            </div>
        </div>
    );
}
