"use client"

import { useState, useEffect, useCallback } from 'react';
import { api, TimelineResponse } from '@/lib/api';

interface UseTimelineResult {
    data: TimelineResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useTimeline(): UseTimelineResult {
    const [data, setData] = useState<TimelineResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeline = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getTimeline();
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load timeline');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    return { data, isLoading, error, refetch: fetchTimeline };
}
