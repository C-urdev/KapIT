import React from 'react';
import {
  Building2,
  ChevronLeft,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Search,
  Send,
  Smile,
  Video,
} from 'lucide-react';
import { getPublicProfile } from '@sharedServices/authService';
import { getMessages, listConversations, sendMessage } from '@sharedServices/messageService';
import MessagesSkeleton from '../../../../components/shared/skeletons/MessagesSkeleton';

const QUICK_EMOJIS = ['😀', '😂', '😊', '😍', '👍', '👌', '👏', '🙏', '🔥', '🎉', '💯', '❤️', '😢', '😭', '💀', '🕵️'];
const MAX_IMAGE_BYTES = 100 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MESSAGE_PAGE_SIZE = 40;

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

export default function MessagesInbox({ user, initialContactId = '', onThreadVisibilityChange, variant = 'user' }) {
  const isCompanyVariant = variant === 'company';
  const [introReady, setIntroReady] = React.useState(false);
  const [conversations, setConversations] = React.useState([]);
  const [selectedConversation, setSelectedConversation] = React.useState(null);
  const [messageInput, setMessageInput] = React.useState('');
  const [messagesByConversation, setMessagesByConversation] = React.useState({});
  const [threadPagingByConversation, setThreadPagingByConversation] = React.useState({});
  const [loadingConversations, setLoadingConversations] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [error, setError] = React.useState('');
  const [contactSearchQuery, setContactSearchQuery] = React.useState('');
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = React.useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = React.useState(false);
  const composerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const threadScrollRef = React.useRef(null);
  const imageInputRef = React.useRef(null);
  const videoInputRef = React.useRef(null);
  const isPrependingMessagesRef = React.useRef(false);
  const messagesByConversationRef = React.useRef({});
  const threadPagingByConversationRef = React.useRef({});

  React.useEffect(() => {
    messagesByConversationRef.current = messagesByConversation;
  }, [messagesByConversation]);

  React.useEffect(() => {
    threadPagingByConversationRef.current = threadPagingByConversation;
  }, [threadPagingByConversation]);

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
            return refreshed || null;
          }
          // Do not auto-select the first conversation, show the chat list.
          return null;
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

  const loadMessages = React.useCallback(
    async (conversationId, { loadOlder = false } = {}) => {
      if (!conversationId) {
        return;
      }

      if (loadOlder) {
        const pagingState = threadPagingByConversationRef.current[conversationId];
        if (pagingState && (!pagingState.hasMore || pagingState.loadingOlder)) {
          return;
        }
      }

      const currentMessages = messagesByConversationRef.current[conversationId] || [];
      const oldestMessage = currentMessages[0];
      const previousScrollHeight = threadScrollRef.current?.scrollHeight || 0;

      try {
        if (loadOlder) {
          setThreadPagingByConversation((prev) => ({
            ...prev,
            [conversationId]: { ...(prev[conversationId] || {}), loadingOlder: true },
          }));
        } else {
          setLoadingMessages(true);
        }

        setError('');
        const response = await getMessages(conversationId, {
          limit: MESSAGE_PAGE_SIZE,
          recentHours: undefined,
          beforeCreatedAt: loadOlder ? oldestMessage?.createdAt : undefined,
        });

        const mappedMessages = (response.messages || []).map((message) => ({
          id: String(message.id),
          sender: message.sender,
          text: message.text,
          time: formatTime(message.createdAt),
          createdAt: message.createdAt,
        }));

        setMessagesByConversation((prev) => {
          if (!loadOlder) {
            return { ...prev, [conversationId]: mappedMessages };
          }

          isPrependingMessagesRef.current = true;
          const existing = prev[conversationId] || [];
          const existingIds = new Set(existing.map((message) => message.id));
          const dedupedOlder = mappedMessages.filter((message) => !existingIds.has(message.id));
          return { ...prev, [conversationId]: [...dedupedOlder, ...existing] };
        });

        setThreadPagingByConversation((prev) => ({
          ...prev,
          [conversationId]: {
            hasMore: Boolean(response.hasMore),
            loadingOlder: false,
          },
        }));

        if (loadOlder) {
          requestAnimationFrame(() => {
            if (!threadScrollRef.current) {
              isPrependingMessagesRef.current = false;
              return;
            }
            const nextScrollHeight = threadScrollRef.current.scrollHeight;
            threadScrollRef.current.scrollTop += nextScrollHeight - previousScrollHeight;
            isPrependingMessagesRef.current = false;
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load messages');
        if (loadOlder) {
          setThreadPagingByConversation((prev) => ({
            ...prev,
            [conversationId]: { ...(prev[conversationId] || {}), loadingOlder: false },
          }));
        }
      } finally {
        if (!loadOlder) {
          setLoadingMessages(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    if (!selectedConversation?.id) {
      return;
    }

    loadMessages(selectedConversation.id, { loadOlder: false });
  }, [selectedConversation?.id, loadMessages]);

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (!composerRef.current?.contains(event.target)) {
        setEmojiPickerOpen(false);
        setAttachMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  React.useEffect(() => {
    if (isPrependingMessagesRef.current) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.id, messagesByConversation, loadingMessages]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIntroReady(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => setIntroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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

  const handleBackToList = () => {
    setSelectedConversation(null);
    setError('');
  };

  const handleSend = async () => {
    const trimmed = String(messageInput || '').trim();
    if (!trimmed || !selectedConversation?.id || sendingMessage) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticCreatedAt = new Date().toISOString();
    const optimisticTime = formatTime(optimisticCreatedAt);
    const optimisticMessage = {
      id: tempId,
      sender: 'me',
      text: trimmed,
      time: optimisticTime,
      createdAt: optimisticCreatedAt,
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
        createdAt: savedMessage.createdAt,
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

  const appendEmoji = (emoji) => {
    setMessageInput((current) => `${current || ''}${emoji}`);
    setEmojiPickerOpen(false);
  };

  const handleAttachImage = () => {
    imageInputRef.current?.click();
    setAttachMenuOpen(false);
  };

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large. Please upload an image up to 100MB.');
      event.target.value = '';
      return;
    }

    event.target.value = '';
    setError('Image uploads are temporarily unavailable. Please try again after upload support is enabled.');
  };

  const handleAttachVideo = () => {
    videoInputRef.current?.click();
    setAttachMenuOpen(false);
  };

  const handleVideoSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError('Video is too large. Please upload a video up to 100MB.');
      event.target.value = '';
      return;
    }

    event.target.value = '';
    setError('Video uploads are temporarily unavailable. Please try again after upload support is enabled.');
  };

  const threadMessages = selectedConversation ? messagesByConversation[selectedConversation.id] || [] : [];
  const threadPaging = selectedConversation ? threadPagingByConversation[selectedConversation.id] || {} : {};
  const listHiddenOnMobile = Boolean(selectedConversation);
  const threadHiddenOnMobile = !selectedConversation;

  React.useEffect(() => {
    onThreadVisibilityChange?.(Boolean(selectedConversation));
  }, [onThreadVisibilityChange, selectedConversation]);

  const handleThreadScroll = React.useCallback(
    (event) => {
      if (!selectedConversation?.id) {
        return;
      }

      const target = event.currentTarget;
      if (target.scrollTop > 40) {
        return;
      }

      loadMessages(selectedConversation.id, { loadOlder: true });
    },
    [loadMessages, selectedConversation?.id]
  );

  if (loadingConversations && !conversations.length) {
    return <MessagesSkeleton />;
  }

  return (
    <div className={`mx-auto flex h-full min-h-0 w-full ${isCompanyVariant ? 'max-w-[min(100%,1560px)] px-0 xl:px-4' : 'max-w-[min(100%,1420px)] px-0'} justify-center xl:transition-all xl:duration-300 xl:ease-out ${introReady ? 'xl:translate-y-0 xl:opacity-100' : 'xl:translate-y-1 xl:opacity-0'}`}>
      <div className={`flex h-full min-h-0 w-full overflow-hidden rounded-none border-0 border-[#d9e0d2] ${isCompanyVariant ? 'bg-[#f0f4eb]' : 'bg-[#f5f7f2]'} shadow-none dark:border-[#3d454e] dark:bg-[#202428] xl:rounded-3xl xl:border`}>
        {/* Narrow icon rail — layout only; KapIT palette */}
        <aside className="hidden w-[52px] shrink-0 flex-col items-center border-r border-[#d9e0d2] bg-[#f8faf6] py-3 dark:border-[#3d454e] dark:bg-[#2f343b] md:flex md:w-14">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#353c44] dark:text-[#e2b94d]"
            aria-current="page"
            title="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <div className="mt-auto flex flex-col items-center gap-2 pb-1">
            <MiniUserAvatar user={user} />
          </div>
        </aside>

        {/* Conversation list */}
        <div
          className={`flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-[#d9e0d2] ${isCompanyVariant ? 'bg-[#f6faf3] sm:max-w-[min(100%,340px)] md:w-[320px]' : 'bg-[#f8fbf6] sm:max-w-[min(100%,320px)] md:w-[300px]'} dark:border-[#3d454e] dark:bg-[#22272b] md:border-r ${
            listHiddenOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {isCompanyVariant ? (
            <div className="border-b border-[#e4e7de] bg-[linear-gradient(180deg,#f8fbf6,#eef5ea)] px-3 py-2.5 dark:border-[#3d454e] dark:bg-[#22272b] lg:hidden">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f0e4] text-[#3a5a40] dark:bg-[#353c44] dark:text-[#e2b94d]">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#588157] dark:text-[#e2b94d]">Company Inbox</p>
                  <p className="text-sm font-semibold text-[#2f4e35] dark:text-white">Candidate Conversations</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="border-b border-[#e4e7de] px-3 py-2.5 dark:border-[#3d454e] sm:px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7c6a] dark:text-[#adb5be]" />
              <input
                ref={searchInputRef}
                type="text"
                value={contactSearchQuery}
                onChange={(event) => setContactSearchQuery(event.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-full border border-[#cfd9c4] bg-[#f5f7f2] py-2.5 pl-10 pr-4 text-sm text-[#344e41] outline-none transition-shadow placeholder:text-[#6b7c6a] focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#444d57] dark:bg-[#1a1d20] dark:text-white dark:placeholder:text-[#adb5be] dark:focus:border-[#6f9b74] dark:focus:ring-[#6f9b74]/25"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-6 text-center text-sm text-[#5c6d58] dark:text-[#adb5be]">Loading conversations…</div>
            ) : filteredConversations.length > 0 ? (
              <ul className={`${isCompanyVariant ? 'space-y-0 p-0' : 'space-y-0.5 p-2'}`}>
                {filteredConversations.map((conversation) => {
                  const active = selectedConversation?.id === conversation.id;
                  return (
                    <li key={conversation.id} className="border-b border-[#e4e7de] dark:border-[#3d454e]">
                      <button
                        type="button"
                        onClick={() => handleSelectConversation(conversation)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                          active
                            ? 'bg-[#eef6ee] dark:bg-[#353c44]'
                            : isCompanyVariant
                              ? 'bg-transparent hover:bg-[#f5f9f2] dark:hover:bg-[#31363d]'
                              : 'hover:bg-[#f5f7f2] dark:hover:bg-[#2f343b]'
                        }`}
                      >
                        <Avatar account={conversation} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-semibold text-[#2f4e35] dark:text-white">{conversation.displayName}</span>
                            <span className="shrink-0 text-[11px] font-medium text-[#6b7c6a] dark:text-[#b3bcc5]">{conversation.time}</span>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-[#556b58] dark:text-[#d0d7dd]">
                            {conversation.lastMessage
                              ? `${conversation.lastMessageSender === 'me' ? 'You: ' : ''}${conversation.lastMessage}`
                              : 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : conversations.length > 0 ? (
              <div className="p-6 text-center text-sm text-[#5c6d58] dark:text-[#adb5be]">No matches for that search.</div>
            ) : (
              <div className="p-6 text-center text-sm text-[#5c6d58] dark:text-[#adb5be]">No conversations yet.</div>
            )}
          </div>
        </div>

        {/* Thread */}
        <div
          className={`min-h-0 min-w-0 flex-1 flex-col ${isCompanyVariant ? 'bg-[#edf3e5]' : 'bg-[#eef3e8]'} dark:bg-[#121416] ${
            threadHiddenOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              <header
                className="flex shrink-0 items-center gap-2 border-b border-[#e0e6da] bg-[#f8fbf6] px-2 pb-2.5 pt-2.5 dark:border-[#3d454e] dark:bg-[#22272b] sm:gap-3 sm:px-4"
                style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
              >
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="inline-flex h-9 min-[420px]:h-10 items-center justify-center gap-1 rounded-full pl-1.5 pr-3 text-[#3a5a40] transition-colors hover:bg-[#eef6ee] lg:hidden dark:text-white dark:hover:bg-[#353c44]"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <Avatar account={selectedConversation} compact />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-[#2f4e35] dark:text-white">{selectedConversation.displayName}</h3>
                  <p className="truncate text-xs text-[#6b7c6a] dark:text-[#b3bcc5]">
                    {selectedConversation.type === 'company' ? 'Company on KapIT' : 'Member on KapIT'}
                  </p>
                </div>
              </header>

              <div
                ref={threadScrollRef}
                onScroll={handleThreadScroll}
                className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
              >
                {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
                {loadingMessages ? (
                  <p className="mb-3 text-center text-sm text-[#6b7c6a] dark:text-[#adb5be]">Loading messages…</p>
                ) : null}
                <div className="mx-auto flex max-w-3xl flex-col gap-2">
                  {threadPaging.loadingOlder ? (
                    <p className="py-1 text-center text-xs text-[#6b7c6a] dark:text-[#adb5be]">Loading older messages…</p>
                  ) : null}
                  {threadMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[min(100%,420px)] px-3.5 py-2 shadow-sm ${
                          message.sender === 'me'
                            ? 'rounded-[20px] rounded-br-md bg-[#588157] text-white dark:bg-[#82ad86]'
                            : 'rounded-[20px] rounded-bl-md border border-[#d5dccf] bg-white text-[#344e41] dark:border-[#444d57] dark:bg-[#353c44] dark:text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{message.text}</p>
                        <p
                          className={`mt-1 text-[11px] font-medium ${
                            message.sender === 'me' ? 'text-white/75' : 'text-[#6b7c6a] dark:text-[#b3bcc5]'
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!loadingMessages && threadMessages.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#6b7c6a] dark:text-[#adb5be]">No messages yet. Say hello below.</p>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <footer className="shrink-0 border-t border-[#e0e6da] bg-[#f8fbf6] px-2 py-2.5 dark:border-[#3d454e] dark:bg-[#22272b] sm:px-4" ref={composerRef}>
                <div className="mx-auto flex max-w-3xl items-end gap-1.5 sm:gap-2">
                  <div className="relative shrink-0">
                    <ComposerIconButton label="Attach image or link" onClick={() => setAttachMenuOpen((current) => !current)}>
                      <Plus className="h-5 w-5" />
                    </ComposerIconButton>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelected}
                      className="hidden"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelected}
                      className="hidden"
                    />
                    {attachMenuOpen ? (
                      <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 min-w-[170px] rounded-xl border border-[#cfd9c4] bg-white p-1.5 shadow-xl dark:border-[#444d57] dark:bg-[#22272b]">
                        <button
                          type="button"
                          onClick={handleAttachImage}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#344e41] hover:bg-[#f5f7f2] dark:text-white dark:hover:bg-[#353c44]"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Add image
                        </button>
                        <button
                          type="button"
                          onClick={handleAttachVideo}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#344e41] hover:bg-[#f5f7f2] dark:text-white dark:hover:bg-[#353c44]"
                        >
                          <Video className="h-4 w-4" />
                          Add video
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <input
                      type="text"
                      placeholder={`Message ${selectedConversation.displayName}…`}
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      onFocus={() => setEmojiPickerOpen(false)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      className="w-full rounded-full border border-[#cfd9c4] bg-[#f5f7f2] py-2.5 pl-4 pr-12 text-[0.9375rem] text-[#344e41] outline-none transition-shadow placeholder:text-[#6b7c6a] focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/20 dark:border-[#444d57] dark:bg-[#1a1d20] dark:text-white dark:placeholder:text-[#adb5be] dark:focus:border-[#6f9b74] dark:focus:ring-[#6f9b74]/20"
                    />
                  </div>

                  <div className="relative flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEmojiPickerOpen((current) => !current)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[#5c6d58] transition-colors hover:bg-[#eef6ee] dark:text-[#d0d7dd] dark:hover:bg-[#353c44]"
                      aria-label="Emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {emojiPickerOpen ? (
                      <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-56 rounded-2xl border border-[#cfd9c4] bg-white p-3 shadow-xl dark:border-[#444d57] dark:bg-[#22272b]">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#588157] dark:text-[#f0c766]">Emojis</div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => appendEmoji(emoji)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-[#f5f7f2] dark:hover:bg-[#353c44]"
                              aria-label={`Insert ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sendingMessage}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a5a40] text-white shadow-md transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center lg:px-10">
              <div className={`${isCompanyVariant ? 'w-full max-w-[440px] rounded-3xl border border-[#d5e0cc] bg-[#eef5ea] p-7 shadow-[0_16px_40px_rgba(58,90,64,0.08)] dark:border-[#3d454e] dark:bg-[#2a2f35]' : ''}`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <p className="mt-4 max-w-sm text-sm font-medium text-[#3a5a40] dark:text-[#e2e6e9]">
                  {isCompanyVariant ? 'Select a candidate conversation to view messages and continue hiring updates.' : 'Select a chat from the list to open the conversation.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RailIconButton({ children, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5c6d58] transition-colors dark:text-[#b3bcc5] ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:bg-[#eef6ee] dark:hover:bg-[#353c44]'
      }`}
    >
      {children}
    </button>
  );
}

function ComposerIconButton({ children, label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5c6d58] dark:text-[#b3bcc5] ${
        disabled ? 'cursor-not-allowed opacity-35' : 'hover:bg-[#eef6ee] dark:hover:bg-[#353c44]'
      }`}
    >
      {children}
    </button>
  );
}

function Avatar({ account, compact = false }) {
  const displayName = formatDisplayName(account);
  const initial = displayName.charAt(0).toUpperCase();
  const sizeClass = compact ? 'h-10 w-10' : 'h-12 w-12';

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] text-sm font-semibold text-white dark:bg-[#6f9b74]`}
    >
      {account?.profileImage ? (
        <img src={account.profileImage} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

function MiniUserAvatar({ user }) {
  const displayName = user?.username || user?.name || user?.email || 'You';
  const initial = String(displayName).charAt(0).toUpperCase();
  const src = user?.profileImage || '';

  return (
    <div
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#d5dccf] bg-[#588157] text-xs font-bold text-white dark:border-[#444d57] dark:bg-[#6f9b74]"
      title="You"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initial}
    </div>
  );
}


