import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Settings, DatabaseConfig, WidgetConfig } from '@/hooks/useSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

export default function SettingsModal({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
}: SettingsModalProps) {
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [databases, setDatabases] = useState<DatabaseConfig[]>(settings.databases);
    const [widgets, setWidgets] = useState<WidgetConfig[]>(settings.widgets);

    // Local state for new entries
    const [newDbId, setNewDbId] = useState('');
    const [newDbName, setNewDbName] = useState('');
    const [newDbView, setNewDbView] = useState<'card' | 'list'>('card');
    const [newWidgetName, setNewWidgetName] = useState('');
    const [newWidgetUrl, setNewWidgetUrl] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdateSettings({ apiKey, databases, widgets });
        onClose();
    };

    const addDatabase = () => {
        if (newDbId && newDbName) {
            setDatabases([
                ...databases,
                { id: newDbId, name: newDbName, viewType: newDbView },
            ]);
            setNewDbId('');
            setNewDbName('');
            setNewDbView('card');
        }
    };

    const removeDatabase = (id: string) => {
        setDatabases(databases.filter((db) => db.id !== id));
    };

    const addWidget = () => {
        if (newWidgetName && newWidgetUrl) {
            setWidgets([
                ...widgets,
                { id: crypto.randomUUID(), name: newWidgetName, url: newWidgetUrl },
            ]);
            setNewWidgetName('');
            setNewWidgetUrl('');
        }
    };

    const removeWidget = (id: string) => {
        setWidgets(widgets.filter((w) => w.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-800">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* API Key Section */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Notion API Key</h3>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="secret_..."
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Stored locally in your browser.
                        </p>
                    </section>

                    {/* Databases Section */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Databases</h3>
                        <div className="space-y-3 mb-4">
                            {databases.map((db) => (
                                <div key={db.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <div className="font-medium text-gray-800">{db.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{db.id} • {db.viewType}</div>
                                    </div>
                                    <button onClick={() => removeDatabase(db.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                            <input
                                placeholder="Display Name"
                                value={newDbName}
                                onChange={(e) => setNewDbName(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded bg-white text-sm"
                            />
                            <input
                                placeholder="Database ID"
                                value={newDbId}
                                onChange={(e) => setNewDbId(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded bg-white text-sm font-mono"
                            />
                            <div className="flex gap-2">
                                <select
                                    value={newDbView}
                                    onChange={(e) => setNewDbView(e.target.value as 'card' | 'list')}
                                    className="p-2 border border-gray-200 rounded bg-white text-sm flex-1"
                                >
                                    <option value="card">Card View</option>
                                    <option value="list">List View</option>
                                </select>
                                <button
                                    onClick={addDatabase}
                                    disabled={!newDbName || !newDbId}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Widgets Section */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Widgets</h3>
                        <div className="space-y-3 mb-4">
                            {widgets.map((w) => (
                                <div key={w.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <div className="font-medium text-gray-800">{w.name}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{w.url}</div>
                                    </div>
                                    <button onClick={() => removeWidget(w.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                            <input
                                placeholder="Widget Name"
                                value={newWidgetName}
                                onChange={(e) => setNewWidgetName(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded bg-white text-sm"
                            />
                            <input
                                placeholder="Embed URL"
                                value={newWidgetUrl}
                                onChange={(e) => setNewWidgetUrl(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded bg-white text-sm"
                            />
                            <button
                                onClick={addWidget}
                                disabled={!newWidgetName || !newWidgetUrl}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Widget
                            </button>
                        </div>
                    </section>
                </div>

                <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white">
                    <button
                        onClick={handleSave}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
