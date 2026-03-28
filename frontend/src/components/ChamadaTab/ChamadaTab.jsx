'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ChamadaTab({ turmaId }) {
    const [aulas, setAulas] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [frequenciaTurma, setFrequenciaTurma] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAula, setModalAula] = useState(false);
    const [aulaSelecionada, setAulaSelecionada] = useState(null); // aula aberta para chamada
    const [abaAtiva, setAbaAtiva] = useState('chamada'); // 'chamada' | 'desempenho'

    useEffect(() => { carregar(); }, []);

    async function carregar() {
        setLoading(true);
        try {
            const [aulasData, alunosData, freqData] = await Promise.all([
                api.get(`/aulas?turma_id=${turmaId}`),
                api.get(`/turmas/${turmaId}/alunos`),
                api.get(`/turmas/${turmaId}/frequencia`).catch(() => []),
            ]);
            setAulas(aulasData || []);
            setAlunos(alunosData || []);
            setFrequenciaTurma(freqData || []);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p style={{ color: '#888', fontSize: '13px' }}>Carregando chamada...</p>;

    return (
        <div style={{ display: 'grid', gap: '20px' }}>

            {/* cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={sectionTitle}>Chamada</h3>
                <button onClick={() => setModalAula(true)} style={btnPrimary}>
                    + Nova aula
                </button>
            </div>

            {/* abas internas */}
            <div style={tabsInner}>
                <TabInner label="Chamada por aula" value="chamada" ativa={abaAtiva} setAtiva={setAbaAtiva} />
                <TabInner label="Desempenho da turma" value="desempenho" ativa={abaAtiva} setAtiva={setAbaAtiva} />
            </div>

            {/* aba chamada */}
            {abaAtiva === 'chamada' && (
                aulas.length === 0 ? (
                    <div style={emptyBox}>
                        <p style={{ margin: 0, color: '#888' }}>Nenhuma aula registrada ainda.</p>
                        <button onClick={() => setModalAula(true)} style={{ ...btnPrimary, marginTop: '10px' }}>
                            Criar primeira aula
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {aulas.map(aula => (
                            <AulaCard
                                key={aula.id}
                                aula={aula}
                                alunos={alunos}
                                onAbrirChamada={() => setAulaSelecionada(aula)}
                            />
                        ))}
                    </div>
                )
            )}

            {/* aba desempenfo da turma */}
            {abaAtiva === 'desempenho' && (
                <DesempenhoTurma frequenciaTurma={frequenciaTurma} />
            )}

            {/* modal de nova aula */}
            {modalAula && (
                <ModalNovaAula
                    turmaId={turmaId}
                    onClose={() => { setModalAula(false); carregar(); }}
                />
            )}

            {/* modal de chamada */}
            {aulaSelecionada && (
                <ModalChamada
                    aula={aulaSelecionada}
                    alunos={alunos}
                    onClose={() => { setAulaSelecionada(null); carregar(); }}
                />
            )}
        </div>
    );
}

/* card de aula */

function AulaCard({ aula, alunos, onAbrirChamada }) {
    const [presencas, setPresencas] = useState(null);

    useEffect(() => { buscarPresencas(); }, []);

    async function buscarPresencas() {
        try {
            const data = await api.get(`/aulas/${aula.id}/presencas`);
            setPresencas(data);
        } catch { }
    }

    return (
        <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{aula.disciplina}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        {new Date(aula.data).toLocaleDateString('pt-BR')}
                        {aula.descricao && ` — ${aula.descricao}`}
                    </div>
                </div>
                <button onClick={onAbrirChamada} style={btnPrimary}>
                    Fazer chamada
                </button>
            </div>
        </div>
    );
}

/* desempenho geral da turma */

function DesempenhoTurma({ frequenciaTurma }) {
    if (!frequenciaTurma || frequenciaTurma.length === 0) return (
        <div style={emptyBox}>
            <p style={{ margin: 0, color: '#888' }}>Nenhuma chamada registrada ainda.</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                Frequência consolidada de cada aluno nesta turma.
            </p>
            {frequenciaTurma.map(freq => {
                const pct = parseFloat(freq.frequencia);
                const cor = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

                return (
                    <div key={freq.aluno_id} style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{freq.nome}</div>
                                <div style={{ fontSize: '11px', color: '#aaa' }}>{freq.faltas} falta(s)</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: cor }}>
                                    {freq.frequencia}
                                </div>
                                <div style={{ fontSize: '11px', color: '#aaa' }}>
                                    {freq.presencas}/{freq.total_aulas} aulas
                                </div>
                            </div>
                        </div>
                        {freq.total_aulas > 0 && (
                            <div style={barTrack}>
                                <div style={{ ...barFill, width: freq.frequencia, background: cor }} />
                            </div>
                        )}
                        {pct < 75 && (
                            <p style={{ fontSize: '11px', color: '#dc2626', margin: '6px 0 0' }}>
                                Aluno com frequencia abaixo de 75% - risco de reprovação
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/*
   modal - nova aula */

function ModalNovaAula({ turmaId, onClose }) {
    const [disciplina, setDisciplina] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [configs, setConfigs] = useState([]);

    useEffect(() => {
        api.get(`/turmas/${turmaId}/config-notas`)
            .then(data => setConfigs(data || []))
            .catch(() => setConfigs([]));
    }, []);

    async function salvar() {
        if (!disciplina || !data) return setErro('Disciplina e data são obrigatórios');
        setErro(''); setLoading(true);
        try {
            await api.post('/aulas', { turma_id: turmaId, disciplina, data, descricao });
            onClose();
        } catch (e) {
            setErro(e?.message || 'Erro ao criar aula');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={overlay}>
            <div style={modal}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Nova aula</h2>

                <label style={labelSm}>Disciplina *</label>
                {configs.length > 0 ? (
                    <select value={disciplina} onChange={e => setDisciplina(e.target.value)} style={input}>
                        <option value="">Selecione a disciplina</option>
                        {configs.map(c => <option key={c.disciplina} value={c.disciplina}>{c.disciplina}</option>)}
                    </select>
                ) : (
                    <input
                        placeholder="Ex: Matemática"
                        value={disciplina}
                        onChange={e => setDisciplina(e.target.value)}
                        style={input}
                    />
                )}

                <label style={labelSm}>Data *</label>
                <input
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                    style={input}
                />

                <label style={labelSm}>Descrição (opcional)</label>
                <input
                    placeholder="Ex: Introdução à álgebra"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    style={input}
                />

                {erro && <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>{erro}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button onClick={onClose} style={btnSec}>Cancelar</button>
                    <button onClick={salvar} style={btnPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Criar aula'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* modal - fazer chamada */

function ModalChamada({ aula, alunos, onClose }) {
    const [presencas, setPresencas] = useState(
        alunos.reduce((acc, a) => ({ ...acc, [a.id]: true }), {})
    );
    const [loading, setLoading] = useState(false);
    const [loadingPresencas, setLoadingPresencas] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        // busca presenças já registradas para pre preencher o modal
        api.get(`/aulas/${aula.id}/presencas`)
            .then(data => {
                if (data && data.length > 0) {
                    // sobrescreve só os alunos que já tem presença registrada
                    setPresencas(prev => {
                        const atualizado = { ...prev };
                        data.forEach(p => { atualizado[p.aluno_id] = p.presente; });
                        return atualizado;
                    });
                }
            })
            .catch(() => {}) // se falhar, mantem todos como true
            .finally(() => setLoadingPresencas(false));
    }, []);

    function toggle(alunoId) {
        setPresencas(prev => ({ ...prev, [alunoId]: !prev[alunoId] }));
    }

    function marcarTodos(valor) {
        setPresencas(alunos.reduce((acc, a) => ({ ...acc, [a.id]: valor }), {}));
    }

    async function salvar() {
        setErro(''); setLoading(true);
        try {
            await api.post(`/aulas/${aula.id}/chamada`, {
                presencas: alunos.map(a => ({ aluno_id: a.id, presente: presencas[a.id] ?? false }))
            });
            onClose();
        } catch (e) {
            setErro(e?.message || 'Erro ao salvar chamada');
        } finally {
            setLoading(false);
        }
    }

    const totalPresentes = Object.values(presencas).filter(Boolean).length;

    return (
        <div style={overlay}>
            <div style={{ ...modal, maxWidth: '480px' }}>
                <h2 style={{ marginBottom: '4px', fontSize: '18px' }}>Chamada</h2>
                {loadingPresencas && (
                    <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Carregando chamada anterior...</p>
                )}
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
                    {aula.disciplina} — {new Date(aula.data).toLocaleDateString('pt-BR')}
                    {aula.descricao && ` — ${aula.descricao}`}
                </p>

                {/* açoes rapidas */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => marcarTodos(true)} style={btnChip}> <IconPresente /> Todos presentes</button>
                    <button onClick={() => marcarTodos(false)} style={btnChip}><IconAusente /> Todos ausentes</button>
                    <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#888', alignSelf: 'center' }}>
                        {totalPresentes}/{alunos.length} presentes
                    </span>
                </div>

                {/* lista de alunos */}
                <div style={{ display: 'grid', gap: '6px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {alunos.map(aluno => {
                        const presente = presencas[aluno.id] ?? false;
                        return (
                            <div
                                key={aluno.id}
                                onClick={() => toggle(aluno.id)}
                                style={{
                                    ...alunoRow,
                                    background: presente ? '#f0fdf4' : '#fff5f5',
                                    borderColor: presente ? '#bbf7d0' : '#fecaca',
                                    cursor: 'pointer',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{aluno.nome}</div>
                                    <div style={{ fontSize: '11px', color: '#aaa' }}>{aluno.email}</div>
                                </div>
                                <span style={badgePresenca(presente)}>
                                    {presente ? 'Presente' : 'Falta'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {erro && <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0' }}>{erro}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                    <button onClick={onClose} style={btnSec}>Cancelar</button>
                    <button onClick={salvar} style={btnPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar chamada'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* sub componentes */

function TabInner({ label, value, ativa, setAtiva }) {
    return (
        <button
            onClick={() => setAtiva(value)}
            style={{
                padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500',
                background: ativa === value ? '#E8490F' : '#f5f5f5',
                color: ativa === value ? '#fff' : '#555',
            }}
        >
            {label}
        </button>
    );
}

/* helpers */

function badgePresenca(presente) {
    return {
        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
        background: presente ? '#dcfce7' : '#fee2e2',
        color: presente ? '#16a34a' : '#dc2626',
        whiteSpace: 'nowrap',
    };
}


/* icons */

const IconPresente = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-0.375 -0.375 12 12" id="Check--Streamline-Sharp" height="12" width="12">
  <desc>
    Check Streamline Icon: https://streamlinehq.com
  </desc>
  <g id="check--check-form-validation-checkmark-success-add-addition-tick">
    <path id="Vector 2356" stroke="#16a34a" d="m0.703125 5.859375 3.28125 3.28125 6.5625 -6.5625" strokeWidth="0.75"></path>
  </g>
</svg>
);

const IconAusente = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-0.43 -0.43 12 12" id="Delete-1--Streamline-Core" height="12" width="12">
  <desc>
    Delete 1 Streamline Icon: https://streamlinehq.com
  </desc>
  <g id="delete-1--remove-add-button-buttons-delete-cross-x-mathematics-multiply-math">
    <path id="Vector" stroke="#dc2626" strokeLinecap="round" strokeLinejoin="round" d="m10.742142857142857 0.39785714285714285 -10.344285714285714 10.344285714285714" strokeWidth="0.86"></path>
    <path id="Vector_2" stroke="#dc2626" strokeLinecap="round" strokeLinejoin="round" d="m0.39785714285714285 0.39785714285714285 10.344285714285714 10.344285714285714" strokeWidth="0.86"></path>
  </g>
</svg>
);


/* estilos */

const sectionTitle = { fontSize: '22px', fontWeight: '700', margin: 0 };
const emptyBox = { background: '#f9f9f9', borderRadius: '12px', padding: '32px', textAlign: 'center' };
const card = { background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eee' };
const alunoRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', border: '1px solid', transition: 'background .15s' };
const tabsInner = { display: 'flex', gap: '8px' };

const barTrack = { height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' };
const barFill = { height: '100%', borderRadius: '99px', transition: 'width .4s' };

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
const modal = { background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' };
const input = { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' };
const labelSm = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#555', marginBottom: '4px' };
const btnPrimary = { background: 'linear-gradient(135deg, #E8490F, #C2185B)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnSec = { background: '#f5f5f5', border: '1px solid #ddd', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnChip = { background: '#f5f5f5', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' };