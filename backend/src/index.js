require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//app.get('/health', (req, res) => res.json({ status: 'ok' })); // rota de teste para verificar se o backend está rodando

// rotas
app.use('/auth', require('./routes/auth'));
app.use('/turmas', require('./routes/turmas'));
app.use('/turmas', require('./routes/notas'));
app.use('/notas', require('./routes/notas'));
app.use('/alunos', require('./routes/notas'));
app.use('/mensagens', require('./routes/mensagens'));


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));