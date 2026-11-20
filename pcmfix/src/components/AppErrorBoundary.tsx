import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown application error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PCM Checklist crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', padding: '32px 20px', display: 'grid', placeItems: 'center', background: '#F5EFE6', color: '#23211E', fontFamily: 'system-ui, sans-serif' }}>
          <section style={{ width: '100%', maxWidth: 520, padding: 24, border: '1px solid #DFD5C5', borderRadius: 20, background: '#FAF6F0' }}>
            <h1 style={{ margin: '0 0 10px', fontSize: 22 }}>The checklist could not load</h1>
            <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>The page encountered an error. Reload the page; your saved checklist data in this browser is not intentionally cleared.</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 12, borderRadius: 10, background: '#EEE7DC', fontSize: 12 }}>{this.state.message}</pre>
            <button onClick={() => window.location.reload()} style={{ minHeight: 44, padding: '0 18px', border: 0, borderRadius: 10, background: '#556B4F', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Reload app</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
