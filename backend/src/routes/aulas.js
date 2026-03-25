const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// POST: /aulas — professor cria aula 
router.post('/', auth, async (req, res) => {
  const { turma_id, disciplina, data, descricao } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!turma_id || !disciplina || !data) {
    return res.status(400).json({ error: 'turma_id, disciplina e data são obrigatórios' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.aulas (turma_id, disciplina, data, descricao)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [turma_id, disciplina, data, descricao || null]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar aula:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET: /aulas — lista aulas da turma 
router.get('/', auth, async (req, res) => {
  const { turma_id } = req.query;

  if (!turma_id) {
    return res.status(400).json({ error: 'turma_id é obrigatório' });
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM public.aulas WHERE turma_id = $1 ORDER BY data DESC',
      [turma_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar aulas:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST: /aulas/:id/chamada — registra presenças
router.post('/:id/chamada', auth, async (req, res) => {
  const { id } = req.params;
  const { presencas } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!presencas || !Array.isArray(presencas) || presencas.length === 0) {
    return res.status(400).json({ error: 'presencas deve ser um array com pelo menos um item' });
  }

  try {
    // insere todas as presenças de uma vez
    const valores = presencas.map((_, i) => 
      `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
    ).join(', ');

    const params = presencas.flatMap(p => [id, p.aluno_id, p.presente ?? false]);

    const { rows } = await db.query(
      `INSERT INTO public.presencas (aula_id, aluno_id, presente)
       VALUES ${valores}
       ON CONFLICT (aula_id, aluno_id) DO UPDATE SET presente = EXCLUDED.presente
       RETURNING *`,
      params
    );

    return res.status(201).json(rows);
  } catch (err) {
    console.error('Erro ao registrar chamada:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;