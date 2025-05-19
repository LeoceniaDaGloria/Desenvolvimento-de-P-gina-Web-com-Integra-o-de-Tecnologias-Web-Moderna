
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const WebSocket = require('ws');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const port = process.env.port || 3000;

// Configurar middleware para parsing de JSON e servir arquivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rota para salvar dados do formulário de contato
app.post('/api/CONTATO', async (req, res) => {
  try {
    const { nome, email, mensagem } = req.body;
    if (!nome || !email || !mensagem) {
      console.log('Dados incompletos recebidos:', req.body);
      return res.status(400).json({ error: 'Nome, email e mensagem são obrigatórios' });
    }

    const dadosPath = path.join(__dirname, '../public/dados.json');
    let dados = { contato: [], chat: [], estoque: [] };
    try {
      const data = await fs.readFile(dadosPath, 'utf8');
      if (data.trim()) {
        dados = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao ler dados.json para contato:', error.message);
    }

    const timestamp = new Date().toISOString();
    const novoContato = {
      id: dados.contato.length + 1,
      nome,
      email,
      mensagem,
      timestamp
    };
    dados.contato.push(novoContato);

    await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf8');
    console.log('Contato salvo no dados.json:', novoContato);

    res.status(200).json({ message: 'Contato enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar contato:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao salvar contato' });
  }
});

// Configurar WebSocket
const server = app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });
socketHandler(wss);

// Rota explícita para a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/principal.html'));
});
// Rotas para páginas
app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/stock.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/stock.html'));
});

app.get('/CONTATO.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/CONTATO.html'));
});