import * as XLSX from "xlsx";
import { formatCpf } from "@/lib/validators/cpf";
import { formatDate, formatTime } from "@/lib/utils";
import type { Treinamento } from "@/types/treinamento";

type ExportRow = {
  Nome: string;
  Matrícula: string;
  CPF: string;
  Data: string;
  Hora: string;
  Status: string;
};

const HEADERS: (keyof ExportRow)[] = ["Nome", "Matrícula", "CPF", "Data", "Hora", "Status"];

function toRow(training: Treinamento): ExportRow {
  return {
    Nome: training.nome,
    Matrícula: training.matricula,
    CPF: formatCpf(training.cpf),
    Data: formatDate(training.created_at),
    Hora: formatTime(training.created_at),
    Status: training.status,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTrainingsToCsv(trainings: Treinamento[], filename = "treinamentos.csv") {
  const rows = trainings.map(toRow);
  const lines = [
    HEADERS.join(";"),
    ...rows.map((row) =>
      HEADERS.map((header) => `"${String(row[header]).replace(/"/g, '""')}"`).join(";"),
    ),
  ];
  // BOM no início para o Excel reconhecer UTF-8 corretamente em acentos.
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportTrainingsToExcel(trainings: Treinamento[], filename = "treinamentos.xlsx") {
  const rows = trainings.map(toRow);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Treinamentos");
  XLSX.writeFile(workbook, filename);
}
