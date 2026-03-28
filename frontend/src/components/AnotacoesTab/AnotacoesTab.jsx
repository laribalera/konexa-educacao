'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AnotacoesTab({ turmaId }) {
    const [anotacoes, setAnotacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);

    useEffect(() => { carregar(); }, []);

    async function carregar() {
        setLoading(true);
        try {
            const data = await api.get(`/anotacoes?turma_id=${turmaId}`);
            setAnotacoes(data || []);
        } catch {
            setAnotacoes([]);
        } finally {
            setLoading(false);
        }
    }

    async function deletar(id) {
        if (!confirm('Excluir esta anotação?')) return;
        await api.delete(`/anotacoes/${id}`);
        carregar();
    }

    if (loading) return <p style={{ color: '#888', fontSize: '13px' }}>Carregando anotações...</p>;

    return (
        <div style={{ display: 'grid', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={sectionTitle}>Minhas anotações</h3>
                <button onClick={() => setModalAberto(true)} style={btnPrimary}>
                    + Nova anotação
                </button>
            </div>

            {anotacoes.length === 0 ? (
                <div style={emptyBox}>
                    <p style={{ margin: 0, color: '#888' }}>Nenhuma anotação ainda.</p>
                    <button onClick={() => setModalAberto(true)} style={{ ...btnPrimary, marginTop: '10px' }}>
                        Criar primeira anotação
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {anotacoes.map(anotacao => (
                        <div key={anotacao.id} style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div style={{ fontSize: '11px', color: '#aaa' }}>
                                    {new Date(anotacao.atualizado_em).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => setEditando(anotacao)} style={btnIcon} title="Editar">
                                        <EditarIcon />
                                    </button>
                                    <button onClick={() => deletar(anotacao.id)} style={btnIcon} title="Excluir">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#333' }}>
                                {anotacao.conteudo}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {modalAberto && (
                <ModalAnotacao
                    turmaId={turmaId}
                    onClose={() => { setModalAberto(false); carregar(); }}
                />
            )}

            {editando && (
                <ModalAnotacao
                    turmaId={turmaId}
                    anotacao={editando}
                    onClose={() => { setEditando(null); carregar(); }}
                />
            )}
        </div>
    );
}

/* Mmodal - nova/ editar  */

function ModalAnotacao({ turmaId, anotacao, onClose }) {
    const isEdicao = !!anotacao;
    const [conteudo, setConteudo] = useState(anotacao?.conteudo || '');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    async function salvar() {
        if (!conteudo.trim()) return setErro('A anotação não pode estar vazia');
        setErro(''); setLoading(true);
        try {
            if (isEdicao) {
                await api.put(`/anotacoes/${anotacao.id}`, { conteudo });
            } else {
                await api.post('/anotacoes', { turma_id: turmaId, conteudo });
            }
            onClose();
        } catch (e) {
            setErro(e?.message || 'Erro ao salvar anotação');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={overlay}>
            <div style={modal}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>
                    {isEdicao ? 'Editar anotação' : 'Nova anotação'}
                </h2>

                <textarea
                    placeholder="Digite sua anotação..."
                    value={conteudo}
                    onChange={e => { setConteudo(e.target.value); setErro(''); }}
                    style={textarea}
                    autoFocus
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#bbb' }}>{conteudo.length} caracteres</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {erro && <span style={{ fontSize: '12px', color: '#dc2626' }}>{erro}</span>}
                        <button onClick={onClose} style={btnSec}>Cancelar</button>
                        <button onClick={salvar} style={btnPrimary} disabled={loading}>
                            {loading ? 'Salvando...' : isEdicao ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </div>
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

const sectionTitle = { fontSize: '22px', fontWeight: '700', margin: 0 };
const emptyBox = { background: '#f9f9f9', borderRadius: '12px', padding: '32px', textAlign: 'center' };
const card = { background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eee' };
const btnIcon = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' };

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' };
const modal = { background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '520px' };
const textarea = { width: '100%', minHeight: '180px', padding: '12px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
const btnPrimary = { background: 'linear-gradient(135deg, #E8490F, #C2185B)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnSec = { background: '#f5f5f5', border: '1px solid #ddd', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };