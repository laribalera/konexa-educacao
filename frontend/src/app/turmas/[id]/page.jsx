'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

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

    const [alunos, setAlunos] = useState([]);
    const [turma, setTurma] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, [id]);

    async function carregarDados() {
        try {
            // alunos
            const alunosData = await api.get(`/turmas/${id}/alunos`);
            setAlunos(alunosData);

            // turmas (pra pegar nome/código)
            const turmas = await api.get('/turmas');
            const atual = turmas.find(t => t.id == id);
            setTurma(atual);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function removerAluno(alunoId) {
        const confirmar = confirm('Tem certeza que deseja remover este aluno?');

        if (!confirmar) return;

        try {
            await api.delete(`/turmas/${id}/alunos/${alunoId}`);
            carregarDados();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return <Layout><p style={{ padding: '24px' }}>Carregando...</p></Layout>;
    }

    return (
        <Layout>
            {/* Topo */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid var(--gray-200)',
                padding: '16px 24px',
            }}>


                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: '700',
                    marginTop: '8px'
                }}>
                    {turma?.nome}
                </h1>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <span style={badge}>{turma?.codigo}</span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        {turma?.ano_letivo}
                    </span>
                </div>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '24px' }}>
                

                <h2 style={sectionTitle}>Alunos</h2>

                {alunos.length === 0 ? (
                    <p style={{ color: 'var(--gray-400)' }}>
                        Nenhum aluno matriculado.
                    </p>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {alunos.map((aluno) => (
                            <div key={aluno.id} style={card}>
                                <div>
                                    <div style={nomeAluno}>{aluno.nome}</div>
                                    <div style={emailAluno}>{aluno.email}</div>
                                </div>

                                {user?.role === 'professor' && (
                                    <button
                                        onClick={() => removerAluno(aluno.id)}
                                        style={btnRemover}
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

const sectionTitle = {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
};

const card = {
    background: '#fff',
    border: '1px solid var(--gray-200)',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const nomeAluno = {
    fontWeight: '600',
    fontSize: '14px',
};

const emailAluno = {
    fontSize: '12px',
    color: 'var(--gray-400)',
};

const btnRemover = {
    padding: '6px 12px',
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
};

const badge = {
    background: 'var(--amber-light)',
    color: 'var(--amber)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
};

const backButton = {
    fontSize: '12px',
    color: 'var(--gray-500)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
};