require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//app.get('/health', (req, res) => res.json({ status: 'ok' })); // rota de teste para verificar se o backend está rodando

// rotas
app.use('/auth', require('./routes/auth')); // login/logout

app.use('/turmas', require('./routes/turmas')); // CRUD de turmas
app.use('/turmas', require('./routes/notas')); // CRUD de notas dentro de turmas

app.use('/notas', require('./routes/notas')); // CRUD de notas (para professores verem todas as notas, não só dentro de turmas)
app.use('/alunos', require('./routes/notas')); // CRUD de alunos (para professores verem todos os alunos, não só dentro de turmas)

app.use('/mensagens', require('./routes/mensagens')); // CRUD de mensagens (para professores e alunos se comunicarem dentro de turmas)

app.use('/turmas', require('./routes/materiais')); // CRUD de materiais dentro de turmas (professores podem criar, alunos podem ver)

app.use('/aulas', require('./routes/aulas')); // CRUD de aulas dentro de turmas (professores podem criar, alunos podem ver)
app.use('/presencas', require('./routes/presencas')); // CRUD de presenças dentro de aulas (professores podem marcar, alunos podem ver)

app.use('/anotacoes', require('./routes/anotacoes')); // CRUD de anotações (alunos podem criar/atualizar suas anotações por turma

app.use('/diario', require('./routes/diario')); // CRUD de diário de turma (professores podem criar/editar/deletar entradas)

app.use('/avisos', require('./routes/avisos')); // CRUD de avisos dentro de turmas (professores podem criar, alunos podem ver e reagir)

app.use('/turmas', require('./routes/frequencia')); // rota para frequência de alunos dentro de turmas (professores podem ver frequência de todos os alunos, alunos podem ver só a própria frequência)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));