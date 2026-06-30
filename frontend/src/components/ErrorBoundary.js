import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
          <h1 className="font-serif text-3xl text-khajur-primary">Something went wrong</h1>
          <p className="text-sm text-khajur-dark/50">Please refresh the page or contact support.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-khajur-gold text-khajur-primary px-8 py-3 text-xs font-bold uppercase tracking-widest"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

// App.js — wrap everything
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        ...
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
</ErrorBoundary>
