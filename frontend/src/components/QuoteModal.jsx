import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Trash2 } from 'lucide-react'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import './QuoteModal.css'

export default function QuoteModal({ cliente, pet, onClose }) {
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)
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
  const [enviando, setEnviando] = useState(false)
  const [erroCompartilhamento, setErroCompartilhamento] = useState('')
  const [salvandoDoc, setSalvandoDoc] = useState(false)
  const [docSalvo, setDocSalvo] = useState(false)

  // Custo de Visita Externa: usa a hora técnica e o custo/km configurados uma
  // vez no Perfil (Precificação). Aqui o vet só edita os dados do caso (caso a caso).
  const [horaTecnica, setHoraTecnica] = useState(0)
  const [custoKmVeiculo, setCustoKmVeiculo] = useState(0)
  const [mostrarVisita, setMostrarVisita] = useState(false)
  const [visita, setVisita] = useState({ distanciaKm: '', tempoDeslocamentoMin: '' })
  // Itens de visita externa (linha fixa mostrada abaixo da seção; no PDF vira "Outros")
  const [itensVisita, setItensVisita] = useState([]) // [{ id, valor }]

  // Estoque de Insumos: adiciona insumo ao orçamento e abate do estoque automaticamente
  const [insumosDisponiveis, setInsumosDisponiveis] = useState([])
  const [mostrarInsumo, setMostrarInsumo] = useState(false)
  const [insumoSelecionadoId, setInsumoSelecionadoId] = useState('')
  const [insumoQuantidade, setInsumoQuantidade] = useState('1')
  const [materiaisAvulsos, setMateriaisAvulsos] = useState('') // material sem cadastro (R$)
  // Itens de insumo/material adicionados ao orçamento (linha fixa abaixo da seção)
  const [itensInsumo, setItensInsumo] = useState([]) // [{ id, descricao, valor, insumoId?, quantidade? }]
  const [erroInsumo, setErroInsumo] = useState('')
  const [proximoItemId, setProximoItemId] = useState(1)

  useEffect(() => {
    buscarPerfilVet()
    buscarInsumos()
  }, [])

  const buscarInsumos = async () => {
    try {
      const res = await axios.get('/api/insumos')
      if (res.data.sucesso) setInsumosDisponiveis(res.data.data || [])
    } catch (err) {
      console.log('Erro ao buscar insumos')
    }
  }

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
        setHoraTecnica(parseFloat(perfil.precificacao?.horaTecnica) || 0)

        // Custo/km do veículo (se configurado)
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
    } catch (err) {
      console.log('Erro ao buscar perfil do veterinário')
    }
  }

  const visitaDistancia = parseFloat(visita.distanciaKm) || 0
  const visitaTempo = parseFloat(visita.tempoDeslocamentoMin) || 0
  const visitaCustoTempo = (visitaTempo / 60) * horaTecnica
  const visitaCustoDeslocamento = visitaDistancia * custoKmVeiculo
  const visitaSubtotal = visitaCustoTempo + visitaCustoDeslocamento

  // Adiciona o custo da visita como uma LINHA FIXA (mostrada abaixo da seção).
  // No app aparece como "Visita externa"; no PDF de orçamento/cobrança vira "Outros".
  const handleAdicionarVisita = () => {
    if (visitaSubtotal <= 0) return
    setItensVisita(prev => [...prev, { id: proximoItemId, valor: visitaSubtotal }])
    setProximoItemId(prev => prev + 1)
    setVisita({ distanciaKm: '', tempoDeslocamentoMin: '' })
    setMostrarVisita(false)
  }

  const removerItemVisita = (id) => {
    setItensVisita(prev => prev.filter(i => i.id !== id))
  }

  const insumoSelecionado = insumosDisponiveis.find(i => String(i.id) === String(insumoSelecionadoId))
  const insumoQtdNum = parseFloat(insumoQuantidade) || 0
  const insumoValorTotal = insumoSelecionado ? (parseFloat(insumoSelecionado.precoVenda) || 0) * insumoQtdNum : 0
  const insumoEstoqueInsuficiente = insumoSelecionado && insumoQtdNum > (parseFloat(insumoSelecionado.quantidadeEstoque) || 0)
  const materiaisAvulsosNum = parseFloat(String(materiaisAvulsos).replace(',', '.')) || 0

  // Adiciona insumo do estoque (abate estoque) e/ou material avulso como itens fixos
  // mostrados logo abaixo do botão "+ Usar Insumo".
  const handleAdicionarInsumo = async () => {
    setErroInsumo('')
    const novos = []

    // 1) Insumo do estoque selecionado → abate estoque
    if (insumoSelecionado && insumoQtdNum > 0) {
      try {
        const res = await axios.post(`/api/insumos/${insumoSelecionado.id}/baixar-estoque`, { quantidade: insumoQtdNum })
        if (!res.data.sucesso) {
          setErroInsumo(res.data.erro || 'Erro ao abater estoque')
          return
        }
        novos.push({
          id: proximoItemId + novos.length,
          descricao: `${insumoSelecionado.nome} (${insumoQtdNum} ${insumoSelecionado.unidade})`,
          valor: insumoValorTotal,
          insumoId: insumoSelecionado.id,
          quantidade: insumoQtdNum
        })
        // Atualiza estoque local exibido no seletor
        setInsumosDisponiveis(prev => prev.map(i =>
          i.id === insumoSelecionado.id ? { ...i, quantidadeEstoque: res.data.data.quantidadeEstoque } : i
        ))
      } catch (err) {
        setErroInsumo('Erro ao abater estoque do insumo')
        return
      }
    }

    // 2) Material avulso (sem cadastro) → só valor, não mexe no estoque
    if (materiaisAvulsosNum > 0) {
      novos.push({
        id: proximoItemId + novos.length,
        descricao: 'Materiais/insumos',
        valor: materiaisAvulsosNum
      })
    }

    if (novos.length === 0) {
      setErroInsumo('Selecione um insumo ou informe um valor de material avulso.')
      return
    }

    setItensInsumo(prev => [...prev, ...novos])
    setProximoItemId(prev => prev + novos.length)
    setInsumoSelecionadoId('')
    setInsumoQuantidade('1')
    setMateriaisAvulsos('')
    setMostrarInsumo(false)
  }

  // Ao remover um insumo do orçamento, repõe a quantidade no estoque
  const removerItemInsumo = async (item) => {
    if (item.insumoId && item.quantidade > 0) {
      try {
        const res = await axios.post(`/api/insumos/${item.insumoId}/repor-estoque`, { quantidade: item.quantidade })
        if (res.data?.sucesso) {
          setInsumosDisponiveis(prev => prev.map(i =>
            i.id === item.insumoId ? { ...i, quantidadeEstoque: res.data.data.quantidadeEstoque } : i
          ))
        }
      } catch { /* se falhar a reposição, ao menos remove a linha */ }
    }
    setItensInsumo(prev => prev.filter(i => i.id !== item.id))
  }

  // Todos os itens do documento, na ordem: procedimentos → insumos → visita ("Deslocamento") por último.
  // rótuloVisita controla se a visita aparece como "Visita externa" (app) ou "Deslocamento" (PDF).
  // consolidarInsumos: usado SOMENTE ao gerar o PDF do orçamento — o cliente recebe uma única
  // linha "Materiais e insumos" com o total, em vez do detalhe de cada item do estoque.
  const montarItens = (rotuloVisita, consolidarInsumos = false) => {
    const proc = procedimentos
      .filter(p => p.descricao && p.valor)
      .map(p => ({ descricao: p.descricao, valor: parseFloat(String(p.valor).replace(',', '.')) || 0 }))
    const ins = consolidarInsumos
      ? (itensInsumo.length > 0 ? [{ descricao: 'Materiais e insumos', valor: itensInsumo.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0) }] : [])
      : itensInsumo.map(i => ({ descricao: i.descricao, valor: i.valor }))
    const vis = itensVisita.map(i => ({ descricao: rotuloVisita, valor: i.valor }))
    return [...proc, ...ins, ...vis]
  }

  // Documento vazio se não há nenhum item OU se há procedimento pela metade
  const procedimentoIncompleto = procedimentos.some(p => (p.descricao && !p.valor) || (!p.descricao && p.valor))
  const documentoVazio = montarItens('Deslocamento').length === 0 || procedimentoIncompleto

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
    const totalProc = procedimentos.reduce((total, p) => {
      const valor = parseFloat(String(p.valor).replace(',', '.')) || 0
      return total + valor
    }, 0)
    const totalInsumo = itensInsumo.reduce((t, i) => t + (parseFloat(i.valor) || 0), 0)
    const totalVisita = itensVisita.reduce((t, i) => t + (parseFloat(i.valor) || 0), 0)
    return totalProc + totalInsumo + totalVisita
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
          .orcamento-aviso {
            margin-top: 10px; padding: 7px 10px;
            background: #fff8e6; border-left: 3px solid #b8860b;
            font-size: 9px; color: #8a6d0b; line-height: 1.4; border-radius: 2px;
          }
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
            /* height auto (em vez de 297mm fixo) evita uma 2ª página em branco
               quando o conteúdo é curto — 297mm exato transbordava por arredondamento */
            .page { margin: 0; width: 210mm; height: auto; min-height: 0; overflow: visible; page-break-after: avoid; }
            .content { flex: none; }
            .footer { margin-top: 24px; }
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
                ${montarItens('Deslocamento', true).map(p => `
                  <tr>
                    <td>${p.descricao || '-'}</td>
                    <td class="td-valor">${formatarValor(p.valor)}</td>
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

            <div class="orcamento-aviso">
              Este é um <strong>orçamento estimado</strong>. Os valores podem variar de acordo com os materiais e serviços que se mostrarem necessários durante o tratamento.
            </div>
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
          ">Imprimir</button>
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
    montarItens('Deslocamento').forEach((p, idx) => {
      texto += `${idx + 1}. ${p.descricao || '-'} - ${formatarValor(p.valor)}\n`
    })

    texto += `\n*VALOR TOTAL: ${formatarValor(calcularTotal())}*\n`

    if (descricaoProcedimento) {
      texto += `\n*OBSERVAÇÕES:*\n${descricaoProcedimento}\n`
    }

    texto += `\nGerado em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR')}`

    return texto
  }

  // Gera o PDF de verdade no servidor (pdfkit) a partir dos dados atuais do orçamento
  const gerarPdfBlob = async () => {
    const payload = {
      cliente: { nome: cliente?.nome, telefone: cliente?.telefone, email: cliente?.email },
      pet: { nome: pet?.nome, especie: pet?.especie, raca: pet?.raca },
      procedimentos: montarItens('Deslocamento', true).map(p => ({ descricao: p.descricao, valor: p.valor })),
      observacao: descricaoProcedimento,
      dataValidade,
      total: calcularTotal()
    }
    const res = await axios.post('/api/orcamento/pdf', payload, { responseType: 'blob' })
    return new File([res.data], `orcamento-${cliente?.nome || 'orcamento'}.pdf`, { type: 'application/pdf' })
  }

  // Salva o orçamento no histórico de documentos emitidos (com data de emissão)
  const salvarOrcamento = async () => {
    setSalvandoDoc(true)
    try {
      const itens = montarItens('Deslocamento')
      const payload = {
        tipo: 'orcamento',
        numero: `ORC-${Date.now()}`,
        clienteNome: cliente?.nome || '',
        petNome: pet?.nome || '',
        total: calcularTotal(),
        dados: {
          cliente: { nome: cliente?.nome, telefone: cliente?.telefone, email: cliente?.email },
          pet: { nome: pet?.nome, especie: pet?.especie, raca: pet?.raca },
          procedimentos: itens,
          observacao: descricaoProcedimento,
          dataValidade,
          total: calcularTotal()
        }
      }
      const res = await axios.post('/api/documentos', payload)
      if (res.data.sucesso) {
        setDocSalvo(true)
        setTimeout(() => setDocSalvo(false), 2500)
      }
    } catch (err) {
      setErroCompartilhamento('Erro ao salvar o orçamento. Tente novamente.')
    } finally {
      setSalvandoDoc(false)
    }
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

  const compartilharPorEmail = async () => {
    setEnviando(true)
    setErroCompartilhamento('')
    try {
      const file = await gerarPdfBlob()

      // Web Share API com arquivo: no celular já abre a lista de apps (inclui Mail) com o PDF anexado
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orçamento - ${cliente?.nome}`,
          text: `Orçamento para ${pet?.nome}`
        })
        setMostrarCompartilhamento(false)
        return
      }

      // Sem suporte a compartilhar arquivo: baixa o PDF e abre o app de email nativo
      // (o usuário precisa anexar manualmente o arquivo baixado)
      baixarArquivo(file)
      const assunto = `Orçamento - ${cliente?.nome} (${pet?.nome})`
      const corpo = encodeURIComponent(
        `Segue em anexo o orçamento (${file.name} baixado agora).\n\n${gerarTextoQuote()}`
      )
      window.open(`mailto:${cliente?.email || ''}?subject=${encodeURIComponent(assunto)}&body=${corpo}`)
      setMostrarCompartilhamento(false)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setErroCompartilhamento('Erro ao gerar o PDF do orçamento. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const compartilharPorWhatsapp = async () => {
    const numeroWhatsapp = cliente?.telefone?.replace(/\D/g, '') || ''

    setEnviando(true)
    setErroCompartilhamento('')
    try {
      const file = await gerarPdfBlob()

      // Web Share API com arquivo: no celular abre direto na lista de apps, com WhatsApp já selecionável
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orçamento - ${cliente?.nome}`,
          text: `Orçamento para ${pet?.nome}`
        })
        setMostrarCompartilhamento(false)
        return
      }

      // Sem suporte a compartilhar arquivo (ex: desktop): baixa o PDF e abre o WhatsApp Web/App
      // com o texto pronto — o usuário anexa o arquivo baixado manualmente
      baixarArquivo(file)
      const textoCodificado = encodeURIComponent(gerarTextoQuote())
      if (numeroWhatsapp) {
        window.open(`https://wa.me/55${numeroWhatsapp}?text=${textoCodificado}`)
      } else {
        alert('Número de telefone do cliente não disponível. O PDF foi baixado — anexe manualmente no WhatsApp.')
      }
      setMostrarCompartilhamento(false)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setErroCompartilhamento('Erro ao gerar o PDF do orçamento. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return createPortal(
    <div className="quote-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="quote-modal" ref={swipeRef} style={swipeStyle}>
        {/* Header */}
        <div className="quote-header">
          <h2>Novo Orçamento</h2>
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

          {/* Custo de Visita Externa — calcula usando a hora técnica e o custo/km
              configurados no Perfil; aqui o vet só edita os dados do caso. */}
          <div className="quote-section quote-visita-section">
            <div className="section-header">
              <h3>Custo de Visita Externa</h3>
              {!mostrarVisita && (
                <button
                  type="button"
                  className="btn-add-procedure"
                  onClick={() => setMostrarVisita(true)}
                >
                  + Calcular
                </button>
              )}
            </div>

            {mostrarVisita && (
              (horaTecnica <= 0 && custoKmVeiculo <= 0) ? (
                <p className="quote-visita-aviso">
                  Configure sua <strong>Hora Técnica</strong> e/ou o <strong>veículo</strong> no Perfil (card Precificação) para calcular o custo de deslocamento.
                </p>
              ) : (
                <>
                  <div className="quote-visita-inputs">
                    <div className="quote-visita-field">
                      <label>Distância ida+volta (km)</label>
                      <input
                        type="number"
                        placeholder="Ex: 24"
                        value={visita.distanciaKm}
                        onChange={(e) => setVisita({ ...visita, distanciaKm: e.target.value })}
                        autoFocus
                      />
                    </div>
                    <div className="quote-visita-field">
                      <label>Tempo de deslocamento (min)</label>
                      <input
                        type="number"
                        placeholder="Ex: 40"
                        value={visita.tempoDeslocamentoMin}
                        onChange={(e) => setVisita({ ...visita, tempoDeslocamentoMin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="quote-visita-resultado">
                    {horaTecnica > 0 && (
                      <div className="quote-visita-linha">
                        <span>Seu tempo ({(visitaTempo / 60).toFixed(1)}h × R$ {horaTecnica.toFixed(2)}):</span>
                        <strong>{formatarValor(visitaCustoTempo)}</strong>
                      </div>
                    )}
                    {custoKmVeiculo > 0 && (
                      <div className="quote-visita-linha">
                        <span>Deslocamento ({visitaDistancia} km × R$ {custoKmVeiculo.toFixed(2)}/km):</span>
                        <strong>{formatarValor(visitaCustoDeslocamento)}</strong>
                      </div>
                    )}
                    <div className="quote-visita-linha quote-visita-total">
                      <span>Subtotal da visita:</span>
                      <strong>{formatarValor(visitaSubtotal)}</strong>
                    </div>
                  </div>

                  <div className="quote-visita-acoes">
                    <button
                      type="button"
                      className="btn-visita-cancelar"
                      onClick={() => { setMostrarVisita(false); setVisita({ distanciaKm: '', tempoDeslocamentoMin: '' }) }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-visita-adicionar"
                      onClick={handleAdicionarVisita}
                      disabled={visitaSubtotal <= 0}
                    >
                      Adicionar
                    </button>
                  </div>
                </>
              )
            )}

            {/* Itens de visita já adicionados (linha fixa; no PDF aparece como "Outros") */}
            {itensVisita.map(item => (
              <div key={item.id} className="quote-item-fixo">
                <span className="qif-nome">Visita externa</span>
                <span className="qif-valor">{formatarValor(item.valor)}</span>
                <button
                  type="button"
                  className="qif-remover"
                  onClick={() => removerItemVisita(item.id)}
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Insumos do Estoque — ao adicionar, abate a quantidade do estoque automaticamente */}
          <div className="quote-section quote-visita-section">
            <div className="section-header">
              <h3>Insumos do Estoque</h3>
              {!mostrarInsumo && (
                <button
                  type="button"
                  className="btn-add-procedure"
                  onClick={() => setMostrarInsumo(true)}
                >
                  + Usar Insumo
                </button>
              )}
            </div>

            {mostrarInsumo && (
              <>
                {erroInsumo && <div className="quote-visita-aviso">{erroInsumo}</div>}

                {insumosDisponiveis.length > 0 ? (
                  <>
                    <div className="quote-visita-inputs">
                      <div className="quote-visita-field" style={{ flex: 2 }}>
                        <label>Insumo do estoque</label>
                        <select
                          value={insumoSelecionadoId}
                          onChange={(e) => setInsumoSelecionadoId(e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {insumosDisponiveis.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.nome} ({parseFloat(i.quantidadeEstoque)} {i.unidade} em estoque)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="quote-visita-field">
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

                    {insumoSelecionado && (
                      <div className="quote-visita-resultado">
                        <div className="quote-visita-linha">
                          <span>{insumoQtdNum} {insumoSelecionado.unidade} × R$ {parseFloat(insumoSelecionado.precoVenda).toFixed(2)}:</span>
                          <strong>{formatarValor(insumoValorTotal)}</strong>
                        </div>
                        {insumoEstoqueInsuficiente && (
                          <p className="quote-visita-aviso" style={{ marginTop: '0.5rem' }}>
                            Estoque atual ({parseFloat(insumoSelecionado.quantidadeEstoque)} {insumoSelecionado.unidade}) é menor que a quantidade solicitada.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="quote-visita-aviso">
                    Nenhum insumo cadastrado. Use o campo abaixo para material avulso, ou cadastre em <strong>Perfil → Estoque de Insumos</strong>.
                  </p>
                )}

                {/* Material avulso (sem cadastro) — não mexe no estoque */}
                <div className="quote-visita-inputs">
                  <div className="quote-visita-field">
                    <label>Materiais/insumos avulsos (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 20,00"
                      value={materiaisAvulsos}
                      onChange={(e) => setMateriaisAvulsos(e.target.value)}
                    />
                  </div>
                </div>

                <div className="quote-visita-acoes">
                  <button
                    type="button"
                    className="btn-visita-cancelar"
                    onClick={() => { setMostrarInsumo(false); setInsumoSelecionadoId(''); setInsumoQuantidade('1'); setMateriaisAvulsos(''); setErroInsumo('') }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-visita-adicionar"
                    onClick={handleAdicionarInsumo}
                    disabled={(!insumoSelecionado || insumoQtdNum <= 0) && materiaisAvulsosNum <= 0}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            )}

            {/* Insumos/materiais já adicionados (linha fixa abaixo do botão) */}
            {itensInsumo.map(item => (
              <div key={item.id} className="quote-item-fixo">
                <span className="qif-nome">{item.descricao}</span>
                <span className="qif-valor">{formatarValor(item.valor)}</span>
                <button
                  type="button"
                  className="qif-remover"
                  onClick={() => removerItemInsumo(item)}
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
            <p className="quote-orcamento-aviso">
              Este é um orçamento estimado. Os valores podem variar de acordo com os materiais e serviços que se mostrarem necessários durante o tratamento.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="quote-footer">
          <div className="quote-footer-actions">
            <button
              type="button"
              className="btn-gerar-pdf"
              onClick={gerarPDF}
              disabled={documentoVazio}
            >
              PDF
            </button>
            <button
              type="button"
              className="btn-compartilhar"
              onClick={() => setMostrarCompartilhamento(true)}
              disabled={documentoVazio}
            >
              Email/WhatsApp
            </button>
            <button
              type="button"
              className="btn-salvar-doc"
              onClick={salvarOrcamento}
              disabled={documentoVazio || salvandoDoc}
            >
              {salvandoDoc ? '⏳...' : docSalvo ? 'Salvo!' : 'Salvar'}
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
              <p>Escolha como deseja compartilhar o orçamento (PDF anexado):</p>
              {erroCompartilhamento && (
                <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '8px' }}>{erroCompartilhamento}</p>
              )}
            </div>
            <div className="compartilhamento-footer">
              <button
                type="button"
                className="btn-compartilhamento-email"
                onClick={compartilharPorEmail}
                disabled={enviando}
              >
                {enviando ? '⏳ Gerando PDF...' : 'Enviar por Email'}
              </button>
              <button
                type="button"
                className="btn-compartilhamento-whatsapp"
                onClick={compartilharPorWhatsapp}
                disabled={enviando}
              >
                {enviando ? '⏳ Gerando PDF...' : 'Enviar por WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
