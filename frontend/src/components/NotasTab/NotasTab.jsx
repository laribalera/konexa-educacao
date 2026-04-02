'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function NotasTab({ turmaId, user }) {
    if (user?.role === 'professor') {
        return <NotasProfessor turmaId={turmaId} />;
    }
    return <NotasAluno turmaId={turmaId} userId={user?.id} />;
}

/* visao do prof */

function NotasProfessor({ turmaId }) {
    const [configs, setConfigs] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [notas, setNotas] = useState([]);
    const [alunoSel, setAlunoSel] = useState(null);
    const [modalConfig, setModalConfig] = useState(false);
    const [modalNota, setModalNota] = useState(false);
    const [editandoNota, setEditandoNota] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { carregar(); }, []);

    async function carregar() {
        setLoading(true);
        const [cfgs, als] = await Promise.all([
            api.get(`/turmas/${turmaId}/config-notas`),
            api.get(`/turmas/${turmaId}/alunos`),
        ]);
        setConfigs(cfgs || []);
        setAlunos(als || []);

        const ns = await api.get(`/notas?turma_id=${turmaId}`);
        setNotas(ns || []);
        setLoading(false);
    }

    async function deletarNota(id) {
        if (!confirm('Excluir esta nota?')) return;
        await api.delete(`/notas/${id}`);
        carregar();
    }

    const notasFiltradas = alunoSel
        ? notas.filter(n => n.aluno_id === alunoSel)
        : notas;

    function mediaAlunoDisciplina(alunoId, disciplina) {
        const ns = notas.filter(n => n.aluno_id === alunoId && n.disciplina === disciplina);
        if (ns.length === 0) return '—';
        const cfg = configs.find(c => c.disciplina === disciplina);
        if (!cfg) return '—';
        const provas = ns.filter(n => n.tipo === 'prova');
        const ativs = ns.filter(n => n.tipo === 'atividade');
        const mp = provas.length ? provas.reduce((a, n) => a + Number(n.valor), 0) / provas.length : 0; // média das provas (calculo: soma das notas / quantidade de provas)
        const ma = ativs.length ? ativs.reduce((a, n) => a + Number(n.valor), 0) / ativs.length : 0; // média das atividades (calculo: soma das notas / quantidade de atividades)
        return ((mp * Number(cfg.peso_prova) + ma * Number(cfg.peso_atividades)) / 10).toFixed(1); // média ponderada final (calculo: (média provas * peso prova + média atividades * peso atividades) / 10)
    }

    if (loading) return <p style={{ color: '#888' }}>Carregando notas...</p>;

    return (
        <div style={{ display: 'grid', gap: '20px' }}>

            {/* cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={sectionTitle}>Notas</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setModalConfig(true)} style={btnSec}>
                        Configurar disciplinas
                    </button>
                    <button
                        onClick={() => setModalNota(true)}
                        style={btnPrimary}
                        disabled={configs.length === 0 || alunos.length === 0}
                    >
                        + Lançar nota
                    </button>
                </div>
            </div>

            {configs.length === 0 && (
                <div style={emptyBox}>
                    <p style={{ margin: 0, color: '#888' }}>Nenhuma disciplina configurada ainda.</p>
                    <button onClick={() => setModalConfig(true)} style={{ ...btnPrimary, marginTop: '10px' }}>
                        Configurar agora
                    </button>
                </div>
            )}

            {configs.length > 0 && alunos.length > 0 && (
                <>
                    {/* filtro por aluno */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>Filtrar por aluno:</span>
                        <button
                            onClick={() => setAlunoSel(null)}
                            style={{ ...chipBtn, ...(alunoSel === null ? chipAtivo : {}) }}
                        >
                            Todos
                        </button>
                        {alunos.map(a => (
                            <button
                                key={a.id}
                                onClick={() => setAlunoSel(a.id)}
                                style={{ ...chipBtn, ...(alunoSel === a.id ? chipAtivo : {}) }}
                            >
                                {a.nome}
                            </button>
                        ))}
                    </div>

                    {/* tabela geral */}
                    {!alunoSel && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={tabela}>
                                <thead>
                                    <tr>
                                        <th style={th}>Aluno</th>

                                        <th style={th}>Nota Geral</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alunos.map(a => (
                                        <tr key={a.id}>
                                            <td style={td}>{a.nome}</td>
                                            {configs.map(c => {
                                                const m = mediaAlunoDisciplina(a.id, c.disciplina);
                                                const num = parseFloat(m);
                                                return (
                                                    <td key={c.disciplina} style={{ ...td, textAlign: 'left' }}>
                                                        <span style={{
                                                            fontWeight: '600',
                                                            color: isNaN(num) ? '#999' : num >= 6 ? '#16a34a' : num >= 4 ? '#d97706' : '#dc2626'
                                                        }}>
                                                            {m}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* notas individuais por aluno */}
                    {alunoSel && (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                                {notasFiltradas.length} nota(s) lançada(s) para {alunos.find(a => a.id === alunoSel)?.nome}
                            </p>
                            {configs.map(cfg => {
                                const ns = notasFiltradas.filter(n => n.disciplina === cfg.disciplina);
                                return (
                                    <div key={cfg.disciplina} style={card}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <strong>{cfg.disciplina}</strong>
                                            <span style={{ fontSize: '12px', color: '#888' }}>
                                                Peso prova: {cfg.peso_prova} · Peso ativ: {cfg.peso_atividades}
                                            </span>
                                        </div>
                                        {ns.length === 0 ? (
                                            <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>Nenhuma nota lançada</p>
                                        ) : (
                                            ns.map(n => (
                                                <div key={n.id} style={notaRow}>
                                                    <div>
                                                        <span style={badgeTipo(n.tipo)}>{n.tipo}</span>
                                                        <span style={{ marginLeft: '8px', fontSize: '13px' }}>{n.descricao || '—'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <strong style={{ fontSize: '16px' }}>{Number(n.valor).toFixed(1)}</strong>
                                                        <button onClick={() => setEditandoNota(n)} style={btnIcon}><EditarIcon /></button>
                                                        <button onClick={() => deletarNota(n.id)} style={btnIcon}><TrashIcon /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {modalConfig && (
                <ModalConfigDisciplinas
                    turmaId={turmaId}
                    configs={configs}
                    onClose={() => { setModalConfig(false); carregar(); }}
                />
            )}
            {modalNota && (
                <ModalLancarNota
                    turmaId={turmaId}
                    alunos={alunos}
                    configs={configs}
                    onClose={() => { setModalNota(false); carregar(); }}
                />
            )}
            {editandoNota && (
                <ModalEditarNota
                    nota={editandoNota}
                    onClose={() => { setEditandoNota(null); carregar(); }}
                />
            )}
        </div>
    );
}

/* modal - configurar disciplinas */

const DISCIPLINAS_DISPONIVEIS = [
    'Matemática',
    'Português',
    'Inglês',
    'História',
    'Geografia',
    'Ciências',
    'Educação Física',
    'Arte',
    'Informática'
];

function ModalConfigDisciplinas({ turmaId, configs, onClose }) {
    const [cfgs, setCfgs] = useState(configs);
    const [disciplina, setDisciplina] = useState('');
    const [pesoProva, setPesoProva] = useState(6);
    const [pesoAtiv, setPesoAtiv] = useState(4);
    const [editando, setEditando] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    const temConfig = cfgs.length > 0;
    const cfg = cfgs[0];

    function handlePesoProva(val) {
        const v = Math.min(10, Math.max(0, Number(val)));
        setPesoProva(v);
        setPesoAtiv(parseFloat((10 - v).toFixed(1)));
    }
    function handlePesoAtiv(val) {
        const v = Math.min(10, Math.max(0, Number(val)));
        setPesoAtiv(v);
        setPesoProva(parseFloat((10 - v).toFixed(1)));
    }

    async function adicionar() {
        if (!disciplina) return setErro('Selecione uma disciplina');
        setErro(''); setLoading(true);
        try {
            const nova = await api.post(`/turmas/${turmaId}/config-notas`, {
                disciplina,
                peso_prova: Number(pesoProva),
                peso_atividades: Number(pesoAtiv)
            });
            setCfgs(prev => [...prev, nova]);
            setDisciplina('');
            setPesoProva(6);
            setPesoAtiv(4);
        } catch (e) {
            setErro(e?.message || 'Erro ao salvar');
        } finally {
            setLoading(false);
        }
    }

    async function salvarEdicao() {
        setErro(''); setLoading(true);
        try {
            await api.put(`/turmas/${turmaId}/config-notas/${cfg.disciplina}`, {
                peso_prova: Number(pesoProva),
                peso_atividades: Number(pesoAtiv)
            });
            setCfgs([{ ...cfg, peso_prova: pesoProva, peso_atividades: pesoAtiv }]);
            setEditando(null);
        } catch (e) {
            setErro(e?.message || 'Erro ao salvar');
        } finally {
            setLoading(false);
        }
    }

    function iniciarEdicao() {
        setPesoProva(cfg.peso_prova);
        setPesoAtiv(cfg.peso_atividades);
        setEditando(true);
        setErro('');
    }

    return (
        <div style={overlay}>
            <div style={{ ...modal, maxWidth: '480px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Configurar disciplinas</h2>

                {!temConfig ? (
                    <>
                        <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Selecionar disciplina</p>
                        
                        <label style={labelSm}>Disciplina *</label>
                        <select
                            value={disciplina}
                            onChange={e => { setDisciplina(e.target.value); setErro(''); }}
                            style={input}
                        >
                            <option value="">Escolha a disciplina</option>
                            {DISCIPLINAS_DISPONIVEIS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '6px' }}>
                            <div>
                                <label style={labelSm}>Peso prova</label>
                                <input type="number" min="0" max="10" step="0.5"
                                    value={pesoProva}
                                    onChange={e => handlePesoProva(e.target.value)}
                                    style={input}
                                />
                            </div>
                            <div>
                                <label style={labelSm}>Peso atividades</label>
                                <input type="number" min="0" max="10" step="0.5"
                                    value={pesoAtiv}
                                    onChange={e => handlePesoAtiv(e.target.value)}
                                    style={input}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
                            Soma: <strong style={{ color: Number(pesoProva) + Number(pesoAtiv) === 10 ? '#16a34a' : '#dc2626' }}>
                                {(Number(pesoProva) + Number(pesoAtiv)).toFixed(1)}
                            </strong> / 10
                        </p>
                        {erro && <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>{erro}</p>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            <button onClick={onClose} style={btnSec}>Cancelar</button>
                            <button onClick={adicionar} style={btnPrimary} disabled={loading || !disciplina}>
                                {loading ? 'Salvando...' : 'Adicionar'}
                            </button>
                        </div>
                    </>
                ) : !editando ? (
                    <>
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#15803d' }}>{cfg.disciplina}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#166534' }}>
                                        Prova: {cfg.peso_prova} · Atividades: {cfg.peso_atividades}
                                    </p>
                                </div>
                                <button onClick={iniciarEdicao} style={btnIcon}>
                                    <EditarIcon />
                                </button>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px 0', textAlign: 'center' }}>
                            Apenas uma disciplina pode ser configurada por turma
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={onClose} style={btnPrimary}>Fechar</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#1e40af' }}>{cfg.disciplina}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '6px' }}>
                            <div>
                                <label style={labelSm}>Peso prova</label>
                                <input type="number" min="0" max="10" step="0.5"
                                    value={pesoProva}
                                    onChange={e => handlePesoProva(e.target.value)}
                                    style={input}
                                />
                            </div>
                            <div>
                                <label style={labelSm}>Peso atividades</label>
                                <input type="number" min="0" max="10" step="0.5"
                                    value={pesoAtiv}
                                    onChange={e => handlePesoAtiv(e.target.value)}
                                    style={input}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
                            Soma: <strong style={{ color: Number(pesoProva) + Number(pesoAtiv) === 10 ? '#16a34a' : '#dc2626' }}>
                                {(Number(pesoProva) + Number(pesoAtiv)).toFixed(1)}
                            </strong> / 10
                        </p>
                        {erro && <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>{erro}</p>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                            <button onClick={() => setEditando(null)} style={btnSec}>Cancelar</button>
                            <button onClick={salvarEdicao} style={btnPrimary} disabled={loading}>
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* modal - lançar nota */

function ModalLancarNota({ turmaId, alunos, configs, onClose }) {
    const [alunoId, setAlunoId] = useState('');
    const [disciplina, setDisciplina] = useState('');
    const [tipo, setTipo] = useState('prova');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    async function salvar() {
        if (!alunoId || !disciplina || !tipo || valor === '') return setErro('Preencha todos os campos obrigatórios');
        const v = Number(valor);
        if (isNaN(v) || v < 0 || v > 10) return setErro('Nota deve ser entre 0 e 10');
        setErro(''); setLoading(true);
        try {
            await api.post('/notas', { aluno_id: alunoId, turma_id: turmaId, disciplina, tipo, valor: v, descricao });
            onClose();
        } catch (e) {
            setErro(e?.message || 'Erro ao lançar nota');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={overlay}>
            <div style={modal}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Lançar nota</h2>

                <label style={labelSm}>Aluno *</label>
                <select value={alunoId} onChange={e => setAlunoId(e.target.value)} style={input}>
                    <option value="">Selecione o aluno</option>
                    {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>

                <label style={labelSm}>Disciplina *</label>
                <select value={disciplina} onChange={e => setDisciplina(e.target.value)} style={input}>
                    <option value="">Selecione a disciplina</option>
                    {configs.map(c => <option key={c.disciplina} value={c.disciplina}>{c.disciplina}</option>)}
                </select>

                <label style={labelSm}>Tipo *</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} style={input}>
                    <option value="prova">Prova</option>
                    <option value="atividade">Atividade</option>
                </select>

                <label style={labelSm}>Valor (0–10) *</label>
                <input type="number" min="0" max="10" step="0.1"
                    placeholder="Ex: 8.5"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    style={input}
                />

                <label style={labelSm}>Descrição (opcional)</label>
                <input
                    placeholder="Ex: Prova Bimestral, Trabalho em grupo..."
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    style={input}
                />

                {erro && <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>{erro}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button onClick={onClose} style={btnSec}>Cancelar</button>
                    <button onClick={salvar} style={btnPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Lançar nota'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* modal - editar nota */

function ModalEditarNota({ nota, onClose }) {
    const [valor, setValor] = useState(nota.valor);
    const [descricao, setDescricao] = useState(nota.descricao || '');
    const [loading, setLoading] = useState(false);

    async function salvar() {
        const v = Number(valor);
        if (isNaN(v) || v < 0 || v > 10) return alert('Nota deve ser entre 0 e 10');
        setLoading(true);
        await api.put(`/notas/${nota.id}`, { valor: v, descricao });
        setLoading(false);
        onClose();
    }

    return (
        <div style={overlay}>
            <div style={modal}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Editar nota</h2>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                    {nota.disciplina} · {nota.tipo} · {nota.aluno_nome}
                </p>

                <label style={labelSm}>Valor (0–10)</label>
                <input type="number" min="0" max="10" step="0.1"
                    value={valor} onChange={e => setValor(e.target.value)} style={input} />

                <label style={labelSm}>Descrição</label>
                <input placeholder="Descrição" value={descricao}
                    onChange={e => setDescricao(e.target.value)} style={input} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button onClick={onClose} style={btnSec}>Cancelar</button>
                    <button onClick={salvar} style={btnPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* visao do aluno */

function NotasAluno({ turmaId, userId }) {
    const [desempenho, setDesempenho] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notas, setNotas] = useState([]);

    useEffect(() => { carregar(); }, []);

    async function carregar() {
        try {
            const [desemp, ns] = await Promise.all([
                api.get(`/alunos/${userId}/desempenho?turma_id=${turmaId}`),
                api.get(`/notas?turma_id=${turmaId}&aluno_id=${userId}`)
            ]);

            setDesempenho(desemp || []);
            setNotas(ns || []);
        } catch {
            setDesempenho([]);
            setNotas([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p style={{ color: '#888' }}>Carregando notas...</p>;

    if (desempenho.length === 0) return (
        <div style={emptyBox}>
            <p style={{ margin: 0, color: '#888' }}>Nenhuma nota lançada ainda.</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: '12px' }}>
            <h3 style={sectionTitle}>Meu desempenho</h3>
            {desempenho.map(d => {
                const nota = parseFloat(d.nota_final);
                const cor = nota >= 6 ? '#16a34a' : nota >= 4 ? '#d97706' : '#dc2626';
                return (
                    <div key={d.disciplina} style={card}>
                        <h4 style={{ margin: 0, fontSize: '18px' }}>Nota Geral</h4>
                        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '24px', fontWeight: '700', padding: '4px 10px', color: cor }}>{d.nota_final}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={miniCard}>
                                <div style={miniLabel}>Média provas</div>
                                <div style={miniVal}>{d.media_provas}</div>
                                <div style={miniSub}>peso {d.peso_prova}</div>
                            </div>
                            <div style={miniCard}>
                                <div style={miniLabel}>Média atividades</div>
                                <div style={miniVal}>{d.media_atividades}</div>
                                <div style={miniSub}>peso {d.peso_atividades}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(nota * 10, 100)}%`, height: '100%', background: cor, borderRadius: '99px', transition: 'width .4s' }} />
                        </div>

                        {/* notas individuais */}
                        <div style={{ marginTop: '12px' }}>
                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                                Avaliações
                            </p>

                            {notas
                                .filter(n => n.disciplina === d.disciplina)
                                .length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>
                                    Nenhuma avaliação lançada
                                </p>
                            ) : (
                                notas
                                    .filter(n => n.disciplina === d.disciplina)
                                    .map(n => (
                                        <div key={n.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '6px 0',
                                            borderBottom: '1px solid #f5f5f5'
                                        }}>
                                            <div>
                                                <span style={badgeTipo(n.tipo)}>{n.tipo}</span>
                                                <span style={{ marginLeft: '6px', fontSize: '12px' }}>
                                                    {n.descricao || '—'}
                                                </span>
                                            </div>
                                            <strong style={{ fontSize: '14px' }}>
                                                {Number(n.valor).toFixed(1)}
                                            </strong>
                                        </div>
                                    ))
                            )}
                        </div>


                    </div>
                );
            })}
        </div>
    );
}


function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-0.75 -0.75 16 16" stroke="#E8490F" aria-hidden="true" id="Trash--Streamline-Heroicons-Outline" height="16" width="16">
            <desc>
                Trash Streamline Icon: https://streamlinehq.com
            </desc>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.905416666666666 5.4375 -0.20904166666666663 5.4375m-2.89275 0L5.594583333333333 5.4375m6.022333333333333 -1.9393749999999998c0.206625 0.03141666666666666 0.4120416666666667 0.06464583333333333 0.6174583333333333 0.10029166666666667m-0.6174583333333333 -0.0996875L10.971666666666666 11.885770833333332a1.359375 1.359375 0 0 1 -1.35575 1.2548541666666666H4.884083333333333a1.359375 1.359375 0 0 1 -1.35575 -1.2548541666666666L2.8830833333333334 3.498125m8.733833333333333 0a29.065249999999995 29.065249999999995 0 0 0 -2.1012916666666666 -0.23985416666666667m-7.25 0.3395416666666667c0.20541666666666666 -0.03564583333333333 0.41083333333333333 -0.06887499999999999 0.6174583333333333 -0.0996875m0 0a29.06645833333333 29.06645833333333 0 0 1 2.1012916666666666 -0.23985416666666667m4.53125 0v-0.5534166666666667c0 -0.7129166666666665 -0.5497916666666667 -1.3074166666666667 -1.262708333333333 -1.3297708333333333a31.394916666666663 31.394916666666663 0 0 0 -2.005833333333333 0c-0.7129166666666665 0.022354166666666665 -1.262708333333333 0.6174583333333333 -1.262708333333333 1.3297708333333333v0.5534166666666667m4.53125 0a29.402979166666665 29.402979166666665 0 0 0 -4.53125 0" strokeWidth="1.5"></path>
        </svg>
    );
}

function EditarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-0.75 -0.75 16 16" stroke="#E8490F" aria-hidden="true" id="Pencil-Square--Streamline-Heroicons-Outline" height="16" width="16">
            <desc>
                Pencil Square Streamline Icon: https://streamlinehq.com
            </desc>
            <path strokeLinecap="round" strokeLinejoin="round" d="m10.187458333333332 2.7108958333333333 1.0192291666666666 -1.0198333333333331a1.1328125 1.1328125 0 1 1 1.60225 1.60225L6.393291666666666 9.708958333333333a2.71875 2.71875 0 0 1 -1.1461041666666667 0.6827083333333333L3.625 10.875l0.48333333333333334 -1.6221875a2.71875 2.71875 0 0 1 0.6827083333333333 -1.1461041666666667l5.396416666666666 -5.395812499999999Zm0 0L11.78125 4.3046875M10.875 8.458333333333332v2.8697916666666665A1.359375 1.359375 0 0 1 9.515625 12.6875H3.171875A1.359375 1.359375 0 0 1 1.8125 11.328125V4.984375A1.359375 1.359375 0 0 1 3.171875 3.625H6.041666666666666" strokeWidth="1.5"></path>
        </svg>
    );
}

/* styles */

const sectionTitle = { fontSize: '22px', fontWeight: '700', paddingBottom: '1px' };
const card = { background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eee' };
const emptyBox = { background: '#f9f9f9', borderRadius: '12px', padding: '32px', textAlign: 'center' };

const tabela = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' };
const th = { padding: '10px 14px', background: '#f9f9f9', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' };
const td = { padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #f0f0f0' };
const notaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' };

const chipBtn = { padding: '4px 12px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', fontSize: '12px', cursor: 'pointer' };
const chipAtivo = { background: '#E8490F', color: '#fff', border: 'none' };
const btnIcon = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' };
const labelSm = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#555', marginBottom: '4px' };
const miniCard = { background: '#f9f9f9', padding: '10px', borderRadius: '8px' };
const miniLabel = { fontSize: '11px', color: '#888', marginBottom: '2px' };
const miniVal = { fontSize: '18px', fontWeight: '700' };
const miniSub = { fontSize: '11px', color: '#aaa' };
const badgeTipo = (tipo) => ({
    fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600',
    background: tipo === 'prova' ? '#ede9fe' : '#e0f2fe',
    color: tipo === 'prova' ? '#7c3aed' : '#0369a1'
});

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
const modal = { background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' };
const input = { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' };
const btnPrimary = { background: 'linear-gradient(135deg, #E8490F, #C2185B)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnSec = { background: '#f5f5f5', border: '1px solid #ddd', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };