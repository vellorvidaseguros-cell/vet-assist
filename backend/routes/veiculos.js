import express from 'express'
import {
  obterVeiculo,
  criarVeiculo,
  atualizarVeiculo,
  calcularCustoKm,
  buscarMarcas,
  buscarModelosPorMarca,
  buscarDadosVeiculoPorPlaca,
  buscarConsumoMedioPorModelo
} from '../controllers/VeiculoController.js'

const router = express.Router()

// Rotas de consulta de dados de veículos
router.get('/dados/marcas', buscarMarcas)
router.get('/dados/modelos/:marca', buscarModelosPorMarca)
router.post('/dados/buscar-placa', buscarDadosVeiculoPorPlaca)
router.get('/dados/consumo/:marca/:modelo', buscarConsumoMedioPorModelo)

// Rotas de CRUD de veículos do usuário
router.get('/:veterinarioId', obterVeiculo)
router.post('/', criarVeiculo)
router.put('/:id', atualizarVeiculo)
router.get('/:veiculoId/custo-km', calcularCustoKm)

export default router
