const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// GET: /presencas — aluno consulta própria frequência
router.get('/', auth, async (req, res) => {
  const { turma_id } = req.query;

  if (!turma_id) {
    return res.status(400).json({ error: 'turma_id é obrigatório' });
  }

  try {
    const { rows } = await db.query(
      `SELECT 
         a.data, a.disciplina, a.descricao,
         p.presente
       FROM public.presencas p
       INNER JOIN public.aulas a ON a.id = p.aula_id
       WHERE p.aluno_id = $1 AND a.turma_id = $2
       ORDER BY a.data DESC`,
      [req.user.id, turma_id]
    );

    const total = rows.length;
    const presentes = rows.filter(r => r.presente).length;
    const percentual = total > 0 ? ((presentes / total) * 100).toFixed(1) : '0.0';

    return res.json({
      frequencia: `${percentual}%`,
      total_aulas: total,
      presencas: presentes,
      faltas: total - presentes,
      detalhes: rows
    });
  } catch (err) {
    console.error('Erro ao consultar frequência:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PUT: /presencas/:aula_id — corrige chamada
router.put('/:aula_id', auth, async (req, res) => {
  const { aula_id } = req.params;
  const { presencas } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!presencas || !Array.isArray(presencas) || presencas.length === 0) {
    return res.status(400).json({ error: 'presencas deve ser um array com pelo menos um item' });
  }

  try {
    const valores = presencas.map((_, i) =>
      `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
    ).join(', ');

    const params = presencas.flatMap(p => [aula_id, p.aluno_id, p.presente ?? false]);

    const { rows } = await db.query(
      `INSERT INTO public.presencas (aula_id, aluno_id, presente)
       VALUES ${valores}
       ON CONFLICT (aula_id, aluno_id) DO UPDATE SET presente = EXCLUDED.presente
       RETURNING *`,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error('Erro ao corrigir chamada:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;