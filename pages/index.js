import { useCallback, useMemo, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('');
  const [cnpjError, setCnpjError] = useState('');

  const [form, setForm] = useState({
    empresa_nome: '',
    empresa_cnpj: '',
    empresa_endereco: '',
    empresa_cidade: '',
    empresa_uf: '',
    empresa_cep: '',
    empresa_telefone: '',
    empresa_site: '',
    resp_nome: '',
    resp_cargo: '',
    resp_telefone: '',
    origem: '',
    origem_outro: '',
    num_colaboradores: '',
    principais_setores: '',
    tempo_mercado: '',
    modelo_atuacao: [],
    ramo: '',
    mvv: '',
    clima: '',
    lideranca: '',
    pcs: '',
    crescimento: '',
    socios_diretores: '',
    num_gestores: '',
    num_subordinados: '',
    tipo_vaga: '',
    motivo_abertura: '',
    titulo_cargo: '',
    setor: '',
    tipo_contrato: [],
    tipo_contrato_outro: '',
    horario: '',
    modelo_trabalho: '',
    faixa_salarial: '',
    beneficios: '',
    previsao_inicio: '',
    formacao_minima: '',
    tecnicos_obrigatorios: '',
    tecnicos_desejaveis: '',
    comportamentais_esperadas: '',
    comportamentais_desejadas: '',
    fit_cultural: '',
    entregas_iniciais: '',
    desafios: ''
  });

  const numbersOnly = (v) => (v || '').replace(/\D+/g, '');
  const maskCNPJ = (value) => {
    const v = numbersOnly(value).slice(0, 14);
    let out = '';
    if (v.length > 0) out = v.slice(0, 2);
    if (v.length > 2) out += '.' + v.slice(2, 5);
    if (v.length > 5) out += '.' + v.slice(5, 8);
    if (v.length > 8) out += '/' + v.slice(8, 12);
    if (v.length > 12) out += '-' + v.slice(12, 14);
    return out;
  };
  const maskCEP = (value) => {
    const v = numbersOnly(value).slice(0, 8);
    return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5, 8)}` : v;
  };
  const maskPhone = (value) => {
    const v = numbersOnly(value).slice(0, 11);
    if (v.length <= 10) {
      const p1 = v.slice(0, 2);
      const p2 = v.slice(2, 6);
      const p3 = v.slice(6, 10);
      return `${p1 ? '(' + p1 + ')' : ''}${p2 ? ' ' + p2 : ''}${p3 ? '-' + p3 : ''}`.trim();
    }
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 7);
    const p3 = v.slice(7, 11);
    return `${p1 ? '(' + p1 + ')' : ''}${p2 ? ' ' + p2 : ''}${p3 ? '-' + p3 : ''}`.trim();
  };

  const setField = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  const onInput = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'empresa_cnpj') return setField(name, maskCNPJ(value));
    if (name === 'empresa_cep') return setField(name, maskCEP(value));
    if (name === 'empresa_telefone' || name === 'resp_telefone') return setField(name, maskPhone(value));
    setField(name, value);
  }, [setField]);

  const onRadio = useCallback((e) => {
    const { name, value } = e.target;
    setField(name, value);
  }, [setField]);

  const onCheckboxGroup = useCallback((e) => {
    const { name, value, checked } = e.target;
    setForm((f) => {
      const list = new Set(f[name] || []);
      if (checked) list.add(value); else list.delete(value);
      return { ...f, [name]: Array.from(list) };
    });
  }, []);

  async function fetchCNPJ(cnpj) {
    const clean = numbersOnly(cnpj);
    if (clean.length !== 14) throw new Error('CNPJ inválido. Informe 14 dígitos.');
    const url = `https://brasilapi.com.br/api/cnpj/v1/${clean}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      const msg = resp.status === 404 ? 'CNPJ não encontrado.' : `Erro ao consultar CNPJ (${resp.status}).`;
      throw new Error(msg);
    }
    const d = await resp.json();
    const endereco = [d.logradouro, d.numero, d.complemento].filter(Boolean).join(', ');
    const bairro = d.bairro ? ` - ${d.bairro}` : '';
    const enderecoCompleto = [endereco + bairro].filter(Boolean).join('');
    let telefone = '';
    if (d.ddd_telefone_1) telefone = maskPhone(numbersOnly(d.ddd_telefone_1));
    return {
      razao_social: d.razao_social || '',
      nome_fantasia: d.nome_fantasia || '',
      enderecoCompleto,
      municipio: d.municipio || '',
      uf: d.uf || '',
      cep: d.cep ? maskCEP(d.cep) : '',
      telefone,
      cnae_fiscal_descricao: d.cnae_fiscal_descricao || ''
    };
  }

  const handleBuscarCNPJ = useCallback(async () => {
    setCnpjError('');
    setStatus('Consultando CNPJ...');
    try {
      const data = await fetchCNPJ(form.empresa_cnpj);
      setForm((f) => ({
        ...f,
        empresa_nome: f.empresa_nome || data.razao_social || data.nome_fantasia || '',
        empresa_endereco: f.empresa_endereco || data.enderecoCompleto,
        empresa_cidade: f.empresa_cidade || data.municipio,
        empresa_uf: f.empresa_uf || data.uf,
        empresa_cep: f.empresa_cep || data.cep,
        empresa_telefone: f.empresa_telefone || data.telefone,
        ramo: f.ramo || data.cnae_fiscal_descricao
      }));
      setStatus('Dados do CNPJ preenchidos.');
    } catch (err) {
      setCnpjError(err.message || 'Não foi possível consultar o CNPJ.');
      setStatus('');
    }
  }, [form.empresa_cnpj]);

  const handleCNPJBlur = useCallback(() => {
    const clean = numbersOnly(form.empresa_cnpj);
    if (clean.length === 14) handleBuscarCNPJ();
  }, [form.empresa_cnpj, handleBuscarCNPJ]);

  const openWhatsApp = useCallback(() => {
    const linhas = [];
    const g = (k) => (form[k] || '').toString().trim();
    const gJoin = (k) => (form[k] || []).join(', ');
    linhas.push('EvoluxRH — Briefing da Vaga');
    linhas.push('');
    linhas.push('*1. Dados da Empresa*');
    linhas.push(`- Nome: ${g('empresa_nome')}`);
    linhas.push(`- CNPJ: ${g('empresa_cnpj')}`);
    linhas.push(`- Endereço: ${g('empresa_endereco')}`);
    linhas.push(`- Cidade/UF: ${g('empresa_cidade')}/${g('empresa_uf')}`);
    linhas.push(`- CEP: ${g('empresa_cep')}`);
    linhas.push(`- Telefone: ${g('empresa_telefone')}`);
    linhas.push(`- Site/Redes: ${g('empresa_site')}`);
    linhas.push('');
    linhas.push('*2. Responsável pelo Processo*');
    linhas.push(`- Nome: ${g('resp_nome')}`);
    linhas.push(`- Cargo: ${g('resp_cargo')}`);
    linhas.push(`- Telefone: ${g('resp_telefone')}`);
    linhas.push(`- Como chegou: ${form.origem}${form.origem === 'Outro' && g('origem_outro') ? ` (${g('origem_outro')})` : ''}`);
    linhas.push('');
    linhas.push('*3. Informações Gerais da Empresa*');
    linhas.push(`- Nº colaboradores: ${g('num_colaboradores')}`);
    linhas.push(`- Setores: ${g('principais_setores')}`);
    linhas.push(`- Tempo de mercado: ${g('tempo_mercado')}`);
    linhas.push(`- Modelo de atuação: ${gJoin('modelo_atuacao')}`);
    linhas.push(`- Ramo/segmento: ${g('ramo')}`);
    linhas.push(`- MVV: ${g('mvv')}`);
    linhas.push(`- Clima: ${g('clima')}`);
    linhas.push(`- Liderança: ${g('lideranca')}`);
    linhas.push(`- Plano cargos e salários: ${g('pcs')}`);
    linhas.push(`- Perspectiva de crescimento: ${g('crescimento')}`);
    linhas.push('');
    linhas.push('*4. Estrutura e Gestão*');
    linhas.push(`- Sócios/Diretores: ${g('socios_diretores')}`);
    linhas.push(`- Nº gestores diretos: ${g('num_gestores')}`);
    linhas.push(`- Subordinados diretos do cargo: ${g('num_subordinados')}`);
    linhas.push(`- Tipo da vaga: ${g('tipo_vaga')}`);
    linhas.push(`- Motivo da abertura: ${g('motivo_abertura')}`);
    linhas.push('');
    linhas.push('*5. Informações da Vaga*');
    linhas.push(`- Título: ${g('titulo_cargo')}`);
    linhas.push(`- Setor/Depto: ${g('setor')}`);
    linhas.push(`- Tipo de contrato: ${gJoin('tipo_contrato')}${(form.tipo_contrato || []).includes('Outro') ? ` (${g('tipo_contrato_outro')})` : ''}`);
    linhas.push(`- Horário: ${g('horario')}`);
    linhas.push(`- Modelo de trabalho: ${g('modelo_trabalho')}`);
    linhas.push(`- Faixa salarial: ${g('faixa_salarial')}`);
    linhas.push(`- Benefícios: ${g('beneficios')}`);
    linhas.push(`- Previsão de início: ${g('previsao_inicio')}`);
    linhas.push('');
    linhas.push('*6. Perfil Técnico e Comportamental*');
    linhas.push(`- Formação mínima: ${g('formacao_minima')}`);
    linhas.push(`- Técnicos obrigatórios: ${g('tecnicos_obrigatorios')}`);
    linhas.push(`- Técnicos desejáveis: ${g('tecnicos_desejaveis')}`);
    linhas.push(`- Comportamentais esperadas: ${g('comportamentais_esperadas')}`);
    linhas.push(`- Comportamentais desejadas: ${g('comportamentais_desejadas')}`);
    linhas.push(`- Fit cultural: ${g('fit_cultural')}`);
    linhas.push(`- Entregas iniciais: ${g('entregas_iniciais')}`);
    linhas.push(`- Desafios do cargo: ${g('desafios')}`);
    const texto = encodeURIComponent(linhas.join('\n'));
    const numero = '5551993796131';
    const url = `https://wa.me/${numero}?text=${texto}`;
    setStatus('Abrindo WhatsApp com as respostas...');
    if (typeof window !== 'undefined') window.open(url, '_blank');
  }, [form]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    openWhatsApp();
  }, [openWhatsApp]);

  return (
    <main className="container">
      <header className="header">
        <h1>EvoluxRH — Briefing da Vaga</h1>
        <p>Preencha as informações abaixo para iniciarmos o processo com agilidade.</p>
      </header>

      <form onSubmit={onSubmit} noValidate>
        {/* 1. Dados da Empresa */}
        <section className="card">
          <h2>1. Dados da Empresa</h2>
          <div className="grid">
            <div className="field">
              <label htmlFor="empresa_nome">Nome da Empresa</label>
              <input id="empresa_nome" name="empresa_nome" type="text" value={form.empresa_nome} onChange={onInput} placeholder="Ex.: ACME LTDA" />
            </div>
            <div className="field">
              <label htmlFor="empresa_cnpj">CNPJ</label>
              <div className="with-action">
                <input id="empresa_cnpj" name="empresa_cnpj" type="text" value={form.empresa_cnpj} onChange={onInput} onBlur={handleCNPJBlur} placeholder="00.000.000/0000-00" maxLength={18} />
                <button type="button" className="btn" onClick={handleBuscarCNPJ}>Buscar CNPJ</button>
              </div>
              <small className="hint">Ao informar o CNPJ, buscaremos os dados automaticamente.</small>
              <div className="error" aria-live="polite">{cnpjError}</div>
            </div>
            <div className="field col-2">
              <label htmlFor="empresa_endereco">Endereço</label>
              <input id="empresa_endereco" name="empresa_endereco" type="text" value={form.empresa_endereco} onChange={onInput} placeholder="Logradouro, número, complemento" />
            </div>
            <div className="field">
              <label htmlFor="empresa_cidade">Cidade</label>
              <input id="empresa_cidade" name="empresa_cidade" type="text" value={form.empresa_cidade} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="empresa_uf">UF</label>
              <input id="empresa_uf" name="empresa_uf" type="text" value={form.empresa_uf} onChange={onInput} maxLength={2} />
            </div>
            <div className="field">
              <label htmlFor="empresa_cep">CEP</label>
              <input id="empresa_cep" name="empresa_cep" type="text" value={form.empresa_cep} onChange={onInput} placeholder="00000-000" maxLength={9} />
            </div>
            <div className="field">
              <label htmlFor="empresa_telefone">Telefone / WhatsApp</label>
              <input id="empresa_telefone" name="empresa_telefone" type="text" value={form.empresa_telefone} onChange={onInput} placeholder="(00) 00000-0000" maxLength={15} />
            </div>
            <div className="field">
              <label htmlFor="empresa_site">Site / Redes sociais (se houver)</label>
              <input id="empresa_site" name="empresa_site" type="text" value={form.empresa_site} onChange={onInput} placeholder="Ex.: https://empresa.com / @empresa" />
            </div>
          </div>
        </section>

        {/* 2. Responsável pelo Processo */}
        <section className="card">
          <h2>2. Responsável pelo Processo</h2>
          <div className="grid">
            <div className="field">
              <label htmlFor="resp_nome">Nome completo</label>
              <input id="resp_nome" name="resp_nome" type="text" value={form.resp_nome} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="resp_cargo">Cargo / Função</label>
              <input id="resp_cargo" name="resp_cargo" type="text" value={form.resp_cargo} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="resp_telefone">Telefone / WhatsApp</label>
              <input id="resp_telefone" name="resp_telefone" type="text" value={form.resp_telefone} onChange={onInput} placeholder="(00) 00000-0000" maxLength={15} />
            </div>
            <div className="field col-2">
              <label>Como chegou até nossa consultoria?</label>
              <div className="options">
                <label><input type="radio" name="origem" value="Indicacao" checked={form.origem === 'Indicacao'} onChange={onRadio} /> Indicação</label>
                <label><input type="radio" name="origem" value="Instagram" checked={form.origem === 'Instagram'} onChange={onRadio} /> Instagram</label>
                <label><input type="radio" name="origem" value="Site" checked={form.origem === 'Site'} onChange={onRadio} /> Site</label>
                <label className="with-input">
                  <input type="radio" name="origem" value="Outro" checked={form.origem === 'Outro'} onChange={onRadio} /> Outro
                  <input type="text" id="origem_outro" name="origem_outro" value={form.origem_outro} onChange={onInput} placeholder="Qual?" />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Informações Gerais da Empresa */}
        <section className="card">
          <h2>3. Informações Gerais da Empresa</h2>
          <div className="grid">
            <div className="field">
              <label htmlFor="num_colaboradores">Número total de colaboradores</label>
              <input id="num_colaboradores" name="num_colaboradores" type="number" value={form.num_colaboradores} onChange={onInput} min={0} />
            </div>
            <div className="field col-2">
              <label htmlFor="principais_setores">Principais setores / áreas da empresa</label>
              <input id="principais_setores" name="principais_setores" type="text" value={form.principais_setores} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="tempo_mercado">Tempo de atuação no mercado</label>
              <input id="tempo_mercado" name="tempo_mercado" type="text" value={form.tempo_mercado} onChange={onInput} placeholder="Ex.: 10 anos" />
            </div>
            <div className="field col-2">
              <label>Modelo de atuação</label>
              <div className="options">
                {['Presencial','Hibrido','Remoto','Campo'].map(val => (
                  <label key={val}><input type="checkbox" name="modelo_atuacao" value={val} checked={form.modelo_atuacao.includes(val)} onChange={onCheckboxGroup} /> {val === 'Remoto' ? '100% remoto' : (val === 'Hibrido' ? 'Híbrido' : (val === 'Campo' ? 'Campo / externo' : 'Presencial'))}</label>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="ramo">Ramo de atividade / segmento</label>
              <input id="ramo" name="ramo" type="text" value={form.ramo} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="mvv">Missão / visão / valores (se houver)</label>
              <textarea id="mvv" name="mvv" rows={3} value={form.mvv} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="clima">Como descreveria o clima organizacional?</label>
              <textarea id="clima" name="clima" rows={3} value={form.clima} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="lideranca">Como é o estilo de liderança predominante?</label>
              <textarea id="lideranca" name="lideranca" rows={3} value={form.lideranca} onChange={onInput} />
            </div>
            <div className="field">
              <label>Plano de cargos e salários?</label>
              <div className="options">
                <label><input type="radio" name="pcs" value="Sim" checked={form.pcs === 'Sim'} onChange={onRadio} /> Sim</label>
                <label><input type="radio" name="pcs" value="Nao" checked={form.pcs === 'Nao'} onChange={onRadio} /> Não</label>
              </div>
            </div>
            <div className="field">
              <label>Perspectiva de crescimento?</label>
              <div className="options">
                <label><input type="radio" name="crescimento" value="Sim" checked={form.crescimento === 'Sim'} onChange={onRadio} /> Sim</label>
                <label><input type="radio" name="crescimento" value="Nao" checked={form.crescimento === 'Nao'} onChange={onRadio} /> Não</label>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Estrutura e Gestão */}
        <section className="card">
          <h2>4. Estrutura e Gestão</h2>
          <div className="grid">
            <div className="field col-2">
              <label htmlFor="socios_diretores">Sócios e/ou Diretores</label>
              <textarea id="socios_diretores" name="socios_diretores" rows={2} value={form.socios_diretores} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="num_gestores">Número de gestores diretos</label>
              <input id="num_gestores" name="num_gestores" type="number" min={0} value={form.num_gestores} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="num_subordinados">Quantos respondem a este cargo/vaga diretamente?</label>
              <input id="num_subordinados" name="num_subordinados" type="number" min={0} value={form.num_subordinados} onChange={onInput} />
            </div>
            <div className="field">
              <label>Vaga é nova ou reposição?</label>
              <div className="options">
                <label><input type="radio" name="tipo_vaga" value="Nova" checked={form.tipo_vaga === 'Nova'} onChange={onRadio} /> Nova</label>
                <label><input type="radio" name="tipo_vaga" value="Reposicao" checked={form.tipo_vaga === 'Reposicao'} onChange={onRadio} /> Reposição</label>
              </div>
            </div>
            <div className="field col-2">
              <label htmlFor="motivo_abertura">Motivo da abertura</label>
              <textarea id="motivo_abertura" name="motivo_abertura" rows={2} value={form.motivo_abertura} onChange={onInput} />
            </div>
          </div>
        </section>

        {/* 5. Informações da Vaga */}
        <section className="card">
          <h2>5. Informações da Vaga</h2>
          <div className="grid">
            <div className="field">
              <label htmlFor="titulo_cargo">Título do cargo</label>
              <input id="titulo_cargo" name="titulo_cargo" type="text" value={form.titulo_cargo} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="setor">Setor / Departamento</label>
              <input id="setor" name="setor" type="text" value={form.setor} onChange={onInput} />
            </div>
            <div className="field">
              <label>Tipo de contrato</label>
              <div className="options">
                {['CLT','PJ','Estagio','Temporario','Outro'].map(val => (
                  <label key={val} className={val === 'Outro' ? 'with-input' : undefined}>
                    <input type="checkbox" name="tipo_contrato" value={val} checked={form.tipo_contrato.includes(val)} onChange={onCheckboxGroup} /> {val === 'Estagio' ? 'Estágio' : (val === 'Temporario' ? 'Temporário' : (val === 'Outro' ? 'Outro' : val))}
                    {val === 'Outro' && (
                      <input type="text" id="tipo_contrato_outro" name="tipo_contrato_outro" value={form.tipo_contrato_outro} onChange={onInput} placeholder="Qual?" />
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="horario">Horário de trabalho</label>
              <input id="horario" name="horario" type="text" value={form.horario} onChange={onInput} placeholder="Ex.: 9h às 18h" />
            </div>
            <div className="field">
              <label>Modelo de trabalho</label>
              <div className="options">
                {['Presencial','Hibrido','Remoto'].map(val => (
                  <label key={val}><input type="radio" name="modelo_trabalho" value={val} checked={form.modelo_trabalho === val} onChange={onRadio} /> {val === 'Hibrido' ? 'Híbrido' : val}</label>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="faixa_salarial">Faixa salarial</label>
              <input id="faixa_salarial" name="faixa_salarial" type="text" value={form.faixa_salarial} onChange={onInput} placeholder="Ex.: R$ 4.000 a R$ 5.500" />
            </div>
            <div className="field col-2">
              <label htmlFor="beneficios">Benefícios</label>
              <textarea id="beneficios" name="beneficios" rows={2} value={form.beneficios} onChange={onInput} />
            </div>
            <div className="field">
              <label htmlFor="previsao_inicio">Previsão de início</label>
              <input id="previsao_inicio" name="previsao_inicio" type="date" value={form.previsao_inicio} onChange={onInput} />
            </div>
          </div>
        </section>

        {/* 6. Perfil Técnico e Comportamental */}
        <section className="card">
          <h2>6. Perfil Técnico e Comportamental</h2>
          <div className="grid">
            <div className="field">
              <label htmlFor="formacao_minima">Formação mínima exigida</label>
              <input id="formacao_minima" name="formacao_minima" type="text" value={form.formacao_minima} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="tecnicos_obrigatorios">Conhecimentos / habilidades técnicas obrigatórias</label>
              <textarea id="tecnicos_obrigatorios" name="tecnicos_obrigatorios" rows={2} value={form.tecnicos_obrigatorios} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="tecnicos_desejaveis">Conhecimentos técnicos desejáveis</label>
              <textarea id="tecnicos_desejaveis" name="tecnicos_desejaveis" rows={2} value={form.tecnicos_desejaveis} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="comportamentais_esperadas">Competências comportamentais esperadas</label>
              <textarea id="comportamentais_esperadas" name="comportamentais_esperadas" rows={2} value={form.comportamentais_esperadas} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="comportamentais_desejadas">Competências comportamentais desejadas</label>
              <textarea id="comportamentais_desejadas" name="comportamentais_desejadas" rows={2} value={form.comportamentais_desejadas} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="fit_cultural">Estilo de profissional que melhor se adapta ao time e à cultura</label>
              <textarea id="fit_cultural" name="fit_cultural" rows={2} value={form.fit_cultural} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="entregas_iniciais">O que espera que entregue nos primeiros meses?</label>
              <textarea id="entregas_iniciais" name="entregas_iniciais" rows={2} value={form.entregas_iniciais} onChange={onInput} />
            </div>
            <div className="field col-2">
              <label htmlFor="desafios">Há desafios específicos que este cargo enfrentará?</label>
              <textarea id="desafios" name="desafios" rows={2} value={form.desafios} onChange={onInput} />
            </div>
          </div>
        </section>

        <footer className="actions">
          <button type="submit" className="btn primary">Enviar</button>
          <span className="status" aria-live="polite">{status}</span>
        </footer>
      </form>
    </main>
  );
}


