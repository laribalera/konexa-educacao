'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const { login, cadastro } = useAuth();
  const [modo, setModo] = useState('login');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'professor',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      if (modo === 'login') {
        await login(form.email, form.senha);
      } else {
        await cadastro(form.nome, form.email, form.senha, form.role);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF0EC 0%, #FDE8F0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>

          {/* logo dentro da div */}
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #E8490F, #C2185B)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Image
              src="/logo.png"
              alt="Konexa Educação"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
          </div>

          {/* titulo */}
          <h1 style={{
            fontSize: '26px',
            fontWeight: '800',
            margin: '0',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-.02em',
          }}>
            Konexa Educação
          </h1>

          {/* subtitulo */}
          <p style={{
            fontSize: '14px',
            color: '#666',
            marginTop: '6px'
          }}>
            Conectando o conhecimento
          </p>

        </div>

        {/* card de login */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
        }}>
          {/* toggle logi<>cadastro */}
          <div style={{
            display: 'flex',
            background: 'var(--gray-100)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
          }}>
            {['login', 'cadastro'].map((m) => (
              <button
                key={m}
                onClick={() => { setModo(m); setErro(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: modo === m ? '600' : '500',
                  color: modo === m ? 'var(--gray-900)' : 'var(--gray-400)',
                  background: modo === m ? '#fff' : 'transparent',
                  boxShadow: modo === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                  transition: 'all .15s',
                }}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {modo === 'cadastro' && (
                <div>
                  <label style={labelStyle}>Nome completo</label>
                  <input
                    name="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>E-mail</label>
                <input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Senha</label>
                <input
                  name="senha"
                  type="password"
                  placeholder="sua senha"
                  value={form.senha}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              {modo === 'cadastro' && (
                <div>
                  <label style={labelStyle}>Sou</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="professor">Professor</option>
                    <option value="aluno">Aluno</option>
                  </select>
                </div>
              )}

              {erro && (
                <div style={{
                  background: 'var(--red-light)',
                  border: '1px solid var(--red-mid)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--red)',
                }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: loading ? 'var(--gray-200)' : 'linear-gradient(135deg, #E8490F, #C2185B)',
                  color: loading ? 'var(--gray-400)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  transition: 'opacity .15s',
                }}
              >
                {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar na plataforma' : 'Criar conta'}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--gray-700)',
  marginBottom: '5px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--gray-200)',
  borderRadius: 'var(--radius)',
  fontSize: '13px',
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
  fontFamily: 'var(--font-body)',
};