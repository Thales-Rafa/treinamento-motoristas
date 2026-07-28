import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = {
  title: "Login administrativo | Treinamento de Motoristas",
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Área administrativa</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o relatório.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
