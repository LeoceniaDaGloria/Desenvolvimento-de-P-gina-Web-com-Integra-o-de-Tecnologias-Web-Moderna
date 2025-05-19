
console.log('Carregando socketHandler.js...');
const fs = require('fs').promises;
const path = require('path');

const dadosPath = path.join(__dirname, '../../public/dados.json');

// Normalizar texto
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Verificar/criar dados.json
const ensureDadosFile = async () => {
  console.log('Verificando dados.json...');
  try {
    await fs.access(dadosPath);
    console.log('dados.json encontrado.');
  } catch {
    console.log('Criando dados.json...');
    const initialData = { contato: [], chat: [], estoque: [] };
    await fs.writeFile(dadosPath, JSON.stringify(initialData, null, 2), 'utf8');
    console.log('dados.json criado.');
  }
};

const readDados = async () => {
  console.log('Lendo dados.json...');
  try {
    await ensureDadosFile();
    const data = await fs.readFile(dadosPath, 'utf8');
    if (!data.trim()) {
      console.log('dados.json vazio, retornando estrutura inicial...');
      return { contato: [], chat: [], estoque: [] };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler dados.json:', error.message);
    return { contato: [], chat: [], estoque: [] };
  }
};

const writeDados = async (dados) => {
  console.log('Escrevendo em dados.json...');
  try {
    await fs.writeFile(dadosPath, JSON.stringify(dados, null, 2), 'utf8');
    console.log('dados.json escrito com sucesso.');
  } catch (error) {
    console.error('Erro ao escrever em dados.json:', error.message, error.stack);
    throw error;
  }
};

module.exports = (wss) => {
  console.log('Configurando WebSocket...');
  const userQuestionCount = new Map();
  const userFirstMessage = new Map();
  const adminConnectedUsers = new Set();
  const adminClients = new Set();
  let isUpdatingStock = false;

  wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');

    readDados().then(dados => {
      console.log('Enviando estoque inicial:', dados.estoque);
      ws.send(JSON.stringify({ type: 'estoque', items: dados.estoque }));
    }).catch(error => {
      console.error('Erro ao enviar estoque:', error.message);
    });

    ws.on('message', async (message) => {
      try {
        console.log('Mensagem recebida:', message.toString());
        const data = JSON.parse(message.toString());
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        if (data.type === 'chat') {
          const dados = await readDados();
          const usuario = data.usuario;
          const cidade = data.cidade || 'Desconhecida';
          const mensagemOriginal = data.mensagem;
          const mensagem = normalizeText(data.mensagem);
          const replyTo = data.replyTo;

          const novaMensagem = {
            id: dados.chat.length + 1,
            usuario,
            mensagem: `${usuario}: ${mensagemOriginal}`,
            sender: 'user',
            timestamp,
            replyTo
          };
          dados.chat.push(novaMensagem);

          // Enviar mensagem do usuário para todos os clientes
          let clientsSent = 0;
          wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({
                type: adminClients.has(client) ? 'admin' : 'chat',
                mensagem: novaMensagem.mensagem,
                sender: 'user',
                timestamp,
                id: novaMensagem.id,
                replyTo
              }));
              clientsSent++;
            }
          });
          console.log(`Mensagem do usuário ${usuario} enviada para ${clientsSent} clientes`);

          if (adminConnectedUsers.has(usuario)) {
            await writeDados(dados);
            return;
          }

          if (!userFirstMessage.has(usuario)) {
            userFirstMessage.set(usuario, true);
            userQuestionCount.set(usuario, 0);

            const initialResponse = {
              type: 'chat',
              mensagem: `Olá ${usuario} de ${cidade}, seja bem-vindo à SoluStyle! Você pode fazer até 2 perguntas.`,
              sender: 'system',
              timestamp
            };
            ws.send(JSON.stringify(initialResponse));
            dados.chat.push({
              id: dados.chat.length + 1,
              usuario: 'Sistema',
              mensagem: initialResponse.mensagem,
              sender: 'system',
              timestamp
            });

            const questionsResponse = {
              type: 'chat',
              mensagem: 'As questões que posso responder são: 1. Como funciona o estoque? 2. Como funciona o cadastro de usuários?',
              sender: 'system',
              timestamp
            };
            ws.send(JSON.stringify(questionsResponse));
            dados.chat.push({
              id: dados.chat.length + 1,
              usuario: 'Sistema',
              mensagem: questionsResponse.mensagem,
              sender: 'system',
              timestamp
            });

            await writeDados(dados);
            return;
          }

          let questionCount = userQuestionCount.get(usuario);
          if (questionCount >= 2) {
            const limitMessage = {
              type: 'chat',
              mensagem: 'Você atingiu o limite de 2 perguntas. Conectando ao administrador...',
              sender: 'system',
              timestamp
            };
            ws.send(JSON.stringify(limitMessage));
            dados.chat.push({
              id: dados.chat.length + 1,
              usuario: 'Sistema',
              mensagem: limitMessage.mensagem,
              sender: 'system',
              timestamp
            });

            adminConnectedUsers.add(usuario);
            const connectMessage = {
              type: 'admin',
              mensagem: `${usuario} foi conectado ao administrador.`,
              sender: 'system',
              timestamp
            };
            wss.clients.forEach(client => {
              if (client.readyState === client.OPEN && adminClients.has(client)) {
                client.send(JSON.stringify(connectMessage));
              }
            });
            dados.chat.push({
              id: dados.chat.length + 1,
              usuario: 'Sistema',
              mensagem: connectMessage.mensagem,
              sender: 'system',
              timestamp
            });
            await writeDados(dados);
            return;
          }

          let resposta;
          let isQuestion = false;

          if (mensagem.includes('estoque') || mensagem.includes('produtos') || mensagem.includes('como funciona o estoque')) {
            isQuestion = true;
            resposta = `Temos camisetas e calças disponíveis. Veja os detalhes na página de Estoque! (${2 - questionCount - 1} pergunta${questionCount === 1 ? '' : 's'} restante${questionCount === 1 ? '' : 's'})`;
          } else if (mensagem.includes('cadastro') || mensagem.includes('usuarios') || mensagem.includes('como funciona o cadastro de usuarios')) {
            isQuestion = true;
            resposta = `O cadastro de usuários pode ser feito na página de Contato, preenchendo o formulário. Após o envio, você receberá uma confirmação em até 24 horas! (${2 - questionCount - 1} pergunta${questionCount === 1 ? '' : 's'} restante${questionCount === 1 ? '' : 's'})`;
          }

          if (isQuestion) {
            questionCount += 1;
            userQuestionCount.set(usuario, questionCount);
            console.log(`Pergunta registrada para ${usuario}, total: ${questionCount}`);
            const systemResponse = {
              type: 'chat',
              mensagem: resposta,
              sender: 'system',
              timestamp
            };
            ws.send(JSON.stringify(systemResponse));
            dados.chat.push({
              id: dados.chat.length + 1,
              usuario: 'Sistema',
              mensagem: resposta,
              sender: 'system',
              timestamp
            });
            await writeDados(dados);
          }
        }

        if (data.type === 'admin') {
          console.log('Mensagem do admin:', data);
          const dados = await readDados();
          const mensagem = `${data.usuario}: ${data.mensagem}`;
          const replyTo = data.replyTo;
          const adminMessage = {
            id: dados.chat.length + 1,
            usuario: data.usuario,
            mensagem,
            sender: 'admin',
            timestamp,
            replyTo
          };
          dados.chat.push(adminMessage);

          let usersSent = 0;
          wss.clients.forEach(client => {
            if (client.readyState === client.OPEN && !adminClients.has(client)) {
              client.send(JSON.stringify({
                type: 'chat',
                mensagem,
                sender: 'admin',
                timestamp,
                id: adminMessage.id,
                replyTo
              }));
              usersSent++;
            }
          });

          let adminsSent = 0;
          wss.clients.forEach(client => {
            if (client.readyState === client.OPEN && adminClients.has(client)) {
              client.send(JSON.stringify({
                type: 'admin',
                mensagem,
                sender: 'admin',
                timestamp,
                id: adminMessage.id,
                replyTo
              }));
              adminsSent++;
            }
          });

          console.log(`Mensagem do admin enviada para ${usersSent} usuário(s) e ${adminsSent} administrador(es)`);
          await writeDados(dados);
        }

        if (data.type === 'loadAdminHistory') {
          console.log('Carregando histórico do admin...');
          const dados = await readDados();
          const adminMessages = dados.chat.filter(msg => adminConnectedUsers.has(msg.usuario) || msg.sender === 'admin' || (msg.sender === 'system' && msg.mensagem.includes('conectado ao administrador')));
          ws.send(JSON.stringify({ type: 'adminHistory', messages: adminMessages }));
          adminClients.add(ws);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error.message, error.stack);
      }
    });

    ws.on('close', () => {
      console.log('Cliente desconectado');
      adminClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('Erro no WebSocket:', error.message);
    });
  });

  // Atualização de estoque
  setInterval(async () => {
    if (isUpdatingStock) {
      console.log('Atualização de estoque em andamento...');
      return;
    }
    isUpdatingStock = true;
    console.log('Iniciando atualização de estoque...');
    try {
      const dados = await readDados();
      if (dados.estoque.length === 0) {
        dados.estoque = [
          { id: 1, produto: 'Camiseta', quantidade: 50, preco: 29.99, ultimaAtualizacao: new Date().toISOString() },
          { id: 2, produto: 'Calça', quantidade: 30, preco: 59.99, ultimaAtualizacao: new Date().toISOString() }
        ];
      }
      dados.estoque.forEach(item => {
        const quantidadeReduzida = Math.floor(Math.random() * 5);
        item.quantidade = Math.max(0, item.quantidade - quantidadeReduzida);
        const variacaoPreco = (Math.random() - 0.5) * 5;
        item.preco = parseFloat((item.preco + variacaoPreco).toFixed(2));
        item.ultimaAtualizacao = new Date().toISOString();
        console.log(`Atualizando ${item.produto}: quantidade -${quantidadeReduzida} (${item.quantidade}), preço +${variacaoPreco.toFixed(2)} (${item.preco})`);
      });
      await writeDados(dados);
      let clientsSent = 0;
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: 'estoque', items: dados.estoque }));
          clientsSent++;
        }
      });
      console.log(`Estoque atualizado para ${clientsSent} clientes.`);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error.message, error.stack);
    } finally {
      isUpdatingStock = false;
    }
  }, 2000);
};