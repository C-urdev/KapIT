'use client';

import React from 'react';
import MessagesInbox from '@sharedComponents/messages/MessagesInbox';

export default function CompanyMessagesPage({ user, onThreadVisibilityChange }) {
  const [initialContactId, setInitialContactId] = React.useState('');

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setInitialContactId(String(params.get('contact') || '').trim());
    } catch {
      setInitialContactId('');
    }
  }, []);

  return (
    <MessagesInbox
      user={user}
      initialContactId={initialContactId}
      onThreadVisibilityChange={onThreadVisibilityChange}
      variant="company"
    />
  );
}
