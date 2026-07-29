"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { driverInfoSchema, type DriverInfoInput } from "@/schemas/driverInfo.schema";
import { formatCpf } from "@/lib/validators/cpf";

interface DriverInfoFormProps {
  onSubmit: (values: DriverInfoInput) => Promise<void> | void;
  isSubmitting: boolean;
}

export function DriverInfoForm({ onSubmit, isSubmitting }: DriverInfoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverInfoInput>({
    resolver: zodResolver(driverInfoSchema),
    defaultValues: { nome: "", matricula: "", cpf: "" },
  });

  const cpfValue = watch("cpf");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          autoComplete="name"
          placeholder="Digite seu nome completo"
          disabled={isSubmitting}
          {...register("nome", {
            onChange: (event) => {
              event.target.value = event.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' ]/g, "");
            },
          })}
        />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="matricula">Matrícula</Label>
        <Input
          id="matricula"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Digite sua matrícula"
          disabled={isSubmitting}
          {...register("matricula", {
            onChange: (event) => {
              event.target.value = event.target.value.replace(/\D/g, "");
            },
          })}
        />
        {errors.matricula && (
          <p className="text-sm text-destructive">{errors.matricula.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          disabled={isSubmitting}
          value={formatCpf(cpfValue ?? "")}
          onChange={(event) => setValue("cpf", formatCpf(event.target.value), { shouldValidate: true })}
        />
        {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Continuar para o vídeo
      </Button>
    </form>
  );
}
