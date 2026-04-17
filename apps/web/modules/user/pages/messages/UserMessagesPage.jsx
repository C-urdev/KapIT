import React from 'react';
import MessagesInbox from '@sharedComponents/messages/MessagesInbox';

export default function UserMessagesPage({ user, initialContactId = '', onThreadVisibilityChange }) {
  return <MessagesInbox user={user} initialContactId={initialContactId} onThreadVisibilityChange={onThreadVisibilityChange} />;
}



