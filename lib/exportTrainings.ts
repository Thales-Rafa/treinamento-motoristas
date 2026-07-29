import * as XLSX from "xlsx";
import { formatCpf } from "@/lib/validators/cpf";
import { formatDate, formatTime } from "@/lib/utils";
import type { Treinamento } from "@/types/treinamento";

type ExportRow = {
  Nome: string;
  Matrícula: string;
  CPF: string;
  Status: string;
  "Data de início": string;
  "Hora de início": string;
  "Data de conclusão": string;
  "Hora de conclusão": string;
};

const HEADERS: (keyof ExportRow)[] = [
  "Nome",
  "Matrícula",
  "CPF",
  "Status",
  "Data de início",
  "Hora de início",
  "Data de conclusão",
  "Hora de conclusão",
];

function toRow(training: Treinamento): ExportRow {
  return {
    Nome: training.nome,
    Matrícula: training.matricula,
    CPF: formatCpf(training.cpf),
    Status: training.status === "concluido" ? "Concluído" : "Em andamento",
    "Data de início": formatDate(training.started_at),
    "Hora de início": formatTime(training.started_at),
    "Data de conclusão": training.ended_at ? formatDate(training.ended_at) : "",
    "Hora de conclusão": training.ended_at ? formatTime(training.ended_at) : "",
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
