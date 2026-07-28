"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingsFilters } from "@/components/admin/TrainingsFilters";
import { TrainingsTable } from "@/components/admin/TrainingsTable";
import { ExportButtons } from "@/components/admin/ExportButtons";
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
            <ExportButtons onLoadData={exportData} isLoading={isExporting} />
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
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
