const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// POST: /mensagens - enviar mensagem no chat da turma (alunos e professores)

router.post('/', auth, async (req, res) => {
    const { turma_id, conteudo } = req.body;

    if (!turma_id || !conteudo) {
        return res.status(400).json({ error: 'Turma ID e conteúdo da mensagem são obrigatórios' });
    }

    try {
        // verifica se o usuário pertence a turma (aluno ou professor)
        const { rows: acesso } = await db.query(
            `SELECT 1 FROM public.turmas WHERE id = $1 AND professor_id = $2
             UNION
             SELECT 1 FROM public.turma_alunos WHERE turma_id = $1 AND aluno_id = $2`,
            [turma_id, req.user.id]
        );

        if (acesso.length === 0) {
            return res.status(403).json({ error: 'Acesso negado: usuário não pertence a esta turma' });
        }

        const { rows } = await db.query(
            `INSERT INTO public.mensagens (turma_id, autor_id, conteudo)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [turma_id, req.user.id, conteudo]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// GET /mensagens?turma_id= - listar mensagens de uma turma (alunos e professores)

router.get('/', auth, async (req, res) => {
    const { turma_id } = req.query;

    if (!turma_id) {
        return res.status(400).json({ error: 'turma_id é obrigatório' });
    }

    try {
        // Verifica se o usuário pertence à turma
        const { rows: acesso } = await db.query(
            `SELECT 1 FROM public.turmas WHERE id = $1 AND professor_id = $2
       UNION
       SELECT 1 FROM public.turma_alunos WHERE turma_id = $1 AND aluno_id = $2`,
            [turma_id, req.user.id]
        );

        if (acesso.length === 0) {
            return res.status(403).json({ error: 'Você não pertence a essa turma' });
        }

        const { rows } = await db.query(
            `SELECT m.id, m.conteudo, m.criado_em - INTERVAL '3 hours' AS criado_em,
                u.id AS autor_id, u.nome AS autor_nome, u.role AS autor_role
                FROM public.mensagens m
                INNER JOIN public.users u ON u.id = m.autor_id
                WHERE m.turma_id = $1
            ORDER BY m.criado_em ASC`,
            [turma_id]
        );

        return res.json(rows);
    } catch (err) {
        console.error('Erro ao listar mensagens:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// DELETE /mensagens/:id - excluir mensagem (somente professor dono da turma)

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    // erifica se o professor é dono da turma
    const { rows: turma } = await db.query(
      `SELECT t.id FROM public.turmas t
       INNER JOIN public.mensagens m ON m.turma_id = t.id
       WHERE m.id = $1 AND t.professor_id = $2`,
      [id, req.user.id]
    );

    if (turma.length === 0) {
      return res.status(403).json({ error: 'Acesso negado: somente o professor dono da turma pode excluir mensagens' });
    }

    await db.query('DELETE FROM public.mensagens WHERE id = $1', [id]);
    return res.json({ message: 'Mensagem excluída com sucesso' });

  } catch (err) {
    console.error('Erro ao excluir mensagem:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;

