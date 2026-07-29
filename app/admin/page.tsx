"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingsFilters } from "@/components/admin/TrainingsFilters";
import { TrainingsTable } from "@/components/admin/TrainingsTable";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { CertificatesBulkButton } from "@/components/admin/CertificatesBulkButton";
import { useTrainingsReport } from "@/hooks/useTrainingsReport";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TreinamentoStatus } from "@/types/treinamento";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [statusView, setStatusView] = useState<TreinamentoStatus>("concluido");

  const {
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
    pageSize,
    data,
    totalCount,
    isLoading,
    isExporting,
    exportData,
  } = useTrainingsReport(statusView);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusView]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectPage = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <main className="flex flex-1 flex-col bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Relatório de treinamentos</h1>
            <p className="text-sm text-muted-foreground">
              {statusView === "concluido"
                ? `${totalCount} motorista${totalCount === 1 ? "" : "s"} concluíram o treinamento`
                : `${totalCount} motorista${totalCount === 1 ? "" : "s"} iniciaram e ainda não concluíram`}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatusView("concluido")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              statusView === "concluido"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground border",
            )}
          >
            Concluídos
          </button>
          <button
            type="button"
            onClick={() => setStatusView("em_andamento")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              statusView === "em_andamento"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground border",
            )}
          >
            Não concluíram
          </button>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">
              {statusView === "concluido" ? "Motoristas concluintes" : "Motoristas que não concluíram"}
            </CardTitle>
            <div className="flex gap-2">
              {statusView === "concluido" && (
                <CertificatesBulkButton selectedIds={Array.from(selectedIds)} />
              )}
              <ExportButtons onLoadData={exportData} isLoading={isExporting} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <TrainingsFilters
              search={search}
              onSearchChange={setSearch}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
            />
            <TrainingsTable
              statusView={statusView}
              data={data}
              isLoading={isLoading}
              sortColumn={sortColumn}
              sortAscending={sortAscending}
              onSort={toggleSort}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectPage={toggleSelectPage}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
