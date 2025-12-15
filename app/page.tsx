'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Mic, Link as LinkIcon, Send, Database, Clock, Calendar } from 'lucide-react';

export default function Home() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [timeSlot, setTimeSlot] = useState('12:00-16:00');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [databaseId, setDatabaseId] = useState('');
  const [databases, setDatabases] = useState<Array<{ id: string; name: string; relationDbId?: string }>>([]);
  const [relationPages, setRelationPages] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedRelation, setSelectedRelation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Searchable dropdown states
  const [searchText, setSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3-pro"
  ];

  const timeSlots = [
    "8:00-12:00",
    "12:00-16:00",
    "16:00-19:00"
  ];

  useEffect(() => {
    // Load saved settings from localStorage
    const savedDatabase = localStorage.getItem('taskapp_default_database');
    const savedTimeSlot = localStorage.getItem('taskapp_default_timeslot');
    const savedModel = localStorage.getItem('taskapp_default_model');

    // Fetch available databases
    fetch('/api/databases')
      .then(res => res.json())
      .then(data => {
        if (data.databases) {
          setDatabases(data.databases);
          // Set default database from settings or first available
          if (savedDatabase && data.databases.find((db: any) => db.id === savedDatabase)) {
            setDatabaseId(savedDatabase);
          } else if (data.databases.length > 0) {
            setDatabaseId(data.databases[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to fetch databases:', err));

    // Apply saved settings
    if (savedTimeSlot) {
      setTimeSlot(savedTimeSlot);
    }
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  // Fetch relation pages when database changes
  useEffect(() => {
    if (!databaseId || databases.length === 0) {
      setRelationPages([]);
      setSelectedRelation('');
      return;
    }

    // Determine which relation database to query based on database index
    // Determine which relation database to query based on selected database
    const selectedDb = databases.find(db => db.id === databaseId);
    // @ts-ignore - relationDbId exists in the API response but might not be in the initial type
    const relationDbId = selectedDb?.relationDbId;

    if (relationDbId) {
      console.log('Fetching relation pages for:', relationDbId);
      fetch(`/api/relation-pages?relationDbId=${relationDbId}&mainDbId=${databaseId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Relation pages received:', data);
          setRelationPages(data.pages || []);
          setSelectedRelation(''); // Reset selection when database changes
        })
        .catch(err => {
          console.error('Failed to fetch relation pages:', err);
          setRelationPages([]);
        });
    } else {
      setRelationPages([]);
      setSelectedRelation('');
    }
  }, [databaseId, databases]);

  // Filter relation pages based on search text
  const filteredPages = relationPages.filter(page =>
    page.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search and highlighted index when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      setHighlightedIndex(-1);
    }
  }, [isDropdownOpen]);

  // Get selected page title for display
  const selectedPage = relationPages.find(page => page.id === selectedRelation);
  const displayText = selectedPage ? selectedPage.title : searchText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, url, model, timeSlot, databaseId, relationId: selectedRelation, selectedDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Handle multiple tasks response
      const tasks = Array.isArray(data.data) ? data.data : [data.data];
      const count = data.count || tasks.length;

      if (count === 1) {
        toast.success('タスクを作成しました！', {
          description: `${tasks[0].name} (${tasks[0].date})`,
        });
      } else {
        toast.success(`${count}件のタスクを作成しました！`, {
          description: tasks.map((t: any) => `${t.name} (${t.date})`).join('\n'),
        });
      }

      setText('');
      setUrl('');
    } catch (error: any) {
      toast.error('Failed to create task', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-3">
          {/* Header with Logo and Settings */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="#8B5CF6" strokeWidth="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-lg sm:text-xl font-bold text-purple-600">×</span>
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="2" fill="#8B5CF6" />
                  <circle cx="8" cy="14" r="1.5" fill="#8B5CF6" />
                  <circle cx="16" cy="14" r="1.5" fill="#8B5CF6" />
                  <path d="M12 10v4M8 14l4-4M16 14l-4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="6" y="18" width="12" height="2" rx="1" fill="#8B5CF6" />
                </svg>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            Task Manager
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base">
            Create tasks with AI-powered smart titles
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                日付
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>

            {/* Time Slot - Only show for databases that support it */}
            {databaseId === (process.env.NEXT_PUBLIC_DATABASE_WITH_TIMESLOT || databases[0]?.id) && (
              <div className="space-y-2">
                <label htmlFor="timeSlot" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  時間帯
                </label>
                <select
                  id="timeSlot"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Database Selection */}
            {databases.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="database" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  データベース
                </label>
                <select
                  id="database"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                >
                  {databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Relation Selection - Full width */}
          {relationPages.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="relation" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Database className="w-4 h-4" />
                {databases.findIndex(db => db.id === databaseId) === 0 ? 'クライアント' : 'クライアントDB'}
              </label>

              {/* Searchable Dropdown */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={isDropdownOpen ? searchText : displayText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setIsDropdownOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => {
                    setSearchText('');
                    setIsDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex(prev =>
                        prev < filteredPages.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      // If search text is empty, clear the selection
                      if (!searchText.trim()) {
                        setSelectedRelation('');
                        setIsDropdownOpen(false);
                      } else if (highlightedIndex >= 0 && filteredPages[highlightedIndex]) {
                        setSelectedRelation(filteredPages[highlightedIndex].id);
                        setIsDropdownOpen(false);
                        setSearchText('');
                      }
                    } else if (e.key === 'Escape') {
                      setIsDropdownOpen(false);
                      setSearchText('');
                    }
                  }}
                  placeholder="検索してください (オプション)"
                  className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                />

                {/* Dropdown List */}
                {isDropdownOpen && filteredPages.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredPages.map((page, index) => (
                      <div
                        key={page.id}
                        onClick={() => {
                          setSelectedRelation(page.id);
                          setIsDropdownOpen(false);
                          setSearchText('');
                        }}
                        className={`px-3 py-2 cursor-pointer transition-colors text-sm ${index === highlightedIndex
                          ? 'bg-blue-100'
                          : 'hover:bg-neutral-100'
                          } ${page.id === selectedRelation ? 'bg-blue-50 font-medium' : ''
                          }`}
                      >
                        {page.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {isDropdownOpen && searchText && filteredPages.length === 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg px-3 py-2 text-sm text-neutral-500"
                  >
                    結果が見つかりませんでした
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="text" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              タスク内容
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例: Slackの内容を確認する、開園タスクを整理する..."
              className="w-full min-h-[120px] px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none placeholder:text-neutral-400 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              URL (オプション)
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-neutral-400 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 border border-neutral-200">AI</span>
              モデル
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                タスクを作成
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
