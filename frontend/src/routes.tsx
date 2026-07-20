import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { WorkflowsListPage } from '@/pages/workflows/WorkflowsListPage'
import { WorkflowEditorPage } from '@/pages/workflows/WorkflowEditorPage'
import { PublicFormPage } from '@/pages/PublicFormPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { WorkflowRunsPage } from '@/pages/WorkflowRunsPage'
import { StackPage } from '@/pages/StackPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/public/form/:id', element: <PublicFormPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/workflows', element: <WorkflowsListPage /> },
          { path: '/workflows/:id/edit', element: <WorkflowEditorPage /> },
          { path: '/documents', element: <DocumentsPage /> },
          { path: '/runs', element: <WorkflowRunsPage /> },
          { path: '/stack', element: <StackPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
