import React from 'react';
import { MessageCircle, Search, Send } from 'lucide-react';
import { getPublicProfile } from '@sharedServices/authService';
import { getMessages, listConversations, sendMessage } from '@sharedServices/messageService';

const formatTime = (value) =>
  new Date(value || Date.now()).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

const formatDisplayName = (account) => account?.companyName || account?.username || account?.email || 'Account';

const normalizeConversation = (conversation) => ({
  id: conversation.id,
  username: conversation.username || '',
  email: conversation.email || '',
  type: conversation.type || '',
  companyName: conversation.companyName || '',
  profileImage: conversation.profileImage || '',
  displayName: formatDisplayName(conversation),
  lastMessage: conversation.lastMessage || '',
  lastMessageSender: conversation.lastMessageSender || 'them',
  time: formatTime(conversation.createdAt),
});

export default function MessagesInbox({ user, initialContactId = '' }) {
  const [conversations, setConversations] = React.useState([]);
  const [selectedConversation, setSelectedConversation] = React.useState(null);
  const [messageInput, setMessageInput] = React.useState('');
  const [messagesByConversation, setMessagesByConversation] = React.useState({});
  const [loadingConversations, setLoadingConversations] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [error, setError] = React.useState('');
  const [contactSearchQuery, setContactSearchQuery] = React.useState('');
  const [sendingMessage, setSendingMessage] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        setError('');
        const data = await listConversations();
        if (cancelled) {
          return;
        }

        const normalized = data.map(normalizeConversation);
        setConversations(normalized);

        if (initialContactId) {
          const matched = normalized.find((conversation) => conversation.id === initialContactId);
          if (matched) {
            setSelectedConversation(matched);
            return;
          }

          try {
            const profile = await getPublicProfile(initialContactId);
            if (cancelled || !profile?.id) {
              return;
            }

            const seededConversation = normalizeConversation({
              ...profile,
              id: profile.id,
              lastMessage: '',
              lastMessageSender: 'them',
              createdAt: new Date().toISOString(),
            });

            setConversations((prev) => {
              const exists = prev.some((conversation) => conversation.id === seededConversation.id);
              return exists ? prev : [seededConversation, ...prev];
            });
            setSelectedConversation(seededConversation);
            setMessagesByConversation((prev) => ({ ...prev, [profile.id]: [] }));
            return;
          } catch {
            // fall through to existing conversation selection
          }
        }

        setSelectedConversation((current) => {
          if (current) {
            const refreshed = normalized.find((conversation) => conversation.id === current.id);
            return refreshed || current;
          }
          return normalized[0] || null;
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load conversations');
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    };

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [initialContactId]);

  React.useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      if (!selectedConversation?.id) {
        return;
      }

      try {
        setLoadingMessages(true);
        setError('');
        const remoteMessages = await getMessages(selectedConversation.id);
        if (cancelled) {
          return;
        }

        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversation.id]: remoteMessages.map((message) => ({
            id: String(message.id),
            sender: message.sender,
            text: message.text,
            time: formatTime(message.createdAt),
          })),
        }));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load messages');
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation?.id]);

  const filteredConversations = React.useMemo(() => {
    const query = String(contactSearchQuery || '').trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.displayName,
        conversation.username,
        conversation.companyName,
        conversation.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [contactSearchQuery, conversations]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setContactSearchQuery('');
    setError('');
  };

  const handleSend = async () => {
    const trimmed = String(messageInput || '').trim();
    if (!trimmed || !selectedConversation?.id || sendingMessage) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticTime = formatTime(new Date().toISOString());
    const optimisticMessage = {
      id: tempId,
      sender: 'me',
      text: trimmed,
      time: optimisticTime,
    };

    setSendingMessage(true);
    setMessageInput('');
    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), optimisticMessage],
    }));

    const optimisticConversation = {
      ...selectedConversation,
      lastMessage: optimisticMessage.text,
      lastMessageSender: optimisticMessage.sender,
      time: optimisticMessage.time,
    };

    setSelectedConversation(optimisticConversation);
    setConversations((prev) => [optimisticConversation, ...prev.filter((conversation) => conversation.id !== optimisticConversation.id)]);

    try {
      setError('');
      const savedMessage = await sendMessage(selectedConversation.id, trimmed);
      const nextMessage = {
        id: String(savedMessage.id),
        sender: savedMessage.sender,
        text: savedMessage.text,
        time: formatTime(savedMessage.createdAt),
      };

      setMessagesByConversation((prev) => {
        const currentMessages = prev[selectedConversation.id] || [];
        const withoutOptimistic = currentMessages.filter((message) => message.id !== tempId);
        const alreadyExists = withoutOptimistic.some((message) => message.id === nextMessage.id);

        return {
          ...prev,
          [selectedConversation.id]: alreadyExists ? withoutOptimistic : [...withoutOptimistic, nextMessage],
        };
      });

      const updatedConversation = {
        ...selectedConversation,
        lastMessage: nextMessage.text,
        lastMessageSender: nextMessage.sender,
        time: nextMessage.time,
      };

      setSelectedConversation(updatedConversation);
      setConversations((prev) => [updatedConversation, ...prev.filter((conversation) => conversation.id !== updatedConversation.id)]);
    } catch (err) {
      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation.id]: (prev[selectedConversation.id] || []).filter((message) => message.id !== tempId),
      }));
      setMessageInput(trimmed);
      setError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto">
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl overflow-hidden min-h-[68vh]">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[68vh]">
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#a3b18a] dark:border-[#2a4a6f] overflow-y-auto">
            <div className="p-4 border-b border-[#a3b18a] dark:border-[#2a4a6f] space-y-3">
              <div>
                <h2 className="text-xl font-bold text-[#3a5a40] dark:text-white">Messages</h2>
                <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Search people or companies you already messaged.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4b5563] dark:text-[#7d9ab8]" />
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(event) => setContactSearchQuery(event.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] pl-10 pr-4 py-2.5 text-sm text-[#344e41] dark:text-white placeholder-[#4b5563] dark:placeholder-[#7d9ab8] focus:outline-none focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6]"
                />
              </div>
            </div>

            {loadingConversations ? (
              <div className="p-6 text-center text-sm text-[#3a5a40] dark:text-[#7d9ab8]">Loading conversations...</div>
            ) : filteredConversations.length > 0 ? (
              <div>
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors border-b border-[#a3b18a] dark:border-[#2a4a6f] ${
                      selectedConversation?.id === conversation.id ? 'bg-[#f5f5f2] dark:bg-[#1e3a5f]' : ''
                    }`}
                  >
                    <Avatar account={conversation} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1 gap-3">
                        <h4 className="font-semibold text-[#3a5a40] dark:text-white truncate">{conversation.displayName}</h4>
                        <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8] shrink-0">{conversation.time}</span>
                      </div>
                      <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] truncate">
                        {conversation.lastMessage
                          ? `${conversation.lastMessageSender === 'me' ? 'You: ' : ''}${conversation.lastMessage}`
                          : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              <div className="p-6 text-center text-sm text-[#3a5a40] dark:text-[#7d9ab8]">
                No conversation matches that search.
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-[#3a5a40] dark:text-[#7d9ab8]">
                No conversations yet.
              </div>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col min-h-[50vh]">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-[#a3b18a] dark:border-[#2a4a6f] flex items-center gap-3">
                  <Avatar account={selectedConversation} compact />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#3a5a40] dark:text-white truncate">{selectedConversation.displayName}</h3>
                    <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate">{selectedConversation.type === 'company' ? 'Company account' : 'User account'}</p>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-[#f5f5f2] dark:bg-[#0a1628] min-h-[35vh]">
                  {error ? <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                  {loadingMessages ? <p className="mb-3 text-sm text-[#3a5a40] dark:text-[#7d9ab8]">Loading messages...</p> : null}
                  <div className="space-y-4">
                    {(messagesByConversation[selectedConversation.id] || []).map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`rounded-lg p-3 max-w-xs ${
                            message.sender === 'me'
                              ? 'bg-[#588157] dark:bg-[#3ba9d6]'
                              : 'bg-white dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f]'
                          }`}
                        >
                          <p className={`text-sm ${message.sender === 'me' ? 'text-white' : 'text-[#344e41] dark:text-white'}`}>{message.text}</p>
                          <span className={`text-xs mt-1 ${message.sender === 'me' ? 'text-white/80' : 'text-[#3a5a40] dark:text-[#7d9ab8]'}`}>{message.time}</span>
                        </div>
                      </div>
                    ))}
                    {!loadingMessages && (messagesByConversation[selectedConversation.id] || []).length === 0 ? (
                      <div className="text-center text-sm text-[#3a5a40] dark:text-[#7d9ab8] py-10">No messages yet. Send the first one.</div>
                    ) : null}
                  </div>
                </div>

                <div className="p-4 border-t border-[#a3b18a] dark:border-[#2a4a6f]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Message ${selectedConversation.displayName}...`}
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#7d9ab8] focus:outline-none focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6]"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sendingMessage}
                      className="px-4 py-2 bg-[#3a5a40] hover:bg-[#344e41] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white rounded-lg transition-colors"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#3a5a40] dark:text-[#7d9ab8]">
                <div className="text-center px-6">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#a3b18a] dark:text-[#2a4a6f]" />
                  <p className="dark:text-white">Select a conversation to start messaging.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ account, compact = false }) {
  const displayName = formatDisplayName(account);
  const initial = displayName.charAt(0).toUpperCase();
  const sizeClass = compact ? 'w-10 h-10' : 'w-12 h-12';

  return (
    <div className={`${sizeClass} rounded-full bg-[#588157] dark:bg-[#3ba9d6] text-white flex items-center justify-center overflow-hidden shrink-0 font-semibold`}>
      {account?.profileImage ? (
        <img src={account.profileImage} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}
