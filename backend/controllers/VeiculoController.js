import { Veiculo } from '../models/index.js'
import axios from 'axios'
import { buscarDadosVeiculo, obterTodasAsMarcas, obterModelosPorMarca, obterConsumoDoVeiculo } from '../services/VeiculoService.js'

export const obterVeiculo = async (req, res) => {
  try {
    // Multi-tenancy: o id vem do token JWT (o :veterinarioId da rota é ignorado)
    const veterinarioId = req.veterinario.id
    const veiculo = await Veiculo.findOne({ where: { veterinarioId } })
    res.json({ sucesso: true, data: veiculo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarVeiculo = async (req, res) => {
  try {
    const { placa, marca, modelo, ano, combustivel, kmAtual } = req.body
    const veterinarioId = req.veterinario.id

    // Buscar dados do veículo na API externa (Fipe)
    let consumoMedio = null
    try {
      const dadosVeiculo = await buscarDadosVeiculo(marca, modelo, ano)
      consumoMedio = dadosVeiculo?.consumoMedio
    } catch (err) {
      console.log('Não foi possível buscar dados do veículo automaticamente')
    }

    const veiculo = await Veiculo.create({
      veterinarioId,
      placa,
      marca,
      modelo,
      ano,
      combustivel,
      kmAtual,
      consumoMedio: consumoMedio || null
    })

    res.status(201).json({ sucesso: true, mensagem: 'Veículo cadastrado!', data: veiculo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarVeiculo = async (req, res) => {
  try {
    const veiculo = await Veiculo.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!veiculo) return res.status(404).json({ sucesso: false, erro: 'Veículo não encontrado' })

    const dados = { ...req.body }
    delete dados.veterinarioId
    await veiculo.update(dados)
    res.json({ sucesso: true, mensagem: 'Veículo atualizado!', data: veiculo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const calcularCustoKm = async (req, res) => {
  try {
    const { veiculoId } = req.params
    const veiculo = await Veiculo.findOne({
      where: { id: veiculoId, veterinarioId: req.veterinario.id }
    })

    if (!veiculo) return res.status(404).json({ sucesso: false, erro: 'Veículo não encontrado' })

    // Preço do combustível: o definido pelo veterinário tem prioridade; senão, média de mercado
    const precoDefinido = parseFloat(veiculo.precoCombustivel) || 0
    const precoCombustivel = precoDefinido > 0
      ? precoDefinido
      : await buscarPrecoCombustivel(veiculo.combustivel)

    // Base do cálculo: km rodados POR MÊS a trabalho (não o odômetro!)
    const kmMensal = parseFloat(veiculo.kmMensal) || 0
    const consumoMedio = parseFloat(veiculo.consumoMedio) || 0

    // % do uso do veículo que é profissional — rateia os custos fixos
    // (combustível não rateia: o kmMensal já é só o km de trabalho)
    const percentualUso = Math.min(100, Math.max(0, parseInt(veiculo.percentualUsoProfissional) || 100)) / 100

    // Custo variável: combustível dos km de trabalho do mês
    const custoCombustivel = (consumoMedio > 0 && kmMensal > 0)
      ? (kmMensal / consumoMedio) * precoCombustivel
      : 0

    // Custos fixos mensais (rateados pelo % de uso profissional)
    const custoSeguroMensal = (parseFloat(veiculo.valorSeguroMensal) || 0) * percentualUso
    const custoIPVAMensal = ((parseFloat(veiculo.valorIPVAAnual) || 0) / 12) * percentualUso
    const custoManutencaoMensal = (parseFloat(veiculo.custoManutencaoEstimado) || 0) * percentualUso
    const custoDepreciacaoMensal = calcularDepreciacao(veiculo.valorAquisicao, veiculo.dataAquisicao) * percentualUso

    const totalCustoMensal = custoCombustivel + custoSeguroMensal + custoIPVAMensal + custoManutencaoMensal + custoDepreciacaoMensal
    const custoKm = (kmMensal > 0) ? (totalCustoMensal / kmMensal) : 0

    res.json({
      sucesso: true,
      data: {
        custoCombustivel,
        custoSeguroMensal,
        custoIPVAMensal,
        custoManutencaoMensal,
        custoDepreciacaoMensal,
        totalCustoMensal,
        custoKm: custoKm.toFixed(2),
        kmMensal,
        percentualUsoProfissional: percentualUso * 100,
        precoCombustivelLitro: precoCombustivel,
        // Sinaliza ao frontend que falta configurar o km mensal (cálculo incompleto)
        configuracaoPendente: kmMensal <= 0
      }
    })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

async function buscarPrecoCombustivel(tipo) {
  try {
    // Usando API do banco Central do Brasil (ou outra fonte)
    // Por simplicidade, vou usar valores médios do mercado
    const precos = {
      'Gasolina': 5.50,
      'Diesel': 6.50,
      'Etanol': 3.50,
      'GNV': 5.00
    }
    return precos[tipo] || 5.50
  } catch (err) {
    return 5.50
  }
}

function calcularDepreciacao(valorAquisicao, dataAquisicao) {
  if (!valorAquisicao || !dataAquisicao) return 0

  // Depreciação estimada: 0.8% do valor de aquisição ao mês (depreciação mensal constante)
  // Não depende de quantos meses passaram - é o valor que perde por mês
  const depreciacao = parseFloat(valorAquisicao) * 0.008
  return depreciacao
}

export const buscarMarcas = async (req, res) => {
  try {
    const marcas = await obterTodasAsMarcas()
    res.json({ sucesso: true, data: marcas })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const buscarModelosPorMarca = async (req, res) => {
  try {
    const { marca } = req.params
    const modelos = await obterModelosPorMarca(marca)
    res.json({ sucesso: true, data: modelos })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const buscarDadosVeiculoPorPlaca = async (req, res) => {
  try {
    const { placa } = req.body
    const resultado = await buscarDadosVeiculo(placa)
    res.json(resultado)
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const buscarConsumoMedioPorModelo = async (req, res) => {
  try {
    const { marca, modelo } = req.params
    const consumo = obterConsumoDoVeiculo(marca, modelo)

    if (consumo) {
      res.json({
        sucesso: true,
        data: {
          marca,
          modelo,
          consumoMedio: consumo
        }
      })
    } else {
      res.json({
        sucesso: false,
        erro: 'Modelo não encontrado na base de dados'
      })
    }
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
