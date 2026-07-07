import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import PagamentoModal from './PagamentoModal'
import { fotoUrl } from '../utils/fotoUrl'
import './MobileCobrancas.css'

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function MobileCobrancas() {
  const [faturamentos, setFaturamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('Pendente')
  const [pagamentoModalFat, setPagamentoModalFat] = useState(null)
  const [enviarCobrancaFat, setEnviarCobrancaFat] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [showMesSeletor, setShowMesSeletor] = useState(false)
  const [whiteLabel, setWhiteLabel] = useState(null)
  const [logoBase64, setLogoBase64] = useState(null)
  const [dadosCobranca, setDadosCobranca] = useState('')
  const hoje = new Date()
  // null = todos os meses; objeto = mês específico
  const [mesSelecionado, setMesSelecionado] = useState({ mes: hoje.getMonth(), ano: hoje.getFullYear() })

  useEffect(() => {
    fetchFaturamentos()
    fetchWhiteLabel()
  }, [])

  const fetchWhiteLabel = async () => {
    try {
      const res = await axios.get('/api/perfil')
      let wl = null
      if (res.data.sucesso && res.data.data?.whiteLabel) {
        wl = res.data.data.whiteLabel
      } else if (res.data.sucesso && res.data.data) {
        const vet = res.data.data
        wl = {
          nomeClinica: vet.nomeClinica || 'VetAssist',
          cnpj: vet.cnpj || '',
          telefone: vet.telefone || '',
          email: vet.email || '',
          endereco: vet.endereco || '',
          cidade: vet.cidade || '',
          estado: vet.estado || ''
        }
      }
      setWhiteLabel(wl)
      setDadosCobranca(res.data.sucesso ? (res.data.data?.dadosCobranca || '') : '')

      const resLogo = await axios.get('/api/perfil/logo-base64')
      if (resLogo.data.sucesso && resLogo.data.data) {
        setLogoBase64(resLogo.data.data)
      }
    } catch (err) {
      setWhiteLabel({ nomeClinica: 'VetAssist', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', estado: '' })
    }
  }

  const fetchFaturamentos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/faturamento')
      if (response.data.sucesso) {
        setFaturamentos(response.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar cobranças')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Montar o HTML estilizado (mesmo padrão visual do Histórico) e abrir em janela
  // com barra de navegação (Fechar/Imprimir) — evita PDF "cru" sem opção de sair.
  const montarHtmlCobranca = async (cobranca) => {
    const hist = cobranca.HistoricoConsulta || {}
    const cliente = cobranca.Cliente || hist.Cliente || {}
    const pet = hist.Pet || {}
    const nomeAnimal = pet.nome || cobranca.descricao || 'N/A'
    const wl = whiteLabel || { nomeClinica: 'VetAssist' }
    const logoSrc = logoBase64 || ''

    // Buscar fotos anexadas ao atendimento (mesma origem usada no Histórico)
    let fotos = []
    if (hist.id) {
      try {
        const resFotos = await axios.get(`/api/anexos/historico/${hist.id}`)
        if (resFotos.data.sucesso) fotos = resFotos.data.data || []
      } catch (err) {
        console.error('Erro ao carregar fotos da cobrança:', err)
      }
    }
    const fotosHTML = fotos.length > 0 ? `
      <div class="section-title">📸 Fotos (${fotos.length})</div>
      <div class="photos-grid">
        ${fotos.map(foto => `
          <div class="photo-item">
            <img src="${fotoUrl(foto.id)}" alt="${foto.nomeArquivo}" />
            <p>${foto.nomeArquivo}</p>
          </div>
        `).join('')}
      </div>
    ` : ''

    const dataConsulta = hist.data
      ? new Date(hist.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : ''
    const valorFormatado = parseFloat(cobranca.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const logoHTML = logoSrc
      ? `<img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.style.display='none'" />`
      : `<div class="header-logo-placeholder">🏥</div>`

    return `
      <html>
        <head>
          <title>Cobrança - ${pet.nome || 'Atendimento'}</title>
          <style>
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { font-family: 'Calibri', 'Arial', sans-serif; color: #333; background: white; height: 100%; }
            body { padding: 1.2cm 1.5cm; min-height: 100vh; display: flex; flex-direction: column; }

            .compact-header { display: flex; align-items: center; gap: 15px; padding: 8px 0 10px; margin-bottom: 14px; border-bottom: 2px solid #0d6b3a; }
            .header-left { flex-shrink: 0; width: 90px; display: flex; align-items: center; justify-content: center; }
            .header-logo { max-height: 70px; max-width: 90px; object-fit: contain; }
            .header-logo-placeholder { font-size: 36px; color: #0d6b3a; }
            .header-center { flex: 1; min-width: 0; }
            .header-center h1 { font-size: 17px; color: #0d6b3a; margin: 0 0 2px; letter-spacing: 0.5px; line-height: 1.2; }
            .header-center .subtitle { font-size: 9px; color: #888; letter-spacing: 1px; margin-bottom: 6px; }
            .header-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10px; color: #444; line-height: 1.4; }
            .header-meta strong { color: #0d6b3a; font-weight: 600; }

            .main-content { padding: 0; flex: 1; }
            .consultation-section { margin-bottom: 14px; }
            .section-title { background: #0d6b3a; color: white; padding: 6px 10px; margin: 10px 0 6px; font-weight: bold; font-size: 11px; letter-spacing: 0.3px; }
            .section-content { padding: 6px 10px 8px; font-size: 11px; line-height: 1.5; }
            .valor-destaque { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 2px solid #0d6b3a; }
            .valor-label { font-size: 13px; font-weight: bold; color: #0d6b3a; }
            .valor-num { font-size: 16px; font-weight: bold; color: #0d6b3a; }
            .dados-cobranca { margin-top: 10px; padding: 10px 12px; background: #f5f9f6; border: 1px solid #d3e6d9; border-radius: 6px; }
            .dados-cobranca-label { font-size: 10px; font-weight: bold; color: #0d6b3a; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px; }
            .dados-cobranca-texto { font-size: 11px; color: #333; white-space: pre-wrap; line-height: 1.5; }
            .photos-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
            .photo-item { flex: 0 0 calc(33% - 6px); text-align: center; }
            .photo-item img { width: 100%; max-height: 180px; object-fit: contain; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 2px; }
            .photo-item p { font-size: 9px; color: #888; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

            .letterhead-footer { border-top: 2px solid #0d6b3a; padding: 8px 0 0; margin-top: auto; font-size: 9px; text-align: center; color: #666; flex-shrink: 0; }
            .footer-info { display: flex; justify-content: center; gap: 18px; flex-wrap: wrap; }
            .footer-info strong { color: #0d6b3a; }
          </style>
        </head>
        <body>
          <div class="compact-header">
            <div class="header-left">${logoHTML}</div>
            <div class="header-center">
              <h1>${wl.nomeClinica}</h1>
              <p class="subtitle">COBRANÇA - ATENDIMENTO VETERINÁRIO</p>
              <div class="header-meta">
                <span><strong>Proprietário:</strong> ${cliente.nome || 'N/A'}</span>
                <span><strong>Animal:</strong> ${nomeAnimal}${pet.especie ? ` (${pet.especie}${pet.raca ? ' • ' + pet.raca : ''})` : ''}</span>
              </div>
              <div class="header-meta">
                ${dataConsulta ? `<span><strong>Data:</strong> ${dataConsulta}</span>` : ''}
                <span><strong>Tipo:</strong> ${hist.tipoAtendimento || cobranca.descricao || 'Atendimento'}</span>
              </div>
            </div>
          </div>

          <div class="main-content">
            <div class="consultation-section">
              ${hist.diagnostico ? `<div class="section-title">Diagnóstico</div><div class="section-content">${hist.diagnostico}</div>` : ''}
              ${hist.procedimentos ? `<div class="section-title">Procedimentos Realizados</div><div class="section-content">${hist.procedimentos}</div>` : ''}
              ${hist.medicamentos ? `<div class="section-title">Medicamentos Prescritos</div><div class="section-content">${hist.medicamentos}</div>` : ''}
              ${hist.observacoes ? `<div class="section-title">Observações</div><div class="section-content">${hist.observacoes}</div>` : ''}

              ${fotosHTML}

              <div class="valor-destaque">
                <span class="valor-label">VALOR:</span>
                <span class="valor-num">R$ ${valorFormatado}</span>
              </div>

              ${dadosCobranca ? `
                <div class="dados-cobranca">
                  <div class="dados-cobranca-label">Dados para Pagamento</div>
                  <div class="dados-cobranca-texto">${dadosCobranca}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="letterhead-footer">
            <div class="footer-info">
              ${wl.cnpj ? `<div><strong>CNPJ:</strong> ${wl.cnpj}</div>` : ''}
              ${wl.telefone ? `<div><strong>Telefone:</strong> ${wl.telefone}</div>` : ''}
              ${wl.email ? `<div><strong>Email:</strong> ${wl.email}</div>` : ''}
            </div>
            ${wl.endereco ? `<p style="margin-top: 4px;">${wl.endereco}${wl.cidade ? ', ' + wl.cidade : ''}${wl.estado ? ' - ' + wl.estado : ''}</p>` : ''}
            <p style="margin-top: 4px; font-size: 9px;">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `
  }

  // Abre janela com o mesmo padrão de barra Fechar/Imprimir usado no Histórico
  const abrirJanelaCobranca = (htmlContent, printWindow) => {
    if (!printWindow) {
      alert('⚠️ Permita pop-ups para visualizar a cobrança.')
      return
    }

    const barraNavegacao = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        background: #0d6b3a; color: white;
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 16px; gap: 12px;
        font-family: Arial, sans-serif; font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      " class="no-print">
        <button onclick="window.close()" style="
          background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
          color: white; padding: 6px 14px; border-radius: 6px;
          font-size: 14px; cursor: pointer; font-weight: 600;
        ">← Fechar</button>
        <span style="font-weight: 600; font-size: 13px; opacity: 0.9;">Cobrança</span>
        <button onclick="window.print()" style="
          background: white; border: none; color: #0d6b3a;
          padding: 6px 14px; border-radius: 6px;
          font-size: 14px; cursor: pointer; font-weight: 700;
        ">🖨️ Imprimir</button>
      </div>
      <div style="height: 48px;" class="no-print"></div>
    `

    const estiloBarra = `<style>@media print { .no-print { display: none !important; } }</style>`
    const htmlFinal = htmlContent
      .replace('</head>', `${estiloBarra}</head>`)
      .replace('</body>', `${barraNavegacao}</body>`)

    printWindow.document.open()
    printWindow.document.write(htmlFinal)
    printWindow.document.close()
  }

  // Visualizar cobrança no padrão visual do Histórico, com barra Fechar/Imprimir
  const abrirPDFHistorico = async (cobranca) => {
    // Abrir a janela ANTES do await para preservar o gesto do usuário (Safari/Chrome mobile bloqueiam popups assíncronos)
    const novaJanela = window.open('', '', 'width=800,height=600')
    if (novaJanela) {
      novaJanela.document.write('<html><body style="font-family:Arial;text-align:center;padding:40px;color:#555"><p>⏳ Gerando cobrança...</p></body></html>')
    }
    try {
      const html = await montarHtmlCobranca(cobranca)
      if (novaJanela) {
        abrirJanelaCobranca(html, novaJanela)
      } else {
        alert('⚠️ Permita pop-ups para visualizar a cobrança.')
      }
    } catch (err) {
      setError('Erro ao abrir a cobrança')
      console.error(err)
    }
  }

  // Gera o PDF de verdade no servidor (pdfkit) a partir do histórico vinculado.
  // Usa o endpoint de COBRANÇA: layout timbrado igual ao do histórico, mas sem fotos.
  const gerarPdfBlob = async (cobranca) => {
    const historicoId = cobranca.historicoConsultaId || cobranca.HistoricoConsulta?.id
    if (!historicoId) throw new Error('Esta cobrança não possui histórico vinculado')
    const res = await axios.get(`/api/historico/cobranca-pdf/${historicoId}`, { responseType: 'blob' })
    const petNome = cobranca.HistoricoConsulta?.Pet?.nome || 'cobranca'
    return new File([res.data], `cobranca-${petNome}.pdf`, { type: 'application/pdf' })
  }

  const baixarArquivo = (file) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  // Construir mensagem de cobrança formatada
  const construirMensagemCobranca = (cobranca) => {
    const clienteNome = cobranca.Cliente?.nome || cobranca.HistoricoConsulta?.Cliente?.nome || 'Cliente'
    const petNome = cobranca.HistoricoConsulta?.Pet?.nome || 'Pet'
    const valor = parseFloat(cobranca.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const tipo = cobranca.HistoricoConsulta?.tipoAtendimento || cobranca.descricao || 'Atendimento'
    const dataConsulta = cobranca.HistoricoConsulta?.data
      ? new Date(cobranca.HistoricoConsulta.data).toLocaleDateString('pt-BR')
      : ''

    return `Olá ${clienteNome}! 🐾

Segue cobrança referente ao atendimento veterinário:

🐾 Pet: ${petNome}
📋 Serviço: ${tipo}${dataConsulta ? `\n📅 Data: ${dataConsulta}` : ''}
💰 Valor: R$ ${valor}

Por favor, entre em contato para confirmar o pagamento.

Obrigado!`
  }

  // Enviar via WhatsApp — PDF de verdade anexado (Web Share API), com fallback para texto
  const enviarWhatsApp = async (cobranca) => {
    const telefone = (cobranca.Cliente?.telefone || cobranca.HistoricoConsulta?.Cliente?.telefone || '').replace(/\D/g, '')
    if (!telefone) {
      alert('⚠️ Cliente não possui telefone cadastrado')
      return
    }
    const numeroLimpo = telefone.startsWith('55') ? telefone : `55${telefone}`

    setEnviando(true)
    setError('')
    try {
      const file = await gerarPdfBlob(cobranca)

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cobrança - Atendimento Veterinário',
          text: `Cobrança para ${cobranca.Cliente?.nome || 'cliente'}`
        })
        setEnviarCobrancaFat(null)
        return
      }

      // Sem suporte a compartilhar arquivo (ex: desktop): baixa o PDF e abre o WhatsApp com o texto
      baixarArquivo(file)
      const mensagem = encodeURIComponent(construirMensagemCobranca(cobranca))
      window.open(`https://wa.me/${numeroLimpo}?text=${mensagem}`, '_blank')
      setEnviarCobrancaFat(null)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError('Erro ao gerar o PDF da cobrança. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  // Enviar via Email — PDF de verdade anexado (Web Share API), com fallback para texto
  const enviarEmail = async (cobranca) => {
    const email = cobranca.Cliente?.email || cobranca.HistoricoConsulta?.Cliente?.email
    if (!email) {
      alert('⚠️ Cliente não possui email cadastrado')
      return
    }

    setEnviando(true)
    setError('')
    try {
      const file = await gerarPdfBlob(cobranca)

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cobrança - Atendimento Veterinário',
          text: `Cobrança para ${cobranca.Cliente?.nome || 'cliente'}`
        })
        setEnviarCobrancaFat(null)
        return
      }

      // Sem suporte a compartilhar arquivo: baixa o PDF e abre o email nativo
      baixarArquivo(file)
      const assunto = encodeURIComponent('Cobrança - Atendimento Veterinário')
      const corpo = encodeURIComponent(`Segue em anexo a cobrança (${file.name} baixado agora).\n\n${construirMensagemCobranca(cobranca)}`)
      window.location.href = `mailto:${email}?subject=${assunto}&body=${corpo}`
      setEnviarCobrancaFat(null)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError('Erro ao gerar o PDF da cobrança. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  // Extrair data do faturamento de forma segura (usa dataEmissao ou createdAt)
  const getDataFaturamento = (f) => {
    const raw = f.dataEmissao || f.createdAt
    if (!raw) return new Date()
    const str = typeof raw === 'string' ? raw : new Date(raw).toISOString()
    const [y, m, d] = str.substring(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // Gerar lista de meses disponíveis nos dados (com faturamentos)
  const mesesDisponiveis = useMemo(() => {
    const mesesSet = new Set()
    faturamentos.forEach(f => {
      const d = getDataFaturamento(f)
      mesesSet.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    // Sempre incluir o mês atual
    mesesSet.add(`${hoje.getFullYear()}-${hoje.getMonth()}`)

    return Array.from(mesesSet)
      .map(key => {
        const [ano, mes] = key.split('-').map(Number)
        return { mes, ano, label: `${MESES_NOMES[mes]} ${ano}` }
      })
      .sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes)
  }, [faturamentos])

  // Faturamentos do período selecionado (null = todos)
  const faturamentosDoMes = useMemo(() => {
    if (!mesSelecionado) return faturamentos
    return faturamentos.filter(f => {
      const d = getDataFaturamento(f)
      return d.getMonth() === mesSelecionado.mes && d.getFullYear() === mesSelecionado.ano
    })
  }, [faturamentos, mesSelecionado])

  // Lista filtrada por status E pelo mês selecionado
  const faturamentosFiltrados = useMemo(() => faturamentosDoMes.filter(f => {
    if (filtro === 'Todos') return true
    return f.status === filtro
  }), [faturamentosDoMes, filtro])

  // À Receber = pendentes + saldo remanescente de parcialmente pagos
  const totalPendente = useMemo(() =>
    faturamentosDoMes.reduce((sum, f) => {
      if (f.status === 'Pendente') {
        return sum + parseFloat(f.valor || 0)
      }
      if (f.status === 'Parcialmente Pago') {
        const saldo = parseFloat(f.valor || 0) - parseFloat(f.valorRecebido || 0)
        return sum + saldo
      }
      return sum
    }, 0)
  , [faturamentosDoMes])

  // Total faturado no período
  const totalFaturamentoMes = useMemo(() =>
    faturamentosDoMes.reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)
  , [faturamentosDoMes])

  // Total recebido no período (Pago ou Parcialmente Pago)
  const totalRecebidoMes = useMemo(() =>
    faturamentosDoMes
      .filter(f => f.status === 'Pago' || f.status === 'Parcialmente Pago')
      .reduce((sum, f) => sum + parseFloat(f.valorRecebido || f.valor || 0), 0)
  , [faturamentosDoMes])

  if (loading) {
    return <div className="mobile-cobrancas-loading">Carregando...</div>
  }

  return (
    <div className="mobile-cobrancas-container">
      {error && (
        <div className="mobile-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Seletor de mês - overlay */}
      {showMesSeletor && (
        <div className="mes-seletor-overlay" onClick={() => setShowMesSeletor(false)}>
          <div className="mes-seletor-menu" onClick={e => e.stopPropagation()}>
            <div className="mes-seletor-titulo">Selecionar Mês</div>
            <button
              className={`mes-seletor-opcao ${!mesSelecionado ? 'ativo' : ''}`}
              onClick={() => { setMesSelecionado(null); setShowMesSeletor(false) }}
            >
              📋 Todos os meses
            </button>
            {mesesDisponiveis.map(({ mes, ano, label }) => (
              <button
                key={`${ano}-${mes}`}
                className={`mes-seletor-opcao ${mesSelecionado && mesSelecionado.mes === mes && mesSelecionado.ano === ano ? 'ativo' : ''}`}
                onClick={() => { setMesSelecionado({ mes, ano }); setShowMesSeletor(false) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="mobile-cobrancas-resumo">
        {/* Card clicável — abre seletor de mês */}
        <div
          className="resumo-card resumo-faturamento-mes clicavel"
          onClick={() => setShowMesSeletor(true)}
        >
          <span className="resumo-label">Faturamento ▾</span>
          <span className="resumo-mes-nome">{mesSelecionado ? MESES_NOMES[mesSelecionado.mes] : 'Todos'}</span>
          <span className="resumo-valor">
            R$ {totalFaturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="resumo-card resumo-faturado-hoje">
          <span className="resumo-label">Recebido</span>
          <span className="resumo-mes-nome">{mesSelecionado ? MESES_NOMES[mesSelecionado.mes] : 'Todos'}</span>
          <span className="resumo-valor">
            R$ {totalRecebidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="resumo-card resumo-a-receber">
          <span className="resumo-label">À Receber</span>
          <span className="resumo-mes-nome">{mesSelecionado ? MESES_NOMES[mesSelecionado.mes] : 'Todos'}</span>
          <span className="resumo-valor">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="mobile-cobrancas-filtros">
        {['Todos', 'Pendente', 'Pago', 'Parcialmente Pago'].map(status => (
          <button
            key={status}
            className={`filtro-btn ${filtro === status ? 'ativo' : ''}`}
            onClick={() => setFiltro(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Lista */}
      {faturamentosFiltrados.length === 0 ? (
        <div className="mobile-cobrancas-empty">
          Nenhuma cobrança {filtro === 'Todos' ? '' : `${filtro.toLowerCase()}`}
        </div>
      ) : (
        <div className="mobile-cobrancas-list">
          {faturamentosFiltrados.map(cobranca => {
            // Formatar data do agendamento/consulta
            const dataRaw = cobranca.HistoricoConsulta?.data || cobranca.dataEmissao || cobranca.createdAt
            const dataFormatada = (() => {
              if (!dataRaw) return null
              const str = typeof dataRaw === 'string' ? dataRaw : new Date(dataRaw).toISOString()
              const [y, m, d] = str.substring(0, 10).split('-').map(Number)
              return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            })()

            // Data do pagamento (se já pago)
            const dataPagRaw = cobranca.dataPagamento || cobranca.dataUltimoPagamento
            const dataPagFormatada = (() => {
              if (!dataPagRaw) return null
              const str = typeof dataPagRaw === 'string' ? dataPagRaw : new Date(dataPagRaw).toISOString()
              const [y, m, d] = str.substring(0, 10).split('-').map(Number)
              return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            })()

            const valorTotal = parseFloat(cobranca.valor)
            const valorRecebido = parseFloat(cobranca.valorRecebido || 0)
            const valorFaltante = valorTotal - valorRecebido

            return (
              <div key={cobranca.id} className="mobile-cobranca-item">
                <div className="cobranca-header">
                  <div className="cobranca-cliente">
                    👤 {cobranca.Cliente?.nome || 'Cliente'}
                  </div>
                  <div className={`cobranca-status ${(cobranca.status || '').toLowerCase().replace(' ', '-')}`}>
                    {cobranca.status}
                  </div>
                </div>

                <div className="cobranca-info">
                  <div className="cobranca-pet">
                    🐾 {cobranca.HistoricoConsulta?.Pet?.nome || cobranca.descricao || 'Pet'}
                  </div>
                  <div className="cobranca-valor">
                    R$ {parseFloat(cobranca.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Resumo para Parcialmente Pago */}
                {cobranca.status === 'Parcialmente Pago' && (
                  <div className="cobranca-resumo-parcial">
                    <span>Total: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Pago: R$ {valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="falta">Falta: R$ {valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {/* Datas */}
                <div className="cobranca-datas">
                  {dataFormatada && (
                    <span className="cobranca-data-item">📅 Consulta: {dataFormatada}</span>
                  )}
                  {dataPagFormatada && (
                    <span className="cobranca-data-item cobranca-data-pago">✅ Pago em: {dataPagFormatada}</span>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="cobranca-acoes">
                  <button
                    className="cobranca-btn-detalhes"
                    onClick={() => abrirPDFHistorico(cobranca)}
                    title="Visualizar PDF do histórico"
                  >
                    📋 PDF
                  </button>

                  {(cobranca.status === 'Pendente' || cobranca.status === 'Parcialmente Pago') && (
                    <>
                      <button
                        className="cobranca-btn-enviar"
                        onClick={() => setEnviarCobrancaFat(cobranca)}
                        title="Enviar cobrança"
                      >
                        📤 Enviar
                      </button>
                      <button
                        className="cobranca-btn-pagar"
                        onClick={() => setPagamentoModalFat(cobranca)}
                      >
                        💰 {cobranca.status === 'Pendente' ? 'Registrar' : 'Adicionar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pagamentoModalFat && (
        <PagamentoModal
          faturamento={pagamentoModalFat}
          onClose={() => setPagamentoModalFat(null)}
          onSuccess={() => {
            setPagamentoModalFat(null)
            fetchFaturamentos()
          }}
        />
      )}

      {/* Modal de escolha de envio */}
      {enviarCobrancaFat && createPortal(
        <div className="enviar-overlay" onClick={() => setEnviarCobrancaFat(null)}>
          <div className="enviar-modal" onClick={e => e.stopPropagation()}>
            <div className="enviar-header">
              <h3>📤 Enviar Cobrança</h3>
              <p>Como você quer enviar a cobrança?</p>
            </div>

            <div className="enviar-info">
              <div className="enviar-info-row">
                <span className="enviar-info-label">Cliente:</span>
                <span>{enviarCobrancaFat.Cliente?.nome || enviarCobrancaFat.HistoricoConsulta?.Cliente?.nome || '—'}</span>
              </div>
              <div className="enviar-info-row">
                <span className="enviar-info-label">Valor:</span>
                <span className="enviar-info-valor">R$ {parseFloat(enviarCobrancaFat.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {error && <div className="error-message" style={{ margin: '0 0 10px' }}>{error}</div>}

            <div className="enviar-opcoes">
              <button
                className="enviar-opcao-whatsapp"
                onClick={() => enviarWhatsApp(enviarCobrancaFat)}
                disabled={enviando}
              >
                <span className="enviar-opcao-icon">💬</span>
                <div className="enviar-opcao-texto">
                  <strong>{enviando ? 'Gerando PDF...' : 'WhatsApp'}</strong>
                  <small>{(enviarCobrancaFat.Cliente?.telefone || enviarCobrancaFat.HistoricoConsulta?.Cliente?.telefone) || 'Sem telefone'}</small>
                </div>
              </button>

              <button
                className="enviar-opcao-email"
                onClick={() => enviarEmail(enviarCobrancaFat)}
                disabled={enviando}
              >
                <span className="enviar-opcao-icon">📧</span>
                <div className="enviar-opcao-texto">
                  <strong>{enviando ? 'Gerando PDF...' : 'Email'}</strong>
                  <small>{(enviarCobrancaFat.Cliente?.email || enviarCobrancaFat.HistoricoConsulta?.Cliente?.email) || 'Sem email'}</small>
                </div>
              </button>
            </div>

            <button
              className="enviar-cancelar"
              onClick={() => setEnviarCobrancaFat(null)}
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
