# Plano de Produção: Correção de Cadastro de Lojas, Restrição de Acesso e Limite de Lojas por Plano

Plano de ajustes críticos para liberar o aplicativo em produção, corrigindo o redirecionamento pós-cadastro de loja, restringindo a visibilidade de lojas apenas ao usuário proprietário e adicionando a regra de cota de lojas nos planos de assinatura.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Confirmadas pelo Usuário nas Pergunas Clarificatórias:**
> 1. **Cota de Lojas por Plano**: Cada plano de assinatura definirá de forma transparente tanto o limite de lojas permitidas por conta quanto a cota de produtos por loja (ex: Plano Grátis: 1 loja / 3 produtos por loja; Plano Ouro: 3 lojas / 25 produtos por loja; Plano Diamante: 5 lojas / 100 produtos por loja).
> 2. **Privacidade e Isolamento de Lojas**: O seletor de lojas no painel do lojista exibirá **estritamente as lojas pertencentes ao usuário logado** (filtrando por `ownerEmail` / `businessId`), ocultando lojas de terceiros. Se o lojista tiver apenas 1 loja, o seletor exibirá a marca dessa loja sem dropdown de troca para concorrência.
> 3. **Redirecionamento Pós-Cadastro**: Ao concluir o cadastro de uma nova loja, o sistema autentica a nova empresa e redireciona o usuário **imediatamente para o painel administrativo da nova loja criada**, abrindo a aba Dashboard.

---

## 1. Overview & Core Concept

- **Problemas Resolvidos**:
  1. *Bug de Cadastro*: Ao cadastrar uma nova loja, o sistema enviava o usuário para uma loja antiga em vez da loja recém-criada.
  2. *Vazamento de Lojas de Terceiros*: O dropdown no cabeçalho do `BusinessPortalScreen` listava todas as empresas do diretório global.
  3. *Regra de Negócio de Planos*: Falta de parâmetro no modelo de dados e interface Admin para configurar e aplicar limites de criação de lojas por plano de assinatura.
- **Público-Alvo**: Lojistas e empresários locais gerenciando suas lojas/filiais e o Administrador Master gerenciando planos e cotas.

---

## 2. User Experience & Visual Design

- **Fluxo do Lojista (Cadastro & Gestão)**:
  1. Lojista acessa "Cadastrar Loja", preenche os dados comerciais, senha e marca.
  2. O sistema verifica a cota de lojas do plano ativo. Se o limite for excedido, exibe alerta amigável e botão para upgrade de plano.
  3. Ao salvar, a nova loja é registrada no diretório, vinculada ao e-mail do usuário e o painel (`BusinessPortalScreen`) é aberto instantaneamente com a nova loja ativa.
- **Seletor de Lojas no Painel**:
  - Exibe apenas filiais/lojas vinculadas ao e-mail/conta do usuário logado (`authSession.email` / `ownerEmail`).
  - Lojistas com 1 loja veem o selo da sua empresa sem dropdown com empresas alheias.
- **Gestão de Planos no Admin**:
  - Novo campo de formulário e coluna na tabela de planos: **"Limite de Lojas por Conta"** (`maxBusinesses` ou `businessLimit`).
  - O Admin pode ajustar livremente esse limite por plano.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Identificação de Propriedade da Loja (`ownerEmail`)**:
  - *Abordagem*: Adicionar a propriedade `ownerEmail?: string` na interface `Business`. Quando uma loja é criada pelo lojista, grava-se seu e-mail como proprietário. Em modo demo ou login por empresa, filtra-se por `ownerEmail` ou `id` da loja ativa.
  - *Motivo*: Garante privacidade total entre contas de lojistas no ambiente Web.
- **Decisão 2: Redirecionamento Direto após Adicionar Loja**:
  - *Abordagem*: A função `addBusiness` retorna o objeto/ID recém-criado, e a função `loginAsBusiness(newId)` atualiza o estado de sessão e define `activeTab = 'dashboard'`.
  - *Motivo*: Atende à resposta exata do usuário, reduzindo a fricção e permitindo cadastrar produtos imediatamente.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DirectoryContext State                         │
│  - businesses: Business[] (com ownerEmail)                            │
│  - plans: Plan[] (com businessLimit)                                   │
│  - authSession: { isAuthenticated, role, email, businessId }           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│   BusinessPortalScreen.tsx   │          │       AdminScreen.tsx        │
│  - Filtra lojas por email    │          │  - Configura businessLimit   │
│  - Redireciona nova loja     │          │    para cada plano           │
│  - Valida cota de criação    │          │  - Exibe métricas de planos  │
└──────────────────────────────┘          └──────────────────────────────┘
```

### Mapeamento de Modificações por Arquivo:

1. `src/types/index.ts`:
   - Atualizar `Plan`: adicionar `businessLimit: number` (ex: 1, 3, 5, 10).
   - Atualizar `Business`: adicionar `ownerEmail?: string`.

2. `src/data/initialData.ts`:
   - Atualizar `initialPlans`: incluir `businessLimit: 1` para Plano Grátis, `3` para Profissional, `5` para Destaque.
   - Atualizar `initialBusinesses`: associar `ownerEmail` às empresas de teste.

3. `src/context/DirectoryContext.tsx`:
   - Atualizar `addBusiness` para registrar `ownerEmail: authSession.email` no objeto da nova empresa.
   - Atualizar `loginAsBusiness` para atribuir `currentBusinessAuth` e a sessão corretamente.

4. `src/components/business/BusinessPortalScreen.tsx`:
   - Filtrar as opções do dropdown de lojas no topo por `b.ownerEmail === userEmail` ou `b.id === activeBusiness.id`.
   - Na aba "Cadastrar Nova Loja", verificar quantas lojas o usuário já possui versus o `businessLimit` do seu plano atual. Se atingiu a cota, travar a submissão com aviso amigável para upgrade de plano.
   - Corrigir a submissão do formulário para chamar `addBusiness` -> `loginAsBusiness(newId)` -> `setActiveTab('dashboard')`.

5. `src/components/admin/AdminScreen.tsx`:
   - Adicionar o campo "Limite de Lojas por Conta" no formulário de criação/edição de planos.
   - Exibir a cota de lojas na listagem de planos.
