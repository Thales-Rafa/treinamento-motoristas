"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { formatCpf } from "@/lib/validators/cpf";
import type { Treinamento } from "@/types/treinamento";

interface SortableColumn {
  key: keyof Treinamento;
  label: string;
}

const COLUMNS: SortableColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "matricula", label: "Matrícula" },
  { key: "cpf", label: "CPF" },
  { key: "created_at", label: "Data" },
  { key: "status", label: "Status" },
];

interface TrainingsTableProps {
  data: Treinamento[];
  isLoading: boolean;
  sortColumn: keyof Treinamento;
  sortAscending: boolean;
  onSort: (column: keyof Treinamento) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function TrainingsTable({
  data,
  isLoading,
  sortColumn,
  sortAscending,
  onSort,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: TrainingsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(totalCount, (page + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead key={column.key}>
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className="flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    {column.label}
                    {sortColumn === column.key &&
                      (sortAscending ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {COLUMNS.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="h-24 text-center text-muted-foreground">
                  Nenhum treinamento encontrado.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.nome}</TableCell>
                  <TableCell>{training.matricula}</TableCell>
                  <TableCell>{formatCpf(training.cpf)}</TableCell>
                  <TableCell>
                    {formatDate(training.created_at)}{" "}
                    <span className="text-muted-foreground">{formatTime(training.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("bg-emerald-500/15 text-emerald-600 dark:text-emerald-400")}>
                      Concluído
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {totalCount > 0
            ? `Mostrando ${rangeStart}–${rangeEnd} de ${totalCount}`
            : "Nenhum resultado"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= totalPages || isLoading}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
