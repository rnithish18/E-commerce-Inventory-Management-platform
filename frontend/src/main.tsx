import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'

// Apply saved theme BEFORE React mounts to prevent flash
const savedTheme = (() => { try { return localStorage.getItem('shopnest_theme'); } catch { return null; } })();
// Default to dark; only switch to light if explicitly saved as 'light'
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else {
  document.documentElement.classList.add('dark');
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
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
