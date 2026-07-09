// Fonte única de verdade sobre recursos e planos do VetAssist.
// O admin pode usar um plano como preset e depois personalizar as
// permissões de cada conta individualmente.

export const RECURSOS = [
  { chave: 'clientes',  nome: 'Clientes e Pets',      descricao: 'Cadastro e gestão de clientes e animais' },
  { chave: 'orcamentos', nome: 'Orçamentos',           descricao: 'Criação e envio de orçamentos' },
  { chave: 'agenda',    nome: 'Agenda e Histórico',   descricao: 'Agendamentos, atendimentos, histórico e fotos' },
  { chave: 'cobrancas', nome: 'Cobranças',            descricao: 'Faturamento, pagamentos e envio de cobranças' },
  { chave: 'insumos',   nome: 'Estoque de Insumos',   descricao: 'Controle de estoque com baixa automática no orçamento' },
  { chave: 'despesas',  nome: 'Despesas e Veículo',   descricao: 'Controle de despesas e custos de veículo' },
  { chave: 'compartilhamento', nome: 'Compartilhamento', descricao: 'Compartilhar o diário de um animal com outro veterinário' },
  { chave: 'extras',    nome: 'Extras',               descricao: 'Cursos, marketplace e comunidades' },
]

export const PLANOS = {
  basico: {
    nome: 'Básico',
    recursos: ['clientes', 'orcamentos'],
  },
  plus: {
    nome: 'Plus',
    recursos: ['clientes', 'orcamentos', 'agenda', 'cobrancas', 'insumos'],
  },
  max: {
    nome: 'Max',
    recursos: ['clientes', 'orcamentos', 'agenda', 'cobrancas', 'insumos', 'despesas', 'compartilhamento', 'extras'],
  },
}

// Resolve as permissões efetivas de uma conta:
// permissões customizadas têm prioridade; senão, usa o preset do plano
export function permissoesEfetivas(veterinario) {
  if (veterinario.role === 'admin') {
    return RECURSOS.map(r => r.chave) // admin tem tudo
  }
  const customizadas = veterinario.permissoes
  if (Array.isArray(customizadas) && customizadas.length > 0) {
    return customizadas
  }
  return PLANOS[veterinario.plano]?.recursos || PLANOS.basico.recursos
}
