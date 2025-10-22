import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './providers/AuthProvider.tsx'
import { StorageProvider } from './providers/StorageProvider.tsx'
import { TaskProvider } from './providers/TaskProvider.tsx'
import { MasterDataProvider } from './providers/MasterDataProvider.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <StorageProvider>
        <TaskProvider>
          <MasterDataProvider>
            <App />
          </MasterDataProvider>
        </TaskProvider>
      </StorageProvider>
    </AuthProvider>
  </StrictMode>,
)
