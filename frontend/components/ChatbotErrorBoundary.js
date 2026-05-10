'use client';

import React, { Component } from 'react';

class ChatbotErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('FaqChatbot crashed:', error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default ChatbotErrorBoundary;
