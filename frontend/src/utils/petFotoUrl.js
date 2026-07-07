// URL da foto de perfil do animal, servida pela API com token na query string
// (o middleware de auth aceita ?token= para tags <img> que não enviam Authorization).
export function petFotoUrl(petId) {
  const token = localStorage.getItem('token')
  return `/api/pets/${petId}/foto?token=${encodeURIComponent(token || '')}`
}
