const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');

// POST: /turmas - criar nova turma (somente professores)

router.post('/', auth, async (req, res) => {
    const { nome, ano_letivo } = req.body;

    if (req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado: role de professor não atribuído' });
    }

    if (!nome || !ano_letivo) {
        return res.status(400).json({ error: 'Nome e ano letivo são obrigatórios' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO public.turmas (nome, ano_letivo, professor_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [nome, ano_letivo, req.user.id]
        );
        return res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Erro ao criar turma:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET: turmas - listar turmas do professor logado

router.get('/', auth, async (req, res) => {
    try {
        let rows; // variável para armazenar resultado da consulta

        if (req.user.role === 'professor') {
            ({ rows } = await db.query(
                'SELECT * FROM public.turmas WHERE professor_id = $1 ORDER BY criado_em DESC',
                [req.user.id]
            ));
        } else {
            ({ rows } = await db.query(
                `SELECT 
                    t.*,
                    u.nome AS nome_professor
                FROM public.turmas t
                INNER JOIN public.turma_alunos ta ON ta.turma_id = t.id
                INNER JOIN public.users u ON u.id = t.professor_id
                WHERE ta.aluno_id = $1
                ORDER BY ta.matriculado_em DESC`,
                [req.user.id]
            ));
        }

        return res.json(rows);
    } catch (error) {
        console.error('Erro ao listar turmas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// POST: /turmas/entrar - aluno entra em turma por código

router.post('/entrar', auth, async (req, res) => {
    const { codigo } = req.body;

    if (req.user.role !== 'aluno') {
        return res.status(403).json({ error: 'Acesso negado: role de aluno não atribuído' });
    }

    if (!codigo) {
        return res.status(400).json({ error: 'Código da turma é obrigatório' });
    }

    try {
        // busca turma por código
        const { rows: turmas } = await db.query(
            'SELECT * FROM public.turmas WHERE codigo = $1',
            [codigo.toUpperCase()]
        );

        if (turmas.length === 0) {
            return res.status(404).json({ error: 'Turma não encontrada' });
        }

        const turma = turmas[0];

        // verifica se aluno já está matriculado
        const { rows: matricula } = await db.query(
            'SELECT * FROM public.turma_alunos WHERE turma_id = $1 AND aluno_id = $2',
            [turma.id, req.user.id]
        );

        if (matricula.length > 0) {
            return res.status(400).json({ error: 'Aluno já matriculado nesta turma' });
        }

        // insere matrícula
        await db.query(
            'INSERT INTO public.turma_alunos (turma_id, aluno_id) VALUES ($1, $2)',
            [turma.id, req.user.id]
        );

        return res.status(201).json({ message: 'Aluno matriculado com sucesso', turma });
    } catch (error) {
        console.error('Erro ao entrar na turma:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET: /turmas/:id/alunos - lista alunos matriculados na turma

router.get('/:id/alunos', auth, async (req, res) => {
    const { id } = req.params;

    //console.log('turma id:', id);
    //console.log('user:', req.user);

    try {
        // Verifica se o professor é dono da turma
        if (req.user.role === 'professor') {
            const { rows } = await db.query(
                'SELECT 1 FROM public.turmas WHERE id = $1 AND professor_id = $2',
                [id, req.user.id]
            );
            if (rows.length === 0) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
        }

        const { rows } = await db.query(
            `WITH professor AS (
                SELECT p.id, p.nome AS nome_professor
                FROM public.users p
                WHERE role = 'professor' AND p.id = (SELECT professor_id FROM public.turmas WHERE id = $1)
            )
            SELECT u.id, u.nome, u.email, ta.matriculado_em, professor.nome_professor
            FROM public.users u
            INNER JOIN public.turma_alunos ta ON ta.aluno_id = u.id
            CROSS JOIN professor
            WHERE ta.turma_id = $1
            ORDER BY u.nome ASC`,
            [id]
        );

        return res.json(rows);
    } catch (error) {
        console.error('Erro ao listar alunos:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// DELETE: /turmas/:id/alunos/:alunoId - remover aluno da turma

router.delete('/:id/alunos/:alunoId', auth, async (req, res) => {
    const { id, alunoId } = req.params;

    if (req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado: apenas professores' });
    }

    try {
        // verifica se o profe é dono da turma
        const { rows: turma } = await db.query(
            'SELECT 1 FROM public.turmas WHERE id = $1 AND professor_id = $2',
            [id, req.user.id]
        );

        if (turma.length === 0) {
            return res.status(403).json({ error: 'Acesso negado: você não é dono da turma' });
        }

        // verifica se o aluno ta na turma
        const { rows: matricula } = await db.query(
            'SELECT 1 FROM public.turma_alunos WHERE turma_id = $1 AND aluno_id = $2',
            [id, alunoId]
        );

        if (matricula.length === 0) {
            return res.status(404).json({ error: 'Aluno não está matriculado nesta turma' });
        }

        // remove o aluno
        await db.query(
            'DELETE FROM public.turma_alunos WHERE turma_id = $1 AND aluno_id = $2',
            [id, alunoId]
        );

        return res.json({ message: 'Aluno removido com sucesso' });

    } catch (error) {
        console.error('Erro ao remover aluno:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE: /turmas/:id - excluir turma (somente professor dono da turma)

router.delete('/:id', auth, async (req, res) => {
    const turmaId = req.params.id;

    if (req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado: role de professor não atribuído' });
    }

    try {
        // Verifica se o professor é dono da turma
        const { rows } = await db.query(
            'SELECT 1 FROM public.turmas WHERE id = $1 AND professor_id = $2',
            [turmaId, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Exclui a turma (as relações de alunos serão excluídas automaticamente por cascade)
        await db.query(
            'DELETE FROM public.turmas WHERE id = $1',
            [turmaId]
        );
        return res.json({ message: 'Turma excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir turma:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;