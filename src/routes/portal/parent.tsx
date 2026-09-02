import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { StudentDashboardPage } from './student';

export const Route = createFileRoute('/portal/parent')({
  component: ParentRouteRedirect,
});

function ParentRouteRedirect() {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate({ to: '/portal/student', replace: true });
  }, [navigate]);

  return <StudentDashboardPage />;
}
