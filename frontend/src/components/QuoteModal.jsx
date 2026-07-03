import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './QuoteModal.css'

export default function QuoteModal({ cliente, pet, onClose }) {
  const [procedimentos, setProcedimentos] = useState([
    { id: 1, descricao: '', valor: '', filtro: '' }
  ])
  const [procedimentosDisponiveis, setProcedimentosDisponiveis] = useState([])
  const [descricaoProcedimento, setDescricaoProcedimento] = useState('')
  const [proximoId, setProximoId] = useState(2)
  const [selecaoAberta, setSelecaoAberta] = useState(null)
  const [mostrarCompartilhamento, setMostrarCompartilhamento] = useState(false)
  const [vetPerfil, setVetPerfil] = useState(null)
  const [dataValidade, setDataValidade] = useState('')

  useEffect(() => {
    buscarPerfilVet()
  }, [])

  const buscarPerfilVet = async () => {
    try {
      const res = await axios.get('/api/perfil')
      if (res.data.sucesso) {
        const perfil = res.data.data
        setVetPerfil(perfil)
        // Carregar tabela de preços do perfil como procedimentos disponíveis
        if (perfil.tabelaPrecos && Object.keys(perfil.tabelaPrecos).length > 0) {
          const lista = Object.entries(perfil.tabelaPrecos)
            .filter(([, valor]) => valor > 0)
            .map(([nome, valor], idx) => ({ id: idx + 1, nome, valor }))
          setProcedimentosDisponiveis(lista)
        }
      }
    } catch (err) {
      console.log('Erro ao buscar perfil do veterinário')
    }
  }

  const adicionarProcedimento = () => {
    setProcedimentos(prev => [
      ...prev,
      { id: proximoId, descricao: '', valor: '', filtro: '' }
    ])
    setProximoId(prev => prev + 1)
  }

  const removerProcedimento = (id) => {
    setProcedimentos(prev => prev.filter(p => p.id !== id))
  }

  const atualizarProcedimento = (id, campos) => {
    setProcedimentos(prev =>
      prev.map(p => p.id === id ? { ...p, ...campos } : p)
    )
  }

  const calcularTotal = () => {
    return procedimentos.reduce((total, p) => {
      const valor = parseFloat(String(p.valor).replace(',', '.')) || 0
      return total + valor
    }, 0)
  }

  const formatarDecimal = (num) => {
    return parseFloat(num).toFixed(2).replace('.', ',')
  }

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const gerarPDF = async () => {
    // IMPORTANTE: abrir janela ANTES de qualquer await para preservar
    // o gesto do usuário — obrigatório no Safari/Chrome mobile
    const novaJanela = window.open('', '_blank')
    if (novaJanela) {
      novaJanela.document.write('<html><body style="font-family:Arial;text-align:center;padding:40px;color:#555"><p>⏳ Gerando orçamento...</p></body></html>')
    }

    const data = new Date()
    const dataFormatada = data.toLocaleDateString('pt-BR')
    const numeroQuote = `ORC-${data.getTime()}`

    const vet = vetPerfil
    const nomeClinica = vet?.nomeClinica || vet?.whiteLabel?.nomeClinica || 'Clínica Veterinária'
    const cnpj = vet?.cnpj || vet?.whiteLabel?.cnpj || ''
    const telefoneVet = vet?.telefone || vet?.whiteLabel?.telefone || ''
    const emailVet = vet?.email || ''
    const enderecoVet = [vet?.endereco, vet?.cidade, vet?.estado].filter(Boolean).join(', ')
    const crmv = vet?.crmv ? `CRMV: ${vet.crmv}` : ''

    // Buscar logo em base64 para incluir no PDF
    let logoBase64 = ''
    try {
      const resLogo = await axios.get('/api/perfil/logo-base64')
      if (resLogo.data?.sucesso && resLogo.data?.data) {
        logoBase64 = resLogo.data.data
      }
    } catch {}

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; background: white; font-size: 12px; }
          .page {
            width: 210mm; height: 297mm; margin: 0 auto;
            padding: 15mm 20mm 10mm 20mm;
            background: white;
            display: flex; flex-direction: column;
            overflow: hidden;
          }
          .content { flex: 1; min-height: 0; overflow: hidden; }
          .header {
            display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 3px solid #1a5f2e; margin-bottom: 14px; padding-bottom: 10px;
          }
          .header-left {}
          .clinic-name { font-size: 18px; font-weight: bold; color: #1a5f2e; }
          .clinic-sub { font-size: 10px; color: #666; margin-top: 2px; }
          .header-right { text-align: right; }
          .quote-title { font-size: 22px; font-weight: bold; color: #000; }
          .quote-number { font-size: 10px; color: #888; margin-top: 2px; }
          .quote-date { font-size: 10px; color: #666; margin-top: 2px; }

          /* Layout 2 colunas para cliente + animal */
          .info-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
            margin-bottom: 14px; background: #f9f9f9;
            border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px;
          }
          .info-col-title {
            font-size: 11px; font-weight: bold; color: #1a5f2e;
            text-transform: uppercase; letter-spacing: 0.5px;
            border-bottom: 1px solid #1a5f2e; padding-bottom: 4px; margin-bottom: 6px;
          }
          .info-line { font-size: 11px; margin-bottom: 3px; color: #444; }
          .info-line strong { color: #222; }

          .section-title {
            font-size: 12px; font-weight: bold; color: #1a5f2e;
            margin-bottom: 8px; padding-bottom: 4px;
            border-bottom: 2px solid #1a5f2e; text-transform: uppercase;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          thead th {
            padding: 7px 10px; text-align: left; font-size: 11px;
            background: #f0f0f0; border-bottom: 2px solid #1a5f2e;
          }
          tbody td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
          tbody tr:last-child td { border-bottom: none; }
          .td-valor { text-align: right; white-space: nowrap; }
          .total-row {
            display: flex; justify-content: flex-end; align-items: center;
            gap: 20px; margin-top: 10px; padding-top: 8px;
            border-top: 2px solid #1a5f2e;
          }
          .total-label { font-size: 14px; font-weight: bold; color: #1a5f2e; }
          .total-valor { font-size: 16px; font-weight: bold; color: #0d6b3a; }
          .validade-row {
            display: flex; justify-content: flex-end;
            margin-top: 8px; padding-top: 6px;
            font-size: 12px; color: #c0392b;
          }
          .validade-row strong { font-weight: bold; }
          .obs-section {
            margin-top: 12px; padding: 8px 10px;
            background: #f9f9f9; border-left: 4px solid #1a5f2e; border-radius: 2px;
          }
          .obs-label { font-size: 10px; font-weight: bold; color: #1a5f2e; margin-bottom: 3px; text-transform: uppercase; }
          .obs-text { font-size: 11px; color: #555; line-height: 1.5; }
          .footer {
            flex-shrink: 0;
            padding-top: 10px;
            border-top: 2px solid #1a5f2e;
            text-align: center;
            margin-top: auto;
          }
          .footer-clinic { font-size: 12px; font-weight: bold; color: #1a5f2e; margin-bottom: 3px; }
          .footer-details {
            display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;
            font-size: 10px; color: #555; margin-bottom: 3px;
          }
          .footer-gen { font-size: 9px; color: #aaa; }
          @page { margin: 0; size: A4; }
          @media print {
            body { margin: 0; }
            .page { margin: 0; width: 210mm; height: 297mm; overflow: hidden; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="content">
            <div class="header">
              <div class="header-left">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="max-height:60px;max-width:160px;object-fit:contain;display:block;margin-bottom:6px;" />` : ''}
                <div class="clinic-name">${nomeClinica}</div>
                ${crmv ? `<div class="clinic-sub">${crmv}</div>` : ''}
              </div>
              <div class="header-right">
                <div class="quote-title">ORÇAMENTO</div>
                <div class="quote-number">#${numeroQuote}</div>
                <div class="quote-date">Emissão: ${dataFormatada}</div>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-col-title">Cliente</div>
                <div class="info-line"><strong>${cliente?.nome || 'N/A'}</strong></div>
                ${cliente?.telefone ? `<div class="info-line">Tel: ${cliente.telefone}</div>` : ''}
                ${cliente?.email ? `<div class="info-line">${cliente.email}</div>` : ''}
                ${cliente?.endereco ? `<div class="info-line">${cliente.endereco}${cliente.cidade ? ', ' + cliente.cidade : ''}${cliente.estado ? '/' + cliente.estado : ''}</div>` : ''}
              </div>
              <div>
                <div class="info-col-title">Animal</div>
                <div class="info-line"><strong>${pet?.nome || 'N/A'}</strong></div>
                ${pet?.especie ? `<div class="info-line">Espécie: ${pet.especie}</div>` : ''}
                ${pet?.raca ? `<div class="info-line">Raça: ${pet.raca}</div>` : ''}
                ${pet?.sexo ? `<div class="info-line">Sexo: ${pet.sexo === 'M' ? 'Macho' : 'Fêmea'}</div>` : ''}
              </div>
            </div>

            <div class="section-title">Procedimentos</div>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th style="text-align:right;width:120px;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${procedimentos.map(p => `
                  <tr>
                    <td>${p.descricao || '-'}</td>
                    <td class="td-valor">${p.valor ? formatarValor(parseFloat(String(p.valor).replace(',', '.'))) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${descricaoProcedimento ? `
              <div class="obs-section">
                <div class="obs-label">Descrição do Procedimento</div>
                <div class="obs-text">${descricaoProcedimento}</div>
              </div>
            ` : ''}

            <div class="total-row">
              <span class="total-label">VALOR TOTAL:</span>
              <span class="total-valor">${formatarValor(calcularTotal())}</span>
            </div>

            ${dataValidade ? `
              <div class="validade-row">
                <strong>Válido até: ${new Date(dataValidade + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="footer-clinic">${nomeClinica}</div>
            <div class="footer-details">
              ${cnpj ? `<span>CNPJ: ${cnpj}</span>` : ''}
              ${telefoneVet ? `<span>Tel: ${telefoneVet}</span>` : ''}
              ${emailVet ? `<span>${emailVet}</span>` : ''}
              ${enderecoVet ? `<span>${enderecoVet}</span>` : ''}
            </div>
            <div class="footer-gen">Gerado em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR')}</div>
          </div>
        </div>
      </body>
      </html>
    `

    if (novaJanela) {
      // Barra de navegação igual ao PDF do histórico (some ao imprimir)
      const barraNavegacao = `
        <div style="
          position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
          background: #1a5f2e; color: white;
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
          <span style="font-weight: 600; font-size: 13px; opacity: 0.9;">Orçamento</span>
          <button onclick="window.print()" style="
            background: white; border: none; color: #1a5f2e;
            padding: 6px 14px; border-radius: 6px;
            font-size: 14px; cursor: pointer; font-weight: 700;
          ">🖨️ Imprimir</button>
        </div>
        <div style="height: 48px;" class="no-print"></div>
      `
      const estiloBarra = `<style>@media print { .no-print { display: none !important; } }</style>`
      const htmlFinal = html
        .replace('</head>', `${estiloBarra}</head>`)
        .replace('</body>', `${barraNavegacao}</body>`)

      novaJanela.document.open()
      novaJanela.document.write(htmlFinal)
      novaJanela.document.close()
      setTimeout(() => novaJanela.print(), 300)
    } else {
      // Fallback se popup ainda bloqueado: download do HTML
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orcamento-${cliente?.nome || 'orcamento'}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
  }

  const gerarTextoQuote = () => {
    const data = new Date()
    const dataFormatada = data.toLocaleDateString('pt-BR')
    const numeroQuote = `ORC-${data.getTime()}`
    const vet = vetPerfil

    let texto = `*ORÇAMENTO #${numeroQuote}*\n\n`
    texto += `*${vet?.nomeClinica || vet?.whiteLabel?.nomeClinica || 'Clínica Veterinária'}*\n`
    texto += vet?.cnpj ? `CNPJ: ${vet.cnpj}\n` : ''
    texto += vet?.telefone ? `Telefone: ${vet.telefone}\n` : ''
    texto += vet?.email ? `Email: ${vet.email}\n` : ''
    texto += vet?.endereco ? `Endereço: ${[vet.endereco, vet.cidade, vet.estado].filter(Boolean).join(', ')}\n` : ''
    texto += '\n'

    texto += `*CLIENTE:*\n`
    texto += `${cliente?.nome || 'N/A'}\n`
    texto += `Telefone: ${cliente?.telefone || 'N/A'}\n`
    texto += `Email: ${cliente?.email || 'N/A'}\n\n`

    texto += `*ANIMAL:*\n`
    texto += `Nome: ${pet?.nome || 'N/A'}\n`
    texto += `Espécie: ${pet?.especie || 'N/A'}\n`
    texto += `Raça: ${pet?.raca || 'N/A'}\n`
    texto += `Data: ${dataFormatada}\n\n`

    texto += `*PROCEDIMENTOS:*\n`
    procedimentos.forEach((p, idx) => {
      const valor = p.valor ? formatarValor(parseFloat(p.valor)) : 'R$ -'
      texto += `${idx + 1}. ${p.descricao || '-'} - ${valor}\n`
    })

    texto += `\n*VALOR TOTAL: ${formatarValor(calcularTotal())}*\n`

    if (descricaoProcedimento) {
      texto += `\n*OBSERVAÇÕES:*\n${descricaoProcedimento}\n`
    }

    texto += `\nGerado em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR')}`

    return texto
  }

  const compartilharPorEmail = () => {
    const assunto = `Orçamento - ${cliente?.nome} (${pet?.nome})`
    const textoQuote = gerarTextoQuote()
    const corpo = encodeURIComponent(textoQuote)
    const email = cliente?.email || ''

    window.open(`mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${corpo}`)
    setMostrarCompartilhamento(false)
  }

  const compartilharPorWhatsapp = () => {
    const textoQuote = gerarTextoQuote()
    const textoCodificado = encodeURIComponent(textoQuote)
    const numeroWhatsapp = cliente?.telefone?.replace(/\D/g, '') || ''

    if (numeroWhatsapp) {
      window.open(`https://wa.me/55${numeroWhatsapp}?text=${textoCodificado}`)
    } else {
      alert('Número de telefone do cliente não disponível para compartilhamento via WhatsApp')
    }
    setMostrarCompartilhamento(false)
  }

  return createPortal(
    <div className="quote-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="quote-modal">
        {/* Header */}
        <div className="quote-header">
          <h2>💰 Novo Orçamento</h2>
        </div>

        {/* Body */}
        <div className="quote-body">
          <div className="quote-info-compact">
            <p>
              <strong>{cliente?.nome}</strong> - {pet?.nome} ({pet?.especie})
            </p>
          </div>

          <div className="quote-section">
            <div className="section-header">
              <h3>Procedimentos</h3>
              <button
                type="button"
                className="btn-add-procedure"
                onClick={adicionarProcedimento}
              >
                + Adicionar
              </button>
            </div>

            <div className="procedures-list">
              {procedimentos.map((proc, idx) => {
                return (
                  <div key={proc.id} className="procedure-item">
                    <div className="procedure-form">
                      <div className="procedure-input-wrapper">
                        <input
                          type="text"
                          placeholder="Procedimento"
                          value={proc.descricao}
                          onChange={(e) => {
                            atualizarProcedimento(proc.id, { descricao: e.target.value, filtro: e.target.value })
                          }}
                          className="procedure-input procedure-descricao-novo"
                        />
                        <button
                          type="button"
                          className="btn-select-procedure"
                          onClick={() => setSelecaoAberta(selecaoAberta === proc.id ? null : proc.id)}
                          title="Selecionar procedimento"
                        >
                          ▼
                        </button>

                        {selecaoAberta === proc.id && (
                          <div className="procedure-dropdown-novo">
                            {procedimentosDisponiveis.length > 0 ? (
                              <div className="procedure-dropdown-list">
                                {procedimentosDisponiveis.map(p => (
                                  <button
                                    key={`${p.id}-${p.nome}`}
                                    type="button"
                                    className="procedure-dropdown-item"
                                    onClick={() => {
                                      atualizarProcedimento(proc.id, {
                                        descricao: p.nome,
                                        valor: p.valor ? parseFloat(p.valor).toFixed(2).replace('.', ',') : '',
                                        filtro: ''
                                      })
                                      setSelecaoAberta(null)
                                    }}
                                  >
                                    <div className="dropdown-item-name">{p.nome}</div>
                                    {p.valor && (
                                      <div className="dropdown-item-price">R$ {parseFloat(p.valor).toFixed(2)}</div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="procedure-dropdown-empty">
                                Nenhum procedimento disponível
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="procedure-inputs">
                        <div className="procedure-valor-group">
                          <span className="currency-label">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={proc.valor}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9.,]/g, '')
                              atualizarProcedimento(proc.id, { valor: raw })
                            }}
                            onBlur={(e) => {
                              const num = parseFloat(String(e.target.value).replace(',', '.')) || 0
                              atualizarProcedimento(proc.id, { valor: num.toFixed(2).replace('.', ',') })
                            }}
                            className="procedure-input procedure-valor"
                          />
                        </div>

                        {procedimentos.length > 1 && (
                          <button
                            type="button"
                            className="btn-cancel-procedure"
                            onClick={() => removerProcedimento(proc.id)}
                            title="Remover procedimento"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          <div className="quote-section">
            <label htmlFor="dataValidade">Validade do Orçamento</label>
            <input
              type="date"
              id="dataValidade"
              value={dataValidade}
              onChange={(e) => setDataValidade(e.target.value)}
              className="procedure-input date-input"
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                display: 'block',
                boxSizing: 'border-box',
                padding: '14px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                background: 'white',
                margin: 0,
                minHeight: '48px',
                fontFamily: 'inherit',
                color: '#333',
              }}
            />
          </div>

          <div className="quote-section">
            <label htmlFor="observacoes">Descrição do procedimento</label>
            <textarea
              id="observacoes"
              placeholder="Adicione detalhes, observações e recomendações específicas do atendimento..."
              value={descricaoProcedimento}
              onChange={(e) => setDescricaoProcedimento(e.target.value)}
              className="observacoes-textarea"
            />
          </div>

          <div className="valor-total-section">
            <div className="valor-total-row">
              <label>Valor Total do Orçamento:</label>
              <div className="valor-total-display">
                {formatarValor(calcularTotal())}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="quote-footer">
          <div className="quote-footer-actions">
            <button
              type="button"
              className="btn-gerar-pdf"
              onClick={gerarPDF}
              disabled={procedimentos.some(p => !p.descricao || !p.valor)}
            >
              📄 PDF
            </button>
            <button
              type="button"
              className="btn-compartilhar"
              onClick={() => setMostrarCompartilhamento(true)}
              disabled={procedimentos.some(p => !p.descricao || !p.valor)}
            >
              📧 Email/WhatsApp
            </button>
          </div>
          <button type="button" className="btn-cancelar" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>

      {/* Compartilhamento Modal */}
      {mostrarCompartilhamento && (
        <div className="compartilhamento-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setMostrarCompartilhamento(false)
        }}>
          <div className="compartilhamento-modal">
            <div className="compartilhamento-header">
              <h3>Compartilhar Orçamento</h3>
              <button
                type="button"
                className="compartilhamento-close"
                onClick={() => setMostrarCompartilhamento(false)}
              >
                ×
              </button>
            </div>
            <div className="compartilhamento-body">
              <p>Escolha como deseja compartilhar o orçamento:</p>
            </div>
            <div className="compartilhamento-footer">
              <button
                type="button"
                className="btn-compartilhamento-email"
                onClick={compartilharPorEmail}
              >
                ✉️ Enviar por Email
              </button>
              <button
                type="button"
                className="btn-compartilhamento-whatsapp"
                onClick={compartilharPorWhatsapp}
              >
                💬 Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
