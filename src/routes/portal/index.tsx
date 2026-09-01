import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../context/AuthContext';

export const Route = createFileRoute('/portal/')({
  component: PortalIndexPage,
});

function PortalIndexPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading) {
      if (role === 'admin') navigate({ to: '/portal/admin' });
      else if (role === 'teacher') navigate({ to: '/portal/teacher' });
      else if (role === 'parent') navigate({ to: '/portal/parent' });
      else navigate({ to: '/portal/login' });
    }
  }, [role, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
