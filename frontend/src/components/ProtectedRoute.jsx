'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      // checa sew a rota exige um role específico
      if (role && user.role !== role) {
        router.push(user.role === 'professor' ? '/dashboard' : '/aluno/dashboard');
      }
    }
  }, [user, loading, role]);

  if (loading || !user) return null;
  if (role && user.role !== role) return null;

  return children;
}
