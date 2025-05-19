Desenvolvimento de Página Web com Integração de Tecnologias Web Modernas
Descrição do Projeto
Este projeto desenvolve uma aplicação web que demonstra o uso de AJAX, WebSocket, Node.js e Bootstrap. A aplicação inclui três páginas interativas:

contato.html: Formulário para adicionar pessoas (nome, idade, cidade) com comunicação assíncrona via AJAX, exibindo os dados salvos.
chat.html: Chat em tempo real usando WebSocket.
stock.html: Atualizações automáticas de preços de produtos via WebSocket.

Tecnologias Utilizadas

Frontend: HTML, CSS, JavaScript, Bootstrap 5.
Backend: Node.js, Express.js, WebSocket (ws).
Outros: AJAX (via fetch), JSON, dotenv.

Estrutura do Projeto

.env: Configurações de ambiente (ex.: porta).
LICENSE: Licença MIT.
package.json, package-lock.json: Dependências e scripts.
public/:
dados.json: Arquivo com dados de pessoas.
Css/style.css: Estilos personalizados.
Js/app.js: Lógica AJAX para formulário e exibição de dados.
Js/websocket.js: Lógica WebSocket para chat e estoque.
index.html, chat.html, stock.html: Páginas principais.
imagens/: .


server/:
server.js: Servidor Express com suporte a API e WebSocket.
config/config.js: Configurações do servidor.
controller/apiController.js: Lógica da API.
routes/apiRoutes.js: Rotas da API.
socket/socketHandler.js: Lógica do WebSocket.



Como Executar

Pré-requisitos:
Node.js instalado.
Navegador moderno.


Instalação:npm install


Iniciar o servidor:npm start


Acesse em http://localhost:3000.

Funcionalidades

AJAX: Formulário em index.html adiciona dados a dados.json e exibe a lista atualizada sem recarregar a página.
WebSocket:
Chat em tempo real em chat.html.
Atualizações de preços de produtos a cada 5 segundos em stock.html.


Bootstrap: Design responsivo com Navbar, grid, formulários estilizados, cartões, modais e alertas.
Node.js: Backend com Express para API RESTful e ws para WebSocket.

Documentação

Cada arquivo contém comentários explicando sua função.
A API possui uma rota POST /api/adicionar para adicionar dados.
O WebSocket gerencia mensagens de chat e atualizações de estoque em tempo real.

Licença
MIT License. Veja o arquivo LICENSE para detalhes.
