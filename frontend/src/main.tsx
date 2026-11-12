import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'

// Apply saved theme BEFORE React mounts — DEFAULT IS LIGHT
const savedTheme = (() => { try { return localStorage.getItem('shopnest_theme'); } catch { return null; } })();
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb', fontSize: '13px' },
            success: { iconTheme: { primary: '#ea580c', secondary: '#fff' } },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
