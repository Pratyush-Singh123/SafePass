import { Component, ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import StatusPage from '@/pages/StatusPage';
import Admin from '@/pages/Admin';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SafePass caught runtime error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              🛡️
            </div>
            <h2 className="text-xl font-bold mb-2">SafePass System Restoring</h2>
            <p className="text-slate-400 text-xs mb-6">
              {this.state.error?.message || 'Recovering state...'}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md"
            >
              Reset Session & Relaunch SafePass
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
