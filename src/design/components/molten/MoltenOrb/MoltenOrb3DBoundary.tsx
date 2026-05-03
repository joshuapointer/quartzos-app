import React from 'react';

/**
 * H2: Class-based error boundary that catches GL/R3F init failures from
 * MoltenOrb3D and renders nothing on error. The SVG halo + sparks layers in
 * MoltenOrb/index.tsx continue to render, so the orb stays phase-aware and
 * visually coherent without the 3D mesh.
 *
 * A single console.warn is emitted so engineers see the failure in logs
 * without surfacing anything to the user.
 */
interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class MoltenOrb3DBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.warn('[MoltenOrb3D] GL init failed — falling back to SVG-only orb.', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
