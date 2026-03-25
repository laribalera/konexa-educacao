const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middlewares/auth');


// POST: /turmas/:id/config-notas - configurar notas da turma (apenas professores)

router.post('/:id/config-notas', auth, async (req, res) => {
    const { id } = req.params;
    const { disciplina, peso_prova, peso_atividades  } = req.body;

    if(req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado: apenas professores podem configurar notas' });
    }

    if (!disciplina || peso_prova == null || peso_atividades  == null) {
        return res.status(400).json({ error: 'Disciplina, peso da prova e peso da atividade são obrigatórios' });
    }

    if(Number(peso_prova) + Number(peso_atividades ) !== 10) {
        return res.status(400).json({ error: 'peso_prova + peso_atividades deve ser igual a 10' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO public.configuracao_notas (turma_id, disciplina, peso_prova, peso_atividades )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [id, disciplina, peso_prova, peso_atividades]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // violação de chave única (configuração já existe para a turma)
            return res.status(400).json({ error: 'Configuração de notas já existe para esta turma' });
        }
        console.error('Erro ao configurar notas:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});


// GET: /turmas/:id/config-notas - obter configuração de notas da turma (alunos e professores)

router.get('/:id/config-notas', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT * FROM public.configuracao_notas WHERE turma_id = $1 ORDER BY disciplina ASC',
      [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar config de notas:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});


// PUT /turmas/:id/config-notas/:disciplina - atualizar configuração de notas da turma (apenas professores)

router.put('/:id/config-notas/:disciplina', auth, async (req, res) => {
  const { id, disciplina } = req.params;
  const { peso_prova, peso_atividades } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (Number(peso_prova) + Number(peso_atividades) !== 10) {
    return res.status(400).json({ error: 'peso_prova + peso_atividades deve ser igual a 10' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE public.configuracao_notas
       SET peso_prova = $1, peso_atividades = $2
       WHERE turma_id = $3 AND disciplina = $4
       RETURNING *`,
      [peso_prova, peso_atividades, id, disciplina]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar config de notas:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});


// POST: /notas - lançar nota para um aluno (apenas professores)

router.post('/', auth, async (req, res) => {
  const { aluno_id, turma_id, disciplina, tipo, valor, descricao } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!aluno_id || !turma_id || !disciplina || !tipo || valor == null) {
    return res.status(400).json({ error: 'aluno_id, turma_id, disciplina, tipo e valor são obrigatórios' });
  }
  if (!['prova', 'atividade'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo deve ser prova ou atividade' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.notas (aluno_id, turma_id, disciplina, tipo, valor, descricao)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [aluno_id, turma_id, disciplina, tipo, valor, descricao || null]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao lançar nota:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /notas - listar notas de um aluno em uma turma (alunos e professores)

router.get('/', auth, async (req, res) => {
  const { aluno_id, turma_id } = req.query;

  if (!turma_id) {
    return res.status(400).json({ error: 'turma_id é obrigatório' });
  }

  try {
    const { rows } = await db.query(
      `SELECT n.*, u.nome AS aluno_nome
       FROM public.notas n
       INNER JOIN public.users u ON u.id = n.aluno_id
       WHERE n.turma_id = $1
       ${aluno_id ? 'AND n.aluno_id = $2' : ''}
       ORDER BY n.criado_em DESC`,
      aluno_id ? [turma_id, aluno_id] : [turma_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar notas:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});


// PUT /notas/:id - atualizar nota (apenas professores)

router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { valor, descricao } = req.body;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE public.notas SET valor = $1, descricao = $2 WHERE id = $3 RETURNING *`,
      [valor, descricao || null, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao editar nota:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE /notas/:id - excluir nota (apenas professores)

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const { rows } = await db.query(
      'DELETE FROM public.notas WHERE id = $1 RETURNING id',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    return res.json({ message: 'Nota removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover nota:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /alunos/:id/desempenho - obter desempenho de um aluno em todas as turmas (apenas o próprio aluno ou professores)

router.get('/:id/desempenho', auth, async (req, res) => {
  const { id } = req.params;
  const { turma_id } = req.query;

  if (!turma_id) {
    return res.status(400).json({ error: 'turma_id é obrigatório' });
  }

  try {
    // busca todss as notas do aluno na turma
    const { rows: notas } = await db.query(
      `SELECT disciplina, tipo, valor
       FROM public.notas
       WHERE aluno_id = $1 AND turma_id = $2`,
      [id, turma_id]
    );

    // busca configuração de pesos
    const { rows: configs } = await db.query(
      'SELECT * FROM public.configuracao_notas WHERE turma_id = $1',
      [turma_id]
    );

    // calcula média por disciplina
    const desempenho = configs.map(config => {
      const notasDisciplina = notas.filter(n => n.disciplina === config.disciplina);
      const provas = notasDisciplina.filter(n => n.tipo === 'prova');
      const atividades = notasDisciplina.filter(n => n.tipo === 'atividade');

      const mediaProvas = provas.length > 0
        ? provas.reduce((acc, n) => acc + Number(n.valor), 0) / provas.length
        : 0;

      const mediaAtividades = atividades.length > 0
        ? atividades.reduce((acc, n) => acc + Number(n.valor), 0) / atividades.length
        : 0;

      const notaFinal = (
        (mediaProvas * Number(config.peso_prova) +
        mediaAtividades * Number(config.peso_atividades)) / 10
      ).toFixed(1);

      return {
        disciplina: config.disciplina,
        media_provas: mediaProvas.toFixed(1),
        media_atividades: mediaAtividades.toFixed(1),
        peso_prova: config.peso_prova,
        peso_atividades: config.peso_atividades,
        nota_final: notaFinal,
      };
    });

    return res.json(desempenho);
  } catch (err) {
    console.error('Erro ao calcular desempenho:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;