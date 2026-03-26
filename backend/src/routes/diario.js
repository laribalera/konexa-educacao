const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// POST: /diario - professor cria entrada no diário
router.post('/', auth, async (req, res) => {
  const { turma_id, conteudo } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Apenas professores podem criar entradas no diário' });
  }
  if (!turma_id || !conteudo) {
    return res.status(400).json({ error: 'turma_id e conteudo são obrigatórios' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.diario_turma (professor_id, turma_id, conteudo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, turma_id, conteudo]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar entrada no diário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET: /diario?turma_id=xxx - lista entradas do diário
router.get('/', auth, async (req, res) => {
  const { turma_id } = req.query;

  if (!turma_id) {
    return res.status(400).json({ error: 'turma_id é obrigatório' });
  }

  try {
    const { rows } = await db.query(
      `SELECT d.*, u.nome AS professor_nome
       FROM public.diario_turma d
       INNER JOIN public.users u ON u.id = d.professor_id
       WHERE d.turma_id = $1
       ORDER BY d.criado_em DESC`,
      [turma_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar diário:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PUT: /diario/:id - professor edita entrada
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { conteudo } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!conteudo) {
    return res.status(400).json({ error: 'conteudo é obrigatório' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE public.diario_turma
       SET conteudo = $1, atualizado_em = now()
       WHERE id = $2 AND professor_id = $3
       RETURNING *`,
      [conteudo, id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao editar entrada:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE: /diario/:id - professor dleta entrada
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const { rows } = await db.query(
      'DELETE FROM public.diario_turma WHERE id = $1 AND professor_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }
    return res.json({ message: 'Entrada deletada com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar entrada:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;