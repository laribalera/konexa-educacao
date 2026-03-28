'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DesempenhoTab({ turmaId, userId }) {
    const [desempenho, setDesempenho] = useState([]);
    const [frequencia, setFrequencia] = useState(null);
    const [loadingNotas, setLoadingNotas] = useState(true);
    const [loadingFreq, setLoadingFreq] = useState(true);

    useEffect(() => {
        carregarNotas();
        carregarFrequencia();
    }, []);

    async function carregarNotas() {
        try {
            const data = await api.get(`/alunos/${userId}/desempenho?turma_id=${turmaId}`);
            setDesempenho(data || []);
        } catch {
            setDesempenho([]);
        } finally {
            setLoadingNotas(false);
        }
    }

    async function carregarFrequencia() {
        try {
            const data = await api.get(`/presencas?turma_id=${turmaId}`);
            setFrequencia(data);
        } catch {
            setFrequencia(null);
        } finally {
            setLoadingFreq(false);
        }
    }

    return (
        <div style={{ display: 'grid', gap: '24px' }}>
            <h3 style={sectionTitle}>Meu desempenho</h3>

            {/* frequencia em aula */}
            <section>
                <h4 style={subTitle}>Frequência</h4>
                {loadingFreq ? (
                    <p style={txtMuted}>Carregando...</p>
                ) : !frequencia || frequencia.total_aulas === 0 ? (
                    <div style={emptyBox}>
                        <p style={{ margin: 0, color: '#888' }}>Nenhuma aula registrada ainda.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {/* cards de resumo */}
                        <div style={statsGrid}>
                            <StatCard
                                label="Frequência"
                                value={frequencia.frequencia}
                                cor={freqCor(parseFloat(frequencia.frequencia))}
                            />
                            <StatCard label="Total de aulas" value={frequencia.total_aulas} />
                            <StatCard label="Presenças" value={frequencia.presencas} cor="#16a34a" />
                            <StatCard label="Faltas" value={frequencia.faltas} cor={frequencia.faltas > 0 ? '#dc2626' : '#888'} />
                        </div>

                        {/* barra de frequencia */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                                <span>Presença</span>
                                <span>{frequencia.frequencia}</span>
                            </div>
                            <div style={barTrack}>
                                <div style={{
                                    ...barFill,
                                    width: frequencia.frequencia,
                                    background: freqCor(parseFloat(frequencia.frequencia))
                                }} />
                            </div>
                            {parseFloat(frequencia.frequencia) < 75 && (
                                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
                                    Atenção: Frequência abaixo de 75% — risco de reprovação por falta.
                                </p>
                            )}
                        </div>

                        {/* historico de aulas */}
                        {frequencia.detalhes?.length > 0 && (
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Histórico de aulas</p>
                                <div style={listaDetalhes}>
                                    {frequencia.detalhes.map((d, i) => (
                                        <div key={i} style={detalheRow}>
                                            <div>
                                                <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                                    {d.disciplina}
                                                </span>
                                                {d.descricao && (
                                                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '6px' }}>
                                                        — {d.descricao}
                                                    </span>
                                                )}
                                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                                                    {new Date(d.data).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            <span style={badgePresenca(d.presente)}>
                                                {d.presente ? 'Presente' : 'Falta'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* notas */}
            <section>
                <h4 style={subTitle}>Notas por disciplina</h4>
                {loadingNotas ? (
                    <p style={txtMuted}>Carregando...</p>
                ) : desempenho.length === 0 ? (
                    <div style={emptyBox}>
                        <p style={{ margin: 0, color: '#888' }}>Nenhuma nota lançada ainda.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {/* grafico de barras horizontal (para demonstrar progresso ) */}
                        <div style={card}>
                            <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>
                                Visão geral
                            </p>
                            {desempenho.map(d => {
                                const nota = parseFloat(d.nota_final);
                                const cor = notaCor(nota);
                                return (
                                    <div key={d.disciplina} style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                            <span>{d.disciplina}</span>
                                            <strong style={{ color: cor }}>{d.nota_final}</strong>
                                        </div>
                                        <div style={barTrack}>
                                            <div style={{
                                                ...barFill,
                                                width: `${Math.min(nota * 10, 100)}%`,
                                                background: cor,
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {/* linha de aprovação */}
                            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>
                                Linha de aprovação: <strong>6.0</strong>
                            </p>
                        </div>

                        {/* cards detalhados por disciplina */}
                        {desempenho.map(d => {
                            const nota = parseFloat(d.nota_final);
                            const cor = notaCor(nota);
                            return (
                                <div key={d.disciplina} style={card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <strong style={{ fontSize: '15px' }}>{d.disciplina}</strong>
                                        <span style={{ fontSize: '26px', fontWeight: '800', color: cor }}>
                                            {d.nota_final}
                                        </span>
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
                                    <div style={{ marginTop: '10px', height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(nota * 10, 100)}%`, height: '100%', background: cor, borderRadius: '99px', transition: 'width .4s' }} />
                                    </div>
                                    {nota < 6 && (
                                        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
                                            Atenção: Desempenho abaixo da média - nota mínima para aprovação: 6.0
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

/* sub componentes */

function StatCard({ label, value, cor }) {
    return (
        <div style={statCard}>
            <div style={statLabel}>{label}</div>
            <div style={{ ...statValue, color: cor || '#111' }}>{value}</div>
        </div>
    );
}

/* helper */

function notaCor(nota) {
    if (isNaN(nota)) return '#999';
    return nota >= 6 ? '#16a34a' : nota >= 4 ? '#d97706' : '#dc2626';
}

function freqCor(pct) {
    return pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
}

function badgePresenca(presente) {
    return {
        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
        background: presente ? '#dcfce7' : '#fee2e2',
        color: presente ? '#16a34a' : '#dc2626',
        whiteSpace: 'nowrap',
    };
}

/* stylez */

const sectionTitle = { fontSize: '22px', fontWeight: '700', margin: 0 };
const subTitle = { fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0', color: '#333' };
const txtMuted = { color: '#888', fontSize: '13px' };
const emptyBox = { background: '#f9f9f9', borderRadius: '12px', padding: '28px', textAlign: 'center' };
const card = { background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eee' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' };
const statCard = { background: '#fff', padding: '14px', borderRadius: '10px', border: '1px solid #eee' };
const statLabel = { fontSize: '11px', color: '#888', marginBottom: '4px' };
const statValue = { fontSize: '22px', fontWeight: '700' };

const barTrack = { height: '8px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' };
const barFill = { height: '100%', borderRadius: '99px', transition: 'width .4s' };

const listaDetalhes = { display: 'grid', gap: '6px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' };
const detalheRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9f9f9', borderRadius: '8px' };

const miniCard = { background: '#f9f9f9', padding: '10px', borderRadius: '8px' };
const miniLabel = { fontSize: '11px', color: '#888', marginBottom: '2px' };
const miniVal = { fontSize: '18px', fontWeight: '700' };
const miniSub = { fontSize: '11px', color: '#aaa' };