# 📊 Estudo de Mercado — VetAssist

> Pesquisa realizada em 07/07/2026. Fontes listadas ao final.

---

## 1. Concorrente homônimo: vetassist.app

**Avaliação: menos ameaçador do que parece.**

- Produto **internacional** (EndSoftTech Web Solutions, origem indiana) — não é focado no Brasil
- Funcionalidades: prontuário eletrônico, faturamento, controle de estoque, agendamento, lembretes automáticos, **portal do cliente** (tutor acessa registros e agenda online), loja online, apps Android/iOS, nuvem
- Preço não público ("contact vendor") e **zero avaliações** no Capterra — comercialmente imaturo
- **Não tem**: Pix, WhatsApp nativo, adaptação ao mercado brasileiro

**O que vale copiar dele:**
- **Portal do tutor** (arquitetura de dois portais: clínica + cliente) — o compartilhamento de animais do nosso app é o embrião disso
- Loja online integrada (receita extra futura)

⚠️ **Atenção jurídica:** mesmo nome "VetAssist". Verificar registro de marca no INPI antes de escalar.

---

## 2. Concorrentes reais (Brasil)

| Sistema | Preço | Foco | Observações |
|---------|-------|------|-------------|
| **SimplesVet** | a partir de **R$ 259/mês** (3 usuários) | Clínicas/petshops | Comprado pela **Petlove** (jul/2025). Ecossistema: Vetsmart, Vetus, Dog Hero |
| **Vetus** | a partir de **R$ 229,90/mês** + módulos avulsos | Clínicas | Também do grupo Petlove |
| **Nuvem Vet** | entrada mais barata | Clínicas pequenas | Bom custo-benefício para quem está começando |
| **VetSoft Web** | planos variados | Clínicas | — |
| **ZettaPET / ConnectVets** | — | Automação WhatsApp | Fortes em conteúdo/SEO sobre gestão veterinária |

**🎯 Insight estratégico central:**
Todos miram **clínicas físicas** e custam R$ 230+/mês. O **veterinário autônomo/domiciliar** — exatamente o perfil do nosso app (custo por km, veículo, WhatsApp, Pix) — está **mal atendido** e dificilmente paga R$ 260/mês. A Petlove consolidou o mercado de clínicas; o nicho domiciliar/autônomo ficou órfão.

---

## 3. As maiores dores do mercado (ranqueadas por evidência)

### 🥇 Dor 1 — Gestão financeira e precificação
- Veterinários saem da faculdade sem preparo em gestão; muitos **"não sabem se têm lucro"**
- No domiciliar é pior: quem cobra R$ 300/consulta mas gasta 2h de deslocamento ganha R$ 100/h sem perceber — **"paga para trabalhar"**
- ✅ **Nosso app JÁ tem custo/km do veículo — nenhum concorrente tem.** Diferencial nº 1, deve virar destaque de marketing

### 🥈 Dor 2 — Inadimplência
- Maior desafio financeiro das clínicas; falta sistema de cobrança eficaz
- ✅ Já temos: cobrança via WhatsApp + dados Pix no PDF
- 💡 **Oportunidade:** "régua de cobrança" — lembrete automático de pendência em 3, 7, 15 dias

### 🥉 Dor 3 — No-show (faltas em consultas)
- Taxa de faltas de **23% a 35%** no setor pet
- Lembrete no dia anterior reduz **até 30%** das faltas
- Padrão-ouro: mensagem ao agendar + confirmação 24–48h antes, com nome do pet e opção confirmar/remarcar
- ✅ Já temos job de lembretes
- 💡 **Oportunidade:** confirmação automática via WhatsApp com resposta do tutor

### Dor 4 — Comunicação com o tutor
- **53% das queixas** contra veterinários (dados da Ordem dos Médicos Veterinários de Portugal) são por comunicação deficiente
- Tutores querem: carteira de vacinação digital com alertas de reforço, histórico acessível, acompanhamento do tratamento
- ✅ O **compartilhamento com o tutor** que estamos construindo ataca exatamente isso
- Apps como Anota Pet e Carteira Pet provam a demanda — mas **não são integrados ao veterinário** (o tutor digita tudo manualmente). Nossa integração vet→tutor é vantagem estrutural

### Dor 5 — Deslocamento (específica do domiciliar)
- Principal desafio do atendimento domiciliar em grandes cidades
- Modelos de cobrança variam: deslocamento incluso vs. cobrado à parte vs. valor mínimo de visita
- Consultas domiciliares: R$ 150–400 (materiais/exames à parte)
- 💡 **Oportunidade:** calculadora de preço de visita (custo/km × distância + hora técnica) — já temos os dados do veículo!

---

## 4. Dados de mercado

- Mercado pet Brasil: **R$ 78 bilhões em 2025** (ABINPET)
- Projeção 2026: **+9,6%**, ultrapassando R$ 80 bi
- 2025 teve primeira retração real em 6 anos (nominal +3,45% vs inflação 4,26%) — mercado mais seletivo
- **Serviços** = segmento que mais cresce (+7,7%)
- **Tendências 2026: atendimento veterinário móvel/domiciliar e planos de saúde pet** — exatamente o nosso nicho
- Nichos lucrativos 2026: alimentação premium, estética, clínicas especializadas, hotelaria, **tecnologia de gestão pet**

---

## 5. Recomendação de planos (usando recursos já implementados em `backend/config/planos.js`)

