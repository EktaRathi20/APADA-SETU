import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { HistoricalDisastersView } from '@/components/dashboard/modes/HistoricalDisastersView';
import { api } from '../services/api';
import { isAbortError } from '../services/apiError';
import type { HistoricalResponse } from '../types/api';
import type { DashboardOutletData } from '../types/dashboard';

type HistorySort = 'newest' | 'oldest' | 'wind' | 'distance';

export default function HistoryPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoricalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<HistorySort>('newest');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      api.getHistory(
        dashboard.selectedRegionKey,
        { page, pageSize: 12, search: searchQuery.trim(), sortBy },
        controller.signal,
      )
        .then(setHistory)
        .catch((requestError: unknown) => {
          if (!isAbortError(requestError)) {
            setError(requestError instanceof Error ? requestError.message : 'The request failed unexpectedly.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [dashboard.selectedRegionKey, page, searchQuery, sortBy, retryCount]);

  const updateSearch = (value: string) => {
    setPage(1);
    setSearchQuery(value);
  };

  const updateSort = (value: HistorySort) => {
    setPage(1);
    setSortBy(value);
  };

  return (
    <HistoricalDisastersView
      history={history}
      isLoading={isLoading}
      error={error}
      onRetry={() => setRetryCount(count => count + 1)}
      regionName={dashboard.selectedCity?.name ?? ''}
      onBackToOverview={() => navigate('/overview')}
      page={page}
      onPageChange={setPage}
      searchQuery={searchQuery}
      onSearchChange={updateSearch}
      sortBy={sortBy}
      onSortChange={updateSort}
    />
  );
}
