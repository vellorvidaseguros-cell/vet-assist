import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData, formatarDataComDia } from '../utils/dateFormatter'
import { apiUrl, API_BASE_URL } from '../utils/apiConfig'
import './AnimalHistory.css'

// O backend já converte os paths, então apenas garantir que começa com /
const getPhotoUrl = (caminhoArquivo) => {
  if (!caminhoArquivo) return ''

  // Se já começa com /, retorna como está
  if (caminhoArquivo.startsWith('/')) {
    return caminhoArquivo
  }

  // Se é um caminho absoluto Windows, extrair a parte relativa
  let normalizado = caminhoArquivo.replace(/\\/g, '/')

  // Se contém 'backend/', extrair a partir daí
  const backendIndex = normalizado.indexOf('backend/')
  if (backendIndex !== -1) {
    return `/${normalizado.substring(backendIndex)}`
  }

  // Se contém 'uploads/', adicionar /backend/ na frente
  const uploadsIndex = normalizado.indexOf('uploads/')
  if (uploadsIndex !== -1) {
    return `/backend/${normalizado.substring(uploadsIndex)}`
  }

  // Fallback: retorna com / na frente
  return `/${normalizado}`
}

const getPhotoUrlFull = (caminhoArquivo) => {
  return `${API_BASE_URL}${getPhotoUrl(caminhoArquivo)}`
}

const getLogoUrl = (logomarcaUrl) => {
  if (!logomarcaUrl) return ''

  // Se já é uma URL completa, retorna como está
  if (logomarcaUrl.startsWith('http://') || logomarcaUrl.startsWith('https://')) {
    return logomarcaUrl
  }

  // Normalizar o caminho
  let normalizado = logomarcaUrl.replace(/\\/g, '/')

  // Se contém 'backend/', extrair a partir daí
  const backendIndex = normalizado.indexOf('backend/')
  if (backendIndex !== -1) {
    return `${API_BASE_URL}/${normalizado.substring(backendIndex)}`
  }

  // Se contém 'uploads/', adicionar /backend/ na frente
  const uploadsIndex = normalizado.indexOf('uploads/')
  if (uploadsIndex !== -1) {
    return `${API_BASE_URL}/backend/${normalizado.substring(uploadsIndex)}`
  }

  // Se não começa com /, adicionar
  if (!normalizado.startsWith('/')) {
    normalizado = '/' + normalizado
  }

  return `${API_BASE_URL}${normalizado}`
}

