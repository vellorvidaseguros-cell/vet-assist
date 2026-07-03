# Auditoria Completa — VetAssist (03/07/2026)

## ✅ Correções aplicadas e testadas nesta auditoria

| # | Problema | Correção | Teste |
|---|----------|----------|-------|
| 1 | Agendamento sem hora quebrava no banco (model exigia `hora`, restava restrição NOT NULL na tabela) | Model `allowNull: true` + controller converte vazio→null + migração `scripts/migrate-hora-nullable.js` executada | POST sem hora retorna sucesso; 52 registros preservados; backup `vet_assist.db.bak-20260703-140225` |
| 2 | PDF do histórico forçava download no celular (header `attachment`) | Trocado para `inline` — visualiza no navegador; imprimir/baixar fica a critério do veterinário | Header confirmado via curl |
| 3 | Fotos nunca apareciam no PDF (caminho apontava para pasta `public/` inexistente) | Caminho corrigido para `backend/uploads` via basename | PDF do histórico 42 com 3 fotos: 9,1 MB, PDF válido |
| 4 | Emojis no PDF viravam caracteres corrompidos (Helvetica não suporta emoji) | Substituídos por rótulos de texto | Geração OK |
| 5 | Histórico do animal nunca exibia "Tipo de Atendimento" e "Próximo Retorno" (código usava `tipo_atendimento`/`proximo_retorno`, banco usa camelCase) | Campos corrigidos em `AnimalHistoryModal.jsx`; campo `prescricao` (inexistente no banco) removido | Build OK |
| 6 | — | Service worker v14 → v15 | — |
| 7 | — | Build de produção do frontend | Passa sem erros (vite build) |

## 🔴 Problemas críticos EM ABERTO

### 1. Segurança: API totalmente aberta (o mais grave) — ✅ RESOLVIDO em 03/07/2026
> Autenticação JWT implementada e testada: todas as rotas /api exigem token
> (401 sem ele, incluindo a rota de apagar tudo). Login já existente passou a ser
> obrigatório. Pendências: trocar senha padrão do admin; CORS ainda aberto;
> arquivos estáticos em /backend/uploads continuam públicos (nomes não adivinháveis).

Descrição original:
- **Nenhuma rota exige login.** Qualquer pessoa com a URL do ngrok acessa todos os dados: clientes (nomes, telefones, e-mails, endereços), pets, faturamento, fotos.
- Existe rota destrutiva sem proteção: `DELETE /api/historico/apagar/todos` apaga TODOS os históricos e faturamentos com uma única chamada.
- CORS liberado para qualquer origem (`origin: '*'`).
- Conta padrão `admin@vetassist.com` / `admin123` criada automaticamente (a rota de login existe em `/api/veterinarios` mas o app não a utiliza).
- **Implicação LGPD**: dados pessoais de clientes expostos publicamente.
- **Correção sugerida**: middleware JWT nas rotas `/api/*` (o `jsonwebtoken` já está instalado), tela de login no frontend, remover/proteger a rota "apagar todos".

### 2. ngrok bloqueado nesta máquina
- `ngrok.exe` retorna "Acesso negado" ao executar (bloqueio do Windows/antivírus; sem detecção registrada no Defender; `Unblock-File` não resolveu).
- **Contorno atual**: celular na mesma rede WiFi funciona: `http://192.168.15.27:5173`.
- **Correção sugerida**: reinstalar (`npm i -g ngrok` ou baixar do site oficial) ou adicionar exceção no antivírus. Dado o item 1, expor via ngrok sem autenticação é arriscado de qualquer forma.

## 🟠 Problemas médios

3. **Sem versionamento desde maio** — dezenas de arquivos modificados sem commit (último commit: 12/05). Risco de perda de trabalho. Commitar antes de qualquer handoff.
4. **PDF pesado** (9 MB com 3 fotos) — fotos entram em resolução original. Sugerir compressão (ex.: `sharp`) antes de embutir.
5. **Sem migrations formais** — o schema evolui via `sequelize.sync({force:false})`, que não altera tabelas existentes (foi exatamente o que quebrou o item 1 das correções). Em produção (PostgreSQL/Railway), o schema pode divergir silenciosamente. Sugerir `sequelize-cli` ou `umzug`.
6. **Registros antigos com `hora: ''`** (string vazia) funcionam no SQLite mas seriam inválidos em PostgreSQL (tipo TIME). Normalizar para NULL na migração de produção.

## 🟡 Problemas menores

7. 16 vulnerabilidades npm (5 high) — rodar `npm audit fix` e reavaliar.
8. Zero testes automatizados.
9. CSS morto: ~200 linhas do modal de detalhes removido em `MobileCobrancas.css` (`.historico-cobranca-*`, `.hc-*`, lightbox).
10. `console.log` de debug espalhado no backend e frontend.
11. Arquivos de documentação/backup acumulados na raiz (30+ arquivos .md/.txt) — consolidar.

## Estado geral

- **Funcional**: agenda, clientes/pets, histórico com fotos, cobranças (WhatsApp/e-mail/pagamento), PDF, despesas, dashboard, PWA mobile. Build de produção OK.
- **Não pronto para uso comercial/multiusuário**: sem autenticação, sem migrations, sem testes, sem versionamento em dia.
- **Adequado para uso pessoal em rede local** após as correções desta auditoria.
