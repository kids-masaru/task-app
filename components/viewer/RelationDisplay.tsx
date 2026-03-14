import React, { useState, useEffect } from 'react';
import { Link as LinkIcon } from 'lucide-react';

interface RelationDisplayProps {
    relations: any[];
    apiKey: string;
}

export function RelationDisplay({ relations, apiKey }: RelationDisplayProps) {
    const [relationNames, setRelationNames] = useState<{ [id: string]: string }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRelationNames() {
            // console.log('[RelationDisplay] Called with relations:', relations);

            if (!relations || relations.length === 0) {
                setLoading(false);
                return;
            }

            const names: { [id: string]: string } = {};

            // Fetch all relation names in parallel
            await Promise.all(
                relations.map(async (rel) => {
                    // Check if we already have this relation name cached in a global way? 
                    // For now, just fetch.
                    try {
                        const res = await fetch(`/api/notion/pages/${rel.id}`, {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                            },
                        });

                        if (res.ok) {
                            const data = await res.json();
                            // Extract title from properties
                            const titleProp = Object.values(data.properties).find(
                                (p: any) => p.type === 'title'
                            ) as any;
                            names[rel.id] = titleProp?.title?.[0]?.plain_text || 'Untitled';
                        } else {
                            names[rel.id] = 'Error loading';
                        }
                    } catch (e) {
                        console.error('Error fetching relation:', e);
                        names[rel.id] = 'Error';
                    }
                })
            );

            setRelationNames(names);
            setLoading(false);
        }

        fetchRelationNames();
    }, [relations, apiKey]);

    if (!relations || relations.length === 0) {
        return <span className="text-gray-400">—</span>;
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <LinkIcon className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-500 text-[10px]">Loading...</span>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2">
            <LinkIcon className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
                {relations.map((rel) => (
                    <span
                        key={rel.id}
                        className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]"
                    >
                        {relationNames[rel.id] || 'Loading...'}
                    </span>
                ))}
            </div>
        </div>
    );
}
