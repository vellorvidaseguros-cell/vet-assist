import { Veiculo } from '../models/index.js'
import axios from 'axios'
import { buscarDadosVeiculo, obterTodasAsMarcas, obterModelosPorMarca, obterConsumoDoVeiculo } from '../services/VeiculoService.js'

export const obterVeiculo = async (req, res) => {
  try {
    const { veterinarioId } = req.params
    const veiculo = await Veiculo.findOne({ where: { veterinarioId } })
    res.json({ sucesso: true, data: veiculo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarVeiculo = async (req, res) => {
  try {
    const { veterinarioId, placa, marca, modelo, ano, combustivel, kmAtual } = req.body

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
    const veiculo = await Veiculo.findByPk(req.params.id)
    if (!veiculo) return res.status(404).json({ sucesso: false, erro: 'Veículo não encontrado' })

    await veiculo.update(req.body)
    res.json({ sucesso: true, mensagem: 'Veículo atualizado!', data: veiculo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const calcularCustoKm = async (req, res) => {
  try {
    const { veiculoId } = req.params
    const veiculo = await Veiculo.findByPk(veiculoId)

    if (!veiculo) return res.status(404).json({ sucesso: false, erro: 'Veículo não encontrado' })

    // Buscar preço do combustível
    const precoCombustivel = await buscarPrecoCombustivel(veiculo.combustivel)

    // Calcular custos mensais
    const custoCombuivel = (veiculo.kmAtual / veiculo.consumoMedio) * precoCombustivel
    const custoSeguroMensal = veiculo.valorSeguroMensal || 0
    const custoManutencaoMensal = veiculo.custoManutencaoEstimado || 0
    const custoDepreciacaoMensal = calcularDepreciacao(veiculo.valorAquisicao, veiculo.dataAquisicao)

    const totalCustoMensal = custoCombuivel + custoSeguroMensal + custoManutencaoMensal + custoDepreciacaoMensal
    const custoKm = totalCustoMensal / veiculo.kmAtual

    res.json({
      sucesso: true,
      data: {
        custoCombuivel,
        custoSeguroMensal,
        custoManutencaoMensal,
        custoDepreciacaoMensal,
        totalCustoMensal,
        custoKm: custoKm.toFixed(2),
        precoCombustivelLitro: precoCombustivel
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

  const mesesUsado = Math.floor(
    (new Date() - new Date(dataAquisicao)) / (1000 * 60 * 60 * 24 * 30)
  )

  // Depreciação estimada: 0.8% ao mês
  const depreciacao = (valorAquisicao * 0.008) / Math.max(mesesUsado, 1)
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
