# ⚡ GUIA RÁPIDO DE RESTAURAÇÃO DE EMERGÊNCIA

## 🆘 Se algo quebrou, siga isto:

### PROBLEMA 1: Fotos não aparecem nos PDFs

**Solução rápida (5 minutos):**

1. Abra `frontend/src/components/AnimalHistory.jsx`
2. Procure por `const fetchAllPhotos = async (historicoData) => {`
3. **SUBSTITUA TODO ESSE BLOCO (linhas 209-222) por:**

```javascript
const fetchAllPhotos = async (historicoData) => {
  try {
    const photoPromises = historicoData.map(historico =>
      axios.get(`/api/anexos/historico/${historico.id}`)
        .then(res => ({
          historicoId: historico.id,
          fotos: res.data.sucesso ? (res.data.data || []) : []
        }))
        .catch(err => {
          console.error(`Erro ao carregar fotos para histórico ${historico.id}:`, err)
          return { historicoId: historico.id, fotos: [] }
        })
    )

    const results = await Promise.all(photoPromises)
    const photosMap = {}
    results.forEach(({ historicoId, fotos }) => {
      photosMap[historicoId] = fotos
    })
    setPhotosByHistorico(photosMap)
  } catch (err) {
    console.error('Erro geral ao carregar fotos:', err)
  }
}
```

4. Salve
5. Reinicie frontend: `npm start`

---

### PROBLEMA 2: PDFs não têm design profissional / parecem emails

**Solução rápida (10 minutos):**

1. Abra `frontend/src/components/AnimalHistory.jsx`
2. Procure por `const generatePDF = (historicoItem) => {`
3. Substitua todo o conteúdo da função (linhas 267-387)
4. Cole do arquivo `BACKUP_SESSAO_2026-05-09.md` seção "Modificação 2: Função generatePDF"
5. Procure por `const generatePDFMultiple = (historicoList) => {`
6. Substitua todo o conteúdo (linhas 389-535)
7. Cole do arquivo `BACKUP_SESSAO_2026-05-09.md` seção "Modificação 3: Função generatePDFMultiple"
8. Salve e reinicie

---

### PROBLEMA 3: Logos não aparecem nos PDFs

**Checklist rápido:**

- [ ] Backend rodando? `npm run dev` em `backend/`
- [ ] Rota `/test-uploads/:filename` existe em `server.js`? (linhas 70-79)
- [ ] Arquivo logo está em `backend/uploads/`?
- [ ] Path salvo é `test-uploads/filename`? (não `backend/uploads/`)

**Se faltar rota, adicione em `server.js` (após linha 69):**

```javascript
app.get('/test-uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  console.log(`[DEBUG] Tentando servir arquivo: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`[ERROR] Arquivo não encontrado: ${filePath}`);
      res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado', filePath });
    }
  });
});
```

---

### PROBLEMA 4: Banco de dados corrompido

**Solução nuclear (limpa tudo):**

```powershell
# Para o backend se estiver rodando (Ctrl+C)

# Delete o arquivo de banco
Remove-Item D:\Claude Code\Vet.Assist\vet_assist.db

# Inicia backend novamente (vai recriar tudo)
npm run dev

# Dados de teste serão recriados automaticamente
```

---

### PROBLEMA 5: Page breaks não funcionam (2 consultas na mesma página)

**Verificação rápida em `generatePDFMultiple`:**

Procure por esta seção no CSS (deve estar em torno da linha 512):

```css
.page-break { page-break-after: always; }
.page-break:last-child { page-break-after: avoid; }
.letterhead-page { page-break-inside: avoid; }
```

Se não estiver, adicione.

---

## 📋 CHECKLIST DE RESTAURAÇÃO COMPLETA

Se precisar restaurar TUDO do zero:

### Arquivo 1: AnimalHistory.jsx
- [ ] Linha 60-93: `fetchWhiteLabel()` - carrega branding
- [ ] Linha 147-169: `fetchAllHistory()` - carrega históricos
- [ ] Linha 209-222: `fetchAllPhotos()` - **CRÍTICO - usar Promise.all()**
- [ ] Linha 267-387: `generatePDF()` - design papel timbrado
- [ ] Linha 389-535: `generatePDFMultiple()` - page breaks por consulta

### Arquivo 2: PerfilController.js
- [ ] Linha 80-86 em `saveWhiteLabel()`: path deve ser `test-uploads/${filename}`

### Arquivo 3: server.js
- [ ] Linha 70-79: Rota `/test-uploads/:filename` adicionada

### Arquivo 4: seed.js
- [ ] seedTestData cria 5 clientes, 7 pets, 3 históricos, 3 faturamentos

---

## 🔧 COMANDOS IMPORTANTES

```powershell
# Iniciar backend
cd D:\Claude Code\Vet.Assist\backend
npm run dev

# Iniciar frontend
cd D:\Claude Code\Vet.Assist\frontend
npm start

# Resetar banco de dados
Remove-Item D:\Claude Code\Vet.Assist\vet_assist.db

# Testar se backend está rodando
curl http://localhost:5000/api/status

# Ver logs em tempo real
npm run dev | Tee-Object log.txt
```

---

## 🎯 DADOS CRÍTICOS

```
Veterinário padrão:
  Email: admin@vetassist.com
  Senha: admin123

Cor tema: #0d6b3a (verde)

URLs:
  Frontend: http://localhost:3000
  Backend: http://localhost:5000
  Teste: http://localhost:5000/api/status
```

---

## 📞 PRÓXIMOS PASSOS SE AINDA NÃO FUNCIONAR

Se após restaurar ainda não funcionar:

1. **Verificar console do navegador** (F12 → Console)
   - Procure por erros vermelhos
   - Copie a mensagem completa

2. **Verificar logs do backend**
   - Procure por `[ERROR]`
   - Veja se APIs estão retornando erro

3. **Testar endpoints diretamente:**
   ```powershell
   # Listar históricos
   curl http://localhost:5000/api/historico
   
   # Carregar branding
   curl http://localhost:5000/api/perfil
   
   # Ver se arquivo existe
   curl http://localhost:5000/test-uploads/NOMEDOARQUIVO.jpg
   ```

4. **Se nada funcionar:** Deletar `vet_assist.db` e recomeçar do zero

---

**Última atualização:** 09/05/2026
**Problema resolvido:** ✅ Fotos intermitentes + Design profissional
