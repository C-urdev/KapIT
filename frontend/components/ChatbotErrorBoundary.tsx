import React from 'react';

type ChatbotErrorBoundaryState = {
  hasError: boolean;
};

export default class ChatbotErrorBoundary extends React.Component<React.PropsWithChildren, ChatbotErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error('FaqChatbot crashed:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
