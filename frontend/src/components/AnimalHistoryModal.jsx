import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Trash2 } from 'lucide-react'
import PhotoUploadModal from './PhotoUploadModal'
import './AnimalHistoryModal.css'

const NOVO_ATENDIMENTO_VAZIO = {
  data: new Date().toISOString().split('T')[0],
  tipoAtendimento: '',
  procedimentos: '',
  observacoes: '',
  valor: ''
}

export default function AnimalHistoryModal({ petId, petName, compartilhadoPor, onClose }) {
  const [historicos, setHistoricos] = useState([])
  const [podeEditar, setPodeEditar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [fotoLightbox, setFotoLightbox] = useState(null)
  const [mostrarNovoAtendimento, setMostrarNovoAtendimento] = useState(false)
  const [novoAtendimento, setNovoAtendimento] = useState(NOVO_ATENDIMENTO_VAZIO)
  const [salvandoAtendimento, setSalvandoAtendimento] = useState(false)
  const [historicoParaFoto, setHistoricoParaFoto] = useState(null)

  // Fotos escolhidas no formulário — enviadas automaticamente após registrar o atendimento
  const [fotosSelecionadas, setFotosSelecionadas] = useState([])
  const [previewsFotos, setPreviewsFotos] = useState([])

  // Atendimento Externo (visita domiciliar) — mesma fórmula do Orçamento/Agendamento
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
  const [itensInsumo, setItensInsumo] = useState([])
  const [erroInsumo, setErroInsumo] = useState('')

  const custoDeslocamento =
    ((parseFloat(tempoDeslocamentoMin) || 0) / 60) * horaTecnica +
    (parseFloat(distanciaKm) || 0) * custoKmVeiculo

  const insumoSelecionado = insumosDisponiveis.find(i => String(i.id) === String(insumoSelecionadoId))
  const insumoQtdNum = parseFloat(insumoQuantidade) || 0
  const insumoValorTotal = insumoSelecionado ? (parseFloat(insumoSelecionado.precoVenda) || 0) * insumoQtdNum : 0
  const totalInsumos = itensInsumo.reduce((sum, i) => sum + (parseFloat(i.valor) || 0), 0)

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    fetchHistorico()
    carregarPrecificacaoEInsumos()
  }, [petId])

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

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const fetchHistorico = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`/api/historico/animal/${petId}`)
      if (res.data.sucesso) {
        // Ordena por data mais recente primeiro
        const sorted = (res.data.data || []).sort((a, b) =>
          new Date(b.data) - new Date(a.data)
        )
        setHistoricos(sorted)
        setPodeEditar(!!res.data.podeEditar)
      } else {
        setError('Erro ao carregar histórico')
      }
    } catch (err) {
      setError('Erro ao carregar histórico do animal')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // "data" do atendimento é escolhida num <input type="date"> (sem hora real).
  // O backend salva como DATE em UTC-meia-noite; usar `new Date(data)` direto
  // aplicaria o fuso do navegador (Brasil = UTC-3) e voltaria para o dia anterior
  // às 21h. Por isso extraímos ano/mês/dia da string e montamos a data local,
  // sem exibir hora (que nunca foi informada pelo usuário).
  const formatarData = (data) => {
    const datePart = String(data).split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Seleção de fotos no formulário (guardadas até registrar o atendimento)
  const handleSelecionarFotos = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return
    setFotosSelecionadas(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewsFotos(prev => [...prev, reader.result])
      reader.readAsDataURL(file)
    })
    e.target.value = '' // permite selecionar o mesmo arquivo de novo se remover
  }

  const removerFotoSelecionada = (index) => {
    setFotosSelecionadas(prev => prev.filter((_, i) => i !== index))
    setPreviewsFotos(prev => prev.filter((_, i) => i !== index))
  }

  const resetFormNovoAtendimento = () => {
    setNovoAtendimento(NOVO_ATENDIMENTO_VAZIO)
    setMostrarNovoAtendimento(false)
    setAtendimentoExterno(false)
    setDistanciaKm('')
    setTempoDeslocamentoMin('')
    setItensInsumo([])
    setMostrarInsumo(false)
    setFotosSelecionadas([])
    setPreviewsFotos([])
  }

  const handleSalvarAtendimento = async () => {
    if (!novoAtendimento.data) {
      setError('Informe a data do atendimento')
      return
    }
    setSalvandoAtendimento(true)
    setError('')

    const linhasExtras = []
    if (atendimentoExterno && custoDeslocamento > 0) {
      linhasExtras.push(`Deslocamento: ${distanciaKm || 0}km / ${tempoDeslocamentoMin || 0}min - R$ ${custoDeslocamento.toFixed(2)}`)
    }
    itensInsumo.forEach(item => {
      linhasExtras.push(`Insumo: ${item.descricao} - R$ ${parseFloat(item.valor).toFixed(2)}`)
    })
    const observacoesFinal = [novoAtendimento.observacoes, ...linhasExtras].filter(Boolean).join('\n\n')

    const valorBase = parseFloat(String(novoAtendimento.valor).replace(',', '.')) || 0
    const valorFinal = valorBase + (atendimentoExterno ? custoDeslocamento : 0) + totalInsumos

    try {
      const res = await axios.post('/api/historico', {
        petId,
        data: novoAtendimento.data,
        tipoAtendimento: novoAtendimento.tipoAtendimento,
        procedimentos: novoAtendimento.procedimentos,
        observacoes: observacoesFinal,
        valor: valorFinal
      })
      if (res.data.sucesso) {
        const novoId = res.data.data?.id
        // Envia as fotos escolhidas no formulário para o atendimento recém-criado
        if (novoId && fotosSelecionadas.length > 0) {
          for (const foto of fotosSelecionadas) {
            try {
              const form = new FormData()
              form.append('arquivo', foto)
              form.append('historicoConsultaId', String(novoId))
              await axios.post('/api/anexos/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000
              })
            } catch (errFoto) {
              console.error('Erro ao enviar foto:', errFoto)
            }
          }
        }
        resetFormNovoAtendimento()
        await fetchHistorico()
      } else {
        setError(res.data.erro || 'Erro ao registrar atendimento')
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao registrar atendimento')
    } finally {
      setSalvandoAtendimento(false)
    }
  }

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const [gerandoPdf, setGerandoPdf] = useState(null)

  // Abre um PDF do backend em nova aba: mesmo padrão usado em QuoteModal e
  // DocumentosEmitidosModal (window.open('','_blank') ANTES do await, para
  // preservar o gesto do usuário e não ser bloqueado por popup blocker, depois
  // troca a location para o blob). É esse padrão — não um link direto com token
  // na query — que dá o viewer nativo com botão de voltar/compartilhar/imprimir
  // no celular; um <a>/location para uma URL simples perde esse viewer no PWA.
  const abrirPdfEmNovaAba = async (chave, url) => {
    setGerandoPdf(chave)
    const novaJanela = window.open('', '_blank')
    try {
      const res = await axios.get(url, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      if (novaJanela) {
        novaJanela.location = blobUrl
      } else {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `${petName || 'historico'}.pdf`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    } catch (err) {
      if (novaJanela) novaJanela.close()
      setError(err.response?.data?.erro || 'Erro ao gerar o PDF')
    } finally {
      setGerandoPdf(null)
    }
  }

  const handleAbrirPdfCompleto = () => {
    abrirPdfEmNovaAba('completo', `/api/historico/animal/${petId}/pdf`)
  }

  const handleAbrirPdfAtendimento = (histId) => {
    abrirPdfEmNovaAba(`atendimento-${histId}`, `/api/historico/pdf/${histId}`)
  }

  if (loading) {
    return createPortal(
      <div className="modal-overlay animal-historico-overlay">
        <div className="modal-content detalhes-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando histórico...</div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="modal-overlay animal-historico-overlay">
      <div className="modal-content detalhes-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="detalhes-titulo">
            <h3>{petName}</h3>
            <span className="detalhes-data">{historicos.length} atendimento(s)</span>
          </div>
          <button className="btn-close" onClick={onClose} type="button">×</button>
        </div>

        {compartilhadoPor && (
          <div className="detalhes-compartilhado-bar">
            Compartilhado por <strong>{compartilhadoPor}</strong>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            <button type="button" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="detalhes-body">
          {historicos.length > 0 && (
            <div className="historico-pdf-completo-wrap">
              <button
                type="button"
                className="btn-pdf-completo"
                onClick={handleAbrirPdfCompleto}
                disabled={gerandoPdf === 'completo'}
              >
                {gerandoPdf === 'completo' ? '⏳ Gerando...' : 'Ver Histórico Completo em PDF'}
              </button>
            </div>
          )}

          {podeEditar && (
            <div className="historico-novo-atendimento">
              {!mostrarNovoAtendimento ? (
                <button
                  type="button"
                  className="btn-novo-atendimento"
                  onClick={() => setMostrarNovoAtendimento(true)}
                >
                  + Novo Atendimento
                </button>
              ) : (
                <div className="novo-atendimento-form">
                  <h4>Novo Atendimento</h4>
                  <div className="na-field">
                    <label>Data *</label>
                    <input
                      type="date"
                      value={novoAtendimento.data}
                      onChange={(e) => setNovoAtendimento({ ...novoAtendimento, data: e.target.value })}
                    />
                  </div>
                  <div className="na-field">
                    <label>Tipo de atendimento</label>
                    <input
                      type="text"
                      placeholder="Ex: Consulta, Vacinação..."
                      value={novoAtendimento.tipoAtendimento}
                      onChange={(e) => setNovoAtendimento({ ...novoAtendimento, tipoAtendimento: e.target.value })}
                    />
                  </div>
                  <div className="na-field">
                    <label>Procedimentos realizados</label>
                    <textarea
                      rows="2"
                      value={novoAtendimento.procedimentos}
                      onChange={(e) => setNovoAtendimento({ ...novoAtendimento, procedimentos: e.target.value })}
                    />
                  </div>
                  <div className="na-field">
                    <label>Observações</label>
                    <textarea
                      rows="2"
                      value={novoAtendimento.observacoes}
                      onChange={(e) => setNovoAtendimento({ ...novoAtendimento, observacoes: e.target.value })}
                    />
                  </div>
                  <div className="na-field">
                    <label>Valor (R$) <span className="optional">(opcional)</span></label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={novoAtendimento.valor}
                      onChange={(e) => setNovoAtendimento({ ...novoAtendimento, valor: e.target.value })}
                    />
                  </div>

                  {/* Atendimento Externo (visita domiciliar) */}
                  <div className="na-toggle-section">
                    <label className="na-checkbox-row">
                      <input
                        type="checkbox"
                        checked={atendimentoExterno}
                        onChange={(e) => setAtendimentoExterno(e.target.checked)}
                      />
                      <span>Atendimento Externo (visita domiciliar)</span>
                    </label>

                    {atendimentoExterno && (
                      (horaTecnica <= 0 && custoKmVeiculo <= 0) ? (
                        <p className="na-aviso">
                          Configure sua <strong>Hora Técnica</strong> e/ou o <strong>veículo</strong> no Perfil (card Precificação) para calcular o custo de deslocamento.
                        </p>
                      ) : (
                        <>
                          <div className="na-row">
                            <div className="na-field">
                              <label>Distância ida+volta (km)</label>
                              <input
                                type="number"
                                placeholder="Ex: 24"
                                value={distanciaKm}
                                onChange={(e) => setDistanciaKm(e.target.value)}
                              />
                            </div>
                            <div className="na-field">
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
                            <p className="na-aviso na-aviso-info">
                              Custo estimado do deslocamento: <strong>R$ {custoDeslocamento.toFixed(2)}</strong>
                            </p>
                          )}
                        </>
                      )
                    )}
                  </div>

                  {/* Insumos Usados */}
                  <div className="na-toggle-section">
                    <label className="na-checkbox-row">
                      <input
                        type="checkbox"
                        checked={mostrarInsumo}
                        onChange={(e) => setMostrarInsumo(e.target.checked)}
                      />
                      <span>Insumos Usados</span>
                    </label>

                    {mostrarInsumo && (
                      erroInsumo ? <p className="na-aviso">{erroInsumo}</p> : null
                    )}
                    {mostrarInsumo && (
                      insumosDisponiveis.length === 0 ? (
                        <p className="na-aviso">Nenhum insumo cadastrado. Configure em <strong>Perfil → Estoque de Insumos</strong>.</p>
                      ) : (
                        <>
                          <div className="na-row">
                            <div className="na-field" style={{ flex: 2 }}>
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
                            <div className="na-field">
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
                          <div className="na-insumo-acoes">
                            <button
                              type="button"
                              className="na-btn-salvar"
                              onClick={handleAdicionarInsumo}
                              disabled={!insumoSelecionado || insumoQtdNum <= 0}
                            >
                              Adicionar Insumo
                            </button>
                          </div>
                        </>
                      )
                    )}

                    {itensInsumo.map(item => (
                      <div key={item.id} className="na-item-fixo">
                        <span>{item.descricao}</span>
                        <strong>R$ {parseFloat(item.valor).toFixed(2)}</strong>
                        <button type="button" onClick={() => removerItemInsumo(item)} title="Remover"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>

                  {/* Fotos do atendimento */}
                  <div className="na-toggle-section">
                    <div className="na-fotos-header">
                      <span>Fotos do atendimento</span>
                      <label className="na-btn-add-foto">
                        + Adicionar
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleSelecionarFotos}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    {previewsFotos.length > 0 && (
                      <div className="na-fotos-grid">
                        {previewsFotos.map((preview, index) => (
                          <div key={index} className="na-foto-item">
                            <img src={preview} alt={`Foto ${index + 1}`} />
                            <button type="button" onClick={() => removerFotoSelecionada(index)} title="Remover">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="na-acoes">
                    <button
                      type="button"
                      className="na-btn-cancelar"
                      onClick={resetFormNovoAtendimento}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="na-btn-salvar"
                      onClick={handleSalvarAtendimento}
                      disabled={salvandoAtendimento}
                    >
                      {salvandoAtendimento
                        ? (fotosSelecionadas.length > 0 ? 'Salvando e enviando fotos...' : 'Salvando...')
                        : 'Registrar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {historicos.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8e8e93', padding: '2rem 1rem' }}>
              <p>Nenhum atendimento registrado</p>
            </div>
          ) : (
            <div className="historico-timeline">
              {historicos.map((hist, idx) => {
                const id = hist.id || idx
                const isExpanded = expandedIds.has(id)
                return (
                  <div key={id} className="historico-item">
                    <div className="historico-date-marker">
                      <div className="marker-dot"></div>
                    </div>

                    <div
                      className={`historico-card ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleExpand(id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="historico-header">
                        <div className="historico-date">
                          {formatarData(hist.data)}
                        </div>
                        {hist.valor && (
                          <div className="historico-valor">
                            {formatarValor(hist.valor)}
                          </div>
                        )}
                      </div>

                      {/* Sempre visível: tipo de atendimento */}
                      {hist.tipoAtendimento && (
                        <div className="historico-field">
                          <span className="historico-label">Tipo de Atendimento:</span>
                          <span className="historico-value">{hist.tipoAtendimento}</span>
                        </div>
                      )}

                      {/* Conteúdo expandido */}
                      {isExpanded && (
                        <>
                          {hist.procedimentos && (
                            <div className="historico-field">
                              <span className="historico-label">Procedimentos:</span>
                              <span className="historico-value">{hist.procedimentos}</span>
                            </div>
                          )}

                          {hist.diagnostico && (
                            <div className="historico-field">
                              <span className="historico-label">Diagnóstico:</span>
                              <span className="historico-value">{hist.diagnostico}</span>
                            </div>
                          )}

                          {hist.observacoes && (
                            <div className="historico-field">
                              <span className="historico-label">Observações:</span>
                              <span className="historico-value">{hist.observacoes}</span>
                            </div>
                          )}

                          {hist.medicamentos && (
                            <div className="historico-field">
                              <span className="historico-label">Medicamentos:</span>
                              <span className="historico-value">{hist.medicamentos}</span>
                            </div>
                          )}

                          {hist.proximoRetorno && (
                            <div className="historico-field">
                              <span className="historico-label">Próximo Retorno:</span>
                              <span className="historico-value">{formatarData(hist.proximoRetorno)}</span>
                            </div>
                          )}

                          {/* Fotos do atendimento */}
                          {hist.Anexos && hist.Anexos.length > 0 && (
                            <div className="historico-field">
                              <span className="historico-label">Fotos ({hist.Anexos.length}):</span>
                              <div className="historico-fotos-grid">
                                {hist.Anexos.map(anexo => (
                                  <img
                                    key={anexo.id}
                                    src={anexo.caminhoArquivo}
                                    alt={anexo.nomeArquivo}
                                    className="historico-foto-thumb"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFotoLightbox(anexo.caminhoArquivo)
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {hist.veterinario && (
                            <div className="historico-footer">
                              {hist.veterinario}
                            </div>
                          )}

                          <div className="historico-card-acoes">
                            <button
                              type="button"
                              className="historico-btn-pdf"
                              onClick={(e) => { e.stopPropagation(); handleAbrirPdfAtendimento(hist.id) }}
                              disabled={gerandoPdf === `atendimento-${hist.id}`}
                            >
                              {gerandoPdf === `atendimento-${hist.id}` ? '⏳ Gerando...' : 'PDF deste atendimento'}
                            </button>
                            {podeEditar && (
                              <button
                                type="button"
                                className="historico-add-foto"
                                onClick={(e) => { e.stopPropagation(); setHistoricoParaFoto(hist.id) }}
                              >
                                Adicionar fotos
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Indicador visual de clique */}
                      <div className="historico-toggle">
                        <span className="toggle-icon">{isExpanded ? '▲ Recolher' : '▼ Ver detalhes'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button type="button" className="btn-cancelar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {/* Lightbox de foto */}
      {fotoLightbox && (
        <div className="foto-lightbox-overlay" onClick={() => setFotoLightbox(null)}>
          <img src={fotoLightbox} alt="Foto ampliada" className="foto-lightbox-img" onClick={e => e.stopPropagation()} />
          <button className="foto-lightbox-voltar" onClick={() => setFotoLightbox(null)}>
            ← Voltar
          </button>
        </div>
      )}

      {/* Upload de fotos do atendimento recém-registrado */}
      {historicoParaFoto && (
        <PhotoUploadModal
          historicoId={historicoParaFoto}
          onClose={() => setHistoricoParaFoto(null)}
          onUploadSuccess={fetchHistorico}
        />
      )}
    </div>,
    document.body
  )
}
