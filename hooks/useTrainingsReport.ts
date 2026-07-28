"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchAllMatchingTrainings, fetchTrainings } from "@/services/reportService";
import type { Treinamento } from "@/types/treinamento";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function useTrainingsReport() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Treinamento>("created_at");
  const [sortAscending, setSortAscending] = useState(false);
  const [page, setPage] = useState(0);

  const [data, setData] = useState<Treinamento[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, dateFrom, dateTo]);

  const queryParams = useMemo(
    () => ({ search: debouncedSearch, dateFrom, dateTo, sortColumn, sortAscending }),
    [debouncedSearch, dateFrom, dateTo, sortColumn, sortAscending],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchTrainings({ ...queryParams, page, pageSize: PAGE_SIZE });
      setData(result.data);
      setTotalCount(result.count);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar treinamentos.");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSort = useCallback(
    (column: keyof Treinamento) => {
      if (column === sortColumn) {
        setSortAscending((prev) => !prev);
      } else {
        setSortColumn(column);
        setSortAscending(true);
      }
    },
    [sortColumn],
  );

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      return await fetchAllMatchingTrainings(queryParams);
    } catch {
      toast.error("Erro ao preparar exportação.");
      return [];
    } finally {
      setIsExporting(false);
    }
  }, [queryParams]);

  return {
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortColumn,
    sortAscending,
    toggleSort,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    data,
    totalCount,
    isLoading,
    isExporting,
    exportData,
    refetch: load,
  };
}
