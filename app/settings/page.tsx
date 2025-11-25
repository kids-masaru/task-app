'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, RotateCcw, Database, Clock, Cpu } from 'lucide-react';
import Link from 'next/link';

interface Settings {
    defaultDatabase?: string;
    defaultTimeSlot?: string;
    defaultModel?: string;
}

export default function SettingsPage() {
    const [databases, setDatabases] = useState<Array<{ id: string; name: string }>>([]);
    const [settings, setSettings] = useState<Settings>({});
    const [isLoading, setIsLoading] = useState(false);

    const timeSlots = [
        "8:00-12:00",
        "12:00-16:00",
        "16:00-19:00"
    ];

    const models = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-3-pro"
    ];

    useEffect(() => {
        // Fetch available databases
        fetch('/api/databases')
            .then(res => res.json())
            .then(data => {
                if (data.databases) {
                    setDatabases(data.databases);
                }
            })
            .catch(err => console.error('Failed to fetch databases:', err));

        // Load saved settings from localStorage
        const savedSettings: Settings = {
            defaultDatabase: localStorage.getItem('taskapp_default_database') || undefined,
            defaultTimeSlot: localStorage.getItem('taskapp_default_timeslot') || undefined,
            defaultModel: localStorage.getItem('taskapp_default_model') || undefined,
        };
        setSettings(savedSettings);
    }, []);

    const handleSave = () => {
        setIsLoading(true);
        try {
            // Save to localStorage
            if (settings.defaultDatabase) {
                localStorage.setItem('taskapp_default_database', settings.defaultDatabase);
            }
            if (settings.defaultTimeSlot) {
                localStorage.setItem('taskapp_default_timeslot', settings.defaultTimeSlot);
            }
            if (settings.defaultModel) {
                localStorage.setItem('taskapp_default_model', settings.defaultModel);
            }

            toast.success('設定を保存しました', {
                description: '次回から選択した値がデフォルトで使用されます',
            });
        } catch (error) {
            toast.error('設定の保存に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        // Clear localStorage
        localStorage.removeItem('taskapp_default_database');
        localStorage.removeItem('taskapp_default_timeslot');
        localStorage.removeItem('taskapp_default_model');

        // Reset state
        setSettings({});

        toast.success('設定をリセットしました');
    };

    return (
        <main className="min-h-screen bg-white text-neutral-900 p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                            設定
                        </h1>
                        <p className="text-neutral-500 text-sm sm:text-base mt-1">
                            デフォルト値を設定できます
                        </p>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 shadow-sm space-y-6">
                    {/* Database Setting */}
                    {databases.length > 0 && (
                        <div className="space-y-2">
                            <label htmlFor="defaultDatabase" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                デフォルトデータベース
                            </label>
                            <select
                                id="defaultDatabase"
                                value={settings.defaultDatabase || ''}
                                onChange={(e) => setSettings({ ...settings, defaultDatabase: e.target.value })}
                                className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                            >
                                <option value="">選択してください</option>
                                {databases.map((db) => (
                                    <option key={db.id} value={db.id}>
                                        {db.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-neutral-500">
                                タスク作成時に自動的に選択されるデータベース
                            </p>
                        </div>
                    )}

                    {/* Time Slot Setting */}
                    <div className="space-y-2">
                        <label htmlFor="defaultTimeSlot" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            デフォルト時間帯
                        </label>
                        <select
                            id="defaultTimeSlot"
                            value={settings.defaultTimeSlot || ''}
                            onChange={(e) => setSettings({ ...settings, defaultTimeSlot: e.target.value })}
                            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        >
                            <option value="">選択してください</option>
                            {timeSlots.map((slot) => (
                                <option key={slot} value={slot}>
                                    {slot}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-neutral-500">
                            タスク作成時に自動的に選択される時間帯
                        </p>
                    </div>

                    {/* Model Setting */}
                    <div className="space-y-2">
                        <label htmlFor="defaultModel" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            デフォルトAIモデル
                        </label>
                        <select
                            id="defaultModel"
                            value={settings.defaultModel || ''}
                            onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                            className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        >
                            <option value="">選択してください</option>
                            {models.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-neutral-500">
                            タスク作成時に自動的に選択されるAIモデル
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                        >
                            <Save className="w-4 h-4" />
                            保存
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isLoading}
                            className="px-4 py-2.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            リセット
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <p className="font-medium mb-1">💡 ヒント</p>
                    <p>
                        設定はこのブラウザに保存されます。別のデバイスやブラウザでは設定が共有されません。
                    </p>
                </div>
            </div>
        </main>
    );
}
