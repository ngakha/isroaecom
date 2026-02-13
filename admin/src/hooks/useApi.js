import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for API calls with loading/error states
 */
export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { immediate = true, params = {} } = options;

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url, { params: overrideParams || params });
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for paginated API lists
 */
export function usePaginatedApi(url) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...filters, ...params, page: params.page || filters.page || 1 };
      const response = await api.get(url, { params: mergedParams });

      setData(response.data.data || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }

      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, filters]);

  useEffect(() => {
    fetchData();
  }, [url, filters]);

  const setPage = (page) => setFilters((prev) => ({ ...prev, page }));
  const updateFilters = (newFilters) => setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));

  return { data, pagination, loading, error, refetch: fetchData, setPage, filters, updateFilters };
}
