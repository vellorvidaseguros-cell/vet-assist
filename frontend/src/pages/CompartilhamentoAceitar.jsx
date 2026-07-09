import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import EsqueceSenhaModal from '../components/EsqueceSenhaModal'
import './CompartilhamentoAceitar.css'

export default function CompartilhamentoAceitar() {
  const { token } = useParams()
  const navigate = useNavigate()
  const isAutenticado = !!localStorage.getItem('token')
  const [proposta, setProposta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState(isAutenticado ? 'aceitar' : 'view') // 'view' | 'criar-conta' | 'aceitar'
  const [formConta, setFormConta] = useState({ nome: '', email: '', senha: '' })
  const [aceitando, setAceitando] = useState(false)
  const [success, setSuccess] = useState('')
  const [esqueceSenhaOpen, setEsqueceSenhaOpen] = useState(false)

  useEffect(() => {
    buscarProposta()
  }, [token])

  const buscarProposta = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/compartilhamento/publico/${token}`)
      if (res.data.sucesso) {
        setProposta(res.data.data)
      } else {
        setError(res.data.erro)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao carregar proposta')
    } finally {
      setLoading(false)
    }
  }

  const handleAceitarComConta = async () => {
    try {
      setAceitando(true)
      setError('')
      const res = await axios.post(`/api/compartilhamento/${token}/aceitar`, {
        novoVeterinario: formConta
      })

      if (res.data.sucesso) {
        setSuccess('Conta criada! Você será redirecionado.')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar conta e aceitar')
    } finally {
      setAceitando(false)
    }
  }

  const handleAceitarSemConta = async () => {
    try {
      setAceitando(true)
      setError('')
      const res = await axios.post(`/api/compartilhamento/${token}/aceitar`, {})

      if (res.data.sucesso) {
        setSuccess('Compartilhamento aceito! Você já pode acessar este animal.')
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao aceitar compartilhamento')
    } finally {
      setAceitando(false)
    }
  }

  if (loading) {
    return (
      <div className="ca-page">
        <div className="ca-container">
          <p className="ca-loading">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="ca-page">
        <div className="ca-container">
          <div className="ca-error-box">
            <h2>Convite Inválido</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')}>Voltar para Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ca-page">
      <div className="ca-container">
        <div className="ca-card">
          {/* Header */}
          <div className="ca-header">
            <h1>Compartilhamento de Animal</h1>
            <p className="ca-subtitle">Você foi convidado a acompanhar o tratamento de um animal</p>
          </div>

          {/* Proposta */}
          <div className="ca-proposta">
            <div className="ca-section">
              <h3>Veterinário</h3>
              <p className="ca-value">{proposta.vetOrigem?.nome}</p>
              <p className="ca-clinic">{proposta.vetOrigem?.nomeClinica || 'Clínica'}</p>
            </div>

            <div className="ca-section">
              <h3>Animal</h3>
              <p className="ca-value">
                {proposta.animal?.nome} ({proposta.animal?.especie})
              </p>
              {proposta.cliente && (
                <p className="ca-owner">Proprietário: {proposta.cliente?.nome}</p>
              )}
            </div>

            <div className="ca-section">
              <h3>Permissões</h3>
              <ul className="ca-permissions">
                {proposta.permissoes?.includes('ver') && <li>Ver históricos</li>}
                {proposta.permissoes?.includes('editar') && <li>Editar históricos</li>}
              </ul>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="ca-message-box">
              <div className="ca-error">{error}</div>
              <button onClick={() => setError('')} className="ca-btn-dismiss">
                Fechar
              </button>
            </div>
          )}
          {success && (
            <div className="ca-message-box">
              <div className="ca-success">{success}</div>
              <button
                onClick={() => navigate(isAutenticado ? '/' : '/login')}
                className="ca-btn-continue"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="ca-actions">
            {step === 'view' && (
              <>
                <p className="ca-question">Você tem uma conta no VetAssist?</p>
                <div className="ca-buttons">
                  <button
                    onClick={handleAceitarSemConta}
                    disabled={aceitando}
                    className="ca-btn-primary"
                  >
                    Sim, Aceitar
                  </button>
                  <button
                    onClick={() => setStep('criar-conta')}
                    className="ca-btn-secondary"
                  >
                    Não, Criar Conta
                  </button>
                </div>
              </>
            )}

            {step === 'aceitar' && isAutenticado && (
              <>
                <p className="ca-question">Aceitar este compartilhamento?</p>
                <div className="ca-buttons">
                  <button
                    onClick={handleAceitarSemConta}
                    disabled={aceitando}
                    className="ca-btn-primary"
                  >
                    {aceitando ? 'Aceitando...' : 'Aceitar'}
                  </button>
                </div>
              </>
            )}

            {step === 'criar-conta' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAceitarComConta()
                }}
                className="ca-form"
              >
                <h3>Criar Conta</h3>
                <input
                  type="text"
                  placeholder="Seu Nome Completo"
                  value={formConta.nome}
                  onChange={(e) =>
                    setFormConta({ ...formConta, nome: e.target.value })
                  }
                  required
                  className="ca-input"
                />
                <input
                  type="email"
                  placeholder="Seu Email"
                  value={formConta.email}
                  onChange={(e) =>
                    setFormConta({ ...formConta, email: e.target.value })
                  }
                  required
                  className="ca-input"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={formConta.senha}
                  onChange={(e) =>
                    setFormConta({ ...formConta, senha: e.target.value })
                  }
                  required
                  className="ca-input"
                />
                <button
                  type="button"
                  onClick={() => setEsqueceSenhaOpen(true)}
                  className="ca-btn-forgot"
                >
                  Esqueci a Senha
                </button>
                <div className="ca-buttons">
                  <button
                    type="button"
                    onClick={() => setStep('view')}
                    className="ca-btn-secondary"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={aceitando}
                    className="ca-btn-primary"
                  >
                    {aceitando ? 'Criando...' : 'Criar e Aceitar'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="ca-footer">
            <p>Ao aceitar, você poderá acompanhar o histórico de tratamentos deste animal.</p>
          </div>
        </div>
      </div>

      <EsqueceSenhaModal
        isOpen={esqueceSenhaOpen}
        onClose={() => setEsqueceSenhaOpen(false)}
      />
    </div>
  )
}
