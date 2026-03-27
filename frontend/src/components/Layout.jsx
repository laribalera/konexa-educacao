'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const navProf = [
        { label: 'Turmas', path: '/dashboard', icon: <IconTurmas /> },
    ];

    const navAluno = [
        { label: 'Minhas turmas', path: '/aluno/dashboard', icon: <IconTurmas /> },
    ];

    const nav = user?.role === 'professor' ? navProf : navAluno;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* Sidebar */}
            <div style={{
                width: '220px',
                background: 'linear-gradient(135deg, #cf9d8b, #C2185B)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>
                {/* Logo */}
                <div style={{
                    padding: '20px 16px 16px',
                    borderBottom: '1px solid #d47197',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}>
                    <IconLogo />
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '16px',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #E8490F, #C2185B)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Konexa</div>
                        <div style={{ fontSize: '11px', color: '#eeecec' }}>Educação</div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {nav.map((item) => {
                        const active = pathname === item.path || pathname.startsWith(item.path + '/');
                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: active ? '#fff' : '#5e5958',
                                    background: active ? 'linear-gradient(135deg, #E8490F, #C2185B)' : 'transparent',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all .15s',
                                    boxShadow: active ? '0 4px 12px rgba(0,0,0,.1)' : 'none',
                                    hover: { background: active ? 'linear-gradient(135deg, #E8490F, #C2185B)' : '#00000010' },
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User */}
                <div style={{
                    padding: '12px',
                    borderTop: '1px solid #d47197',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <div style={{
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #E8490F, #C2185B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '700', color: '#fff',
                        flexShrink: 0,
                    }}>
                        {user?.nome?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#F8D5C2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.nome}
                        </div>
                        <div style={{ fontSize: '11px', color: '#eeecec' }}>{user?.role}</div>
                    </div>
                    <button
                        onClick={logout}
                        title="Sair"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#eeecec', padding: '4px' }}
                    >
                        <IconLogout />
                    </button>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {children}
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
  <path d="M13.6344625 10.5061375c-0.56689375 -0.00043125 -1.1117125 0.2197375 -1.5191375 0.61391875l-2.2144875 -1.72273125c0.18911875 -0.32985625 0.288475 -0.703525 0.2881625 -1.08375 -0.00003125 -0.1313 -0.011825 -0.2623375 -0.0352375 -0.39153125l1.52305 -0.505075c0.75871875 1.51241875 2.87015625 1.63634375 3.8005875 0.22306875 0.9304375 -1.413275 -0.0179625 -3.3038 -1.7071125 -3.4029375 -1.4211625 -0.0834125 -2.5455 1.185525 -2.2915875 2.5863125l-1.52461875 0.50741875c-0.37145625 -0.74084375 -1.1288875 -1.2089375 -1.95764375 -1.209825 -0.20126875 -0.00009375 -0.4015625 0.02784375 -0.595125 0.08300625l-0.74390625 -1.6734c1.42803125 -0.89973125 1.34655625 -3.00795625 -0.14665 -3.7948C5.01754375 -0.051025 3.23250625 1.07364375 3.2976875 2.76021875c0.04551875 1.1778875 1.0142 2.1089875 2.1929625 2.10789375 0.20126875 0.0001 0.4015625 -0.0278375 0.595125 -0.08300625l0.74390625 1.6734c-1.04166875 0.65330625 -1.3409 2.036275 -0.66246875 3.0617625L3.76791875 11.6501875c-1.28906875 -1.0895375 -3.27419375 -0.37504375 -3.57323125 1.28609375 -0.29903125 1.6611375 1.31230625 3.02305625 2.9004125 2.4514625 1.33468125 -0.4803875 1.8688125 -2.08253125 1.08940625 -3.267725l2.3961625 -2.12991875c0.85699375 0.725525 2.12424375 0.68389375 2.93176875 -0.0963125l2.21449375 1.722725c-0.83306875 1.467925 0.23533125 3.28719375 1.923125 3.27469375 1.6877875 -0.0125 2.729125 -1.84740625 1.8744 -3.30281875 -0.393625 -0.6702625 -1.1127 -1.08201875 -1.88999375 -1.08225Zm0 -5.638025c1.20559375 0 1.95909375 1.3051 1.35629375 2.349175 -0.60279375 1.04408125 -2.10979375 1.04408125 -2.71259375 0 -0.13745625 -0.238075 -0.20981875 -0.50814375 -0.20981875 -0.78305625 0 -0.86496875 0.70115 -1.56615625 1.56611875 -1.56611875ZM3.92453125 2.67555c0 -1.2056 1.3051 -1.9591 2.349175 -1.3563 1.04408125 0.6028 1.04408125 2.1098 0 2.71259375 -0.23805625 0.13744375 -0.50816875 0.2098125 -0.78305625 0.209825 -0.86496875 0.0000375 -1.56611875 -0.70115 -1.56611875 -1.56611875ZM2.3584125 14.89126875c-1.20559375 0 -1.95909375 -1.3051 -1.35629375 -2.34918125 0.60279375 -1.044075 2.10979375 -1.044075 2.71259375 0 0.13745625 0.23808125 0.20981875 0.50815 0.20981875 0.7830625 0 0.86494375 -0.701175 1.56611875 -1.56611875 1.56611875Zm5.638025 -5.01158125c-1.2056 0 -1.95909375 -1.30509375 -1.3563 -2.349175 0.6028 -1.044075 2.1098 -1.044075 2.7126 0 0.13745 0.23808125 0.20981875 0.50815 0.20981875 0.7830625 0 0.8649375 -0.701175 1.5661125 -1.56611875 1.5661125Zm5.638025 4.38513125c-1.2056 0 -1.9591 -1.3051 -1.3563 -2.349175 0.6028 -1.04408125 2.10979375 -1.04408125 2.71259375 0 0.13745625 0.23808125 0.20981875 0.50814375 0.20981875 0.78305625 0 0.86494375 -0.70116875 1.56611875 -1.5661125 1.56611875Z" strokeWidth="0.0625"></path>
</svg>
  );
}

function IconTurmas() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Presentation-Audience--Streamline-Ultimate" height="22" width="22">
            <desc>
                Presentation Audience Streamline Icon: https://streamlinehq.com
            </desc>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M11.504 6c1.5188 0 2.75 -1.23122 2.75 -2.75S13.0228 0.5 11.504 0.5c-1.51879 0 -2.75 1.23122 -2.75 2.75S9.98521 6 11.504 6" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M14.87 9.53701c-0.2071 -0.7294 -0.6456 -1.37181 -1.2493 -1.83057s-1.3401 -0.70905 -2.0983 -0.71322c-0.7582 -0.00418 -1.4973 0.238 -2.10605 0.69008 -0.60873 0.45209 -1.05419 1.08963 -1.26935 1.81671" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M7.004 11.5h9" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M8.213 14.451 8.004 11.5h7l-0.211 2.981" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M12.09 20.7c1.2979 0 2.35 -1.0521 2.35 -2.35S13.3879 16 12.09 16s-2.35 1.0521 -2.35 2.35 1.0521 2.35 2.35 2.35" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M4.698 20.7c1.29787 0 2.35 -1.0521 2.35 -2.35S5.99587 16 4.698 16s-2.35 1.0521 -2.35 2.35 1.05213 2.35 2.35 2.35" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M19.318 20.7c1.2979 0 2.35 -1.0521 2.35 -2.35S20.6159 16 19.318 16s-2.35 1.0521 -2.35 2.35 1.0521 2.35 2.35 2.35" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M23 23.5c-0.4389 -0.5446 -0.9942 -0.9839 -1.6252 -1.2857 -0.6309 -0.3018 -1.3214 -0.4584 -2.0208 -0.4584s-1.3899 0.1566 -2.0208 0.4584c-0.631 0.3018 -1.1863 0.7411 -1.6252 1.2857 -0.4542 -0.5424 -1.0213 -0.9791 -1.6618 -1.2797 -0.6404 -0.3005 -1.3388 -0.4576 -2.0462 -0.4603" strokeWidth="1"></path>
            <path stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" d="M1 23.5c0.43892 -0.5446 0.99423 -0.9839 1.62516 -1.2857s1.32144 -0.4584 2.02084 -0.4584 1.38991 0.1566 2.02084 0.4584S7.85308 22.9554 8.292 23.5c0.45421 -0.5424 1.02134 -0.9791 1.66178 -1.2797 0.64042 -0.3005 1.33882 -0.4576 2.04622 -0.4603" strokeWidth="1"></path>
            <path stroke="#eeecec" d="M11.5 14.272c-0.1381 0 -0.25 -0.112 -0.25 -0.25 0 -0.1381 0.1119 -0.25 0.25 -0.25" strokeWidth="1"></path>
            <path stroke="#eeecec" d="M11.5 14.272c0.1381 0 0.25 -0.112 0.25 -0.25 0 -0.1381 -0.1119 -0.25 -0.25 -0.25" strokeWidth="1"></path>
        </svg>
    );
}

function IconAnotacoes() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Content-Paper-Edit--Streamline-Ultimate" height="22" width="22">
            <desc>
                Content Paper Edit Streamline Icon: https://streamlinehq.com
            </desc>
            <path d="M11 18.5H1.5a1 1 0 0 1 -1 -1v-16a1 1 0 0 1 1 -1h15a1 1 0 0 1 1 1v10m-1.8 10.8 -4.2 1.2 1.2 -4.2 7.179 -7.179a2.121 2.121 0 0 1 3 3zm3.279 -9.279 3 3M12.7 19.3l3 3M6 4.5h7m-9 3h9m-9 3h9m-9 3h6.5" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
        </svg>
    );
}

function IconLogout() {
    return (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 22 22">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );
}

function IconDiario() {
    return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="Archive-Books--Streamline-Ultimate" height="24" width="24">
            <desc>
                Archive Books Streamline Icon: https://streamlinehq.com
            </desc>
            <path d="M8 22.5a1 1 0 0 1 -1 1H1.5a1 1 0 0 1 -1 -1v-21a1 1 0 0 1 1 -1H7a1 1 0 0 1 1 1Z" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M5.5 14a0.5 0.5 0 0 1 -0.5 0.5H3a0.5 0.5 0 0 1 -0.5 -0.5V3a0.5 0.5 0 0 1 0.5 -0.5h2a0.5 0.5 0 0 1 0.5 0.5Z" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="m2.5 5.5 3 0" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M16 22.5a1 1 0 0 1 -1 1H9a1 1 0 0 1 -1 -1v-21a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1Z" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M13.5 14a0.5 0.5 0 0 1 -0.5 0.5h-2a0.5 0.5 0 0 1 -0.5 -0.5V3a0.5 0.5 0 0 1 0.5 -0.5h2a0.5 0.5 0 0 1 0.5 0.5Z" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="m10.5 5.5 3 0" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M23.5 22.5a1 1 0 0 1 -1 1H17a1 1 0 0 1 -1 -1v-21a1 1 0 0 1 1 -1h5.5a1 1 0 0 1 1 1Z" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M21.5 14a0.5 0.5 0 0 1 -0.5 0.5h-2a0.5 0.5 0 0 1 -0.5 -0.5V3a0.5 0.5 0 0 1 0.5 -0.5h2a0.5 0.5 0 0 1 0.5 0.5Z" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="m18.5 5.5 3 0" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M2.5 19a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M10.5 19a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
            <path d="M18.5 19a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0" fill="none" stroke="#eeecec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></path>
        </svg>
    );
}