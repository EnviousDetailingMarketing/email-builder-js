import React from 'react';

import { Alert, AlertTitle, Box, Button } from '@mui/material';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Error boundary around the editor/preview canvas (WS-01 item 19).
 *
 * A malformed or unknown block can throw while rendering. Without a boundary the
 * whole editor white-screens and the user loses access to the toolbar (and their
 * document). This isolates render failures to the canvas, keeps the surrounding
 * UI alive, and lets the user retry after editing the JSON.
 */
export default class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Canvas render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={this.handleReset}>
                Retry
              </Button>
            }
          >
            <AlertTitle>Something went wrong rendering this email</AlertTitle>
            {error.message || 'An unexpected error occurred while rendering the canvas.'}
            <Box component="p" sx={{ mt: 1, mb: 0, fontSize: 12, opacity: 0.8 }}>
              Try switching to the JSON tab to fix the offending block, then retry.
            </Box>
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
