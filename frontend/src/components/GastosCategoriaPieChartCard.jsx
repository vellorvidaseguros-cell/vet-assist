import { useState } from 'react'
import GastosCategoriaPieChartModal from './GastosCategoriaPieChartModal'
import './GastosCategoriaPieChartCard.css'

export default function GastosCategoriaPieChartCard({ porCategoria, totalGastos }) {
  const [showModal, setShowModal] = useState(false)

  // Cores para as categorias
  const CORES = {
    'Aluguel': '#1a5f3f',
    'Equipamentos': '#2d7a4a',
    'Medicamentos': '#3d9456',
    'Produtos': '#4caf50',
    'Energia': '#7cb342',
    'Água': '#9ccc65',
    'Internet': '#667eea',
    'Telefone': '#5568d3',
    'Transporte': '#764ba2',
    'Manutenção': '#d946ef',
    'Seguro': '#ec4899',
    'Salários': '#f43f5e',
    'Impostos': '#f97316',
    'Outro': '#999999'
  }

  // Preparar dados para o gráfico
  const dados = Object.entries(porCategoria || {}).map(([categoria, valor]) => ({
    name: categoria,
    value: parseFloat(valor)
  }))

  const dadosOrdenados = dados.sort((a, b) => b.value - a.value)

  // Cor customizada para cada categoria
  const getCor = (categoria) => {
    return CORES[categoria] || '#999'
  }

  // Calcular ângulos para o gráfico de pizza
  const calcularArco = () => {
    if (!totalGastos || totalGastos === 0) return []

    let inicio = 0
    return dadosOrdenados.map((item) => {
      const percentual = item.value / totalGastos
      const angulo = percentual * 360
      const fim = inicio + angulo
      const arco = {
        ...item,
        inicio,
        fim,
        angulo,
        percentual
      }
      inicio = fim
      return arco
    })
  }

  // Converter ângulo para coordenadas
  const anguloParaCoordenadas = (angulo, raio = 40) => {
    const radianos = (angulo - 90) * (Math.PI / 180)
    return {
      x: 60 + raio * Math.cos(radianos),
      y: 60 + raio * Math.sin(radianos)
    }
  }

  // Desenhar um segmento da pizza
  const desenharArco = (arco) => {
    const raio = 40
    const inicio = anguloParaCoordenadas(arco.inicio, raio)
    const fim = anguloParaCoordenadas(arco.fim, raio)
    const largeArc = arco.angulo > 180 ? 1 : 0

    const pathData = [
      `M 60 60`,
      `L ${inicio.x} ${inicio.y}`,
      `A ${raio} ${raio} 0 ${largeArc} 1 ${fim.x} ${fim.y}`,
      'Z'
    ].join(' ')

    return pathData
  }

  const arcos = calcularArco()

  if (dadosOrdenados.length === 0) {
    return null
  }

  return (
    <>
      <div className="gastos-categoria-card" onClick={() => setShowModal(true)}>
        <div className="card-icon">📊</div>
        <div className="card-content">
          <p className="card-label">Gastos por Categoria</p>
          <div className="pie-chart-tiny">
            <svg viewBox="0 0 120 120" width="100%" height="100%">
              {arcos.map((arco) => (
                <path
                  key={arco.name}
                  d={desenharArco(arco)}
                  fill={getCor(arco.name)}
                  stroke="white"
                  strokeWidth="1"
                  style={{ cursor: 'pointer' }}
                  title={`${arco.name}: ${(arco.percentual * 100).toFixed(1)}%`}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {showModal && (
        <GastosCategoriaPieChartModal
          porCategoria={porCategoria}
          totalGastos={totalGastos}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
