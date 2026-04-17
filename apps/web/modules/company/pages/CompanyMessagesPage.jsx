import React from 'react';
import MessagesInbox from '@sharedComponents/messages/MessagesInbox';

export default function CompanyMessagesPage({ user, onThreadVisibilityChange }) {
  const initialContactId = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return String(params.get('contact') || '').trim();
    } catch {
      return '';
    }
  }, []);

  return <MessagesInbox user={user} initialContactId={initialContactId} onThreadVisibilityChange={onThreadVisibilityChange} />;
}
