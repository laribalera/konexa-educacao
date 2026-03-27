'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute role="professor">
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoAno, setNovoAno] = useState('2026');

  useEffect(() => {
    carregarTurmas();
  }, []);

  async function carregarTurmas() {
    try {
      const data = await api.get('/turmas');
      setTurmas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function criarTurma(e) {
    e.preventDefault();
    try {
      await api.post('/turmas', { nome: novoNome, ano_letivo: Number(novoAno) });
      setModalAberto(false);
      setNovoNome('');
      carregarTurmas();
    } catch (err) {
      console.error(err);
    }
  }

  const cores = ['#E8490F', '#C2185B', '#7C3AED', '#16A34A', '#D97706'];

  return (
    <Layout>
      {/* Topbar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--gray-200)',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '700' }}>
            Minhas turmas
          </div>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          style={{
            padding: '7px 14px',
            background: 'linear-gradient(135deg, #E8490F, #C2185B)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Nova turma
        </button>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px' }}>
          Olá, {user?.nome}! Você tem {turmas.length} turma{turmas.length !== 1 ? 's' : ''} ativa{turmas.length !== 1 ? 's' : ''}.
        </p>

        {loading ? (
          <p style={{ color: 'var(--gray-400)', fontSize: '13px' }}>Carregando...</p>
        ) : turmas.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#fff', border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '12px' }}>
              Você ainda não tem turmas criadas.
            </p>
            <button
              onClick={() => setModalAberto(true)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #E8490F, #C2185B)',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer',
              }}
            >
              Criar primeira turma
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px',
          }}>
            {turmas.map((turma, i) => (
              <div
                key={turma.id}
                onClick={() => router.push(`/turmas/${turma.id}`)}
                style={{
                  background: '#fff',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'box-shadow .15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px',
                    background: cores[i % cores.length] + '20',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px', fontWeight: '800',
                    color: cores[i % cores.length],
                  }}>
                    {turma.nome.charAt(0)}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    padding: '3px 8px', borderRadius: '20px',
                    background: 'var(--amber-light)', color: 'var(--amber)',
                  }}>
                    {turma.codigo}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '700' }}>
                  {turma.nome}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '3px' }}>
                  {turma.ano_letivo}
                </div>
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--gray-100)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: '500' }}>
                    Abrir turma →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nova turma */}
      {modalAberto && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '24px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            padding: '28px', width: '100%', maxWidth: '400px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px', fontWeight: '700',
              marginBottom: '20px',
            }}>Nova turma</h2>
            <form onSubmit={criarTurma}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Nome da turma</label>
                <input
                  type="text"
                  placeholder="Ex: Matemática 9A"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Ano letivo</label>
                <input
                  type="number"
                  value={novoAno}
                  onChange={(e) => setNovoAno(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  style={{
                    padding: '8px 16px', border: '1px solid var(--gray-200)',
                    borderRadius: '8px', background: '#fff',
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    cursor: 'pointer', color: 'var(--gray-700)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #E8490F, #C2185B)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  Criar turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const labelStyle = {
  display: 'block', fontSize: '12px',
  fontWeight: '500', color: 'var(--gray-700)', marginBottom: '5px',
};

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
  fontSize: '13px', color: 'var(--gray-900)', background: '#fff',
  outline: 'none', fontFamily: 'var(--font-body)',
};