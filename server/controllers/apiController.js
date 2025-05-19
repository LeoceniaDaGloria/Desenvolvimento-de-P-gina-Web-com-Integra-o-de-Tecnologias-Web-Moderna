
console.log('Carregando apiController.js...');
const fs = require('fs').promises;
const path = require('path');

const dadosPath = path.join(__dirname, '../../public/dados.json');

// Verifica se o arquivo existe, caso contrário, cria com estrutura inicial
const ensureDadosFile = async () => {
  console.log('Verificando existência de dados.json...');
  try {
    await fs.access(dadosPath);
    console.log('dados.json encontrado.');
  } catch {
    console.log('dados.json não encontrado, criando arquivo inicial...');
    const initialData = { contato: [], chat: [], estoque: [] };
    await fs.writeFile(dadosPath, JSON.stringify(initialData, null, 2), 'utf8');
  }
};

const readDados = async () => {
  console.log('Lendo dados.json...');
  try {
    await ensureDadosFile();
    const data = await fs.readFile(dadosPath, 'utf8');
    if (!data.trim()) {
      console.log('dados.json está vazio, retornando estrutura inicial...');
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
    console.error('Erro ao escrever em dados.json:', error.message);
  }
};

exports.contato = async (req, res) => {
  console.log('Processando requisição de contato...');
  try {
    const { nome, email, mensagem } = req.body;

    if (!nome || !email || !mensagem) {
      console.log('Campos obrigatórios faltando:', { nome, email, mensagem });
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const dados = await readDados();
    const novoContato = {
      id: dados.contato.length + 1,
      nome,
      email,
      mensagem,
      data: new Date().toISOString()
    };

    dados.contato.push(novoContato);
    await writeDados(dados);

    console.log('Contato salvo com sucesso:', novoContato);
    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao processar contato:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};