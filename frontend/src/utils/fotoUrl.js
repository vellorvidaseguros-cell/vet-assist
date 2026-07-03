// URL de foto servida pela API com token na query string.
// Necessário porque tags <img> e janelas de impressão não enviam
// o header Authorization — o middleware de auth aceita ?token=
export function fotoUrl(id) {
  const token = localStorage.getItem('token')
  return `/api/anexos/file/${id}?token=${encodeURIComponent(token || '')}`
}
