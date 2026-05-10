'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Send, Volume2, VolumeX, Paperclip, Ellipsis, SquarePen, History, X } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { resolveChatbotReply } from '@shared/utils/chatbotMatcher';
import { playNotificationSound, safeGetStorage, safeSetStorage } from './chatbotSafety';

const STORAGE_KEY = 'kapit-chatbot-minimized';
const SOUND_STORAGE_KEY = 'kapit-chatbot-sound';
const RECENT_STORAGE_KEY = 'kapit-chatbot-recent';
const INITIAL_PROMPTS = [
  'How do I apply for a job?',
  'How do I create a new account?',
  'How do I reset a forgotten password?',
  'What can company or employer accounts do?',
  'How can I upload my resume?',
  'Where can I view plans and payment details?',
];

const createBotMessage = (text) => ({ id: `${Date.now()}-${Math.random()}`, role: 'bot', text });
const createUserMessage = (text) => ({ id: `${Date.now()}-${Math.random()}`, role: 'user', text });

const getStoredSessionUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function FaqChatbot() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showPolicyNotice, setShowPolicyNotice] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);

  const scrollRef = useRef(null);
  const pendingReplyTimeoutRef = useRef(null);
  const lastKnownSessionUserRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = safeGetStorage(STORAGE_KEY, null);
    const soundPref = safeGetStorage(SOUND_STORAGE_KEY, null);
    const savedRecent = safeGetStorage(RECENT_STORAGE_KEY, null);
    setIsMinimized(saved === '1');
    setSoundEnabled(soundPref !== '0');
    if (savedRecent) {
      try {
        const parsed = JSON.parse(savedRecent);
        if (Array.isArray(parsed)) setRecentChats(parsed);
      } catch {
        setRecentChats([]);
      }
    }
    lastKnownSessionUserRef.current = getStoredSessionUser();
  }, []);

  useEffect(() => {
    const currentUser = getStoredSessionUser();
    const hadUserBefore = Boolean(lastKnownSessionUserRef.current);
    const hasUserNow = Boolean(currentUser);

    if (hadUserBefore && !hasUserNow) {
      if (pendingReplyTimeoutRef.current) {
        window.clearTimeout(pendingReplyTimeoutRef.current);
        pendingReplyTimeoutRef.current = null;
      }
      setMessages([]);
      setInputValue('');
      setIsTyping(false);
      setShowPolicyNotice(true);
      setIsOpen(false);
      setIsMinimized(false);
    }

    lastKnownSessionUserRef.current = currentUser;
  }, [pathname]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (pendingReplyTimeoutRef.current) {
        window.clearTimeout(pendingReplyTimeoutRef.current);
      }
    };
  }, []);

  const playBotSound = useCallback(() => {
    playNotificationSound(soundEnabled);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      safeSetStorage(SOUND_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    (rawText) => {
      const trimmed = String(rawText || '').trim();
      if (!trimmed || isTyping) return;

      setMessages((prev) => [...prev, createUserMessage(trimmed)]);
      setInputValue('');
      setIsTyping(true);

      if (pendingReplyTimeoutRef.current) {
        window.clearTimeout(pendingReplyTimeoutRef.current);
      }

      const botReply = resolveChatbotReply(trimmed);
      pendingReplyTimeoutRef.current = window.setTimeout(() => {
        setMessages((prev) => [...prev, createBotMessage(botReply)]);
        setIsTyping(false);
        playBotSound();
        pendingReplyTimeoutRef.current = null;
      }, 650);
    },
    [isTyping, playBotSound]
  );

  const saveRecentChat = useCallback(() => {
    const summary = messages
      .slice(-6)
      .map((message) => `${message.role === 'user' ? 'You' : 'Bot'}: ${message.text}`)
      .join(' | ')
      .trim();
    if (!summary) return;

    const nextRecent = [{ id: `${Date.now()}`, summary }, ...recentChats].slice(0, 8);
    setRecentChats(nextRecent);
    safeSetStorage(RECENT_STORAGE_KEY, JSON.stringify(nextRecent));
  }, [messages, recentChats]);

  const startNewChat = useCallback(() => {
    saveRecentChat();
    setMessages([]);
    setInputValue('');
    setIsTyping(false);
    setShowPolicyNotice(true);
    setIsRecentOpen(false);
    setIsMenuOpen(false);
  }, [saveRecentChat]);

  return (
    <div className="fixed bottom-16 right-4 z-[70] sm:bottom-20 sm:right-5">
      {isOpen && !isMinimized ? (
        <div
          className={`mb-3 flex h-[min(88vh,820px)] max-h-[calc(100vh-36px)] w-[min(94vw,390px)] flex-col overflow-hidden rounded-3xl border shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${
            isDark ? 'border-[#3b434b] bg-[#1a1d20] text-white' : 'border-[#a3b18a] bg-[#f7f6f1] text-[#102a1b]'
          }`}
        >
          <div className={`relative shrink-0 px-4 py-4 ${isDark ? 'border-b border-[#3b434b] bg-[#121416]' : 'border-b border-[#c9d4ba] bg-white text-[#102a1b]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${isDark ? 'border-[#6f9b74] bg-[#2b3138]' : 'border-[#a3b18a] bg-[#f5f5f2]'}`}>
                  <Bot size={16} className={isDark ? 'text-[#9fd3a6]' : 'text-[#3a5a40]'} />
                </span>
                <div>
                  <p className="text-sm font-semibold">KapIT Support Agent</p>
                  <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-[#102a1b]/60'}`}>Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`rounded-md p-1.5 transition ${isDark ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-[#102a1b]/70 hover:bg-black/5 hover:text-[#102a1b]'}`}
                  aria-label={soundEnabled ? 'Mute chatbot sound' : 'Enable chatbot sound'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`rounded-md p-1.5 transition ${isDark ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-[#102a1b]/70 hover:bg-black/5 hover:text-[#102a1b]'}`}
                  aria-label="Open chatbot menu"
                >
                  <Ellipsis size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsRecentOpen(false);
                    setIsOpen(false);
                  }}
                  className={`rounded-md p-1.5 transition ${isDark ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-[#102a1b]/70 hover:bg-black/5 hover:text-[#102a1b]'}`}
                  aria-label="Close chatbot"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {isMenuOpen ? (
              <div
                className={`absolute right-4 top-14 z-20 w-56 overflow-hidden rounded-xl border shadow-xl ${
                  isDark ? 'border-white/15 bg-[#1f242a]' : 'border-[#c9d4ba] bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={startNewChat}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <SquarePen size={15} />
                  Start a new chat
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecentOpen((prev) => !prev)}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <History size={15} />
                  View recent chats
                </button>
                {isRecentOpen ? (
                  <div className={`max-h-40 overflow-y-auto border-t px-3 py-2 text-xs ${isDark ? 'border-white/10 text-white/80' : 'border-black/10 text-[#102a1b]/80'}`}>
                    {recentChats.length === 0 ? (
                      <p className="px-1 py-1">No recent chats yet.</p>
                    ) : (
                      recentChats.map((chat) => (
                        <p key={chat.id} className="line-clamp-2 px-1 py-1">
                          {chat.summary}
                        </p>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={`flex min-h-0 flex-1 flex-col p-3 ${isDark ? 'bg-[#1a1d20] text-white' : 'bg-[#f7f6f1] text-[#102a1b]'}`}>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2 pb-1">
                <div className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm ${isDark ? 'bg-white/10' : 'bg-[#ebe6da] text-[#344e41]'}`}>
                  Hey! Want to deploy a conversational AI agent?
                </div>
                <div className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm ${isDark ? 'bg-white/10' : 'bg-[#ebe6da] text-[#344e41]'}`}>
                  Let me help you figure out if KapIT is the right fit.
                </div>
              </div>

              {messages.length > 0 ? (
                <div className="mt-3 space-y-4 pb-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-[chatIn_220ms_ease-out]`}>
                      <div
                        className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-7 ${
                          message.role === 'user' ? 'bg-[#588157] text-white' : isDark ? 'bg-white/10 text-white/95' : 'bg-[#ebe6da] text-[#344e41]'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}

                  {isTyping ? (
                    <div className="flex justify-start animate-[chatIn_220ms_ease-out]">
                      <div className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 ${isDark ? 'border border-white/15 bg-white/10' : 'border border-black/10 bg-white/80'}`}>
                        <span className={`h-1.5 w-1.5 animate-[chatTyping_1s_ease-in-out_infinite] rounded-full ${isDark ? 'bg-white/80' : 'bg-[#102a1b]/75'}`} />
                        <span className={`h-1.5 w-1.5 animate-[chatTyping_1s_ease-in-out_120ms_infinite] rounded-full ${isDark ? 'bg-white/80' : 'bg-[#102a1b]/75'}`} />
                        <span className={`h-1.5 w-1.5 animate-[chatTyping_1s_ease-in-out_240ms_infinite] rounded-full ${isDark ? 'bg-white/80' : 'bg-[#102a1b]/75'}`} />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={`shrink-0 px-3 pb-3 pt-2 ${isDark ? 'bg-[#1a1d20]' : 'bg-[#f7f6f1]'}`}>
            {messages.length === 0 ? (
              <div className="mb-3">
                <div className="flex flex-wrap items-center justify-center gap-2 px-1">
                  {INITIAL_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-[#cfd5c8] bg-[#f8f7f5] px-4 py-2 text-xs text-[#1f2a1f] transition hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/15"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-[#8b8f8a]">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#9ca3af] text-[10px] font-semibold text-white">C</span>
                  <span>Powered by KapIT</span>
                </div>
              </div>
            ) : null}
            {showPolicyNotice ? (
              <>
                <div className={`mb-2 h-px ${isDark ? 'bg-white/10' : 'bg-[#c9d4ba]'}`} />
                <div className={`mb-2 flex items-center justify-between px-1 text-[11px] ${isDark ? 'text-white/55' : 'text-[#102a1b]/65'}`}>
                  <p>
                    By chatting, you agree to our{' '}
                    <Link href="/privacy-policy" className={`underline ${isDark ? 'text-white/80' : 'text-[#102a1b]'}`}>
                      privacy policy
                    </Link>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPolicyNotice(false)}
                    aria-label="Dismiss policy notice"
                    className={`rounded p-1 text-sm leading-none ${isDark ? 'text-white/70 hover:bg-white/10' : 'text-[#102a1b]/65 hover:bg-black/5'}`}
                  >
                    x
                  </button>
                </div>
              </>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(inputValue);
              }}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${isDark ? 'border border-white/15 bg-black/25' : 'border border-[#d6dbcf] bg-white'}`}
            >
              <button
                type="button"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${isDark ? 'text-white/80 hover:bg-white/10' : 'text-[#6b7280] hover:bg-black/5'}`}
                aria-label="Attach file"
              >
                <Paperclip size={15} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask support anything..."
                className={`h-9 flex-1 bg-transparent px-1 text-sm outline-none ${isDark ? 'text-white placeholder:text-white/45' : 'text-[#111827] placeholder:text-[#9ca3af]'}`}
              />
              <button
                type="submit"
                disabled={!String(inputValue || '').trim() || isTyping}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  isDark ? 'bg-white text-[#102a1b] hover:opacity-90' : 'bg-black text-white hover:opacity-90'
                }`}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {(!isOpen || isMinimized) ? (
        <button
          type="button"
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              return;
            }
            setIsOpen((prev) => !prev);
          }}
          className={`group inline-flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_14px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-transform duration-300 hover:scale-105 ${
            isDark
              ? 'border-[#6f9b74] bg-[#2b3138] text-[#9fd3a6]'
              : 'border-[#a3b18a] bg-[#3a5a40] text-white'
          }`}
          aria-label={isOpen ? 'Toggle chatbot' : 'Open chatbot'}
        >
          <Bot size={22} className="transition-transform duration-300 group-hover:rotate-6" />
        </button>
      ) : null}
    </div>
  );
}
