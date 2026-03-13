// MessagesPage 

import React, { useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { getMessages, sendMessage } from '../../services/messageService';

export default function MessagesPage({ user }) {
  const isNaitAccount = user?.email?.toLowerCase() === 'nait@gmail.com';
  const initialChats = isNaitAccount
    ? [{ id: 1, name: 'Brian Gomez', lastMessage: "Hey! How's your project going?", time: '10:30 AM', unread: 0, avatar: 'B' }]
    : [];
  const [chats, setChats] = useState(initialChats);
  const [selectedChat, setSelectedChat] = useState(initialChats[0] || null);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [messagesByChat, setMessagesByChat] = useState(
    isNaitAccount
      ? {
          1: [
            { id: '1-in', text: "Hey! How's your project going?", time: '10:30 AM', sender: 'them' },
            { id: '1-out', text: 'Going great! Just deployed the latest version.', time: '10:32 AM', sender: 'me' },
          ],
        }
      : {}
  );

  const formatTime = (value = new Date()) =>
    new Date(value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      if (!selectedChat) {
        return;
      }

      try {
        setLoadingMessages(true);
        setError('');
        const remoteMessages = await getMessages(selectedChat.name);
        if (cancelled) {
          return;
        }

        if (remoteMessages.length > 0) {
          const normalized = remoteMessages.map((message) => ({
            id: String(message.id),
            sender: message.sender,
            text: message.text,
            time: formatTime(message.createdAt),
          }));

          setMessagesByChat((prev) => ({
            ...prev,
            [selectedChat.id]: normalized,
          }));

          const latest = normalized[normalized.length - 1];
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === selectedChat.id
                ? { ...chat, lastMessage: latest.text, time: latest.time, unread: 0 }
                : chat
            )
          );
        }
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
  }, [selectedChat]);

  const handleSend = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !selectedChat) {
      return;
    }

    try {
      setError('');
      const savedMessage = await sendMessage(selectedChat.name, trimmed);
      const messageTime = formatTime(savedMessage.createdAt);
      const nextMessage = {
        id: String(savedMessage.id),
        text: savedMessage.text,
        time: messageTime,
        sender: savedMessage.sender,
      };

      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), nextMessage],
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? { ...chat, lastMessage: trimmed, time: messageTime, unread: 0 }
            : chat
        )
      );
      setSelectedChat((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: trimmed,
              time: messageTime,
              unread: 0,
            }
          : prev
      );
      setMessageInput('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto">
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl overflow-hidden min-h-[68vh]">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[68vh]">
          {/* Chat List */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#a3b18a] dark:border-[#2a4a6f] overflow-y-auto">
            <div className="p-4 border-b border-[#a3b18a] dark:border-[#2a4a6f]">
              <h2 className="text-xl font-bold text-[#3a5a40] dark:text-white">Messages</h2>
            </div>
            {chats.length > 0 ? (
              <div>
                {chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors border-b border-[#a3b18a] dark:border-[#2a4a6f] ${
                      selectedChat?.id === chat.id ? 'bg-[#f5f5f2] dark:bg-[#1e3a5f]' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">{chat.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-[#3a5a40] dark:text-white truncate">{chat.name}</h4>
                        <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-[#588157] dark:bg-[#3ba9d6] text-white text-xs font-semibold rounded-full">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-[#3a5a40] dark:text-[#7d9ab8]">
                No contacts yet.
              </div>
            )}
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-8 flex flex-col min-h-[50vh]">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#a3b18a] dark:border-[#2a4a6f] flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{selectedChat.avatar}</span>
                  </div>
                  <h3 className="font-semibold text-[#3a5a40] dark:text-white">{selectedChat.name}</h3>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-[#f5f5f2] dark:bg-[#0a1628] min-h-[35vh]">
                  {error && (
                    <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                  {loadingMessages && (
                    <p className="mb-3 text-sm text-[#3a5a40] dark:text-[#7d9ab8]">Loading messages...</p>
                  )}
                  <div className="space-y-4">
                    {(messagesByChat[selectedChat.id] || []).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`rounded-lg p-3 max-w-xs ${
                            message.sender === 'me'
                              ? 'bg-[#588157] dark:bg-[#3ba9d6]'
                              : 'bg-white dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f]'
                          }`}
                        >
                          <p className={`text-sm ${message.sender === 'me' ? 'text-white' : 'text-[#344e41] dark:text-white'}`}>
                            {message.text}
                          </p>
                          <span className={`text-xs mt-1 ${message.sender === 'me' ? 'text-white/80' : 'text-[#3a5a40] dark:text-[#7d9ab8]'}`}>
                            {message.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#a3b18a] dark:border-[#2a4a6f]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
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
                      onClick={handleSend}
                      className="px-4 py-2 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white rounded-lg transition-colors"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#3a5a40] dark:text-[#7d9ab8]">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#a3b18a] dark:text-[#2a4a6f]" />
                  <p className="dark:text-white">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
