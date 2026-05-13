import { useState, useEffect } from 'react'
import axios from 'axios'
import './MobileSearch.css'

export default function MobileSearch({ onSearch, onClose, autoFocus }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      buscar()
    } else {
      setResultados([])
    }
  }, [searchTerm])

  const buscar = async () => {
    if (searchTerm.trim().length === 0) return

    try {
      setLoading(true)
      const termo = searchTerm.toLowerCase()

      // Buscar em clientes
      const clientesRes = await axios.get('/api/clientes')
      const clientes = (clientesRes.data.data || []).filter(c =>
        c.nome.toLowerCase().includes(termo)
      )

      // Buscar em pets
      const petsRes = await axios.get('/api/pets')
      const pets = (petsRes.data.data || []).filter(p =>
        p.nome.toLowerCase().includes(termo)
      )

      // Combinar resultados
      const resultadosCombinados = [
        ...clientes.map(c => ({
          id: `cliente-${c.id}`,
          tipo: 'Cliente',
          nome: c.nome,
          subtitulo: c.telefone,
          icon: '👤',
          dados: c
        })),
        ...pets.map(p => ({
          id: `pet-${p.id}`,
          tipo: 'Pet',
          nome: p.nome,
          subtitulo: p.tipo,
          icon: '🐾',
          dados: p
        }))
      ]

      setResultados(resultadosCombinados)
      onSearch(resultadosCombinados)
    } catch (err) {
      console.error('Erro ao buscar:', err)
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultadoClick = (resultado) => {
    console.log('Selecionou:', resultado)
    // Será implementado para navegar para detalhes
    onClose()
  }

  return (
    <div className="mobile-search-container">
      <div className="mobile-search-header">
        <button className="btn-voltar" onClick={onClose}>
          ← Voltar
        </button>
        <h2>Buscar</h2>
      </div>

      <div className="mobile-search-input-wrapper">
        <input
          type="text"
          className="mobile-search-input-field"
          placeholder="Buscar cliente, pet, consulta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus={autoFocus}
        />
        {searchTerm && (
          <button
            className="btn-limpar-busca"
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>

      {loading && <div className="search-loading">Buscando...</div>}

      {searchTerm && resultados.length === 0 && !loading && (
        <div className="search-empty">
          Nenhum resultado encontrado para "{searchTerm}"
        </div>
      )}

      {searchTerm && resultados.length > 0 && (
        <div className="search-resultados">
          {resultados.map(resultado => (
            <button
              key={resultado.id}
              className="resultado-item"
              onClick={() => handleResultadoClick(resultado)}
            >
              <span className="resultado-icon">{resultado.icon}</span>
              <div className="resultado-info">
                <span className="resultado-nome">{resultado.nome}</span>
                <span className="resultado-tipo">{resultado.tipo} • {resultado.subtitulo}</span>
              </div>
              <span className="resultado-arrow">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
