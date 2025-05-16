
console.log('Carregando app.js...');
const form = document.getElementById('contatoForm');
const feedback = document.getElementById('feedback');

if (form && feedback) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulário de contato enviado...');

    const nome = document.getElementById('nome')?.value;
    const email = document.getElementById('email')?.value;
    const mensagem = document.getElementById('mensagem')?.value;

    if (!nome || !email || !mensagem) {
      feedback.innerHTML = '<div class="alert alert-danger">Preencha todos os campos.</div>';
      return;
    }

    try {
      const response = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, mensagem })
      });

      const result = await response.json();
      if (response.ok) {
        feedback.innerHTML = '<div class="alert alert-success">Mensagem enviada com sucesso!</div>';
        form.reset();
      } else {
        feedback.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      feedback.innerHTML = '<div class="alert alert-danger">Erro ao enviar mensagem.</div>';
    }
  });
} else {
  console.log('Formulário de contato não encontrado na página.');
}