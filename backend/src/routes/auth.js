const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const supabaseAdmin = require('../lib/supabaseAdmin');

// POST: auth/cadastro
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha, role } = req.body;

    // validação básica
    if (!nome || !email || !senha || !role) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    if (!['aluno', 'professor'].includes(role)) {
        return res.status(400).json({ error: 'Role deve ser "aluno" ou "professor"' });
    }

    try {
        // cria usuário no supabase - trigger do supabase vai criar o perfil na tabela profiles automaticamente
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: false, // para desenvolvimento, não enviamos email de confirmação
            user_metadata: { nome, role }, // armazenar nome e role como metadata do usuário no Supabase
        });

        if (authError) {
            console.error('Erro ao criar usuário no Supabase:', authError);
            return res.status(500).json({ error: 'Erro ao criar usuário' });
        }

        // hash da senha pra armazenar no banco
        const senhaHash = await bcrypt.hash(senha, 10);
        await db.query(
            'UPDATE public.users SET senha_hash = $1 WHERE id = $2',
            [senhaHash, authData.user.id]
        );

        // busca usuário criado para retornar no response
        const { rows } = await db.query(
            'SELECT id, nome, email, role FROM public.users WHERE id = $1',
            [authData.user.id]
        );

        const user = rows[0];

        // gera token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro no cadastro' });
    }
});

// POST: auth/login

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        // busca usuário por email
        const { rows } = await db.query(
            'SELECT * FROM public.users WHERE email = $1',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = rows[0];

        // compara senha co hash
        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha inválidas' });
        }

        // gera token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            },
        });
    } catch (error) {
        console.error('Erro no login:', error); // facilitar a vida com mensagens de erro no console
        res.status(500).json({ error: 'Erro no login' });
    }
});

module.exports = router;