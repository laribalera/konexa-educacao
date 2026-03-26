const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// POST: /anotacoes - aluno salva ou atualiza anotação
router.post('/', auth, async (req, res) => {
    const { turma_id, conteudo } = req.body;

    if (req.user.role !== 'aluno') {
        return res.status(403).json({ error: 'Apenas alunos podem criar anotações' });
    }
    if (!turma_id || !conteudo) {
        return res.status(400).json({ error: 'turma_id e conteudo são obrigatórios' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO public.anotacoes (aluno_id, turma_id, conteudo, atualizado_em)
   VALUES ($1, $2, $3, now())
   RETURNING *`,
            [req.user.id, turma_id, conteudo]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Erro ao salvar anotação:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// GET /anotacoes - aluno busca suas anotações
router.get('/', auth, async (req, res) => {
    const { turma_id } = req.query;

    if (req.user.role !== 'aluno') {
        return res.status(403).json({ error: 'Apenas alunos podem ver anotações' });
    }

    try {
        const { rows } = await db.query(
            `SELECT a.*, t.nome AS turma_nome
       FROM public.anotacoes a
       INNER JOIN public.turmas t ON t.id = a.turma_id
       WHERE a.aluno_id = $1
       ${turma_id ? 'AND a.turma_id = $2' : ''}
       ORDER BY a.atualizado_em DESC`,
            turma_id ? [req.user.id, turma_id] : [req.user.id]
        );
        return res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar anotações:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// PUT /anotacoes/:id - aluno atualiza anotação

router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { conteudo } = req.body;

  if (req.user.role !== 'aluno') {
    return res.status(403).json({ error: 'Apenas alunos podem editar anotações' });
  }
  if (!conteudo) {
    return res.status(400).json({ error: 'conteudo é obrigatório' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE public.anotacoes 
       SET conteudo = $1, atualizado_em = now()
       WHERE id = $2 AND aluno_id = $3
       RETURNING *`,
      [conteudo, id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar anotação:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE: /anotacoes/:id - aluno deleta anotação 
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'aluno') {
        return res.status(403).json({ error: 'Apenas alunos podem deletar anotações' });
    }

    try {
        const { rows } = await db.query(
            'DELETE FROM public.anotacoes WHERE id = $1 AND aluno_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Anotação não encontrada' });
        }
        return res.json({ message: 'Anotação deletada com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar anotação:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

module.exports = router;