| | **Básico** (isca) | **Plus** | **Max** |
|---|---|---|---|
| Preço sugerido | R$ 49–69/mês | R$ 99–129/mês | R$ 169–199/mês |
| Clientes + Pets + Orçamentos | ✅ | ✅ | ✅ |
| Agenda + Histórico + Lembretes anti-no-show | — | ✅ | ✅ |
| Cobranças Pix/WhatsApp + PDF timbrado | — | ✅ | ✅ |
| **Custo/km + Despesas** (exclusivo p/ domiciliar) | — | — | ✅ |
| Compartilhamento (vet e tutor) + Exportar planilha | — | — | ✅ |
| Extras (cursos, marketplace, marketing futuro) | — | — | ✅ |

**Posicionamento sugerido:** *"O sistema do veterinário que vai até o cliente"* — espaço vazio no mercado, 50–70% mais barato que SimplesVet/Vetus.

---

## 6. Backlog de oportunidades (priorizado pela pesquisa)

1. **Confirmação de consulta via WhatsApp** (24–48h antes) — ataca no-show, dor validada com números
2. **Régua de cobrança automática** (3/7/15 dias) — ataca inadimplência
3. ~~Calculadora de preço de visita domiciliar~~ ✅ **FEITO** (07/2026)
4. **Portal/app do tutor** com carteira de vacinação digital + alertas de reforço — rede de captura de usuários (tutor vira lead)
5. ~~Relatório mensal de lucratividade~~ ✅ **FEITO** (07/2026)
6. Marketing para veterinários (landing page própria) — em standby, conforme decidido
7. Verificar marca "VetAssist" no INPI

---

## 🧮 Módulo de Precificação implementado (07/2026)

Ataca a **dor nº 1** (gestão financeira). Princípio de design: **configura uma vez no Perfil, o app calcula sozinho** — veterinário não mexe no dia a dia.

**Metodologia usada:** Hora Técnica + Deslocamento + Materiais + Margem
```
Hora técnica = (custos fixos mensais + pró-labore desejado) ÷ horas faturáveis/mês
horas faturáveis = horas/semana × 4,33 × ocupação% (50-70% realista)

Preço da visita = (tempo consulta + tempo deslocamento) × hora técnica
                + km × custo/km + materiais
                × (1 + margem%)
```

**O que foi entregue:**
- **Custo/km corrigido** (era bug: usava odômetro como km/mês). Agora: km rodados/mês a trabalho, preço de combustível editável, IPVA, % uso profissional rateando custos fixos. Campos no modelo `Veiculo`.
- **Calculadora de Hora Técnica** (`PrecificacaoModal.jsx`, aba 1) — setup único, salvo em `Veterinario.precificacao` (JSON).
- **Calculadora de Visita** (aba 2) — sob demanda, usa hora técnica + custo/km salvos. Nada persiste.
- **Preço mínimo na Tabela de Preços** — duração opcional por serviço (guardada em `precificacao.duracoesServicos`, NÃO em `tabelaPrecos` que é lida como número em 4 lugares), alerta vermelho se preço < custo.
- **Resumo de Lucratividade** no Financeiro — automático, zero input: recebido mês − despesas − custo veículo = lucro real, comparado com meta de pró-labore.

**Campos de dados:** `Veiculo.kmMensal/precoCombustivel/percentualUsoProfissional`; `Veterinario.precificacao` (JSON: custosFixosMensais, proLaboreDesejado, horasPorSemana, ocupacaoPercent, margemLucroPercent, horaTecnica, duracoesServicos). Migration: `scripts/migrate-precificacao.js`.

---

## Fontes

- [SimplesVet — gestão financeira: por que clínicas não sabem se têm lucro](https://simples.vet/blog/gestao/gestao-financeira-para-clinica-veterinaria-lucro/)
- [Saúde Business — gestão de inadimplência em clínicas veterinárias](https://www.saudebusiness.com/gestao-veterinaria/como-melhorar-a-gestao-de-inadimplencia-em-clinicas-veterinarias/)
- [ZettaPET — como reduzir no-show na clínica veterinária](https://blog.zettapet.com.br/como-reduzir-no-show-na-clinica-veterinaria/)
- [ZettaPET — 7 erros de gestão em clínicas veterinárias](https://blog.zettapet.com.br/principais-erros-de-gestao-em-clinicas-veterinarias/)
- [Medicina Veterinária em Foco — atendimento domiciliar rentável](https://www.medicinaveterinariaemfoco.com.br/atendimento-domiciliar-como-torna-lo-rentavel-sem-perder-qualidade-assistencial/)
- [Veterinária Atual — comunicação ineficaz é a principal queixa](https://www.veterinaria-atual.pt/destaques/comunicacao-ineficaz/)
- [Editora Stilo/ABINPET — setor pet R$ 78 bi em 2025](https://www.editorastilo.com.br/pet-food/setor-pet-projeta-crescer-apenas-35-em-2025-com-faturamento-de-r-78-bilhoes/)
- [ConnectVets — tendências do mercado veterinário 2026](https://connectvets.com.br/insights/tendencias-mercado-veterinario-2026/)
- [Capterra — VetAssist (concorrente homônimo)](https://www.capterra.com/p/10033857/VetAssist/)
- [SimplesVet — planos e preços](https://simples.vet/precos/)
- [Vindi — 7 sistemas para clínica veterinária](https://blog.vindi.com.br/sistemas-para-clinica-veterinaria/)
- [Cronoshare — quanto custa consulta veterinária a domicílio](https://www.cronoshare.com.br/quanto-custa/veterinario-domicilio)
- [GG Contabilidade — crescimento mercado pet 2026](https://ggcontabilidade.com/crescimento-mercado-pet/)
- [Anota Pet — carteira de vacinação digital (referência de demanda)](https://www.anotapet.com/)
