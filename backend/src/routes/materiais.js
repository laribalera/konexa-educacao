const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');
const supabaseAdmin = require('../lib/supabaseAdmin');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// POST: /:id/materiais - prof faz o upload do material

router.post('/:id/materiais', auth, upload.single('arquivo'), async (req, res) => {

  const { id } = req.params;
  const { titulo } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!titulo || !req.file) {
    return res.status(400).json({ error: 'Título e arquivo são obrigatórios' });
  }

  try {
    // gera um nome único para o arquivo
    const ext = req.file.originalname.split('.').pop();
    const nomeArquivo = `${id}/${Date.now()}.${ext}`;

    // faz upload para o supa
    const { error: uploadError } = await supabaseAdmin.storage
      .from('materiais')
      .upload(nomeArquivo, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }

    // gera a url pblica do arquivo
    const { data } = supabaseAdmin.storage
      .from('materiais')
      .getPublicUrl(nomeArquivo);

    // salva o material no banco
    const { rows } = await db.query(
      `INSERT INTO public.materiais (turma_id, titulo, arquivo_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, titulo, data.publicUrl]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar material:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});


// GET: /:id/materiais - lista os materiais de uma turma

router.get('/:id/materiais', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT * FROM public.materiais WHERE turma_id = $1 ORDER BY criado_em DESC',
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar materiais:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE: /materiais/:id - prof pode deletar um material

router.delete('/:id/materiais/:materialId', auth, async (req, res) => {
  const { id, materialId } = req.params;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    // busca o material para pegar a uel antes de deletar
    const { rows } = await db.query(
      'SELECT * FROM public.materiais WHERE id = $1 AND turma_id = $2',
      [materialId, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }

    const material = rows[0];

    // extrai o path do arquivo da url publica
    const path = material.arquivo_url.split('/public/materiais/')[1];

    // remove do supa
    const { error: storageError } = await supabaseAdmin.storage
      .from('materiais')
      .remove([path]);

    if (storageError) {
      console.error('Erro ao remover arquivo:', storageError);
      return res.status(500).json({ error: 'Erro ao remover arquivo do storage' });
    }

    // remove do banco
    await db.query('DELETE FROM public.materiais WHERE id = $1', [materialId]);

    return res.json({ message: 'Material removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover material:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;