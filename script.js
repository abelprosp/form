(function () {
  const form = document.getElementById('evoluxrh-form');
  const btnBuscar = document.getElementById('buscar_cnpj');
  const cnpjInput = document.getElementById('empresa_cnpj');
  const statusEl = document.getElementById('form_status');
  const cnpjError = document.getElementById('cnpj_error');

  const el = (id) => document.getElementById(id);

  // Campos que podemos preencher via CNPJ (BrasilAPI)
  const autofillMap = {
    empresa_nome: ['razao_social', 'nome_fantasia'],
    empresa_endereco: ['enderecoCompleto'],
    empresa_cidade: ['municipio'],
    empresa_uf: ['uf'],
    empresa_cep: ['cep'],
    empresa_telefone: ['telefone'],
    ramo: ['cnae_fiscal_descricao']
  };

  function numbersOnly(value) {
    return (value || '').replace(/\D+/g, '');
  }

  function maskCNPJ(value) {
    const v = numbersOnly(value).slice(0, 14);
    const parts = [];
    if (v.length > 2) parts.push(v.slice(0, 2));
    if (v.length > 5) parts.push(v.slice(2, 5));
    if (v.length > 8) parts.push(v.slice(5, 8));
    let rest = '';
    if (v.length > 12) rest = `${v.slice(8, 12)}-${v.slice(12, 14)}`;
    else if (v.length > 8) rest = v.slice(8, 12);
    const base = parts.join('.') + (parts.length ? '/' : '') + rest;
    return base || v;
  }

  function maskCEP(value) {
    const v = numbersOnly(value).slice(0, 8);
    if (v.length > 5) return `${v.slice(0, 5)}-${v.slice(5, 8)}`;
    return v;
  }

  function maskPhone(value) {
    const v = numbersOnly(value).slice(0, 11);
    if (v.length <= 10) {
      // (00) 0000-0000
      const part1 = v.slice(0, 2);
      const part2 = v.slice(2, 6);
      const part3 = v.slice(6, 10);
      return `${part1 ? '(' + part1 + ')' : ''}${part2 ? ' ' + part2 : ''}${part3 ? '-' + part3 : ''}`.trim();
    }
    // (00) 00000-0000
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 7);
    const p3 = v.slice(7, 11);
    return `${p1 ? '(' + p1 + ')' : ''}${p2 ? ' ' + p2 : ''}${p3 ? '-' + p3 : ''}`.trim();
  }

  // Máscaras em tempo real
  cnpjInput.addEventListener('input', () => {
    const caret = cnpjInput.selectionStart;
    cnpjInput.value = maskCNPJ(cnpjInput.value);
    try { cnpjInput.setSelectionRange(caret, caret); } catch (e) {}
  });
  el('empresa_cep').addEventListener('input', (e) => {
    const input = e.target;
    const caret = input.selectionStart;
    input.value = maskCEP(input.value);
    try { input.setSelectionRange(caret, caret); } catch (err) {}
  });
  el('empresa_telefone').addEventListener('input', (e) => {
    const input = e.target;
    const caret = input.selectionStart;
    input.value = maskPhone(input.value);
    try { input.setSelectionRange(caret, caret); } catch (err) {}
  });
  el('resp_telefone').addEventListener('input', (e) => {
    const input = e.target;
    const caret = input.selectionStart;
    input.value = maskPhone(input.value);
    try { input.setSelectionRange(caret, caret); } catch (err) {}
  });

  async function fetchCNPJ(cnpj) {
    const clean = numbersOnly(cnpj);
    if (clean.length !== 14) {
      throw new Error('CNPJ inválido. Informe 14 dígitos.');
    }
    // BrasilAPI — documentação: https://brasilapi.com.br/docs#tag/CNPJ
    const url = `https://brasilapi.com.br/api/cnpj/v1/${clean}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      const msg = resp.status === 404 ? 'CNPJ não encontrado.' : `Erro ao consultar CNPJ (${resp.status}).`;
      throw new Error(msg);
    }
    const data = await resp.json();
    return normalizeCnpjData(data);
  }

  function normalizeCnpjData(d) {
    // Monta endereço completo quando possível
    const endereco = [d.logradouro, d.numero, d.complemento].filter(Boolean).join(', ');
    const bairro = d.bairro ? ` - ${d.bairro}` : '';
    const enderecoCompleto = [endereco + bairro].filter(Boolean).join('');

    // Telefone pode vir em partes (ddd_telefone_1)
    let telefone = '';
    if (d.ddd_telefone_1) {
      const somenteNum = numbersOnly(d.ddd_telefone_1);
      telefone = maskPhone(somenteNum);
    }

    const nome = d.razao_social || d.nome_fantasia || '';

    return {
      razao_social: d.razao_social || '',
      nome_fantasia: d.nome_fantasia || '',
      enderecoCompleto,
      municipio: d.municipio || '',
      uf: d.uf || '',
      cep: d.cep ? maskCEP(d.cep) : '',
      telefone,
      cnae_fiscal_descricao: d.cnae_fiscal_descricao || '',
      nome
    };
  }

  function fillIfEmpty(id, value) {
    const input = el(id);
    if (!input) return;
    const current = (input.value || '').trim();
    if (!current && value) input.value = value;
  }

  async function handleBuscarCNPJ() {
    cnpjError.textContent = '';
    statusEl.textContent = 'Consultando CNPJ...';
    btnBuscar.disabled = true;
    try {
      const data = await fetchCNPJ(cnpjInput.value);
      // Preenchimentos
      const preferredName = data.razao_social || data.nome_fantasia;
      fillIfEmpty('empresa_nome', preferredName);
      fillIfEmpty('empresa_endereco', data.enderecoCompleto);
      fillIfEmpty('empresa_cidade', data.municipio);
      fillIfEmpty('empresa_uf', data.uf);
      fillIfEmpty('empresa_cep', data.cep);
      fillIfEmpty('empresa_telefone', data.telefone);
      fillIfEmpty('ramo', data.cnae_fiscal_descricao);
      statusEl.textContent = 'Dados do CNPJ preenchidos.';
    } catch (err) {
      cnpjError.textContent = err.message || 'Não foi possível consultar o CNPJ.';
      statusEl.textContent = '';
    } finally {
      btnBuscar.disabled = false;
    }
  }

  btnBuscar.addEventListener('click', handleBuscarCNPJ);
  cnpjInput.addEventListener('blur', () => {
    // Se tiver um CNPJ com 14 dígitos, tentar automaticamente
    const clean = numbersOnly(cnpjInput.value);
    if (clean.length === 14) {
      handleBuscarCNPJ();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Coleta e formata dados para WhatsApp
    const getValue = (id) => (el(id)?.value || '').trim();
    const getRadioValue = (name) => {
      const selected = document.querySelector(`input[name="${name}"]:checked`);
      return selected ? selected.value : '';
    };
    const getCheckboxValues = (name) => {
      return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
    };

    const origem = getRadioValue('origem');
    const origemOutro = getValue('origem_outro');
    const modeloAtuacao = getCheckboxValues('modelo_atuacao');
    const planoCargos = getRadioValue('pcs');
    const crescimento = getRadioValue('crescimento');
    const tipoVaga = getRadioValue('tipo_vaga');
    const tiposContrato = getCheckboxValues('tipo_contrato');
    const modeloTrabalho = getRadioValue('modelo_trabalho');

    // Monta mensagem
    const linhas = [];
    linhas.push('EvoluxRH — Briefing da Vaga');
    linhas.push('');
    linhas.push('*1. Dados da Empresa*');
    linhas.push(`- Nome: ${getValue('empresa_nome')}`);
    linhas.push(`- CNPJ: ${getValue('empresa_cnpj')}`);
    linhas.push(`- Endereço: ${getValue('empresa_endereco')}`);
    linhas.push(`- Cidade/UF: ${getValue('empresa_cidade')}/${getValue('empresa_uf')}`);
    linhas.push(`- CEP: ${getValue('empresa_cep')}`);
    linhas.push(`- Telefone: ${getValue('empresa_telefone')}`);
    linhas.push(`- Site/Redes: ${getValue('empresa_site')}`);
    linhas.push('');
    linhas.push('*2. Responsável pelo Processo*');
    linhas.push(`- Nome: ${getValue('resp_nome')}`);
    linhas.push(`- Cargo: ${getValue('resp_cargo')}`);
    linhas.push(`- Telefone: ${getValue('resp_telefone')}`);
    linhas.push(`- Como chegou: ${origem}${origem === 'Outro' && origemOutro ? ` (${origemOutro})` : ''}`);
    linhas.push('');
    linhas.push('*3. Informações Gerais da Empresa*');
    linhas.push(`- Nº colaboradores: ${getValue('num_colaboradores')}`);
    linhas.push(`- Setores: ${getValue('principais_setores')}`);
    linhas.push(`- Tempo de mercado: ${getValue('tempo_mercado')}`);
    linhas.push(`- Modelo de atuação: ${modeloAtuacao.join(', ')}`);
    linhas.push(`- Ramo/segmento: ${getValue('ramo')}`);
    linhas.push(`- MVV: ${getValue('mvv')}`);
    linhas.push(`- Clima: ${getValue('clima')}`);
    linhas.push(`- Liderança: ${getValue('lideranca')}`);
    linhas.push(`- Plano cargos e salários: ${planoCargos}`);
    linhas.push(`- Perspectiva de crescimento: ${crescimento}`);
    linhas.push('');
    linhas.push('*4. Estrutura e Gestão*');
    linhas.push(`- Sócios/Diretores: ${getValue('socios_diretores')}`);
    linhas.push(`- Nº gestores diretos: ${getValue('num_gestores')}`);
    linhas.push(`- Subordinados diretos do cargo: ${getValue('num_subordinados')}`);
    linhas.push(`- Tipo da vaga: ${tipoVaga}`);
    linhas.push(`- Motivo da abertura: ${getValue('motivo_abertura')}`);
    linhas.push('');
    linhas.push('*5. Informações da Vaga*');
    linhas.push(`- Título: ${getValue('titulo_cargo')}`);
    linhas.push(`- Setor/Depto: ${getValue('setor')}`);
    linhas.push(`- Tipo de contrato: ${tiposContrato.join(', ')}${tiposContrato.includes('Outro') ? ` (${getValue('tipo_contrato_outro')})` : ''}`);
    linhas.push(`- Horário: ${getValue('horario')}`);
    linhas.push(`- Modelo de trabalho: ${modeloTrabalho}`);
    linhas.push(`- Faixa salarial: ${getValue('faixa_salarial')}`);
    linhas.push(`- Benefícios: ${getValue('beneficios')}`);
    linhas.push(`- Previsão de início: ${getValue('previsao_inicio')}`);
    linhas.push('');
    linhas.push('*6. Perfil Técnico e Comportamental*');
    linhas.push(`- Formação mínima: ${getValue('formacao_minima')}`);
    linhas.push(`- Técnicos obrigatórios: ${getValue('tecnicos_obrigatorios')}`);
    linhas.push(`- Técnicos desejáveis: ${getValue('tecnicos_desejaveis')}`);
    linhas.push(`- Comportamentais esperadas: ${getValue('comportamentais_esperadas')}`);
    linhas.push(`- Comportamentais desejadas: ${getValue('comportamentais_desejadas')}`);
    linhas.push(`- Fit cultural: ${getValue('fit_cultural')}`);
    linhas.push(`- Entregas iniciais: ${getValue('entregas_iniciais')}`);
    linhas.push(`- Desafios do cargo: ${getValue('desafios')}`);

    const texto = encodeURIComponent(linhas.join('\n'));
    const numero = '5551993796131'; // +55 51 99379-6131
    const url = `https://wa.me/${numero}?text=${texto}`;

    statusEl.textContent = 'Abrindo WhatsApp com as respostas...';
    window.open(url, '_blank');
  });
})();


