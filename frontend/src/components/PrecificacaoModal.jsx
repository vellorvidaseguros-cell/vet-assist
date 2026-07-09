import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import MoneyInput from './MoneyInput'
import './PrecificacaoModal.css'

const SEMANAS_POR_MES = 4.33

const fmtBR = (n) => (isFinite(n) ? n : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Setup ÚNICO: o veterinário configura uma vez e o app usa em tudo
// (calculadora de visita dentro do Orçamento, preço mínimo da tabela, relatório de lucratividade)
export default function PrecificacaoModal({ isOpen, onClose, perfil, custoKm, onSaved }) {
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    custosFixosMensais: '',
    proLaboreDesejado: '',
    horasPorSemana: 40,
    ocupacaoPercent: 60,
    margemLucroPercent: 20
  })

  useEffect(() => {
    if (isOpen && perfil?.precificacao) {
      setForm({
        custosFixosMensais: perfil.precificacao.custosFixosMensais ?? '',
        proLaboreDesejado: perfil.precificacao.proLaboreDesejado ?? '',
        horasPorSemana: perfil.precificacao.horasPorSemana ?? 40,
        ocupacaoPercent: perfil.precificacao.ocupacaoPercent ?? 60,
        margemLucroPercent: perfil.precificacao.margemLucroPercent ?? 20
      })
    }
  }, [isOpen, perfil])

  // Cálculo ao vivo da hora técnica
  const custos = parseFloat(form.custosFixosMensais) || 0
  const proLabore = parseFloat(form.proLaboreDesejado) || 0
  const horasSemana = parseFloat(form.horasPorSemana) || 0
  const ocupacao = Math.min(100, Math.max(1, parseFloat(form.ocupacaoPercent) || 60)) / 100
  const horasFaturaveisMes = horasSemana * SEMANAS_POR_MES * ocupacao
  const horaTecnica = horasFaturaveisMes > 0 ? (custos + proLabore) / horasFaturaveisMes : 0

  const horaTecnicaSalva = perfil?.precificacao?.horaTecnica || 0

  const handleSalvar = async () => {
    if (!custos && !proLabore) {
      setError('Preencha ao menos os custos fixos ou o pró-labore desejado')
      return
    }
    if (horasFaturaveisMes <= 0) {
      setError('Horas por semana deve ser maior que zero')
      return
    }

    try {
      setSalvando(true)
      setError('')
      const precificacao = {
        custosFixosMensais: custos,
        proLaboreDesejado: proLabore,
        horasPorSemana: horasSemana,
        ocupacaoPercent: ocupacao * 100,
        margemLucroPercent: parseFloat(form.margemLucroPercent) || 20,
        horaTecnica: parseFloat(horaTecnica.toFixed(2)),
        // Preserva as durações por serviço definidas na Tabela de Preços
        duracoesServicos: perfil?.precificacao?.duracoesServicos || {}
      }
      const res = await axios.put(`/api/perfil/${perfil?.id || 1}`, { precificacao })
      if (res.data.sucesso) {
        setSucesso('Precificação salva! O app agora usa sua hora técnica nos cálculos.')
        onSaved && onSaved()
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar precificação')
    } finally {
      setSalvando(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="pr-modal-overlay">
      <div className="pr-modal">
        <div className="pr-modal-header">
          <h2>Precificação</h2>
          <button className="pr-btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="pr-modal-body">
          {error && <div className="pr-error">{error}</div>}
          {sucesso && (
            <div className="pr-success-box">
              <div className="pr-success">{sucesso}</div>
              <button className="pr-btn-dismiss" onClick={() => setSucesso('')}>OK</button>
            </div>
          )}

          <p className="pr-description">
            Configure <strong>uma única vez</strong>. O app passa a usar sua hora técnica em todos os cálculos — você não precisa mexer nisso no dia a dia.
          </p>

          <div className="pr-field">
            <label>Custos fixos mensais do negócio (R$)</label>
            <MoneyInput
              placeholder="Ex: 2.500,00"
              value={form.custosFixosMensais}
              onChangeValue={(v) => setForm({ ...form, custosFixosMensais: v ?? '' })}
            />
            <small>CRMV, contador, celular/internet, materiais recorrentes, marketing… (sem contar o veículo, que já entra pelo custo/km)</small>
          </div>

          <div className="pr-field">
            <label>Quanto você quer ganhar por mês? (R$)</label>
            <MoneyInput
              placeholder="Ex: 8.000,00"
              value={form.proLaboreDesejado}
              onChangeValue={(v) => setForm({ ...form, proLaboreDesejado: v ?? '' })}
            />
            <small>Seu pró-labore. A maioria esquece de se pagar — não cometa esse erro!</small>
          </div>

          <div className="pr-field-row">
            <div className="pr-field">
              <label>Horas de trabalho/semana</label>
              <input
                type="number"
                value={form.horasPorSemana}
                onChange={(e) => setForm({ ...form, horasPorSemana: e.target.value })}
              />
            </div>
            <div className="pr-field">
              <label>Ocupação real (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.ocupacaoPercent}
                onChange={(e) => setForm({ ...form, ocupacaoPercent: e.target.value })}
              />
              <small>% das horas realmente atendendo (o resto é deslocamento, administração, buracos). 50–70% é realista.</small>
            </div>
          </div>

          <div className="pr-field">
            <label>Margem de lucro na visita externa (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.margemLucroPercent}
              onChange={(e) => setForm({ ...form, margemLucroPercent: e.target.value })}
            />
            <small>
              Aplicada <strong>somente</strong> sobre o cálculo de "Custo de Visita Externa" (tempo + deslocamento + materiais avulsos) dentro do Orçamento.
              Não afeta os <strong>Insumos do Estoque</strong> (esses já cobram exatamente o preço de venda que você cadastrou, sem markup extra)
              nem os demais itens da <strong>Tabela de Preços</strong>. 15–30% é o padrão do setor.
            </small>
          </div>

          {/* Resultado ao vivo */}
          <div className="pr-resultado">
            <div className="pr-resultado-linha">
              <span>Horas faturáveis/mês:</span>
              <strong>{horasFaturaveisMes.toFixed(0)}h</strong>
            </div>
            <div className="pr-resultado-destaque">
              <span>Sua hora técnica vale:</span>
              <strong>R$ {fmtBR(horaTecnica)}</strong>
            </div>
            {horaTecnicaSalva > 0 && horaTecnicaSalva !== parseFloat(horaTecnica.toFixed(2)) && (
              <p className="pr-hint">Valor salvo atualmente: R$ {fmtBR(horaTecnicaSalva)} — salve para atualizar.</p>
            )}
          </div>

          <button
            className="pr-btn-salvar"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar Precificação'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
