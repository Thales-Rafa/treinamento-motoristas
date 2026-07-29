"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchAllMatchingTrainings, fetchTrainings } from "@/services/reportService";
import type { Treinamento, TreinamentoStatus } from "@/types/treinamento";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

/** Coluna mais relevante para ordenar/filtrar por data, dependendo do status. */
function defaultDateColumn(status: TreinamentoStatus): keyof Treinamento {
  return status === "concluido" ? "ended_at" : "started_at";
}

export function useTrainingsReport(status: TreinamentoStatus) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Treinamento>(defaultDateColumn(status));
  const [sortAscending, setSortAscending] = useState(false);
  const [page, setPage] = useState(0);

  const [data, setData] = useState<Treinamento[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Ao trocar de aba (status), volta para os padrões daquela visão.
  useEffect(() => {
    setSortColumn(defaultDateColumn(status));
    setSortAscending(false);
    setSearch("");
    setDateFrom(null);
    setDateTo(null);
    setPage(0);
  }, [status]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, dateFrom, dateTo]);

  const queryParams = useMemo(
    () => ({
      status,
      search: debouncedSearch,
      dateFrom,
      dateTo,
      dateColumn: defaultDateColumn(status),
      sortColumn,
      sortAscending,
    }),
    [status, debouncedSearch, dateFrom, dateTo, sortColumn, sortAscending],
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
