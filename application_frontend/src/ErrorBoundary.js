// src/ErrorBoundary.js

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Aggiorna lo stato per mostrare il fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puoi loggare l'errore in un servizio di reporting
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puoi rendere qualsiasi fallback UI
      return <h2>Something went wrong.</h2>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
