const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// GET /turmas/:id/frequencia — retorna frequência de todos os alunos da turma
router.get('/:id/frequencia', auth, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    // busca todos os alunos da turma
    const { rows: alunos } = await db.query(
      `SELECT u.id, u.nome FROM turma_alunos ta
       INNER JOIN users u ON u.id = ta.aluno_id
       WHERE ta.turma_id = $1`,
      [id]
    );

    // busca todas as presenças da turma de uma vez
    const { rows: presencas } = await db.query(
      `SELECT p.aluno_id, p.presente
       FROM presencas p
       INNER JOIN aulas a ON a.id = p.aula_id
       WHERE a.turma_id = $1`,
      [id]
    );

    // calcula frequência por aluno
    const resultado = alunos.map(aluno => {
      const ps = presencas.filter(p => p.aluno_id === aluno.id);
      const total = ps.length;
      const presentes = ps.filter(p => p.presente).length;
      const percentual = total > 0 ? ((presentes / total) * 100).toFixed(1) : '0.0';

      return {
        aluno_id: aluno.id,
        nome: aluno.nome,
        frequencia: `${percentual}%`,
        total_aulas: total,
        presencas: presentes,
        faltas: total - presentes,
      };
    });

    return res.json(resultado);
  } catch (err) {
    console.error('Erro ao buscar frequência da turma:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;