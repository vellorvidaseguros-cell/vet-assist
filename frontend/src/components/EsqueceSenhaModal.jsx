import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './EsqueceSenhaModal.css'

export default function EsqueceSenhaModal({ isOpen, onClose }) {
  const [step, setStep] = useState('email') // 'email' | 'aguardando' | 'reset-password' | 'sucesso'
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSolicitar = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Digite seu email')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Só registra o PEDIDO — o admin confirma sua identidade e entrega
      // o código manualmente (WhatsApp/telefone já cadastrado).
      const res = await axios.post('/api/veterinarios/esqueci-senha', { email })
      if (!res.data.sucesso) {
        setError(res.data.erro || 'Erro ao solicitar código')
        return
      }

      setStep('aguardando')
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao solicitar código')
    } finally {
      setLoading(false)
    }
  }

  const handleProsseguir = () => {
    setStep('reset-password')
    setCodigo('')
  }

  const handleAtualizarSenha = async (e) => {
    e.preventDefault()
    if (!codigo || !novaSenha || !confirmarSenha) {
      setError('Preencha todos os campos')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não conferem')
      return
    }

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      setLoading(true)
      setError('')

      // O código é validado no servidor (expira em 15 minutos)
      const res = await axios.post('/api/veterinarios/atualizar-senha', {
        email,
        codigo,
        novaSenha
      })

      if (res.data.sucesso) {
        setError('')
        setStep('sucesso')
      } else {
        setError(res.data.erro || 'Erro ao atualizar senha')
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao atualizar senha')
    } finally {
      setLoading(false)
    }
  }

  const handleFechar = () => {
    onClose()
    setStep('email')
    setEmail('')
    setCodigo('')
    setNovaSenha('')
    setConfirmarSenha('')
    setError('')
  }

  if (!isOpen) return null

  return createPortal(
    <div className="es-modal-overlay">
      <div className="es-modal">
        {/* Header */}
        <div className="es-modal-header">
          <h2>Recuperar Senha</h2>
          <button className="es-btn-close" onClick={handleFechar}>✕</button>
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSolicitar} className="es-modal-body">
            {error && <div className="es-error">{error}</div>}

            <p className="es-description">
              Digite seu email. O administrador vai confirmar sua identidade e te enviar um código pelo telefone cadastrado.
            </p>

            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="es-input"
              disabled={loading}
              autoFocus
            />

            <div className="es-buttons">
              <button
                type="button"
                onClick={handleFechar}
                className="es-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="es-btn-primary"
              >
                {loading ? 'Enviando...' : 'Solicitar Código'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Aguardando o admin liberar o código */}
        {step === 'aguardando' && (
          <div className="es-modal-body">
            <div className="es-success-box">
              <p className="es-label">Pedido Enviado!</p>
              <p className="es-description">
                O administrador vai te enviar um código pelo telefone/WhatsApp cadastrado. Clique no botão abaixo quando receber.
              </p>

              <div className="es-buttons">
                <button
                  type="button"
                  onClick={handleFechar}
                  className="es-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProsseguir}
                  className="es-btn-primary"
                >
                  Já Recebi o Código
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset-password' && (
          <form onSubmit={handleAtualizarSenha} className="es-modal-body">
            {error && <div className="es-error">{error}</div>}

            <p className="es-description">
              Digite o código que o administrador te enviou e sua nova senha.
            </p>

            <input
              type="text"
              placeholder="Código (6 dígitos)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.slice(0, 6))}
              className="es-input"
              maxLength="6"
              autoFocus
            />

            <input
              type="password"
              placeholder="Nova Senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="es-input"
              disabled={loading}
            />

            <input
              type="password"
              placeholder="Confirmar Senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="es-input"
              disabled={loading}
            />

            <div className="es-buttons">
              <button
                type="button"
                onClick={() => setStep('whatsapp-sent')}
                className="es-btn-secondary"
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="es-btn-primary"
              >
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Sucesso (fechamento manual) */}
        {step === 'sucesso' && (
          <div className="es-modal-body">
            <div className="es-success-box">
              <p className="es-label">Senha Atualizada!</p>
              <p className="es-description">
                Sua senha foi alterada com sucesso. Use a nova senha no próximo login.
              </p>
              <div className="es-buttons">
                <button
                  type="button"
                  onClick={handleFechar}
                  className="es-btn-primary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
