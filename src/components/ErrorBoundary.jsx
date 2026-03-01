import { Component } from 'react';

/**
 * Error boundary that catches:
 * - Lazy chunk loading failures (after deploys with new hashes)
 * - Any rendering errors in child components
 * Prevents white screen by showing a recovery UI.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    // Detect chunk loading errors (happens when deploy changes chunk hashes)
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.message?.includes('Importing a module script failed');

    return { hasError: true, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    // If it's a chunk error, auto-reload once to get the latest build
    if (this.state.isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        return;
      }
      // If already reloaded once, show fallback UI
      sessionStorage.removeItem('chunk_reload');
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('chunk_reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-yellow-600">refresh</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {this.state.isChunkError ? 'New Update Available' : 'Something went wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.isChunkError
                ? 'A new version of SomaSave has been deployed. Please reload to get the latest version.'
                : 'An unexpected error occurred. Please reload the page to try again.'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-full bg-primary text-gray-900 font-bold hover:opacity-90 transition-all shadow-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
