import { useState, useEffect } from 'react'
import axios from 'axios'
import './AdminPanel.css'

const FORM_VAZIO = { nome: '', email: '', senha: '', telefone: '', plano: 'basico' }

export default function AdminPanel() {
  const [contas, setContas] = useState([])
  const [catalogo, setCatalogo] = useState({ recursos: [], planos: {} })
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [showNovaConta, setShowNovaConta] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [permissoesEdit, setPermissoesEdit] = useState([])

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const [contasRes, planosRes] = await Promise.all([
        axios.get('/api/admin/contas'),
        axios.get('/api/admin/planos')
      ])
      if (contasRes.data.sucesso) setContas(contasRes.data.data || [])
      if (planosRes.data.sucesso) setCatalogo(planosRes.data.data)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }

  const avisar = (msg) => {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 4000)
  }

  const criarConta = async (e) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const res = await axios.post('/api/admin/contas', form)
      if (res.data.sucesso) {
        avisar(res.data.mensagem)
        setForm(FORM_VAZIO)
        setShowNovaConta(false)
        carregar()
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta')
    } finally {
      setSalvando(false)
    }
  }

  const atualizarConta = async (id, dados, msgOk) => {
    setErro('')
    try {
      const res = await axios.put(`/api/admin/contas/${id}`, dados)
      if (res.data.sucesso) {
        avisar(msgOk || 'Conta atualizada!')
        carregar()
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar conta')
    }
  }

  const alternarSuspensao = (conta) => {
    const acao = conta.ativo ? 'suspender' : 'reativar'
    if (!window.confirm(`Deseja ${acao} a conta de ${conta.nome}?`)) return
    atualizarConta(conta.id, { ativo: !conta.ativo }, conta.ativo ? 'Conta suspensa' : 'Conta reativada')
  }

  const mudarPlano = (conta, plano) => {
    // Trocar de plano limpa permissões customizadas (volta ao preset)
    atualizarConta(conta.id, { plano, permissoes: [] }, `Plano alterado para ${catalogo.planos[plano]?.nome || plano}`)
  }

  const resetarSenha = (conta) => {
    const senha = window.prompt(`Nova senha para ${conta.nome}:`)
    if (!senha || senha.length < 6) {
      if (senha !== null) setErro('A senha precisa ter pelo menos 6 caracteres')
      return
    }
    atualizarConta(conta.id, { senha }, 'Senha redefinida')
  }

  // Exclusão é permanente e apaga todos os dados do assinante (clientes, animais,
  // agendamentos, histórico, cobranças...). Confirmação dupla para evitar clique acidental.
  const excluirConta = async (conta) => {
    if (!window.confirm(`⚠️ EXCLUIR PERMANENTEMENTE a conta de ${conta.nome}?\n\nTodos os clientes, animais, agendamentos e histórico dessa conta serão apagados para sempre. Esta ação NÃO pode ser desfeita.`)) return
    const digitado = window.prompt(`Para confirmar, digite o nome da conta exatamente: ${conta.nome}`)
    if (digitado !== conta.nome) {
      if (digitado !== null) setErro('Nome digitado não confere. Exclusão cancelada.')
      return
    }
    setErro('')
    try {
      const res = await axios.delete(`/api/admin/contas/${conta.id}`)
      if (res.data.sucesso) {
        avisar('Conta excluída permanentemente')
        carregar()
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao excluir conta')
    }
  }

  const abrirPermissoes = (conta) => {
    setEditandoId(conta.id)
    setPermissoesEdit([...(conta.permissoesEfetivas || [])])
  }

  const togglePermissao = (chave) => {
    setPermissoesEdit(prev =>
      prev.includes(chave) ? prev.filter(p => p !== chave) : [...prev, chave]
    )
  }

  const salvarPermissoes = (conta) => {
    atualizarConta(conta.id, { permissoes: permissoesEdit }, 'Permissões atualizadas')
    setEditandoId(null)
  }

  if (loading) {
    return <div className="admin-loading">Carregando painel...</div>
  }

  return (
    <div className="admin-panel">
      <div className="admin-header-row">
        <h2>🔑 Contas e Assinaturas</h2>
        <button className="admin-btn-nova" onClick={() => setShowNovaConta(!showNovaConta)}>
          {showNovaConta ? '✕ Cancelar' : '+ Nova Conta'}
        </button>
      </div>

      {erro && <div className="admin-erro">{erro} <button onClick={() => setErro('')}>×</button></div>}
      {sucesso && <div className="admin-sucesso">{sucesso}</div>}

      {/* Formulário de nova conta */}
      {showNovaConta && (
        <form className="admin-form-nova" onSubmit={criarConta}>
          <h3>Nova conta de assinante</h3>
          <div className="admin-form-grid">
            <input
              placeholder="Nome do veterinário *"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email de login *"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Senha inicial *"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              minLength={6}
              required
            />
            <input
              placeholder="Telefone"
              value={form.telefone}
              onChange={e => setForm({ ...form, telefone: e.target.value })}
            />
            <select value={form.plano} onChange={e => setForm({ ...form, plano: e.target.value })}>
              {Object.entries(catalogo.planos).map(([chave, p]) => (
                <option key={chave} value={chave}>Plano {p.nome}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="admin-btn-salvar" disabled={salvando}>
            {salvando ? 'Criando...' : '✓ Criar Conta'}
          </button>
        </form>
      )}

      {/* Lista de contas */}
      <div className="admin-contas-list">
        {contas.map(conta => (
          <div key={conta.id} className={`admin-conta-card ${!conta.ativo ? 'suspensa' : ''}`}>
            <div className="admin-conta-topo">
              <div className="admin-conta-info">
                <strong>{conta.nome}</strong>
                {conta.role === 'admin' && <span className="admin-badge-admin">ADMIN</span>}
                {!conta.ativo && <span className="admin-badge-suspensa">SUSPENSA</span>}
                <div className="admin-conta-email">{conta.email}</div>
                <div className="admin-conta-meta">
                  {conta.totalClientes} cliente(s) • {conta.totalAgendamentos} agendamento(s)
                  {' • '}desde {new Date(conta.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {conta.role !== 'admin' && (
              <>
                <div className="admin-conta-plano">
                  <label>Plano:</label>
                  <select value={conta.plano} onChange={e => mudarPlano(conta, e.target.value)}>
                    {Object.entries(catalogo.planos).map(([chave, p]) => (
                      <option key={chave} value={chave}>{p.nome}</option>
                    ))}
                  </select>
                  <button className="admin-btn-permissoes" onClick={() => editandoId === conta.id ? setEditandoId(null) : abrirPermissoes(conta)}>
                    {editandoId === conta.id ? 'Fechar' : '⚙️ Permissões'}
                  </button>
                </div>

                {/* Permissões efetivas (chips) */}
                {editandoId !== conta.id && (
                  <div className="admin-conta-recursos">
                    {catalogo.recursos.map(r => (
                      <span
                        key={r.chave}
                        className={`admin-chip ${conta.permissoesEfetivas?.includes(r.chave) ? 'ativo' : 'inativo'}`}
                        title={r.descricao}
                      >
                        {conta.permissoesEfetivas?.includes(r.chave) ? '✓' : '✕'} {r.nome}
                      </span>
                    ))}
                    {Array.isArray(conta.permissoes) && conta.permissoes.length > 0 && (
                      <span className="admin-chip customizada" title="Esta conta tem permissões customizadas (diferentes do preset do plano)">
                        ✎ customizada
                      </span>
                    )}
                  </div>
                )}

                {/* Edição de permissões */}
                {editandoId === conta.id && (
                  <div className="admin-permissoes-editor">
                    <p className="admin-permissoes-hint">
                      Marque os recursos desta conta. Ao salvar, elas substituem o preset do plano.
                    </p>
                    {catalogo.recursos.map(r => (
                      <label key={r.chave} className="admin-permissao-item">
                        <input
                          type="checkbox"
                          checked={permissoesEdit.includes(r.chave)}
                          onChange={() => togglePermissao(r.chave)}
                        />
                        <span><strong>{r.nome}</strong> — {r.descricao}</span>
                      </label>
                    ))}
                    <button className="admin-btn-salvar" onClick={() => salvarPermissoes(conta)}>
                      ✓ Salvar Permissões
                    </button>
                  </div>
                )}

                <div className="admin-conta-acoes">
                  <button
                    className={conta.ativo ? 'admin-btn-suspender' : 'admin-btn-reativar'}
                    onClick={() => alternarSuspensao(conta)}
                  >
                    {conta.ativo ? '⏸ Suspender' : '▶ Reativar'}
                  </button>
                  <button className="admin-btn-senha" onClick={() => resetarSenha(conta)}>
                    🔑 Redefinir Senha
                  </button>
                  {conta.role !== 'admin' && (
                    <button className="admin-btn-excluir" onClick={() => excluirConta(conta)}>
                      🗑️ Excluir Conta
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
