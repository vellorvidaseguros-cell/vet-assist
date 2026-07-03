import { useState } from 'react'
import { createPortal } from 'react-dom'
import './GastosCategoriaPieChartModal.css'

export default function GastosCategoriaPieChartModal({ porCategoria, totalGastos, onClose }) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null)

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
  const anguloParaCoordenadas = (angulo, raio = 100) => {
    const radianos = (angulo - 90) * (Math.PI / 180)
    return {
      x: 150 + raio * Math.cos(radianos),
      y: 150 + raio * Math.sin(radianos)
    }
  }

  // Desenhar um segmento da pizza
  const desenharArco = (arco) => {
    const raio = 100
    const inicio = anguloParaCoordenadas(arco.inicio, raio)
    const fim = anguloParaCoordenadas(arco.fim, raio)
    const largeArc = arco.angulo > 180 ? 1 : 0

    const pathData = [
      `M 150 150`,
      `L ${inicio.x} ${inicio.y}`,
      `A ${raio} ${raio} 0 ${largeArc} 1 ${fim.x} ${fim.y}`,
      'Z'
    ].join(' ')

    return pathData
  }

  const arcos = calcularArco()

  // Ao clicar em uma categoria no gráfico
  const handleClickCategoria = (categoria) => {
    setCategoriaSelecionada(categoriaSelecionada?.name === categoria.name ? null : categoria)
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalhes de Gastos por Categoria</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="grafico-wrapper">
            {/* Gráfico de Pizza */}
            <div className="pie-chart-container">
              <svg
                viewBox="0 0 300 300"
                width="300"
                height="300"
                style={{ cursor: 'pointer' }}
              >
                {arcos.map((arco) => (
                  <g
                    key={arco.name}
                    onClick={() => handleClickCategoria(arco)}
                    style={{
                      opacity:
                        categoriaSelecionada === null ||
                        categoriaSelecionada.name === arco.name
                          ? 1
                          : 0.5,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    <path
                      d={desenharArco(arco)}
                      fill={getCor(arco.name)}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      title={`${arco.name}: R$ ${arco.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    {/* Label com percentual */}
                    {arco.percentual > 0.05 && (
                      <text
                        x={anguloParaCoordenadas((arco.inicio + arco.fim) / 2, 65).x}
                        y={anguloParaCoordenadas((arco.inicio + arco.fim) / 2, 65).y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        pointerEvents="none"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {(arco.percentual * 100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Detalhes da Categoria */}
            <div className="categoria-details">
              {categoriaSelecionada ? (
                <div className="detalhe-box">
                  <div className="detalhe-header">
                    <div
                      className="detalhe-cor"
                      style={{ backgroundColor: getCor(categoriaSelecionada.name) }}
                    ></div>
                    <h4>{categoriaSelecionada.name}</h4>
                  </div>
                  <div className="detalhe-valores">
                    <div className="detalhe-valor">
                      <span className="label">Valor:</span>
                      <span className="valor">
                        R$ {categoriaSelecionada.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="detalhe-percentual">
                      <span className="label">Percentual:</span>
                      <span className="percentual">
                        {((categoriaSelecionada.value / totalGastos) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-fechar"
                    onClick={() => setCategoriaSelecionada(null)}
                  >
                    ✕ Fechar
                  </button>
                </div>
              ) : (
                <div className="resumo-total">
                  <div className="resumo-item">
                    <span className="label">Total de Gastos:</span>
                    <span className="valor-total">
                      R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="hint">Clique em um segmento do gráfico para ver detalhes</p>
                </div>
              )}
            </div>
          </div>

          {/* Legenda interativa */}
          <div className="categoria-lista">
            <h4>Todas as Categorias</h4>
            <div className="lista-items">
              {dadosOrdenados.map((item) => (
                <div
                  key={item.name}
                  className={`lista-item ${categoriaSelecionada?.name === item.name ? 'ativo' : ''}`}
                  onClick={() => handleClickCategoria(item)}
                >
                  <div className="item-cor" style={{ backgroundColor: getCor(item.name) }}></div>
                  <div className="item-info">
                    <span className="item-nome">{item.name}</span>
                    <span className="item-valor">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="item-percentual">
                    {((item.value / totalGastos) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-fechar-modal" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
