import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error-boundary" role="alert">
          <h1>Terjadi kesalahan</h1>
          <p>Aplikasi mengalami gangguan. Coba muat ulang atau kembali ke beranda.</p>
          <p className="app-error-boundary-detail">{this.state.error.message}</p>
          <div className="app-error-boundary-actions">
            <button type="button" className="btn-primary" onClick={this.handleReload}>
              Muat ulang
            </button>
            <button type="button" className="auth-form-tab" onClick={this.handleRetry}>
              Coba lagi
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
