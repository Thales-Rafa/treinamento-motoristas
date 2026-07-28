"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrainingsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string | null;
  onDateFromChange: (value: string | null) => void;
  dateTo: string | null;
  onDateToChange: (value: string | null) => void;
}

export function TrainingsFilters({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: TrainingsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-sm space-y-2">
        <Label htmlFor="search">Buscar</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nome, matrícula ou CPF"
            className="pl-9"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">De</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom ?? ""}
            onChange={(event) => onDateFromChange(event.target.value || null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">Até</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo ?? ""}
            onChange={(event) => onDateToChange(event.target.value || null)}
          />
        </div>
      </div>
    </div>
  );
}
