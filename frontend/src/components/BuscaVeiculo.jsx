import { useState, useEffect } from 'react'
import axios from 'axios'
import './BuscaVeiculo.css'

export default function BuscaVeiculo({ onDataReceived, isEditing }) {
  const [placa, setPlaca] = useState('')
  const [marcas, setMarcas] = useState([])
  const [modelos, setModelos] = useState([])
  const [selectedMarca, setSelectedMarca] = useState('')
  const [selectedModelo, setSelectedModelo] = useState('')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1) // 1: placa, 2: marca/modelo

  useEffect(() => {
    if (isEditing) {
      fetchMarcas()
    }
  }, [isEditing])

  const fetchMarcas = async () => {
    try {
      const response = await axios.get('/api/veiculos/dados/marcas')
      if (response.data.sucesso) {
        setMarcas(response.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar marcas:', err)
    }
  }

  const handleBuscarPlaca = async () => {
    setMessage('')

    if (!placa.trim()) {
      setMessage('Por favor, insira uma placa válida')
      return
    }

    // Avançar para seleção de marca/modelo
    setStep(2)
    setSelectedMarca('')
    setSelectedModelo('')
    setModelos([])
    setMessage('Selecione a marca e modelo do veículo')
  }

  const handleMarcaChange = async (marca) => {
    setSelectedMarca(marca)
    setSelectedModelo('')
    setModelos([])
    setMessage('')

    if (!marca) return

    try {
      setLoading(true)
      const response = await axios.get(`/api/veiculos/dados/modelos/${marca}`)
      if (response.data.sucesso) {
        setModelos(response.data.data || [])
      }
    } catch (err) {
      setMessage('Erro ao buscar modelos')
    } finally {
      setLoading(false)
    }
  }

  const handleModeloChange = async (modelo) => {
    setSelectedModelo(modelo)
    setMessage('')

    if (!selectedMarca || !modelo) return

    try {
      setLoading(true)
      const response = await axios.get(
        `/api/veiculos/dados/consumo/${selectedMarca}/${modelo}`
      )

      // Preenche marca/modelo/ano SEMPRE. O consumo entra se a base tiver;
      // senão, o vet digita manualmente (mensagem orientativa, não erro).
      const consumoEncontrado = response.data.sucesso && response.data.data?.consumoMedio
      const dados = {
        placa: placa.toUpperCase(),
        marca: selectedMarca,
        modelo: modelo,
        ano: ano,
        combustivel: 'Gasolina',
        custoManutencaoEstimado: 2500
      }
      if (consumoEncontrado) dados.consumoMedio = response.data.data.consumoMedio
      onDataReceived(dados)
      setStep(1)
      setPlaca('')

      if (consumoEncontrado) {
        setMessage(`✅ Dados preenchidos! ${selectedMarca} ${modelo} (${ano})`)
        setTimeout(() => setMessage(''), 4000)
      } else {
        setMessage(`✅ ${selectedMarca} ${modelo} (${ano}) preenchido. ℹ️ Informe o Consumo Médio (KM/L) manualmente no campo abaixo.`)
        setTimeout(() => setMessage(''), 6000)
      }
    } catch (err) {
      setMessage('Erro ao buscar dados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isEditing) return null

  return (
    <div className="busca-veiculo">
      <h4>🔍 Buscar Dados do Veículo na FIPE</h4>

      {step === 1 ? (
        <div className="busca-form">
          <div className="form-group">
            <label>Placa do Veículo *</label>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC1234 ou ABC1D23"
              maxLength="8"
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleBuscarPlaca()
                }
              }}
            />
          </div>
          <div className="form-group">
            <button
              type="button"
              className="btn-buscar"
              disabled={loading || !placa.trim()}
              onClick={handleBuscarPlaca}
            >
              {loading ? '⏳ Próximo...' : '➜ Próximo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="busca-form">
          <div className="form-group">
            <label>Marca *</label>
            <select
              value={selectedMarca}
              onChange={(e) => handleMarcaChange(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione uma marca</option>
              {marcas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Modelo *</label>
            <select
              value={selectedModelo}
              onChange={(e) => handleModeloChange(e.target.value)}
              disabled={!selectedMarca || modelos.length === 0 || loading}
            >
              <option value="">Selecione um modelo</option>
              {modelos.map(m => (
                <option key={m.modelo} value={m.modelo}>
                  {m.modelo} ({m.consumo} KM/L)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Ano *</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              min="1980"
              max={new Date().getFullYear()}
            />
          </div>
          <div className="form-group">
            <button
              type="button"
              className="btn-buscar btn-voltar"
              onClick={() => setStep(1)}
            >
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </p>
      )}

      <div className="info-text">
        ℹ️ {step === 1
          ? 'Insira a placa e clique em "Próximo"'
          : 'Selecione marca, modelo e ano para preencher os dados automaticamente'}
      </div>
    </div>
  )
}
