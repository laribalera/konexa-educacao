const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// POST: /avisos

router.post('/', auth, async (req, res) => {
    const { turma_id, titulo, conteudo } = req.body;

    if (req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Apenas professores podem criar avisos' });
    }

    if (!turma_id || !conteudo) {
        return res.status(400).json({ error: 'turma_id e conteudo são obrigatórios' });
    }

    try {
        // verifica se o professor é dono da turma
        const { rows: turma } = await db.query(
            'SELECT 1 FROM turmas WHERE id = $1 AND professor_id = $2',
            [turma_id, req.user.id]
        );

        if (turma.length === 0) {
            return res.status(403).json({ error: 'Você não é dono da turma' });
        }

        const { rows } = await db.query(
            `INSERT INTO avisos (turma_id, professor_id, titulo, conteudo)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [turma_id, req.user.id, titulo, conteudo]
        );

        return res.status(201).json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar aviso' });
    }
});

// GET: /avisos/turma/:turmaId

router.get('/turma/:turmaId', auth, async (req, res) => {
    const { turmaId } = req.params;

    try {
        const { rows } = await db.query(
            `SELECT 
                a.*,
                u.nome AS nome_professor
             FROM avisos a
             INNER JOIN users u ON u.id = a.professor_id
             WHERE a.turma_id = $1
             ORDER BY a.criado_em DESC`,
            [turmaId]
        );

        return res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar avisos' });
    }
});

// PUT: /avisos/:id

router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo } = req.body;

    try {
        const { rows } = await db.query(
            `UPDATE avisos
             SET titulo = $1, conteudo = $2
             WHERE id = $3 AND professor_id = $4
             RETURNING *`,
            [titulo, conteudo, id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        return res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar aviso' });
    }
});

// DELETE: /avisos/:id

router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `DELETE FROM avisos
             WHERE id = $1 AND professor_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        return res.json({ message: 'Aviso removido' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover aviso' });
    }
});

// POST: /avisos/:id/reacoes

router.post('/:id/reacoes', auth, async (req, res) => {
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
        return res.status(400).json({ error: 'Emoji é obrigatório' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM aviso_reacoes 
             WHERE aviso_id = $1 AND user_id = $2 AND emoji = $3`,
            [id, req.user.id, emoji]
        );

        if (rows.length > 0) {
            // remove reação
            await db.query(
                `DELETE FROM aviso_reacoes 
                 WHERE aviso_id = $1 AND user_id = $2 AND emoji = $3`,
                [id, req.user.id, emoji]
            );

            return res.json({ removed: true });
        } else {
            // adiciona reação
            await db.query(
                `INSERT INTO aviso_reacoes (aviso_id, user_id, emoji)
                 VALUES ($1, $2, $3)`,
                [id, req.user.id, emoji]
            );

            return res.json({ added: true });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao reagir' });
    }
});

// GET: /avisos/:id/reacoes

router.get('/:id/reacoes', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `SELECT 
                emoji,
                COUNT(*) as total
             FROM aviso_reacoes
             WHERE aviso_id = $1
             GROUP BY emoji`,
            [id]
        );

        return res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reações' });
    }
});

// GET: /avisos/:id/minhas-reacoes

router.get('/:id/minhas-reacoes', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `SELECT emoji 
             FROM aviso_reacoes
             WHERE aviso_id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        return res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reações do usuário' });
    }
});

module.exports = router;