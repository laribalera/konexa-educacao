'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import MateriaisPage from './materiais/page';

export default function TurmaPage() {
    return (
        <ProtectedRoute>
            <Turma />
        </ProtectedRoute>
    );
}

function Turma() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [turma, setTurma] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('home');

    useEffect(() => {
        carregarTurma();
    }, []);

    async function carregarTurma() {
        const turmas = await api.get('/turmas');
        const atual = turmas.find(t => t.id == id);
        setTurma(atual);
    }

    return (
        <Layout>
            {/* header */}
            <div style={header}>
                <button onClick={() => router.back()} style={backButton}>
                    ← Voltar
                </button>

                <h1 style={titulo}>{turma?.nome}</h1>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={badge}>{turma?.codigo}</span>
                    <span style={subinfo}>{turma?.ano_letivo}</span>
                </div>
            </div>

            {/* tabs de menu */}
            <div style={tabsBar}>
                <Tab label="Home" value="home" {...{ abaAtiva, setAbaAtiva }} />
                <Tab label="Alunos" value="alunos" {...{ abaAtiva, setAbaAtiva }} />
                <Tab label="Materiais" value="materiais" {...{ abaAtiva, setAbaAtiva }} />
                <Tab label="Notas" value="notas" {...{ abaAtiva, setAbaAtiva }} />

                {/*apenas alunos*/}
                {user?.role === 'aluno' && (
                    <Tab label="Anotações" value="anotacoes" {...{ abaAtiva, setAbaAtiva }} />
                )}

                {/*apenas profs*/}
                {user?.role === 'professor' && (
                    <>
                        <Tab label="Diário de Classe" value="diario" {...{ abaAtiva, setAbaAtiva }} />
                        <Tab label="Chamada" value="chamada" {...{ abaAtiva, setAbaAtiva }} />
                    </>
                )}

            </div>

            {/* conteudo */}
            <div style={{ padding: '24px' }}>
                {abaAtiva === 'home' && <HomeTab turmaId={id} user={user} />}
                {abaAtiva === 'alunos' && <AlunosTab turmaId={id} user={user} />}
                {abaAtiva === 'materiais' && <MateriaisPage params={{ id: turma?.id }} />}
                {abaAtiva === 'notas' && <p>Notas (em construção)</p>}
                {abaAtiva === 'diario' && <p>Diário de Classe (em construção)</p>}
            </div>
        </Layout>
    );
}

/* tabs */

function Tab({ label, value, abaAtiva, setAbaAtiva }) {
    const ativa = abaAtiva === value;

    return (
        <button
            onClick={() => setAbaAtiva(value)}
            style={{ ...tab, ...(ativa ? tabAtiva : {}) }}
        >
            {label}
        </button>
    );
}

/* homepade */

function HomeTab({ turmaId, user }) {
    const [avisos, setAvisos] = useState([]);
    const [stats, setStats] = useState({ alunos: 0 });
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const avisosData = await api.get(`/avisos/turma/${turmaId}`);
        setAvisos(avisosData);

        const alunos = await api.get(`/turmas/${turmaId}/alunos`);
        setStats({ alunos: alunos.length });
    }

    async function criarAviso(dados) {
        await api.post('/avisos', {
            turma_id: turmaId,
            ...dados
        });

        setModalAberto(false);
        carregar();
    }

    return (
        <div style={{ display: 'grid', gap: '20px' }}>

            {/* stats */}
            <div style={statsGrid}>
                <StatCard label="Alunos nesta turma" value={stats.alunos} />
            </div>

            {/* header avisos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={sectionTitle}>Avisos</h2>

                {user?.role === 'professor' && (
                    <button onClick={() => setModalAberto(true)} style={btnPrimary}>
                        + Novo aviso
                    </button>
                )}
            </div>

            {/* avisos */}
            {avisos.map(aviso => (
                <AvisoCard key={aviso.id} aviso={aviso} user={user} onRefresh={carregar} />
            ))}

            {/* grid de chat e materiais */}
            <div style={gridInferior}>
                <ChatTurma turmaId={turmaId} user={user} />
                <MateriaisRecentes turmaId={turmaId} />
            </div>

            {modalAberto && (
                <CriarAvisoModal
                    onClose={() => setModalAberto(false)}
                    onSave={criarAviso}
                />
            )}
        </div>
    );
}

/* stats */

function StatCard({ label, value }) {
    return (
        <div style={statCard}>
            <div style={statLabel}>{label}</div>
            <div style={statValue}>{value}</div>
        </div>
    );
}

/* aviso */

