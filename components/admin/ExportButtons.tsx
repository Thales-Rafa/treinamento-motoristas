"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportTrainingsToCsv, exportTrainingsToExcel } from "@/lib/exportTrainings";
import type { Treinamento } from "@/types/treinamento";

interface ExportButtonsProps {
  onLoadData: () => Promise<Treinamento[]>;
  isLoading: boolean;
}

export function ExportButtons({ onLoadData, isLoading }: ExportButtonsProps) {
  const [action, setAction] = useState<"csv" | "excel" | null>(null);

  const handleExport = async (type: "csv" | "excel") => {
    setAction(type);
    try {
      const data = await onLoadData();
      if (data.length === 0) {
        toast.info("Nenhum registro para exportar.");
        return;
      }
      if (type === "csv") {
        exportTrainingsToCsv(data);
      } else {
        exportTrainingsToExcel(data);
      }
    } finally {
      setAction(null);
    }
  };

  const busy = isLoading && action !== null;

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("csv")}
        disabled={busy}
      >
        {busy && action === "csv" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("excel")}
        disabled={busy}
      >
        {busy && action === "excel" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </Button>
    </div>
  );
}
