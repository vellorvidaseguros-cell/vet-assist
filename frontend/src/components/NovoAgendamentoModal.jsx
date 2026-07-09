import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { HORARIOS } from '../utils/horariosDisponiveis'
import './NovoAgendamentoModal.css'

// Hook que bloqueia o scroll do body enquanto o modal está aberto
function useLockBodyScroll() {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])
}

const AGENDAMENTO_VAZIO = {
  clienteId: '',
  petId: '',
  data: '',
  hora: '',
  tipoAtendimento: '',
  descricao: '',
  valor: '',
  status: 'Pendente'
}

const TIPOS_ATENDIMENTO = [
  'Consulta Geral',
  'Vacinação',
  'Cirurgia',
  'Banho e Tosa',
  'Limpeza de Dentes',
  'Ultrassom',
  'Radiografia',
  'Exame Laboratorial',
  'Retorno',
  'Emergência',
  'Outro'
]

export default function NovoAgendamentoModal({ onClose, onSuccess }) {
  useLockBodyScroll()  // Trava scroll do app de fundo

  const [agendamentoForm, setAgendamentoForm] = useState(AGENDAMENTO_VAZIO)
  // Array de objetos: [{ tipo: 'Consulta', valor: '150.00', descricao: '...' }, ...]
  const [tiposSelecionados, setTiposSelecionados] = useState([{ tipo: '', valor: '', descricao: '' }])
  const [clientes, setClientes] = useState([])
  const [pets, setPets] = useState([])
  const [petsFiltrados, setPetsFiltrados] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tabelaPrecos, setTabelaPrecos] = useState({})

  // Atendimento Externo (visita domiciliar): usa a mesma hora técnica e
  // custo/km configurados no Perfil (Precificação), igual ao Orçamento.
  const [atendimentoExterno, setAtendimentoExterno] = useState(false)
  const [horaTecnica, setHoraTecnica] = useState(0)
  const [custoKmVeiculo, setCustoKmVeiculo] = useState(0)
  const [distanciaKm, setDistanciaKm] = useState('')
  const [tempoDeslocamentoMin, setTempoDeslocamentoMin] = useState('')

  // Insumos usados no atendimento (abate do estoque ao adicionar)
  const [insumosDisponiveis, setInsumosDisponiveis] = useState([])
  const [mostrarInsumo, setMostrarInsumo] = useState(false)
  const [insumoSelecionadoId, setInsumoSelecionadoId] = useState('')
  const [insumoQuantidade, setInsumoQuantidade] = useState('1')
  const [itensInsumo, setItensInsumo] = useState([]) // [{ id, descricao, valor, insumoId, quantidade }]
  const [erroInsumo, setErroInsumo] = useState('')

  const custoDeslocamento =
    ((parseFloat(tempoDeslocamentoMin) || 0) / 60) * horaTecnica +
    (parseFloat(distanciaKm) || 0) * custoKmVeiculo

  const totalInsumos = itensInsumo.reduce((sum, i) => sum + (parseFloat(i.valor) || 0), 0)

  // Calcular valor total (tipos de atendimento + deslocamento + insumos)
  const valorTotal = tiposSelecionados.reduce((sum, item) => {
    return sum + (parseFloat(item.valor) || 0)
  }, 0) + (atendimentoExterno ? custoDeslocamento : 0) + totalInsumos

  // Adicionar mais um tipo de atendimento
  const adicionarTipo = () => {
    setTiposSelecionados(prev => [...prev, { tipo: '', valor: '', descricao: '' }])
  }

  // Remover um tipo
  const removerTipo = (index) => {
    setTiposSelecionados(prev => {
      const novo = prev.filter((_, i) => i !== index)
      return novo.length === 0 ? [{ tipo: '', valor: '', descricao: '' }] : novo
    })
  }

  // Atualizar o tipo de um atendimento (auto-preenche valor da tabela)
  const atualizarTipo = (index, tipo) => {
    setTiposSelecionados(prev => {
      const novo = [...prev]
      const precoSugerido = tabelaPrecos[tipo]
      novo[index] = {
        ...novo[index],
        tipo: tipo,
        valor: precoSugerido !== undefined && precoSugerido !== null
          ? parseFloat(precoSugerido).toFixed(2)
          : novo[index].valor
      }
      return novo
    })
  }

  // Atualizar o valor de um atendimento manualmente
  const atualizarValorTipo = (index, valor) => {
    setTiposSelecionados(prev => {
      const novo = [...prev]
      novo[index] = { ...novo[index], valor }
      return novo
    })
  }

  // Atualizar a descrição de um atendimento
  const atualizarDescricaoTipo = (index, descricao) => {
    setTiposSelecionados(prev => {
      const novo = [...prev]
      novo[index] = { ...novo[index], descricao }
      return novo
    })
  }

  useEffect(() => {
    carregarDados()
    carregarPrecificacaoEInsumos()
  }, [])

  const carregarPrecificacaoEInsumos = async () => {
    try {
      const perfilRes = await axios.get('/api/perfil')
      if (perfilRes.data.sucesso) {
        const perfil = perfilRes.data.data
        setHoraTecnica(parseFloat(perfil.precificacao?.horaTecnica) || 0)
        if (perfil.id) {
          try {
            const veic = await axios.get(`/api/veiculos/${perfil.id}`)
            const veiculoId = veic.data?.data?.id
            if (veiculoId) {
              const custo = await axios.get(`/api/veiculos/${veiculoId}/custo-km`)
              if (custo.data?.sucesso && !custo.data.data.configuracaoPendente) {
                setCustoKmVeiculo(parseFloat(custo.data.data.custoKm) || 0)
              }
            }
          } catch { /* custo/km é opcional */ }
        }
      }
    } catch { /* precificação é opcional */ }

    try {
      const insumosRes = await axios.get('/api/insumos')
      if (insumosRes.data.sucesso) setInsumosDisponiveis(insumosRes.data.data || [])
    } catch { /* insumos é opcional */ }
  }

  const insumoSelecionado = insumosDisponiveis.find(i => String(i.id) === String(insumoSelecionadoId))
  const insumoQtdNum = parseFloat(insumoQuantidade) || 0
  const insumoValorTotal = insumoSelecionado ? (parseFloat(insumoSelecionado.precoVenda) || 0) * insumoQtdNum : 0

  const handleAdicionarInsumo = async () => {
    if (!insumoSelecionado || insumoQtdNum <= 0) return
    setErroInsumo('')
    try {
      const res = await axios.post(`/api/insumos/${insumoSelecionado.id}/baixar-estoque`, { quantidade: insumoQtdNum })
      if (!res.data.sucesso) {
        setErroInsumo(res.data.erro || 'Erro ao abater estoque')
        return
      }
      setItensInsumo(prev => [...prev, {
        id: Date.now(),
        descricao: `${insumoSelecionado.nome} (${insumoQtdNum} ${insumoSelecionado.unidade})`,
        valor: insumoValorTotal,
        insumoId: insumoSelecionado.id,
        quantidade: insumoQtdNum
      }])
      setInsumosDisponiveis(prev => prev.map(i =>
        i.id === insumoSelecionado.id ? { ...i, quantidadeEstoque: res.data.data.quantidadeEstoque } : i
      ))
      setInsumoSelecionadoId('')
      setInsumoQuantidade('1')
    } catch {
      setErroInsumo('Erro ao abater estoque do insumo')
    }
  }

  const removerItemInsumo = async (item) => {
    try {
      await axios.post(`/api/insumos/${item.insumoId}/repor-estoque`, { quantidade: item.quantidade })
    } catch { /* se falhar a reposição, ao menos remove a linha */ }
    setItensInsumo(prev => prev.filter(i => i.id !== item.id))
  }

  useEffect(() => {
    // Filtrar pets baseado no cliente selecionado
    if (agendamentoForm.clienteId) {
      const petsDo = pets.filter(p => p.clienteId === parseInt(agendamentoForm.clienteId))
      setPetsFiltrados(petsDo)
      // Limpar pet selecionado se não estiver na lista filtrada
      if (agendamentoForm.petId && !petsDo.find(p => p.id === parseInt(agendamentoForm.petId))) {
        setAgendamentoForm(prev => ({ ...prev, petId: '' }))
      }
    } else {
      setPetsFiltrados([])
    }
  }, [agendamentoForm.clienteId, pets])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [clientesRes, petsRes, precosRes, agendRes] = await Promise.all([
        axios.get('/api/clientes'),
        axios.get('/api/pets'),
        axios.get('/api/perfil/tabela-precos').catch(() => ({ data: { sucesso: false } })),
        axios.get('/api/agendamentos').catch(() => ({ data: { sucesso: false } }))
      ])

      if (clientesRes.data.sucesso) setClientes(clientesRes.data.data || [])
      if (petsRes.data.sucesso) setPets(petsRes.data.data || [])
      if (precosRes.data.sucesso) setTabelaPrecos(precosRes.data.data || {})
      if (agendRes.data.sucesso) setAgendamentos(agendRes.data.data || [])
    } catch (err) {
      setErro('Erro ao carregar dados')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Auto-preencher valor ao selecionar tipo de atendimento
    if (name === 'tipoAtendimento' && value && tabelaPrecos[value] !== undefined) {
      setAgendamentoForm(prev => ({
        ...prev,
        [name]: value,
        valor: parseFloat(tabelaPrecos[value]).toFixed(2)
      }))
      return
    }

    setAgendamentoForm(prev => ({ ...prev, [name]: value }))
  }

  const scrollErrorIntoView = () => {
    // Pequeno delay para garantir que o erro foi renderizado
    setTimeout(() => {
      const errorEl = document.querySelector('.nam-error')
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const setErroComScroll = (msg) => {
    setErro(msg)
    scrollErrorIntoView()
  }

  const handleSalvar = async () => {
    console.log('[Agendamento] Iniciando salvamento...', agendamentoForm)

    // Validações
    if (!agendamentoForm.clienteId.toString().trim()) {
      setErroComScroll('Cliente é obrigatório')
      return
    }
    if (!agendamentoForm.petId.toString().trim()) {
      setErroComScroll('Pet é obrigatório')
      return
    }
    if (!agendamentoForm.data.trim()) {
      setErroComScroll('Data é obrigatória')
      return
    }
    // Filtrar tipos vazios e validar
    const tiposValidos = tiposSelecionados.filter(item => item.tipo && item.tipo.trim())
    if (tiposValidos.length === 0) {
      setErroComScroll('Selecione pelo menos um tipo de atendimento')
      return
    }
    // Concatenar tipos com " + "
    const tipoConcatenado = tiposValidos.map(t => t.tipo).join(' + ')
    agendamentoForm.tipoAtendimento = tipoConcatenado

    // Concatenar descrições de cada atendimento (formato: "Tipo: descrição")
    const linhasExtras = []
    if (atendimentoExterno && custoDeslocamento > 0) {
      linhasExtras.push(`Deslocamento: ${distanciaKm || 0}km / ${tempoDeslocamentoMin || 0}min - R$ ${custoDeslocamento.toFixed(2)}`)
    }
    itensInsumo.forEach(item => {
      linhasExtras.push(`Insumo: ${item.descricao} - R$ ${parseFloat(item.valor).toFixed(2)}`)
    })

    const descricoesConcatenadas = [
      ...tiposValidos
        .filter(item => item.descricao && item.descricao.trim())
        .map(item => `${item.tipo}: ${item.descricao.trim()}`),
      ...linhasExtras
    ].join('\n\n')
    if (descricoesConcatenadas) {
      agendamentoForm.descricao = descricoesConcatenadas
    }

    // Calcular valor total automaticamente (tipos + deslocamento + insumos)
    const valorCalculado = valorTotal
    if (valorCalculado > 0) {
      agendamentoForm.valor = valorCalculado.toFixed(2)
    }
    if (!agendamentoForm.valor || parseFloat(agendamentoForm.valor) <= 0) {
      setErroComScroll('Valor deve ser maior que zero')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      const payload = {
        ...agendamentoForm,
        clienteId: parseInt(agendamentoForm.clienteId),
        petId: parseInt(agendamentoForm.petId),
        valor: parseFloat(agendamentoForm.valor)
      }
      console.log('[Agendamento] Enviando para API:', payload)

      const response = await axios.post('/api/agendamentos', payload)
      console.log('[Agendamento] Resposta da API:', response.data)

      if (response.data.sucesso) {
        console.log('[Agendamento] Sucesso!')
        onSuccess()
        onClose()
      } else {
        console.error('[Agendamento] Falha:', response.data.erro)
        setErroComScroll(response.data.erro || 'Erro ao criar agendamento')
      }
    } catch (err) {
      console.error('[Agendamento] Erro:', err)
      console.error('[Agendamento] Response:', err.response?.data)
      const msg = err.response?.data?.erro || err.message || 'Erro ao salvar agendamento. Tente novamente.'
      setErroComScroll(msg)
    } finally {
      setSalvando(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (carregando) {
    return createPortal(
      <div className="nam-overlay" onClick={handleOverlayClick}>
        <div className="nam-modal">
          <div className="nam-header">
            <h2>Novo Agendamento</h2>
          </div>
          <div className="nam-body">
            <p style={{ textAlign: 'center', color: '#8e8e93' }}>Carregando dados...</p>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="nam-overlay" onClick={handleOverlayClick}>
      <div className="nam-modal">
        {/* HEADER */}
        <div className="nam-header">
          <h2>Novo Agendamento</h2>
        </div>

        {/* BODY */}
        <div className="nam-body">
          {erro && <div className="nam-error">{erro}</div>}

          {/* CLIENTE E PET */}
          <div className="nam-section">
            <h3 className="nam-section-title">Cliente e Pet</h3>

            <div className="nam-row">
              <div className="nam-group">
                <label>Cliente *</label>
                <select
                  name="clienteId"
                  value={agendamentoForm.clienteId}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nam-group">
                <label>Pet *</label>
                <select
                  name="petId"
                  value={agendamentoForm.petId}
                  onChange={handleInputChange}
                  disabled={!agendamentoForm.clienteId}
                >
                  <option value="">
                    {agendamentoForm.clienteId ? 'Selecione um pet' : 'Escolha um cliente primeiro'}
                  </option>
                  {petsFiltrados.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.nome} ({pet.especie})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DATA E HORA */}
          <div className="nam-section">
            <h3 className="nam-section-title">Data e Hora</h3>

            <div className="nam-row">
              <div className="nam-group">
                <label>Data *</label>
                <input
                  type="date"
                  name="data"
                  value={agendamentoForm.data}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="nam-group">
                <label>Hora <span className="optional">(opcional)</span></label>
                <select
                  name="hora"
                  value={agendamentoForm.hora}
                  onChange={handleInputChange}
                >
                  <option value="">Sem horário definido</option>
                  {HORARIOS.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ATENDIMENTO */}
          <div className="nam-section">
            <h3 className="nam-section-title">Tipos de Atendimento</h3>

            {tiposSelecionados.map((item, index) => (
              <div key={index} className="tipo-item">
                <div className="tipo-item-header">
                  <label className="tipo-item-label">
                    {index === 0 ? `Atendimento 1 *` : `Atendimento ${index + 1}`}
                  </label>
                  {tiposSelecionados.length > 1 && (
                    <button
                      type="button"
                      className="btn-remover-tipo"
                      onClick={() => removerTipo(index)}
                      title="Remover este atendimento"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <div className="tipo-field">
                  <label className="tipo-field-label">Tipo</label>
                  <select
                    className="tipo-select"
                    value={item.tipo}
                    onChange={(e) => atualizarTipo(index, e.target.value)}
                  >
                    <option value="">Selecione um tipo</option>
                    {TIPOS_ATENDIMENTO.map(t => (
                      <option key={t} value={t}>
                        {t}{tabelaPrecos[t] ? ` - R$ ${parseFloat(tabelaPrecos[t]).toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tipo-field">
                  <label className="tipo-field-label">Valor (R$)</label>
                  <input
                    type="number"
                    className="tipo-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={item.valor}
                    onChange={(e) => atualizarValorTipo(index, e.target.value)}
                  />
                </div>
                <div className="tipo-field">
                  <label className="tipo-field-label">Descrição</label>
                  <textarea
                    className="tipo-textarea"
                    placeholder="Detalhes deste atendimento (opcional)"
                    value={item.descricao}
                    onChange={(e) => atualizarDescricaoTipo(index, e.target.value)}
                    rows="2"
                  />
                </div>
              </div>
            ))}

            {/* Botão Adicionar - sempre após o último atendimento */}
            <button
              type="button"
              className="btn-adicionar-tipo"
              onClick={adicionarTipo}
            >
              Adicionar outro tipo de atendimento
            </button>
          </div>

          {/* ATENDIMENTO EXTERNO (visita domiciliar) */}
          <div className="nam-section">
            <label className="nam-checkbox-row">
              <input
                type="checkbox"
                checked={atendimentoExterno}
                onChange={(e) => setAtendimentoExterno(e.target.checked)}
              />
              <span>Atendimento Externo (visita domiciliar)</span>
            </label>

            {atendimentoExterno && (
              (horaTecnica <= 0 && custoKmVeiculo <= 0) ? (
                <p className="nam-aviso">
                  Configure sua <strong>Hora Técnica</strong> e/ou o <strong>veículo</strong> no Perfil (card Precificação) para calcular o custo de deslocamento.
                </p>
              ) : (
                <>
                  <div className="nam-row">
                    <div className="nam-group">
                      <label>Distância ida+volta (km)</label>
                      <input
                        type="number"
                        placeholder="Ex: 24"
                        value={distanciaKm}
                        onChange={(e) => setDistanciaKm(e.target.value)}
                      />
                    </div>
                    <div className="nam-group">
                      <label>Tempo de deslocamento (min)</label>
                      <input
                        type="number"
                        placeholder="Ex: 40"
                        value={tempoDeslocamentoMin}
                        onChange={(e) => setTempoDeslocamentoMin(e.target.value)}
                      />
                    </div>
                  </div>
                  {custoDeslocamento > 0 && (
                    <p className="nam-aviso nam-aviso-info">
                      Custo estimado do deslocamento: <strong>R$ {custoDeslocamento.toFixed(2)}</strong>
                    </p>
                  )}
                </>
              )
            )}
          </div>

          {/* INSUMOS USADOS */}
          <div className="nam-section">
            <label className="nam-checkbox-row">
              <input
                type="checkbox"
                checked={mostrarInsumo}
                onChange={(e) => setMostrarInsumo(e.target.checked)}
              />
              <span>Insumos Usados</span>
            </label>

            {mostrarInsumo && (
              <>
                {erroInsumo && <p className="nam-aviso">{erroInsumo}</p>}
                {insumosDisponiveis.length === 0 ? (
                  <p className="nam-aviso">Nenhum insumo cadastrado. Configure em <strong>Perfil → Estoque de Insumos</strong>.</p>
                ) : (
                  <>
                    <div className="nam-row">
                      <div className="nam-group" style={{ flex: 2 }}>
                        <label>Insumo do estoque</label>
                        <select value={insumoSelecionadoId} onChange={(e) => setInsumoSelecionadoId(e.target.value)}>
                          <option value="">Selecione...</option>
                          {insumosDisponiveis.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.nome} ({parseFloat(i.quantidadeEstoque)} {i.unidade} em estoque)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="nam-group">
                        <label>Quantidade</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={insumoQuantidade}
                          onChange={(e) => setInsumoQuantidade(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="nam-insumo-acoes nam-insumo-acoes-single">
                      <button
                        type="button"
                        className="nam-btn-insumo-adicionar"
                        onClick={handleAdicionarInsumo}
                        disabled={!insumoSelecionado || insumoQtdNum <= 0}
                      >
                        Adicionar Insumo
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {itensInsumo.map(item => (
              <div key={item.id} className="nam-item-fixo">
                <span>{item.descricao}</span>
                <strong>R$ {parseFloat(item.valor).toFixed(2)}</strong>
                <button type="button" onClick={() => removerItemInsumo(item)} title="Remover">🗑️</button>
              </div>
            ))}
          </div>

          {/* VALOR TOTAL */}
          <div className="nam-section">
            <h3 className="nam-section-title">Valor Total</h3>
            <div className="valor-total-box">
              <span className="valor-total-label">Valor Total da Consulta</span>
              <span className="valor-total-amount">
                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="valor-total-hint">
              Soma automática dos valores dos atendimentos acima
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="nam-footer">
          <button className="nam-btn-cancelar" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button
            className="nam-btn-salvar"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Criar Agendamento'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
