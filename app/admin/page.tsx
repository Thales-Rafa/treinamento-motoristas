"use client";

import { useCallback, useState } from "react";
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

export default function AdminDashboardPage() {
  const router = useRouter();
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
  } = useTrainingsReport();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
              {totalCount} motorista{totalCount === 1 ? "" : "s"} concluíram o treinamento
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Motoristas concluintes</CardTitle>
            <div className="flex gap-2">
              <CertificatesBulkButton selectedIds={Array.from(selectedIds)} />
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