function CriarAvisoModal({ onClose, onSave }) {
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!conteudo) return;

        setLoading(true);
        await onSave({ titulo, conteudo });
        setLoading(false);
    }

    return (
        <div style={overlay}>
            <div style={modal}>
                <h2 style={{ marginBottom: '16px' }}>Novo aviso</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        placeholder="Título (opcional)"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        style={input}
                    />

                    <textarea
                        placeholder="Escreva o aviso..."
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        style={textarea}
                        required
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" onClick={onClose} style={btnSec}>
                            Cancelar
                        </button>

                        <button type="submit" style={btnPrimary}>
                            {loading ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AvisoCard({ aviso, user, onRefresh }) {
    const [reacoes, setReacoes] = useState([]);
    const [editando, setEditando] = useState(false);

    const EMOJIS = ['👍', '❤️', '👏', '👀', '✅', '😭'];

    useEffect(() => {
        carregarReacoes();
    }, []);

    async function carregarReacoes() {
        const data = await api.get(`/avisos/${aviso.id}/reacoes`);
        setReacoes(data);
    }

    async function reagir(emoji) {
        await api.post(`/avisos/${aviso.id}/reacoes`, { emoji });
        carregarReacoes();
    }

    async function deletar() {
        if (!confirm('Excluir este aviso?')) return;

        await api.delete(`/avisos/${aviso.id}`);
        onRefresh();
    }

    function total(emoji) {
        const r = reacoes.find(r => r.emoji === emoji);
        return r ? r.total : 0;
    }

    return (
        <>
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <div style={tituloAviso}>{aviso.titulo}</div>
                        <div style={meta}>
                            {aviso.nome_professor} • {new Date(aviso.criado_em).toLocaleDateString()}
                        </div>
                    </div>

                    {/* açoes do professor no acviso */}
                    {user?.role === 'professor' && (
                        <div style={{ display: 'flex', gap: '3px' }}>
                            <button onClick={() => setEditando(true)} style={btnSec}>
                                <EditarIcon />
                            </button>
                            <button onClick={deletar} style={btnRemover}>
                                <TrashIcon />
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ margin: '12px 0' }}>
                    {aviso.conteudo}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    {EMOJIS.map(e => (
                        <button key={e} onClick={() => reagir(e)} className='reaction'>
                            {e} {total(e)}
                        </button>
                    ))}
                </div>
            </div>

            {/* modal de edição */}
            {editando && (
                <EditarAvisoModal
                    aviso={aviso}
                    onClose={() => setEditando(false)}
                    onSave={onRefresh}
                />
            )}
        </>
    );
}

function EditarAvisoModal({ aviso, onClose, onSave }) {
    const [titulo, setTitulo] = useState(aviso.titulo || '');
    const [conteudo, setConteudo] = useState(aviso.conteudo || '');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setLoading(true);

        await api.put(`/avisos/${aviso.id}`, {
            titulo,
            conteudo
        });

        setLoading(false);
        onClose();
        onSave();
    }

    return (
        <div style={overlay}>
            <div style={modal}>
                <h2 style={{ marginBottom: '16px' }}>Editar aviso</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        style={input}
                    />

                    <textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        style={textarea}
                        required
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" onClick={onClose} style={btnSec}>
                            Cancelar
                        </button>

                        <button type="submit" style={btnPrimary}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/*chat da tutma*/

function ChatTurma({ turmaId, user }) {
    const [mensagens, setMensagens] = useState([]);
    const [texto, setTexto] = useState('');

    useEffect(() => {
        carregar();

        const interval = setInterval(carregar, 3000);
        return () => clearInterval(interval);
    }, []);

    async function carregar() {
        const data = await api.get(`/mensagens?turma_id=${turmaId}`);
        setMensagens(data);
    }

    async function enviar(e) {
        e.preventDefault();

        if (!texto.trim()) return;

        await api.post('/mensagens', {
            turma_id: turmaId,
            conteudo: texto
        });

        setTexto('');
        carregar();
    }

    async function deletar(id) {
        if (!confirm('Excluir mensagem?')) return;

        await api.delete(`/mensagens/${id}`);
        carregar();
    }

    return (
        <div style={card}>
            <h3 style={sectionTitle}>Chat da turma</h3>

            <div style={chatBox}>
                {mensagens.map(m => (
                    <div key={m.id} style={msgItem}>
                        <div style={msgHeader}>
                            <div style={msgHeader}>
                                <strong>{m.autor_nome}</strong>

                                <span style={badgeRole(m.autor_role)}>
                                    {m.autor_role}
                                </span>

                                <span style={msgMeta}>
                                    {new Date(m.criado_em).toLocaleTimeString()}
                                </span>

                                {user?.role === 'professor' && (
                                    <button onClick={() => deletar(m.id)} style={btnRemover}>
                                        x
                                    </button>
                                )}
                            </div>

                        </div>

                        <div>{m.conteudo}</div>
                    </div>
                ))}
            </div>

            <form onSubmit={enviar} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    style={{ ...input, marginBottom: 0 }}
                />

                <button type="submit" style={btnPrimary}>
                    Enviar
                </button>
            </form>
        </div>
    );
}

/*materiais recentes*/

function MateriaisRecentes({ turmaId }) {
    const [materiais, setMateriais] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (turmaId) {
            carregar();
        }
    }, [turmaId]);

    async function carregar() {
        try {
            const res = await api.get(`/turmas/${turmaId}/materiais`);

            // ordenar do mais recente para o mais antigo
            const ordenados = (res || []).sort(
                (a, b) => new Date(b.criado_em) - new Date(a.criado_em)
            );

            setMateriais(ordenados.slice(0, 3));
        } catch (err) {
            console.error('Erro ao buscar materiais:', err);
            setMateriais([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={card}>
            <h3 style={sectionTitle}>Materiais recentes</h3>

            {loading ? (
                <p>Carregando...</p>
            ) : materiais.length === 0 ? (
                <p style={{ color: '#666' }}>
                    Nenhum material encontrado.
                </p>
            ) : (
                materiais.map((m) => (
                    <div key={m.id} style={item}>
                        <div>
                            <strong>{m.titulo}</strong>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                {new Date(m.criado_em).toLocaleDateString()}
                            </div>
                        </div>

                        <a
                            href={m.arquivo_url}
                            target="_blank"
                            rel="noreferrer"
                            style={btnPrimary}
                        >
                            Abrir
                        </a>
                    </div>
                ))
            )}
        </div>
    );
}


/* alunos */

function AlunosTab({ turmaId, user }) {
    const [alunos, setAlunos] = useState([]);

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const data = await api.get(`/turmas/${turmaId}/alunos`);
        setAlunos(data);
    }

    async function remover(id) {
        if (!confirm('Remover aluno?')) return;

        await api.delete(`/turmas/${turmaId}/alunos/${id}`);
        carregar();
    }

    return (
        <div style={{ display: 'grid', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '20px' }}>Alunos Matriculados</h3>
            {alunos.map(a => (
                <div key={a.id} style={cardRow}>
                    <div>
                        <div style={{ fontWeight: '600' }}>{a.nome}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{a.email}</div>
                    </div>

                    {user?.role === 'professor' && (
                        <button onClick={() => remover(a.id)} style={btnRemover}>
                            Remover
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

/*icons*/

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

/* stylessz */

const header = { background: '#fff', padding: '20px', borderBottom: '1px solid #eee' };
const titulo = { fontSize: '20px', fontWeight: '700' };
const subinfo = { fontSize: '12px', color: '#666' };
const badge = { background: '#fde68a', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#b45309', fontWeight: '600' };
const backButton = { background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', color: '#888' };

const tabsBar = { display: 'flex', gap: '8px', padding: '10px 20px', borderBottom: '1px solid #eee' };
const tab = { padding: '8px 14px', border: 'none', background: '#f5f5f5', borderRadius: '8px', cursor: 'pointer' };
const tabAtiva = { background: '#E8490F', color: '#fff' };

const statsGrid = { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' };
const statCard = { background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #eee' };
const statLabel = { fontSize: '12px', color: '#666' };
const statValue = { fontSize: '20px', fontWeight: '700' };

const sectionTitle = { fontSize: '22px', fontWeight: '700', paddingBottom: '1px' };

const card = { background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #eee' };
const tituloAviso = { fontWeight: '700', fontSize: '16px', marginBottom: '4px' };
const meta = { fontSize: '12px', color: '#888' };

const cardRow = { display: 'flex', justifyContent: 'spacebetween', padding: '12px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' };
const btnRemover = { background: '#fff', color: '#b91c1c', border: 'none', padding: '2px 5px', borderRadius: '6px', cursor: 'pointer' };

const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50
};

const modal = {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px'
};

const input = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px'
};

const textarea = {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    marginBottom: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px'
};

const btnPrimary = {
    background: 'linear-gradient(135deg, #E8490F, #C2185B)',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none'
};

const btnSec = {
    background: '#fff',
    border: 'none',
    padding: '2px 5px',
    borderRadius: '8px',
    cursor: 'pointer'
};

const gridInferior = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
};

const chatBox = {
    maxHeight: '300px',
    overflowY: 'auto',
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
};

const msgItem = {
    background: '#f9f9f9',
    padding: '8px',
    borderRadius: '8px'
};

const msgHeader = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px'
};

const msgMeta = {
    fontSize: '10px',
    color: '#888'
};

const badgeRole = (role) => ({
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '12px',
    fontWeight: '600',
    background:
        role === 'professor' ? '#ede9fe' : '#e0f2fe',
    color:
        role === 'professor' ? '#8c5ed6' : '#0369a1'
});


const item = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
};