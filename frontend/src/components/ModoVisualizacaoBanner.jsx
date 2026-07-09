// Banner fixo mostrado quando o admin está em modo "Ver como" (somente leitura)
// numa conta de assinante. Permite voltar pro próprio painel admin com 1 toque.
export default function ModoVisualizacaoBanner() {
  const backup = localStorage.getItem('admin_token_backup')
  if (!backup) return null

  const sair = () => {
    localStorage.setItem('token', backup)
    const contaBackup = localStorage.getItem('admin_conta_backup')
    if (contaBackup) localStorage.setItem('conta', contaBackup)
    localStorage.removeItem('admin_token_backup')
    localStorage.removeItem('admin_conta_backup')
    window.location.reload()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10002,
      background: '#1a4fb4', color: '#fff',
      padding: '8px 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '12px', fontSize: '13px', fontWeight: 600
    }}>
      <span>Modo visualização (somente leitura)</span>
      <button
        onClick={sair}
        style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
          padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
          fontWeight: 700, cursor: 'pointer'
        }}
      >
        Sair
      </button>
    </div>
  )
}
