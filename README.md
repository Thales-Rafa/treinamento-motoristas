# Sistema de Treinamento de Motoristas

Aplicação Next.js 15 + TypeScript + TailwindCSS + shadcn/ui + Supabase para registrar a conclusão
de treinamentos obrigatórios de motoristas, com relatório administrativo protegido por login.

## Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · Supabase (Postgres + Auth) ·
Zod · React Hook Form · sonner · ua-parser-js · xlsx · @react-pdf/renderer · jszip.

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie a `Project URL` e a `anon public key`, e também a
   `service_role key` (mantenha essa em segredo).
3. Abra **SQL Editor** e rode o script completo de [`supabase/setup.sql`](./supabase/setup.sql).
   Ele cria a tabela `treinamentos`, o índice único de CPF e as políticas de RLS.
4. Crie o usuário administrador em **Authentication > Users > Add user** (e-mail + senha) —
   é esse usuário que faz login em `/admin`.

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_TOKEN_SECRET=
TRAINING_VIDEO_DURATION_SECONDS=
NEXT_PUBLIC_TRAINING_VIDEO_SRC=/videos/treinamento.mp4
COMPANY_NAME="Fama Transporte Turismo Ltda"
TRAINING_TITLE="Treinamento de Motoristas"
```

- `APP_TOKEN_SECRET`: qualquer string aleatória longa (ex.: `openssl rand -hex 32`). É usada para
  assinar o token de sessão do treinamento — trocá-la invalida sessões em andamento.
- `TRAINING_VIDEO_DURATION_SECONDS`: duração real do vídeo, em segundos. É a base da validação
  anti-fraude no servidor, então precisa bater com o arquivo real.
- `COMPANY_NAME` / `TRAINING_TITLE`: usados só no cabeçalho do termo em PDF (ver abaixo).

## 3. Colocar o vídeo de treinamento

Coloque o arquivo `.mp4` em `public/videos/treinamento.mp4` (ou ajuste o nome via
`NEXT_PUBLIC_TRAINING_VIDEO_SRC`). Ajuste `TRAINING_VIDEO_DURATION_SECONDS` de acordo.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para o fluxo do motorista e
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) para a área administrativa.

## Como funciona a proteção contra fraude

- O botão "Confirmar que concluí o treinamento" só aparece no cliente depois do evento `ended`
  do vídeo — mas isso é só experiência de uso, não a barreira de segurança.
- A barra de progresso do player é só visual (sem clique/arraste) e qualquer tentativa de pular
  o vídeo (arrastar, atalhos de teclado, alterar `currentTime` via DevTools) é revertida em tempo
  real pelo player (veja `hooks/useVideoGuard.ts`).
- Ao preencher nome/matrícula/CPF, o servidor emite um token assinado (HMAC) contendo o horário
  exato da liberação do vídeo (`app/api/treinamento/start`). Esse token não pode ser forjado pelo
  cliente.
- Na confirmação (`app/api/treinamento/confirm`), o servidor recalcula o tempo decorrido desde a
  emissão do token e rejeita a confirmação se esse tempo for menor que a duração do vídeo — ou
  seja, mesmo chamando a API diretamente (sem passar pela UI), não é possível concluir o
  treinamento mais rápido do que a duração real do vídeo.
- CPF, matrícula e nome são revalidados no servidor (incluindo dígito verificador do CPF) e a
  duplicidade de CPF é bloqueada tanto por checagem prévia quanto por índice único no banco.
- IP e User-Agent são capturados dos headers da requisição no servidor, não do payload enviado
  pelo cliente.

## Termo de conclusão em PDF

No relatório admin (`/admin`), cada motorista tem um botão para baixar um "Termo de
Confirmação de Conclusão de Treinamento" em PDF (nome, matrícula, CPF, datas, duração
assistida, IP, SO/navegador, ID único e um resumo dos controles anti-fraude aplicados).
Também dá para selecionar vários motoristas (checkboxes) e baixar todos de uma vez como um
`.zip` — limite de 100 por vez (`app/api/treinamento/certificados/route.tsx`). Não é uma
assinatura digital com validade jurídica por si só, mas o documento carrega um código de
verificação derivado dos dados do registro, útil para detectar alteração posterior.

## Deploy na Vercel

1. Suba o repositório para o GitHub/GitLab/Bitbucket.
2. Importe o projeto na Vercel.
3. Configure as mesmas variáveis de ambiente do `.env.local` em **Project Settings > Environment
   Variables**.
4. Faça o deploy. O vídeo em `public/videos` é servido como asset estático normalmente.

## Estrutura do projeto

```
app/                    # Rotas (App Router): motorista, /admin, API routes
components/
  ui/                   # componentes shadcn/ui
  motorista/            # form, player de vídeo, dialog de confirmação
  admin/                # login, tabela, filtros, exportação
hooks/                  # useVideoGuard, useTrainingFlow, useTrainingsReport
lib/
  supabase/             # clients Supabase (browser, server, service role, middleware)
  validators/           # validação de CPF
  certificate/          # template do termo em PDF + hash de verificação
  token.ts              # token de sessão assinado (HMAC)
  exportTrainings.ts    # exportação CSV/Excel
schemas/                # schemas Zod (compartilhados client/servidor)
services/               # wrappers de chamadas HTTP/Supabase
types/                  # tipos TypeScript compartilhados
supabase/setup.sql      # script de criação do banco
```
