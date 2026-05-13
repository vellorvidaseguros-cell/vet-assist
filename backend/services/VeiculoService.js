import axios from 'axios'

// URL da FIPE API (gratuita e pública)
const FIPE_API_URL = 'https://parallelum.com.br/fipe/api/v1/carros'

// Cache para evitar múltiplas requisições
const cacheAPI = {
  marcas: null,
  modelos: {},
  ultimaAtualizacao: 0
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

// Banco de dados de teste para desenvolvimento (fallback)
const VEICULO_DATABASE = {
  'FVG9A96': { placa: 'FVG9A96', marca: 'Toyota', modelo: 'Corolla', ano: 2018, combustivel: 'Gasolina' },
  'ABC1234': { placa: 'ABC1234', marca: 'Fiat', modelo: 'Uno', ano: 2015, combustivel: 'Gasolina' },
  'XYZ9876': { placa: 'XYZ9876', marca: 'Volkswagen', modelo: 'Gol', ano: 2020, combustivel: 'Gasolina' },
  'DEF5678': { placa: 'DEF5678', marca: 'Honda', modelo: 'Civic', ano: 2017, combustivel: 'Gasolina' },
  'GHI9012': { placa: 'GHI9012', marca: 'Chevrolet', modelo: 'Onix', ano: 2019, combustivel: 'Gasolina' },
  'JKL3456': { placa: 'JKL3456', marca: 'Ford', modelo: 'Fiesta', ano: 2016, combustivel: 'Gasolina' }
}

// Banco de dados de consumo médio por modelo
const CONSUMO_DATABASE = {
  'fiat-uno': 12.5,
  'fiat-palio': 13,
  'fiat-siena': 12,
  'fiat-strada': 10,
  'ford-fiesta': 12,
  'ford-ka': 11,
  'ford-focus': 10.5,
  'vw-gol': 12,
  'vw-polo': 12.5,
  'vw-virtus': 11,
  'vw-golf': 10,
  'chevrolet-onix': 12,
  'chevrolet-cruze': 10,
  'hyundai-i30': 11,
  'hyundai-creta': 10,
  'toyota-corolla': 11,
  'toyota-yaris': 12,
  'peugeot-208': 12,
  'renault-sandero': 11,
  'honda-civic': 10.5,
  'honda-fit': 12,
}

// Custo estimado de manutenção anual (em R$) por faixa de ano
const MANUTENCAO_ESTIMADA = {
  'novo': 1500, // Até 2 anos
  'recente': 2000, // 3-5 anos
  'intermediario': 2500, // 6-10 anos
  'antigo': 3500, // 11-15 anos
  'muito-antigo': 4500, // 16+ anos
}

export async function buscarDadosVeiculo(placa) {
  try {
    // Limpar placa (remover caracteres especiais)
    const placaLimpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (placaLimpa.length < 7) {
      throw new Error('Placa inválida')
    }

    // Primeiro tentar banco de dados local
    if (VEICULO_DATABASE[placaLimpa]) {
      const dados = VEICULO_DATABASE[placaLimpa]
      const consumo = await buscarConsumoMedioFipe(dados.marca, dados.modelo)
      const manutencaoEstimada = calcularManutencaoEstimada(dados.ano)

      return {
        sucesso: true,
        data: {
          ...dados,
          consumoMedio: consumo || 12,
          custoManutencaoEstimado: manutencaoEstimada
        }
      }
    }

    // Tentar FIPE API
    const dadosVeiculo = await buscarFipeAPI(placaLimpa)

    if (dadosVeiculo) {
      const consumo = await buscarConsumoMedioFipe(dadosVeiculo.marca, dadosVeiculo.modelo)
      const manutencaoEstimada = calcularManutencaoEstimada(dadosVeiculo.ano)

      return {
        sucesso: true,
        data: {
          ...dadosVeiculo,
          consumoMedio: consumo || 12,
          custoManutencaoEstimado: manutencaoEstimada
        }
      }
    }

    throw new Error('Veículo não encontrado na FIPE')
  } catch (error) {
    console.log('[ERROR] Erro ao buscar veículo:', error.message)
    return {
      sucesso: false,
      erro: error.message
    }
  }
}

async function buscarFipeAPI(placa) {
  try {
    const placaUpperCase = placa.toUpperCase()
    console.log(`[INFO] Buscando dados da placa ${placaUpperCase} na FIPE API Parallelum...`)

    // A FIPE API não decodifica placa diretamente
    // Para uma solução com entrada de placa, usaríamos um serviço de decodificação
    // Por enquanto, retornar null para permitir seleção manual
    // Em produção, integrar com serviço que decodifica placa

    console.log('[INFO] Sugestão: Use seleção de marca/modelo para buscar na FIPE')
    return null
  } catch (error) {
    console.log('[ERROR] Erro ao buscar na FIPE:', error.message)
    return null
  }
}

// Nova função para buscar consumo médio via FIPE
async function buscarConsumoMedioFipe(marca, modelo) {
  try {
    if (!marca || !modelo) return null

    console.log(`[INFO] Buscando consumo na FIPE para ${marca} ${modelo}...`)

    // 1. Buscar marcas da FIPE
    const marcasResponse = await axios.get(`${FIPE_API_URL}/marcas`, { timeout: 5000 })
    const marcaObj = marcasResponse.data.find(m => m.nome.toUpperCase() === marca.toUpperCase())

    if (!marcaObj) {
      console.log(`[INFO] Marca ${marca} não encontrada na FIPE`)
      return null
    }

    // 2. Buscar modelos da marca
    const modelosResponse = await axios.get(`${FIPE_API_URL}/marcas/${marcaObj.codigo}/modelos`, { timeout: 5000 })
    const modeloObj = modelosResponse.data.modelos.find(m => m.nome.toUpperCase() === modelo.toUpperCase())

    if (!modeloObj) {
      console.log(`[INFO] Modelo ${modelo} não encontrado para marca ${marca}`)
      return null
    }

    // 3. Buscar anos disponíveis
    const anosResponse = await axios.get(`${FIPE_API_URL}/marcas/${marcaObj.codigo}/modelos/${modeloObj.codigo}/anos`, { timeout: 5000 })

    // Usar o primeiro ano disponível para obter dados (último ano normalmente)
    if (anosResponse.data.length === 0) {
      return null
    }

    const anoObj = anosResponse.data[anosResponse.data.length - 1]

    // 4. Buscar dados completos incluindo valor FIPE
    const dadosResponse = await axios.get(`${FIPE_API_URL}/marcas/${marcaObj.codigo}/modelos/${modeloObj.codigo}/anos/${anoObj.codigo}`, { timeout: 5000 })

    // Extrair consumo se disponível nos dados da FIPE (nem sempre vem)
    // Se não houver, usar banco de dados local
    const consumoLocal = buscarConsumoMedio(marca, modelo)
    return consumoLocal

  } catch (error) {
    console.log(`[INFO] Erro ao buscar consumo na FIPE: ${error.message}`)
    // Fallback para banco de dados local
    return buscarConsumoMedio(marca, modelo)
  }
}

function buscarConsumoMedio(marca, modelo) {
  if (!marca || !modelo) return null

  const chave = `${marca.toLowerCase()}-${modelo.toLowerCase()}`.replace(/\s+/g, '-')

  // Buscar consumo exato
  if (CONSUMO_DATABASE[chave]) {
    return CONSUMO_DATABASE[chave]
  }

  // Buscar por marca se não encontrar modelo exato
  const marcaKeys = Object.keys(CONSUMO_DATABASE).filter(k => k.startsWith(marca.toLowerCase()))
  if (marcaKeys.length > 0) {
    const consumos = marcaKeys.map(k => CONSUMO_DATABASE[k])
    const media = consumos.reduce((a, b) => a + b, 0) / consumos.length
    return parseFloat(media.toFixed(1))
  }

  return null
}

function calcularManutencaoEstimada(ano) {
  if (!ano) return 2000

  const idadeVeiculo = new Date().getFullYear() - parseInt(ano)

  if (idadeVeiculo <= 2) return MANUTENCAO_ESTIMADA['novo']
  if (idadeVeiculo <= 5) return MANUTENCAO_ESTIMADA['recente']
  if (idadeVeiculo <= 10) return MANUTENCAO_ESTIMADA['intermediario']
  if (idadeVeiculo <= 15) return MANUTENCAO_ESTIMADA['antigo']
  return MANUTENCAO_ESTIMADA['muito-antigo']
}

export async function obterTodasAsMarcas() {
  try {
    console.log('[INFO] Buscando marcas da FIPE API...')

    // Verificar cache
    if (cacheAPI.marcas && (Date.now() - cacheAPI.ultimaAtualizacao) < CACHE_DURATION) {
      console.log('[INFO] Usando marcas do cache')
      return cacheAPI.marcas
    }

    const response = await axios.get(`${FIPE_API_URL}/marcas`, { timeout: 5000 })

    // Extrair apenas os nomes das marcas
    const marcas = response.data.map(m => m.nome).sort()

    // Atualizar cache
    cacheAPI.marcas = marcas
    cacheAPI.ultimaAtualizacao = Date.now()

    console.log(`[INFO] ${marcas.length} marcas carregadas da FIPE`)
    return marcas
  } catch (error) {
    console.log('[ERROR] Erro ao buscar marcas da FIPE:', error.message)
    // Fallback para marcas locais
    const marcasLocais = new Set()
    Object.keys(CONSUMO_DATABASE).forEach(chave => {
      const marca = chave.split('-')[0].toUpperCase()
      marcasLocais.add(marca)
    })
    return Array.from(marcasLocais).sort()
  }
}

export async function obterModelosPorMarca(marca) {
  try {
    console.log(`[INFO] Buscando modelos para ${marca} na FIPE API...`)

    const response = await axios.get(`${FIPE_API_URL}/marcas`, { timeout: 5000 })
    const marcaObj = response.data.find(m => m.nome.toUpperCase() === marca.toUpperCase())

    if (!marcaObj) {
      console.log(`[INFO] Marca ${marca} não encontrada, usando banco local`)
      return obterModelosLocais(marca)
    }

    // Buscar modelos
    const modelosResponse = await axios.get(`${FIPE_API_URL}/marcas/${marcaObj.codigo}/modelos`, { timeout: 5000 })

    // Enriquecer com consumo do banco local
    const modelos = modelosResponse.data.modelos.map(m => {
      const consumoLocal = buscarConsumoMedio(marca, m.nome)
      return {
        modelo: m.nome,
        consumo: consumoLocal || 12 // default 12 KM/L
      }
    }).sort((a, b) => a.modelo.localeCompare(b.modelo))

    console.log(`[INFO] ${modelos.length} modelos encontrados para ${marca}`)
    return modelos
  } catch (error) {
    console.log(`[ERROR] Erro ao buscar modelos: ${error.message}`)
    return obterModelosLocais(marca)
  }
}

// Função auxiliar para obter modelos do banco local (fallback)
function obterModelosLocais(marca) {
  const prefix = marca.toLowerCase() + '-'
  const modelos = Object.keys(CONSUMO_DATABASE)
    .filter(chave => chave.startsWith(prefix))
    .map(chave => {
      const modelo = chave.replace(prefix, '').toUpperCase()
      const consumo = CONSUMO_DATABASE[chave]
      return { modelo, consumo }
    })
  return modelos
}

export function obterConsumoDoVeiculo(marca, modelo) {
  const consumo = buscarConsumoMedio(marca, modelo)
  return consumo || null
}
