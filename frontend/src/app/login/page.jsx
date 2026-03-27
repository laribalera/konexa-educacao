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
            <IconLogo />
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

function IconLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#eeecec" id="Graph-Thin--Streamline-Phosphor-Thin" height="36" width="36">
  <desc>
    Graph Thin Streamline Icon: https://streamlinehq.com
  </desc>
  <path d="M13.6344625 10.5061375c-0.56689375 -0.00043125 -1.1117125 0.2197375 -1.5191375 0.61391875l-2.2144875 -1.72273125c0.18911875 -0.32985625 0.288475 -0.703525 0.2881625 -1.08375 -0.00003125 -0.1313 -0.011825 -0.2623375 -0.0352375 -0.39153125l1.52305 -0.505075c0.75871875 1.51241875 2.87015625 1.63634375 3.8005875 0.22306875 0.9304375 -1.413275 -0.0179625 -3.3038 -1.7071125 -3.4029375 -1.4211625 -0.0834125 -2.5455 1.185525 -2.2915875 2.5863125l-1.52461875 0.50741875c-0.37145625 -0.74084375 -1.1288875 -1.2089375 -1.95764375 -1.209825 -0.20126875 -0.00009375 -0.4015625 0.02784375 -0.595125 0.08300625l-0.74390625 -1.6734c1.42803125 -0.89973125 1.34655625 -3.00795625 -0.14665 -3.7948C5.01754375 -0.051025 3.23250625 1.07364375 3.2976875 2.76021875c0.04551875 1.1778875 1.0142 2.1089875 2.1929625 2.10789375 0.20126875 0.0001 0.4015625 -0.0278375 0.595125 -0.08300625l0.74390625 1.6734c-1.04166875 0.65330625 -1.3409 2.036275 -0.66246875 3.0617625L3.76791875 11.6501875c-1.28906875 -1.0895375 -3.27419375 -0.37504375 -3.57323125 1.28609375 -0.29903125 1.6611375 1.31230625 3.02305625 2.9004125 2.4514625 1.33468125 -0.4803875 1.8688125 -2.08253125 1.08940625 -3.267725l2.3961625 -2.12991875c0.85699375 0.725525 2.12424375 0.68389375 2.93176875 -0.0963125l2.21449375 1.722725c-0.83306875 1.467925 0.23533125 3.28719375 1.923125 3.27469375 1.6877875 -0.0125 2.729125 -1.84740625 1.8744 -3.30281875 -0.393625 -0.6702625 -1.1127 -1.08201875 -1.88999375 -1.08225Zm0 -5.638025c1.20559375 0 1.95909375 1.3051 1.35629375 2.349175 -0.60279375 1.04408125 -2.10979375 1.04408125 -2.71259375 0 -0.13745625 -0.238075 -0.20981875 -0.50814375 -0.20981875 -0.78305625 0 -0.86496875 0.70115 -1.56615625 1.56611875 -1.56611875ZM3.92453125 2.67555c0 -1.2056 1.3051 -1.9591 2.349175 -1.3563 1.04408125 0.6028 1.04408125 2.1098 0 2.71259375 -0.23805625 0.13744375 -0.50816875 0.2098125 -0.78305625 0.209825 -0.86496875 0.0000375 -1.56611875 -0.70115 -1.56611875 -1.56611875ZM2.3584125 14.89126875c-1.20559375 0 -1.95909375 -1.3051 -1.35629375 -2.34918125 0.60279375 -1.044075 2.10979375 -1.044075 2.71259375 0 0.13745625 0.23808125 0.20981875 0.50815 0.20981875 0.7830625 0 0.86494375 -0.701175 1.56611875 -1.56611875 1.56611875Zm5.638025 -5.01158125c-1.2056 0 -1.95909375 -1.30509375 -1.3563 -2.349175 0.6028 -1.044075 2.1098 -1.044075 2.7126 0 0.13745 0.23808125 0.20981875 0.50815 0.20981875 0.7830625 0 0.8649375 -0.701175 1.5661125 -1.56611875 1.5661125Zm5.638025 4.38513125c-1.2056 0 -1.9591 -1.3051 -1.3563 -2.349175 0.6028 -1.04408125 2.10979375 -1.04408125 2.71259375 0 0.13745625 0.23808125 0.20981875 0.50814375 0.20981875 0.78305625 0 0.86494375 -0.70116875 1.56611875 -1.5661125 1.56611875Z" stroke-width="0.0625"></path>
</svg>
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