export default function AnimalHistory() {
  const [clientes, setClientes] = useState([])
  const [pets, setPets] = useState([])
  const [selectedClienteId, setSelectedClienteId] = useState('')
  const [selectedPetId, setSelectedPetId] = useState('')
  const [allHistory, setAllHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [photosByHistorico, setPhotosByHistorico] = useState({})
  const [selectedDateTab, setSelectedDateTab] = useState(null)
  const [groupedByDate, setGroupedByDate] = useState({})
  const [expandedDates, setExpandedDates] = useState({})
  const [whiteLabel, setWhiteLabel] = useState(null)
  const [logoBase64, setLogoBase64] = useState(null)

  useEffect(() => {
    fetchClientes()
    fetchAllHistory()
    fetchWhiteLabel()
  }, [])

  // Buscar logo direto como Base64 do backend (sem CORS, sem timing)
  const fetchLogoBase64 = async () => {
    try {
      const res = await axios.get('/api/perfil/logo-base64')
      if (res.data.sucesso && res.data.data) {
        console.log('[INFO] Logo base64 carregada do servidor, tamanho:', res.data.data.length)
        return res.data.data
      }
      return null
    } catch (err) {
      console.error('[ERROR] Erro ao buscar logo base64:', err)
      return null
    }
  }

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
          estado: vet.estado || '',
          logomarcaUrl: vet.logomarcaUrl || ''
        }
      }

      setWhiteLabel(wl)

      // Buscar logo como base64 direto do backend (mais confiável)
      const base64 = await fetchLogoBase64()
      setLogoBase64(base64)
    } catch (err) {
      console.error('Erro ao carregar white label:', err)
      setWhiteLabel({
        nomeClinica: 'VetAssist',
        cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        logomarcaUrl: ''
      })
    }
  }

  useEffect(() => {
    if (selectedClienteId) {
      fetchPetsByCliente(selectedClienteId)
    } else {
      setPets([])
      setSelectedPetId('')
    }
    applyFilters()
  }, [selectedClienteId, allHistory])

  useEffect(() => {
    applyFilters()
  }, [selectedPetId, allHistory])

  // Expandir automaticamente o primeiro atendimento quando a data é selecionada
  useEffect(() => {
    if (selectedDateTab && groupedByDate[selectedDateTab] && groupedByDate[selectedDateTab].length > 0) {
      setTimeout(() => {
        setExpandedId(groupedByDate[selectedDateTab][0].id)
      }, 0)
    }
  }, [selectedDateTab])

  // Recolher todos os atendimentos quando filtro de animal é ativado
  useEffect(() => {
    if (selectedPetId) {
      setExpandedId(null)
    }
  }, [selectedPetId])

  const fetchClientes = async () => {
    try {
      const res = await axios.get('/api/clientes')
      if (res.data.sucesso) {
        setClientes(res.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar proprietários')
    }
  }

  const fetchPetsByCliente = async (clienteId) => {
    try {
      const res = await axios.get(`/api/pets/cliente/${clienteId}`)
      if (res.data.sucesso) {
        setPets(res.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar animais do proprietário')
    }
  }

  const fetchAllHistory = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/historico')
      if (res.data.sucesso) {
        // Filtrar apenas históricos com status 'Concluído' e ordenar por data DESC
        const historicoData = (res.data.data || [])
          .filter(h => h.status === 'Concluído')
          .sort((a, b) => new Date(b.data) - new Date(a.data))

        setAllHistory(historicoData)
        groupHistoricoByDate(historicoData)
        fetchAllPhotos(historicoData)

        // Todas as datas começam recolhidas
        setExpandedDates({})
      }
    } catch (err) {
      setError('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const groupHistoricoByDate = (historicoData) => {
    const grouped = {}
    historicoData.forEach(item => {
      const date = new Date(item.data).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(item)
    })

    // Ordenar atendimentos de cada dia por horário (cronológico)
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const horaA = a.HistoricoConsulta?.hora || '00:00'
        const horaB = b.HistoricoConsulta?.hora || '00:00'
        return horaA.localeCompare(horaB)
      })
    })

    setGroupedByDate(grouped)
  }

  const applyFilters = () => {
    let filtered = allHistory

    if (selectedPetId) {
      filtered = filtered.filter(h => h.petId === parseInt(selectedPetId))
    } else if (selectedClienteId) {
      filtered = filtered.filter(h => h.clienteId === parseInt(selectedClienteId))
    }

    // Ordenar cronologicamente (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.data) - new Date(a.data))

    setFilteredHistory(filtered)
    groupHistoricoByDate(filtered)
  }

  const fetchAllPhotos = async (historicoData) => {
    try {
      const photoPromises = historicoData.map(historico =>
        axios.get(`/api/anexos/historico/${historico.id}`)
          .then(res => ({
            historicoId: historico.id,
            fotos: res.data.sucesso ? (res.data.data || []) : []
          }))
          .catch(err => {
            console.error(`Erro ao carregar fotos para histórico ${historico.id}:`, err)
            return { historicoId: historico.id, fotos: [] }
          })
      )

      const results = await Promise.all(photoPromises)
      const photosMap = {}
      results.forEach(({ historicoId, fotos }) => {
        photosMap[historicoId] = fotos
      })
      setPhotosByHistorico(photosMap)
    } catch (err) {
      console.error('Erro geral ao carregar fotos:', err)
    }
  }

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleDateExpanded = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }))
  }

  const deletePhoto = async (anexoId) => {
    if (window.confirm('Tem certeza que deseja deletar esta foto?')) {
      try {
        const res = await axios.delete(`/api/anexos/${anexoId}`)
        if (res.data.sucesso) {
          setError('')
          fetchAllHistory()
        }
      } catch (err) {
        setError('Erro ao deletar foto')
      }
    }
  }

  const deleteHistorico = async (historicoId, petName) => {
    if (window.confirm(`Tem certeza que deseja deletar o histórico de ${petName}? Esta ação não pode ser desfeita.`)) {
      try {
        const res = await axios.delete(`/api/historico/${historicoId}`)
        if (res.data.sucesso) {
          setError('')
          await fetchAllHistory()
          // Disparar evento para atualizar o Dashboard e Financeiro
          window.dispatchEvent(new Event('historicoDeleted'))
        } else {
          setError('Erro ao deletar histórico')
        }
      } catch (err) {
        setError('Erro ao deletar histórico: ' + (err.response?.data?.erro || err.message))
      }
    }
  }

  const generatePDF = (historicoItem) => {
    const cliente = clientes.find(c => c.id === historicoItem.clienteId)
    const pet = historicoItem.Pet
    const fotos = photosByHistorico[historicoItem.id] || []
    const dataNascimento = pet?.dataNascimento ? formatarData(pet.dataNascimento) : 'N/A'
    const dataConsulta = formatarData(historicoItem.data)
    const wl = whiteLabel || { nomeClinica: 'VetAssist' }
    const apiBaseUrl = API_BASE_URL

    // Gerar HTML das fotos
    const fotosHTML = fotos.length > 0 ? `
      <div class="section-title">📸 Fotos (${fotos.length})</div>
      <div class="photos">
        ${fotos.map(foto => `
          <div>
            <img src="${apiBaseUrl}/api/anexos/file/${foto.id}" alt="${foto.nomeArquivo}" style="max-width: 400px; margin: 10px 0; border: 1px solid #ddd; padding: 5px;" />
            <p style="font-size: 12px; color: #666;">📷 ${foto.nomeArquivo}</p>
          </div>
        `).join('')}
      </div>
    ` : ''

    // Gerar HTML da logo se existir
    const logoSrc = logoBase64 || (wl.logomarcaUrl ? getLogoUrl(wl.logomarcaUrl) : '')
    console.log('[DEBUG] Logo Base64:', !!logoBase64, 'logoBase64 length:', logoBase64?.length || 0, 'Original URL:', wl.logomarcaUrl)
    const logoHTML = logoSrc ? `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoSrc}" alt="Logo" style="max-height: 80px; max-width: 200px;" onerror="this.style.display='none'" />
      </div>
    ` : `
      <div style="text-align: center; margin-bottom: 20px; color: #0d6b3a; font-weight: bold; font-size: 24px;">
        🏥
      </div>
    `

    // Gerar HTML dos dados da clínica
    const clinicaInfoHTML = `
      <div style="background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 4px; font-size: 12px;">
        ${wl.cnpj ? `<div><strong>CNPJ:</strong> ${wl.cnpj}</div>` : ''}
        ${wl.telefone ? `<div><strong>Telefone:</strong> ${wl.telefone}</div>` : ''}
        ${wl.email ? `<div><strong>Email:</strong> ${wl.email}</div>` : ''}
        ${wl.endereco ? `<div><strong>Endereço:</strong> ${wl.endereco}${wl.cidade ? ', ' + wl.cidade : ''}${wl.estado ? ' - ' + wl.estado : ''}</div>` : ''}
      </div>
    `

    const htmlContent = `
      <html>
        <head>
          <title>Histórico - ${pet?.nome}</title>
          <style>
            /* Remove cabeçalho/rodapé automático do navegador */
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { font-family: 'Calibri', 'Arial', sans-serif; color: #333; background: white; }
            body { padding: 1.2cm 1.5cm; }

            .compact-header {
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 8px 0 10px;
              margin-bottom: 14px;
              border-bottom: 2px solid #0d6b3a;
            }
            .header-left { flex-shrink: 0; width: 90px; display: flex; align-items: center; justify-content: center; }
            .header-logo { max-height: 70px; max-width: 90px; object-fit: contain; }
            .header-logo-placeholder { font-size: 36px; color: #0d6b3a; }
            .header-center { flex: 1; min-width: 0; }
            .header-center h1 { font-size: 17px; color: #0d6b3a; margin: 0 0 2px; letter-spacing: 0.5px; line-height: 1.2; }
            .header-center .subtitle { font-size: 9px; color: #888; letter-spacing: 1px; margin-bottom: 6px; }
            .header-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10px; color: #444; line-height: 1.4; }
            .header-meta strong { color: #0d6b3a; font-weight: 600; }

            .main-content { padding: 0; }
            .consultation-section { margin-bottom: 14px; }
            .section-title { background: #0d6b3a; color: white; padding: 6px 10px; margin: 10px 0 6px; font-weight: bold; font-size: 11px; letter-spacing: 0.3px; }
            .section-content { padding: 6px 10px 8px; font-size: 11px; line-height: 1.5; }
            .photos { margin-top: 10px; }
            .photos img { max-width: 280px; margin: 6px 0; border: 1px solid #ddd; }

            .letterhead-footer { border-top: 2px solid #0d6b3a; padding: 8px 0 0; margin-top: 20px; font-size: 9px; text-align: center; color: #666; }
            .footer-info { display: flex; justify-content: center; gap: 18px; flex-wrap: wrap; }
            .footer-info strong { color: #0d6b3a; }
          </style>
        </head>
        <body>
          <div class="compact-header">
            <div class="header-left">
              ${logoSrc ? `<img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.style.display='none'" />` : `<div class="header-logo-placeholder">🏥</div>`}
            </div>
            <div class="header-center">
              <h1>${wl.nomeClinica}</h1>
              <p class="subtitle">REGISTRO DE ATENDIMENTO VETERINÁRIO</p>
              <div class="header-meta">
                <span><strong>Proprietário:</strong> ${cliente?.nome || 'N/A'}</span>
                <span><strong>Animal:</strong> ${pet?.nome} (${pet?.especie || '-'} • ${pet?.raca || '-'})</span>
              </div>
              <div class="header-meta">
                <span><strong>Data:</strong> ${dataConsulta}</span>
                <span><strong>Tipo:</strong> ${historicoItem.tipoAtendimento}</span>
                <span><strong>Nasc.:</strong> ${dataNascimento}</span>
              </div>
            </div>
          </div>

          <div class="main-content">
            <div class="consultation-section">
              ${historicoItem.diagnostico ? `<div class="section-title">Diagnóstico</div><div class="section-content">${historicoItem.diagnostico}</div>` : ''}
              ${historicoItem.procedimentos ? `<div class="section-title">Procedimentos Realizados</div><div class="section-content">${historicoItem.procedimentos}</div>` : ''}
              ${historicoItem.medicamentos ? `<div class="section-title">Medicamentos Prescritos</div><div class="section-content">${historicoItem.medicamentos}</div>` : ''}
              ${historicoItem.observacoes ? `<div class="section-title">Observações</div><div class="section-content">${historicoItem.observacoes}</div>` : ''}

              ${fotosHTML}
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

    abrirJanelaImpressao(htmlContent)
  }

  // Helper: abre janela de print e aguarda TODAS as imagens carregarem antes de imprimir
  const abrirJanelaImpressao = (htmlContent) => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) {
      alert('⚠️ Permita pop-ups para gerar o PDF.')
      return
    }
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Aguardar todas as imagens carregarem antes de imprimir
    const imagens = printWindow.document.images
    const total = imagens.length

    if (total === 0) {
      // Sem imagens, pode imprimir direto
      setTimeout(() => printWindow.print(), 300)
      return
    }

    let carregadas = 0
    let imprimiu = false

    const tentarImprimir = () => {
      if (imprimiu) return
      carregadas++
      console.log(`[DEBUG] Imagem ${carregadas}/${total} carregada`)
      if (carregadas >= total) {
        imprimiu = true
        setTimeout(() => printWindow.print(), 200)
      }
    }

    Array.from(imagens).forEach(img => {
      if (img.complete && img.naturalHeight !== 0) {
        tentarImprimir()
      } else {
        img.onload = tentarImprimir
        img.onerror = tentarImprimir // mesmo erro conta — não trava
      }
    })

    // Timeout de segurança: se em 5s não imprimiu, força o print
    setTimeout(() => {
      if (!imprimiu) {
        imprimiu = true
        console.warn('[WARN] Timeout aguardando imagens, forçando print')
        printWindow.print()
      }
    }, 5000)
  }

  const generatePDFMultiple = (historicoList) => {
    if (historicoList.length === 0) return

    const cliente = clientes.find(c => c.id === historicoList[0].clienteId)
    const pet = historicoList[0].Pet
    const dataNascimento = pet?.dataNascimento ? formatarData(pet.dataNascimento) : 'N/A'
    const wl = whiteLabel || { nomeClinica: 'VetAssist', logomarcaUrl: '', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', estado: '' }
    const apiBaseUrl = API_BASE_URL
    console.log('[DEBUG] WhiteLabel no PDF Multiple:', wl)

    // Gerar HTML da logo se existir
    const logoSrc = logoBase64 || (wl.logomarcaUrl ? getLogoUrl(wl.logomarcaUrl) : '')
    console.log('[DEBUG] Logo Base64:', !!logoBase64, 'logoBase64 length:', logoBase64?.length || 0, 'Original URL:', wl.logomarcaUrl)
    const logoHTML = logoSrc ? `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoSrc}" alt="Logo" style="max-height: 80px; max-width: 200px;" onerror="this.style.display='none'" />
      </div>
    ` : `
      <div style="text-align: center; margin-bottom: 20px; color: #0d6b3a; font-weight: bold; font-size: 24px;">
        🏥
      </div>
    `

    // Gerar HTML dos dados da clínica
    const clinicaInfoHTML = `
      <div style="background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 4px; font-size: 12px;">
        ${wl.cnpj ? `<div><strong>CNPJ:</strong> ${wl.cnpj}</div>` : ''}
        ${wl.telefone ? `<div><strong>Telefone:</strong> ${wl.telefone}</div>` : ''}
        ${wl.email ? `<div><strong>Email:</strong> ${wl.email}</div>` : ''}
        ${wl.endereco ? `<div><strong>Endereço:</strong> ${wl.endereco}${wl.cidade ? ', ' + wl.cidade : ''}${wl.estado ? ' - ' + wl.estado : ''}</div>` : ''}
      </div>
    `

    const consultasHTML = historicoList.map(item => {
      const fotos = photosByHistorico[item.id] || []
      const dataConsulta = formatarData(item.data)

      const fotosHTML = fotos.length > 0 ? `
        <div class="section-title">📸 Fotos (${fotos.length})</div>
        <div class="photos">
          ${fotos.map(foto => `
            <div>
              <img src="${apiBaseUrl}/api/anexos/file/${foto.id}" alt="${foto.nomeArquivo}" style="max-width: 400px; margin: 10px 0; border: 1px solid #ddd; padding: 5px;" />
              <p style="font-size: 12px; color: #666;">📷 ${foto.nomeArquivo}</p>
            </div>
          `).join('')}
        </div>
      ` : ''

      const logoMiniHTML = logoSrc
        ? `<img src="${logoSrc}" alt="Logo" class="header-logo" onerror="this.style.display='none'" />`
        : `<div class="header-logo-placeholder">🏥</div>`

      return `
        <div class="page-break">
          <div class="letterhead-page">
            <!-- Cabeçalho compacto: apenas logo + clínica -->
            <div class="compact-header">
              <div class="header-left">
                ${logoMiniHTML}
              </div>
              <div class="header-center">
                <h1>${wl.nomeClinica}</h1>
                <p class="subtitle">REGISTRO DE ATENDIMENTO VETERINÁRIO</p>
              </div>
            </div>

            <!-- Espaço em branco para anotações manuscritas -->
            <div class="main-content">
              <div class="blank-notes-space"></div>
              <div class="consultation-section">
                ${item.diagnostico ? `<div class="section-title">Diagnóstico</div><div class="section-content">${item.diagnostico}</div>` : ''}
                ${item.procedimentos ? `<div class="section-title">Procedimentos Realizados</div><div class="section-content">${item.procedimentos}</div>` : ''}
                ${item.medicamentos ? `<div class="section-title">Medicamentos Prescritos</div><div class="section-content">${item.medicamentos}</div>` : ''}
                ${item.observacoes ? `<div class="section-title">Observações</div><div class="section-content">${item.observacoes}</div>` : ''}

                ${fotosHTML}
              </div>
            </div>

            <!-- Rodapé com informações do atendimento -->
            <div class="letterhead-footer">
              <div class="consultation-info">
                <span><strong>Proprietário:</strong> ${cliente?.nome || 'N/A'}</span>
                <span><strong>Animal:</strong> ${pet?.nome} (${pet?.especie || '-'} • ${pet?.raca || '-'})</span>
                <span><strong>Data:</strong> ${dataConsulta}</span>
                <span><strong>Horário:</strong> ${new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span><strong>Tipo:</strong> ${item.tipoAtendimento}</span>
              </div>
              <div class="footer-info">
                ${wl.cnpj ? `<div><strong>CNPJ:</strong> ${wl.cnpj}</div>` : ''}
                ${wl.telefone ? `<div><strong>Telefone:</strong> ${wl.telefone}</div>` : ''}
                ${wl.email ? `<div><strong>Email:</strong> ${wl.email}</div>` : ''}
              </div>
              ${wl.endereco ? `<p style="margin-top: 4px;">${wl.endereco}${wl.cidade ? ', ' + wl.cidade : ''}${wl.estado ? ' - ' + wl.estado : ''}</p>` : ''}
              <p style="margin-top: 4px; font-size: 9px;">Valor: R$ ${item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}</p>
            </div>
          </div>
        </div>
      `
    }).join('')

    const htmlContent = `
      <html>
        <head>
          <title>Histórico Completo - ${pet?.nome}</title>
          <style>
            /* Remove cabeçalho/rodapé automático do navegador */
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              font-family: 'Calibri', 'Arial', sans-serif;
              color: #333;
              background: white;
            }
            body { padding: 1.2cm 1.5cm; }

            /* ====== CABEÇALHO COMPACTO (max ~12% da página) ====== */
            .compact-header {
              display: flex;
              align-items: center;
              gap: 20px;
              padding: 15px 20px;
              margin-bottom: 20px;
              border-bottom: 2px solid #0d6b3a;
            }
            .header-left {
              flex-shrink: 0;
              width: 90px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .header-logo {
              max-height: 70px;
              max-width: 90px;
              object-fit: contain;
            }
            .header-logo-placeholder {
              font-size: 36px;
              color: #0d6b3a;
            }
            .header-center {
              flex: 1;
              min-width: 0;
            }
            .header-center h1 {
              font-size: 18px;
              color: #0d6b3a;
              margin: 0 0 2px;
              letter-spacing: 0.5px;
              line-height: 1.2;
              font-weight: 700;
            }
            .header-center .subtitle {
              font-size: 8px;
              color: #888;
              letter-spacing: 1px;
              margin: 0;
              font-weight: 600;
            }
            .header-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              font-size: 10px;
              color: #444;
              line-height: 1.4;
            }
            .header-meta strong { color: #0d6b3a; font-weight: 600; }

            /* ====== CONTEÚDO PRINCIPAL ====== */
            .main-content { padding: 0; }
            .blank-notes-space {
              min-height: 200px;
              border: 1px dashed #ddd;
              border-radius: 4px;
              padding: 20px;
              margin-bottom: 20px;
              background-color: #fafafa;
              text-align: center;
              color: #aaa;
              font-size: 12px;
              font-style: italic;
            }
            .blank-notes-space::before {
              content: 'Espaço para anotações manuscritas';
              display: block;
            }
            .consultation-section { margin-bottom: 14px; }
            .section-title {
              background: #0d6b3a;
              color: white;
              padding: 6px 10px;
              margin: 10px 0 6px;
              font-weight: bold;
              font-size: 11px;
              letter-spacing: 0.3px;
            }
            .section-content {
              padding: 6px 10px 8px;
              font-size: 11px;
              line-height: 1.5;
            }

            .photos { margin-top: 10px; }
            .photos img { max-width: 280px; margin: 6px 0; border: 1px solid #ddd; }

            /* ====== RODAPÉ ====== */
            .letterhead-footer {
              border-top: 2px solid #0d6b3a;
              padding: 12px 20px 8px;
              margin-top: auto;
              font-size: 9px;
              color: #666;
              background-color: #f9f9f9;
            }
            .consultation-info {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e0e0e0;
              font-size: 9px;
              line-height: 1.4;
            }
            .consultation-info span {
              flex: 0 1 auto;
            }
            .consultation-info strong { color: #0d6b3a; font-weight: 600; }
            .footer-info {
              display: flex;
              justify-content: center;
              gap: 18px;
              flex-wrap: wrap;
              margin: 8px 0 4px;
            }
            .footer-info strong { color: #0d6b3a; }

            /* ====== CAPA (página única) ====== */
            .info-capa {
              text-align: center;
              padding: 60px 20px;
              min-height: 90vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-after: always;
              break-after: page;
            }
            .info-capa img { max-height: 150px; margin-bottom: 30px; }
            .info-capa h1 { font-size: 36px; color: #0d6b3a; margin: 30px 0 20px; letter-spacing: 1px; }
            .info-capa p { font-size: 16px; color: #555; margin: 8px 0; }
            .info-capa .capa-footer { margin-top: 50px; font-size: 13px; color: #999; }

            /* ====== QUEBRAS DE PÁGINA ====== */
            .page-break {
              page-break-after: always;
              break-after: page;
              page-break-inside: avoid;
              break-inside: avoid;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
              height: 100%;
            }
            .page-break:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .letterhead-page {
              page-break-inside: avoid;
              break-inside: avoid;
              display: flex;
              flex-direction: column;
              min-height: 100%;
              justify-content: space-between;
            }

            @media print {
              .info-capa { min-height: 95vh; }
            }
          </style>
        </head>
        <body>
          <div class="info-capa">
            ${logoHTML}
            <h1>HISTÓRICO CLÍNICO COMPLETO</h1>
            <p>Paciente: <strong>${pet?.nome}</strong></p>
            <p>Total de Consultas: <strong>${historicoList.length}</strong></p>
            <p class="capa-footer">Proprietário: ${cliente?.nome || 'N/A'}</p>
            <p class="capa-footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          ${consultasHTML}
        </body>
      </html>
    `

    abrirJanelaImpressao(htmlContent)
  }

  // Obter datas únicas ordenadas (mais recentes primeiro)
  const uniqueDates = Object.keys(groupedByDate).sort().reverse()

  if (loading) return <div className="loading">Carregando histórico...</div>

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📋 Histórico Finalizado</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="selector-container">
        <div className="cliente-selector">
          <label>Filtrar por Proprietário (Opcional):</label>
          <select
            value={selectedClienteId}
            onChange={(e) => setSelectedClienteId(e.target.value)}
            className="selector-dropdown"
          >
            <option value="">-- Todos os Proprietários --</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                👤 {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        {selectedClienteId && (
          <div className="pet-selector">
            <label>Filtrar por Animal (Opcional):</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <select
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                className="selector-dropdown"
                style={{ flex: 1 }}
              >
                <option value="">-- Todos os Animais --</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>
                    🐾 {pet.nome} ({pet.especie})
                  </option>
                ))}
              </select>
              {selectedPetId && filteredHistory.length > 0 && (
                <button
                  className="btn-pdf"
                  onClick={() => generatePDFMultiple(filteredHistory)}
                  style={{
                    whiteSpace: 'nowrap',
                    marginBottom: 0,
                    padding: '0.6rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  📄 Gerar PDF Global
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modo de Filtro: Lista Cronológica por Animal/Proprietário */}
      {selectedPetId && filteredHistory.length > 0 && (
        <div className="filtered-list-view">
          <div className="history-list">
            {filteredHistory.map(item => (
              <div key={item.id} className="history-card">
                <div
                  className="card-header"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '1.5rem' }}
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="card-title" style={{ flex: 1 }}>
                    <span className="toggle-icon">
                      {expandedId === item.id ? '▼' : '▶'}
                    </span>
                    <span className="date">
                      {formatarData(item.data)}
                    </span>
                    <span className="time">
                      {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="type">{item.tipoAtendimento}</span>
                    <span className="client-name">
                      👤 {item.Cliente?.nome}
                    </span>
                    <span className="animal">
                      🐾 {item.Pet?.nome}
                    </span>
                    <span className="valor">
                      R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-pdf"
                      onClick={() => generatePDF(item)}
                      title="Gerar PDF"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      📄 Gerar PDF
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => deleteHistorico(item.id, item.Pet?.nome)}
                      title="Apagar Histórico"
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="card-content">
                    <div className="content-section">
                      <strong>Data da Consulta:</strong> {formatarDataComDia(item.data)}
                    </div>

                    {item.diagnostico && (
                      <div className="content-section">
                        <strong>Diagnóstico:</strong>
                        <p>{item.diagnostico}</p>
                      </div>
                    )}

                    {item.procedimentos && (
                      <div className="content-section">
                        <strong>Procedimentos:</strong>
                        <p>{item.procedimentos}</p>
                      </div>
                    )}

                    {item.medicamentos && (
                      <div className="content-section">
                        <strong>Medicamentos:</strong>
                        <p>{item.medicamentos}</p>
                      </div>
                    )}

                    {item.observacoes && (
                      <div className="content-section">
                        <strong>Observações:</strong>
                        <p>{item.observacoes}</p>
                      </div>
                    )}

                    <div className="content-section">
                      <strong>Valor:</strong> R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </div>

                    {photosByHistorico[item.id] && photosByHistorico[item.id].length > 0 && (
                      <div className="photos-section">
                        <strong>📸 Fotos ({photosByHistorico[item.id].length})</strong>
                        <div className="photos-grid">
                          {photosByHistorico[item.id].map(foto => (
                            <div key={foto.id} className="photo-item">
                              <img
                                src={`/api/anexos/file/${foto.id}`}
                                alt={foto.nomeArquivo}
                                className="photo-thumbnail"
                              />
                              <button
                                className="btn-delete-photo"
                                onClick={() => deletePhoto(foto.id)}
                                title="Deletar foto"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modo de Filtro: Sem resultados */}
      {selectedPetId && filteredHistory.length === 0 && (
        <div className="empty-message">
          <p>Nenhuma consulta finalizada para este animal</p>
        </div>
      )}

      {/* Modo Normal: Todas as Datas com Toggle (quando nenhum animal é selecionado) */}
      {!selectedPetId && uniqueDates.length > 0 && (
        <div className="all-dates-accordion">
          {uniqueDates.map(date => (
            <div key={date} className="date-accordion-item">
              {/* Header da Data */}
              <div className="date-accordion-header" onClick={() => toggleDateExpanded(date)}>
                <button
                  className="toggle-date-btn"
                  title={expandedDates[date] ? 'Recolher' : 'Expandir'}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDateExpanded(date)
                  }}
                >
                  {expandedDates[date] ? '▼' : '▶'}
                </button>
                <span className="date-label">{formatarDataComDia(date)}</span>
                <span className="count-badge">{groupedByDate[date].length}</span>
              </div>

              {/* Conteúdo do Histórico da Data */}
              {expandedDates[date] && groupedByDate[date] && (
                <div className="history-list">
                  {groupedByDate[date].length === 0 ? (
                    <div className="empty-message">
                      <p>Nenhuma consulta finalizada neste período</p>
                    </div>
                  ) : (
                    groupedByDate[date].map(item => (
              <div key={item.id} className="history-card">
                <div
                  className="card-header"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '1.5rem' }}
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="card-title" style={{ flex: 1 }}>
                    <span className="toggle-icon">
                      {expandedId === item.id ? '▼' : '▶'}
                    </span>
                    <span className="time">
                      {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="type">{item.tipoAtendimento}</span>
                    <span className="client-name">
                      👤 {item.Cliente?.nome}
                    </span>
                    <span className="animal">
                      🐾 {item.Pet?.nome}
                    </span>
                    <span className="valor">
                      R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-pdf"
                      onClick={() => generatePDF(item)}
                      title="Gerar PDF"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      📄 Gerar PDF
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => deleteHistorico(item.id, item.Pet?.nome)}
                      title="Apagar Histórico"
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="card-content">
                    {item.diagnostico && (
                      <div className="content-section">
                        <strong>Diagnóstico:</strong>
                        <p>{item.diagnostico}</p>
                      </div>
                    )}

                    {item.procedimentos && (
                      <div className="content-section">
                        <strong>Procedimentos:</strong>
                        <p>{item.procedimentos}</p>
                      </div>
                    )}

                    {item.medicamentos && (
                      <div className="content-section">
                        <strong>Medicamentos:</strong>
                        <p>{item.medicamentos}</p>
                      </div>
                    )}

                    {item.observacoes && (
                      <div className="content-section">
                        <strong>Observações:</strong>
                        <p>{item.observacoes}</p>
                      </div>
                    )}

                    <div className="content-section">
                      <strong>Valor:</strong> R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                    </div>

                    {photosByHistorico[item.id] && photosByHistorico[item.id].length > 0 && (
                      <div className="photos-section">
                        <strong>📸 Fotos ({photosByHistorico[item.id].length})</strong>
                        <div className="photos-grid">
                          {photosByHistorico[item.id].map(foto => (
                            <div key={foto.id} className="photo-item">
                              <img
                                src={`/api/anexos/file/${foto.id}`}
                                alt={foto.nomeArquivo}
                                className="photo-thumbnail"
                              />
                              <button
                                className="btn-delete-photo"
                                onClick={() => deletePhoto(foto.id)}
                                title="Deletar foto"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!selectedPetId && allHistory.length === 0 && (
        <div className="empty-message">
          <p>Nenhuma consulta finalizada no histórico</p>
        </div>
      )}
    </div>
  )
}
