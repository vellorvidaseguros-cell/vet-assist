import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './ExportarDadosModal.css'

// Exporta CSV compatível com Excel pt-BR (BOM UTF-8 + separador ";")
const gerarCSV = (linhas) => {
  const escapar = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  return '﻿' + linhas.map(linha => linha.map(escapar).join(';')).join('\r\n')
}

const baixarCSV = (conteudo, nomeArquivo) => {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

const formatarDataBR = (data) => {
  if (!data) return ''
  const d = new Date(data)
  return isNaN(d) ? '' : d.toLocaleDateString('pt-BR')
}

const formatarValor = (v) => {
  const n = parseFloat(v || 0)
  // Número com vírgula decimal (Excel pt-BR reconhece como número)
  return n.toFixed(2).replace('.', ',')
}

export default function ExportarDadosModal({ isOpen, onClose }) {
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const paraInput = (d) => d.toISOString().split('T')[0]

  const [dataInicio, setDataInicio] = useState(paraInput(primeiroDiaMes))
  const [dataFim, setDataFim] = useState(paraInput(hoje))
  const [tipo, setTipo] = useState('cobrancas')
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState('')

  const dentroDoPeriodo = (data) => {
    if (!data) return false
    const d = new Date(data)
    const inicio = new Date(`${dataInicio}T00:00:00`)
    const fim = new Date(`${dataFim}T23:59:59`)
    return d >= inicio && d <= fim
  }

  const exportarCobrancas = async () => {
    const res = await axios.get('/api/faturamento')
    if (!res.data.sucesso) throw new Error(res.data.erro)
    const filtradas = (res.data.data || []).filter(f => dentroDoPeriodo(f.dataEmissao))

    const linhas = [[
      'Data Emissão', 'Cliente', 'Animal', 'Descrição', 'Valor (R$)',
      'Valor Recebido (R$)', 'Status', 'Data Pagamento'
    ]]
    filtradas.forEach(f => {
      linhas.push([
        formatarDataBR(f.dataEmissao),
        f.Cliente?.nome || '',
        f.HistoricoConsulta?.Pet?.nome || '',
        f.descricao || f.HistoricoConsulta?.tipoAtendimento || '',
        formatarValor(f.valor),
        formatarValor(f.valorRecebido),
        f.status || '',
        formatarDataBR(f.dataPagamento)
      ])
    })
    const total = filtradas.reduce((s, f) => s + parseFloat(f.valor || 0), 0)
    linhas.push([])
    linhas.push(['TOTAL', '', '', '', formatarValor(total), '', '', ''])
    return { linhas, qtd: filtradas.length, nome: 'cobrancas' }
  }

  const exportarAtendimentos = async () => {
    const res = await axios.get('/api/historico')
    if (!res.data.sucesso) throw new Error(res.data.erro)
    const filtrados = (res.data.data || []).filter(h => dentroDoPeriodo(h.data))

    const linhas = [[
      'Data', 'Cliente', 'Animal', 'Espécie', 'Tipo de Atendimento',
      'Diagnóstico', 'Procedimentos', 'Valor (R$)'
    ]]
    filtrados.forEach(h => {
      linhas.push([
        formatarDataBR(h.data),
        h.Cliente?.nome || '',
        h.Pet?.nome || '',
        h.Pet?.especie || '',
        h.tipoAtendimento || '',
        h.diagnostico || '',
        h.procedimentos || '',
        formatarValor(h.valor)
      ])
    })
    return { linhas, qtd: filtrados.length, nome: 'atendimentos' }
  }

  const exportarFaturamento = async () => {
    const res = await axios.get('/api/faturamento')
    if (!res.data.sucesso) throw new Error(res.data.erro)
    const filtradas = (res.data.data || []).filter(f => dentroDoPeriodo(f.dataEmissao))

    const pagas = filtradas.filter(f => f.status === 'Pago')
    const pendentes = filtradas.filter(f => f.status !== 'Pago')
    const soma = (arr) => arr.reduce((s, f) => s + parseFloat(f.valor || 0), 0)
    const somaRecebido = filtradas.reduce((s, f) => s + parseFloat(f.valorRecebido || 0), 0)

    const linhas = [[
      'Data Emissão', 'Cliente', 'Animal', 'Descrição', 'Valor (R$)',
      'Valor Recebido (R$)', 'Status'
    ]]
    filtradas.forEach(f => {
      linhas.push([
        formatarDataBR(f.dataEmissao),
        f.Cliente?.nome || '',
        f.HistoricoConsulta?.Pet?.nome || '',
        f.descricao || f.HistoricoConsulta?.tipoAtendimento || '',
        formatarValor(f.valor),
        formatarValor(f.valorRecebido),
        f.status || ''
      ])
    })
    linhas.push([])
    linhas.push(['RESUMO DO PERÍODO'])
    linhas.push(['Total Faturado', formatarValor(soma(filtradas))])
    linhas.push(['Total Recebido', formatarValor(somaRecebido)])
    linhas.push(['Total Pago (cobranças quitadas)', formatarValor(soma(pagas))])
    linhas.push(['Total Pendente', formatarValor(soma(pendentes))])
    linhas.push(['Quantidade de Cobranças', String(filtradas.length)])
    return { linhas, qtd: filtradas.length, nome: 'faturamento' }
  }

  const handleExportar = async () => {
    setError('')
    setSucesso('')

    if (!dataInicio || !dataFim) {
      setError('Selecione o período')
      return
    }
    if (new Date(dataInicio) > new Date(dataFim)) {
      setError('A data inicial não pode ser maior que a final')
      return
    }

    try {
      setExportando(true)
      let resultado
      if (tipo === 'cobrancas') resultado = await exportarCobrancas()
      else if (tipo === 'atendimentos') resultado = await exportarAtendimentos()
      else resultado = await exportarFaturamento()

      if (resultado.qtd === 0) {
        setError('Nenhum registro encontrado no período selecionado')
        return
      }

      const nomeArquivo = `${resultado.nome}_${dataInicio}_a_${dataFim}.csv`
      baixarCSV(gerarCSV(resultado.linhas), nomeArquivo)
      setSucesso(`✅ ${resultado.qtd} registro(s) exportado(s) com sucesso!`)
    } catch (err) {
      setError(err.response?.data?.erro || err.message || 'Erro ao exportar dados')
    } finally {
      setExportando(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="ed-modal-overlay">
      <div className="ed-modal">
        <div className="ed-modal-header">
          <h2>📊 Exportar Dados</h2>
          <button className="ed-btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="ed-modal-body">
          {error && <div className="ed-error">{error}</div>}
          {sucesso && <div className="ed-success">{sucesso}</div>}

          <p className="ed-description">
            Selecione o período e o tipo de dados. O arquivo é gerado em planilha (CSV) compatível com Excel e Google Sheets.
          </p>

          {/* Período */}
          <div className="ed-section">
            <label className="ed-label">Período:</label>
            <div className="ed-datas">
              <div className="ed-data-group">
                <span>De</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="ed-input"
                />
              </div>
              <div className="ed-data-group">
                <span>Até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="ed-input"
                />
              </div>
            </div>
          </div>

          {/* Tipo */}
          <div className="ed-section">
            <label className="ed-label">O que deseja exportar?</label>
            <div className="ed-opcoes">
              <label className={`ed-opcao ${tipo === 'cobrancas' ? 'ativa' : ''}`}>
                <input
                  type="radio"
                  name="tipoExport"
                  value="cobrancas"
                  checked={tipo === 'cobrancas'}
                  onChange={() => setTipo('cobrancas')}
                />
                <div>
                  <strong>💰 Cobranças</strong>
                  <span>Todas as cobranças do período com status e pagamentos</span>
                </div>
              </label>

              <label className={`ed-opcao ${tipo === 'atendimentos' ? 'ativa' : ''}`}>
                <input
                  type="radio"
                  name="tipoExport"
                  value="atendimentos"
                  checked={tipo === 'atendimentos'}
                  onChange={() => setTipo('atendimentos')}
                />
                <div>
                  <strong>📋 Atendimentos</strong>
                  <span>Consultas realizadas no período com diagnóstico e procedimentos</span>
                </div>
              </label>

              <label className={`ed-opcao ${tipo === 'faturamento' ? 'ativa' : ''}`}>
                <input
                  type="radio"
                  name="tipoExport"
                  value="faturamento"
                  checked={tipo === 'faturamento'}
                  onChange={() => setTipo('faturamento')}
                />
                <div>
                  <strong>📈 Faturamento Completo</strong>
                  <span>Todos os atendimentos faturados + resumo (total, recebido, pendente)</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="ed-modal-footer">
          <button type="button" onClick={onClose} className="ed-btn-cancel">
            Fechar
          </button>
          <button
            type="button"
            onClick={handleExportar}
            disabled={exportando}
            className="ed-btn-exportar"
          >
            {exportando ? 'Exportando...' : '⬇️ Exportar Planilha'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
