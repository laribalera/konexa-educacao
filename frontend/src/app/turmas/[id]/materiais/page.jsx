'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function MateriaisPage({ params }) {
    const { user } = useAuth();
    const turmaId = params.id;

    const [materiais, setMateriais] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [arquivo, setArquivo] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPE = 'application/pdf';

    useEffect(() => {
        if (turmaId) {
            buscarMateriais();
        }
    }, [turmaId]);

    async function buscarMateriais() {
        try {
            console.log("Buscando materiais da turma:", turmaId);

            const res = await api.get(`/turmas/${turmaId}/materiais`);

            // console.log("RESPOSTA:", res); 

            setMateriais(res || []);
        } catch (err) {
            console.error("erro ao buscxar:", err);
            setMateriais([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload() {
        if (!titulo || !arquivo) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        if (arquivo.type !== 'application/pdf') {
            alert('Somente PDF é permitido');
            return;
        }

        if (arquivo.size > MAX_FILE_SIZE) {
            alert('Arquivo excede o tamanho máximo de 10MB');
            return;
        }

        try {
            setEnviando(true);

            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('arquivo', arquivo);

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/turmas/${turmaId}/materiais`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            setTitulo('');
            setArquivo(null);
            setModalOpen(false);

            buscarMateriais();

        } catch (err) {
            console.error(err);
            alert('Erro ao enviar material');
        } finally {
            setEnviando(false);
        }
    }

    async function deletarMaterial(id) {
        if (!confirm('Tem certeza que deseja excluir este material?')) return;

        try {
            await api.delete(`/turmas/${turmaId}/materiais/${id}`);
            buscarMateriais();
        } catch (err) {
            console.error(err);
            alert('Erro ao deletar material');
        }
    }

    if (loading) return <p>Carregando...</p>;

    return (
        <div>
            <div style={header}>
                <h2 style={{ margin: 0 }}>Materiais da turma</h2>

                {user?.role === 'professor' && (
                    <button style={btnPrimary} onClick={() => setModalOpen(true)}>
                        + Novo material
                    </button>
                )}
            </div>

            <div style={{ marginTop: 20 }}>
                {materiais.map((m) => (
                    <div key={m.id} style={card}>
                        <div>
                            <h3>{m.titulo}</h3>
                            <small>
                                {new Date(m.criado_em).toLocaleString()}
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                                href={m.arquivo_url}
                                target="_blank"
                                rel="noreferrer"
                                style={btnPrimary}
                            >
                                Abrir
                            </a>

                            {user?.role === 'professor' && (
                                <button
                                    onClick={() => deletarMaterial(m.id)}
                                    style={btnDelete}
                                >
                                    Excluir
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {modalOpen && (
                <div style={overlay}>
                    <div style={modal}>
                        <h3>Novo material</h3>

                        <input
                            type="text"
                            placeholder="Título"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            style={input}
                        />

                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                                const file = e.target.files[0];

                                if (!file) return;

                                // valida tipo
                                if (file.type !== ALLOWED_TYPE) {
                                    alert('Apenas arquivos PDF são permitidos');
                                    e.target.value = '';
                                    return;
                                }

                                // valida tamanho
                                if (file.size > MAX_FILE_SIZE) {
                                    alert('Arquivo muito grande. Máximo permitido: 10MB');
                                    e.target.value = '';
                                    return;
                                }

                                setArquivo(file);
                            }}
                        />

                        <div style={modalActions}>
                            <button onClick={() => setModalOpen(false)} style={btnSecondary}>
                                Cancelar
                            </button>

                            <button onClick={handleUpload} style={btnPrimary}>
                                {enviando ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


const card = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #eee',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '10px',
    background: '#fff'
};


const header = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
};

const btnPrimary = {
    background: 'linear-gradient(135deg, #E8490F, #C2185B)',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
};

const overlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const modal = {
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const input = {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ccc'
};

const modalActions = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px'
};

const btnSecondary = {
    background: '#e5e7eb',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer'
};

const btnDelete = {
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer'
};