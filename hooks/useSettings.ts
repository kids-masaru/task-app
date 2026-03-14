import { useState, useEffect } from 'react';

export type ViewType = 'card' | 'list';

export interface DatabaseConfig {
    id: string;
    name: string;
    viewType: ViewType;
}

export interface WidgetConfig {
    id: string;
    name: string;
    url: string;
}

export interface DatabaseSettings {
    visibleProperties?: string[];
    filterProperties?: string[];
}

export interface Settings {
    apiKey: string;
    databases: DatabaseConfig[];
    widgets: WidgetConfig[];
    databaseSettings: Record<string, DatabaseSettings>;
}

const EMPTY_SETTINGS: Settings = {
    apiKey: '',
    databases: [],
    widgets: [],
    databaseSettings: {},
};

function loadDefaultConfig(): Settings {
    try {
        const envDatabases = process.env.NEXT_PUBLIC_DEFAULT_DATABASES;
        const envWidgets = process.env.NEXT_PUBLIC_DEFAULT_WIDGETS;

        let databases = [];
        try {
            const parsed = envDatabases ? JSON.parse(envDatabases) : [];
            databases = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse NEXT_PUBLIC_DEFAULT_DATABASES:', envDatabases, e);
            databases = [];
        }

        let widgets = [];
        try {
            const parsed = envWidgets ? JSON.parse(envWidgets) : [];
            widgets = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse NEXT_PUBLIC_DEFAULT_WIDGETS:', envWidgets, e);
            widgets = [];
        }

        return {
            apiKey: process.env.NEXT_PUBLIC_NOTION_API_KEY || '',
            databases,
            widgets,
            databaseSettings: {},
        };
    } catch (e) {
        console.error('Failed to load default config:', e);
        return EMPTY_SETTINGS;
    }
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        function initialize() {
            try {
                const defaultConfig = loadDefaultConfig();
                const stored = localStorage.getItem('notion-viewer-settings');

                if (stored) {
                    try {
                        const parsedSettings = JSON.parse(stored);
                        setSettings({
                            apiKey: parsedSettings.apiKey || defaultConfig.apiKey,
                            databases: parsedSettings.databases.length > 0
                                ? parsedSettings.databases
                                : defaultConfig.databases,
                            widgets: parsedSettings.widgets.length > 0
                                ? parsedSettings.widgets
                                : defaultConfig.widgets,
                            databaseSettings: parsedSettings.databaseSettings || {},
                        });
                    } catch (e) {
                        console.error('Failed to parse settings', e);
                        setSettings(defaultConfig);
                        localStorage.setItem('notion-viewer-settings', JSON.stringify(defaultConfig));
                    }
                } else {
                    console.log('Initializing with default config from env:', defaultConfig);
                    setSettings(defaultConfig);
                    localStorage.setItem('notion-viewer-settings', JSON.stringify(defaultConfig));
                }
            } catch (e) {
                console.error('Critical initialization error in useSettings:', e);
                // Fallback to empty settings to prevent crash
                setSettings(EMPTY_SETTINGS);
            } finally {
                setIsLoaded(true);
            }
        }

        initialize();
    }, []);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            console.log('Saving settings to localStorage:', updated);
            localStorage.setItem('notion-viewer-settings', JSON.stringify(updated));
            return updated;
        });
    };

    const addDatabase = (db: DatabaseConfig) => {
        updateSettings({ databases: [...settings.databases, db] });
    };

    const removeDatabase = (id: string) => {
        updateSettings({ databases: settings.databases.filter((d) => d.id !== id) });
    };

    const addWidget = (widget: WidgetConfig) => {
        updateSettings({ widgets: [...settings.widgets, widget] });
    };

    const removeWidget = (id: string) => {
        updateSettings({ widgets: settings.widgets.filter((w) => w.id !== id) });
    };

    const updateDatabaseSettings = (dbId: string, dbSettings: DatabaseSettings) => {
        setSettings((prev) => {
            const newDatabaseSettings = {
                ...prev.databaseSettings,
                [dbId]: {
                    ...prev.databaseSettings[dbId],
                    ...dbSettings,
                },
            };

            const updated = {
                ...prev,
                databaseSettings: newDatabaseSettings,
            };

            console.log('Updating database settings:', dbId, dbSettings);
            console.log('New settings:', updated);
            localStorage.setItem('notion-viewer-settings', JSON.stringify(updated));
            return updated;
        });
    };

    return {
        settings,
        isLoaded,
        updateSettings,
        addDatabase,
        removeDatabase,
        addWidget,
        removeWidget,
        updateDatabaseSettings,
    };
}
