import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import MoneyInput from './MoneyInput'
import ConfirmModal from './ConfirmModal'
import './EstoqueInsumosModal.css'

const UNIDADES = ['un', 'ml', 'mg', 'comprimido', 'frasco', 'caixa', 'kg', 'g']

const VAZIO = {
  nome: '',
  unidade: 'un',
  quantidadeEstoque: '',
  quantidadeMinima: '',
  custoUnitario: '',
  precoVenda: ''
}

export default function EstoqueInsumosModal({ isOpen, onClose }) {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [confirm, setConfirm] = useState({ open: false })

  useEffect(() => {
    if (isOpen) fetchInsumos()
  }, [isOpen])

  const fetchInsumos = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/insumos')
      if (res.data.sucesso) setInsumos(res.data.data || [])
    } catch (err) {
      setError('Erro ao carregar insumos')
    } finally {
      setLoading(false)
    }
  }

  const abrirNovo = () => {
    setForm(VAZIO)
    setEditandoId(null)
    setShowForm(true)
  }

  const abrirEdicao = (insumo) => {
    setForm({
      nome: insumo.nome,
      unidade: insumo.unidade || 'un',
      quantidadeEstoque: insumo.quantidadeEstoque,
      quantidadeMinima: insumo.quantidadeMinima,
      custoUnitario: insumo.custoUnitario,
      precoVenda: insumo.precoVenda
    })
    setEditandoId(insumo.id)
    setShowForm(true)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      setError('Informe o nome do insumo')
      return
    }
    try {
      setSalvando(true)
      setError('')
      const payload = {
        nome: form.nome.trim(),
        unidade: form.unidade,
        quantidadeEstoque: parseFloat(form.quantidadeEstoque) || 0,
        quantidadeMinima: parseFloat(form.quantidadeMinima) || 0,
        custoUnitario: parseFloat(form.custoUnitario) || 0,
        precoVenda: parseFloat(form.precoVenda) || 0
      }

      const res = editandoId
        ? await axios.put(`/api/insumos/${editandoId}`, payload)
        : await axios.post('/api/insumos', payload)

      if (res.data.sucesso) {
        setShowForm(false)
        setForm(VAZIO)
        setEditandoId(null)
        await fetchInsumos()
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar insumo')
    } finally {
      setSalvando(false)
    }
  }

  const handleRemover = (insumo) => {
    setConfirm({
      open: true,
      title: 'Remover Insumo',
      message: `Remover "${insumo.nome}" do estoque? Você pode restaurá-lo depois na Lixeira.`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/insumos/${insumo.id}`)
          await fetchInsumos()
        } catch (err) {
          setError('Erro ao remover insumo')
        } finally {
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  if (!isOpen) return null

  return createPortal(
    <div className="ei-modal-overlay">
      <div className="ei-modal">
        <div className="ei-modal-header">
          <h2>📦 Estoque de Insumos</h2>
          <button className="ei-btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="ei-modal-body">
          {error && <div className="ei-error">{error}</div>}

          {!showForm ? (
            <>
              <p className="ei-description">
                Cadastre os insumos que você usa nos atendimentos (seringas, medicamentos, curativos...).
                Ao usá-los em um Orçamento, o estoque é abatido automaticamente.
              </p>

              <button className="ei-btn-novo" onClick={abrirNovo}>+ Novo Insumo</button>

              {loading ? (
                <p className="ei-vazio">Carregando...</p>
              ) : insumos.length === 0 ? (
                <p className="ei-vazio">Nenhum insumo cadastrado ainda.</p>
              ) : (
                <div className="ei-lista">
                  {insumos.map(insumo => {
                    const estoqueBaixo = parseFloat(insumo.quantidadeMinima) > 0 &&
                      parseFloat(insumo.quantidadeEstoque) <= parseFloat(insumo.quantidadeMinima)
                    return (
                      <div key={insumo.id} className={`ei-item ${estoqueBaixo ? 'ei-item-baixo' : ''}`}>
                        <div className="ei-item-info">
                          <span className="ei-item-nome">
                            {insumo.nome}
                            {estoqueBaixo && <span className="ei-badge-baixo">⚠️ estoque baixo</span>}
                          </span>
                          <span className="ei-item-detalhes">
                            {parseFloat(insumo.quantidadeEstoque)} {insumo.unidade} em estoque
                            {parseFloat(insumo.precoVenda) > 0 && ` · venda R$ ${parseFloat(insumo.precoVenda).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="ei-item-acoes">
                          <button className="ei-btn-icon" onClick={() => abrirEdicao(insumo)} title="Editar">✏️</button>
                          <button className="ei-btn-icon" onClick={() => handleRemover(insumo)} title="Remover">🗑️</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSalvar} className="ei-form">
              <h3>{editandoId ? 'Editar Insumo' : 'Novo Insumo'}</h3>

              <div className="ei-field">
                <label>Nome *</label>
                <input
                  type="text"
                  placeholder="Ex: Seringa 5ml"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="ei-field-row">
                <div className="ei-field">
                  <label>Unidade</label>
                  <input
                    type="text"
                    list="ei-unidades-sugestoes"
                    placeholder="un, kg, caixa, saco..."
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  />
                  <datalist id="ei-unidades-sugestoes">
                    {UNIDADES.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
                <div className="ei-field">
                  <label>Quantidade em estoque</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.quantidadeEstoque}
                    onChange={(e) => setForm({ ...form, quantidadeEstoque: e.target.value })}
                  />
                </div>
              </div>

              <div className="ei-field">
                <label>Alertar quando estoque chegar em</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Opcional"
                  value={form.quantidadeMinima}
                  onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })}
                />
              </div>

              <div className="ei-field-row">
                <div className="ei-field">
                  <label>Custo unitário (R$)</label>
                  <MoneyInput
                    placeholder="Quanto você pagou"
                    value={form.custoUnitario}
                    onChangeValue={(v) => setForm({ ...form, custoUnitario: v ?? '' })}
                  />
                </div>
                <div className="ei-field">
                  <label>Preço de venda (R$)</label>
                  <MoneyInput
                    placeholder="Cobrado no atendimento"
                    value={form.precoVenda}
                    onChangeValue={(v) => setForm({ ...form, precoVenda: v ?? '' })}
                  />
                </div>
              </div>

              <div className="ei-form-acoes">
                <button
                  type="button"
                  className="ei-btn-cancelar"
                  onClick={() => { setShowForm(false); setForm(VAZIO); setEditandoId(null) }}
                >
                  Cancelar
                </button>
                <button type="submit" className="ei-btn-salvar" disabled={salvando}>
                  {salvando ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <ConfirmModal {...confirm} />
    </div>,
    document.body
  )
}
