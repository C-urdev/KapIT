'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from '../../../../components/shared/Link';
import { usePathname, useRouter } from '@shared/hooks/useAppRouter';
import { Send, Volume2, VolumeX, Paperclip, Ellipsis, SquarePen, X } from 'lucide-react';
import ChatbotBrandMark from './ChatbotBrandMark';
import { useTheme } from '@sharedContext/ThemeContext';
import { CHATBOT_DEFAULT_SUGGESTIONS, CHATBOT_WELCOME_MESSAGE } from '@shared/data/chatbotFaq';
import { getChatbotErrorReply, requestChatbotMessage } from '@sharedServices/chatbotService';
import { playNotificationSound, safeGetStorage, safeSetStorage } from './chatbotSafety';

const STORAGE_KEY = 'kapit-chatbot-minimized';
const SOUND_STORAGE_KEY = 'kapit-chatbot-sound';
const CHAT_STATE_STORAGE_KEY = 'kapit-chatbot-state-v1';
const INITIAL_PROMPTS = CHATBOT_DEFAULT_SUGGESTIONS.map((item) => item.prompt);

const createBotMessage = (text, extras = {}) => ({ id: `${Date.now()}-${Math.random()}`, role: 'bot', text, ...extras });
const createUserMessage = (text) => ({ id: `${Date.now()}-${Math.random()}`, role: 'user', text });

const sanitizeChatActions = (actions) =>
  Array.isArray(actions)
    ? actions
        .map((action) => ({
          type: String(action?.type || '').trim().toLowerCase(),
          label: String(action?.label || '').trim(),
          href: String(action?.href || '').trim(),
        }))
        .filter((action) => action.type === 'navigate' && action.label && action.href.startsWith('/'))
    : [];

const sanitizeStoredMessages = (rawMessages) =>
  Array.isArray(rawMessages)
    ? rawMessages
        .map((message) => ({
          id: String(message?.id || `${Date.now()}-${Math.random()}`),
          role: message?.role === 'user' ? 'user' : 'bot',
          text: String(message?.text || '').trim(),
          intentId: String(message?.intentId || '').trim(),
          confidence: Number.isFinite(Number(message?.confidence)) ? Number(message.confidence) : 0,
          actions: sanitizeChatActions(message?.actions),
        }))
        .filter((message) => Boolean(message.text))
    : [];

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
  const router = useRouter();
  const isLandingPage = pathname === '/';
  const isUserDashboardPage = String(pathname || '').startsWith('/dashboard/');
  const isCompanyPage = String(pathname || '').startsWith('/company/');
  const useLandingPosition = isLandingPage || isCompanyPage;
  const isPricingPage = pathname === '/pricing' || pathname === '/for-employers/pricing';
  const anchorClassName = `chatbot-fab-anchor${useLandingPosition ? ' chatbot-fab-anchor--landing' : ''}${isLandingPage ? ' chatbot-fab-anchor--public-landing' : ''}${isUserDashboardPage ? ' chatbot-fab-anchor--dashboard' : ''}${isPricingPage ? ' chatbot-fab-anchor--pricing' : ''}`;
  const launcherButtonClass = isDark
    ? 'group relative z-10 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#202428]/92 text-[#e2e6e9] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#2a2f35] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_22px_42px_rgba(0,0,0,0.4)] active:scale-[0.98]'
    : 'group relative z-10 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#9ab896] bg-[#bcd3af]/96 text-[#2f4a36] shadow-[0_16px_34px_rgba(58,90,64,0.18),inset_0_1px_0_rgba(255,255,255,0.52)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#c8dcbf] hover:shadow-[0_20px_40px_rgba(58,90,64,0.24),inset_0_1px_0_rgba(255,255,255,0.58)] active:scale-[0.98]';
  const landingLauncherClass = isDark
    ? 'group relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#dcebd8] px-0 text-sm font-semibold leading-none text-[#102a1b] shadow-[0_18px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#e7f1e3] hover:shadow-[0_22px_52px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.52)] active:scale-[0.98] sm:w-auto sm:gap-3 sm:px-4 sm:pl-5'
    : 'group relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#2f4a36] px-0 text-sm font-semibold leading-none text-white shadow-[0_18px_40px_rgba(47,74,54,0.22)] transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#3a5a40] hover:shadow-[0_22px_48px_rgba(47,74,54,0.26)] active:scale-[0.98] sm:w-auto sm:gap-3 sm:px-4 sm:pl-5';
  const landingLauncherIconClass = isDark
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-[#2f4a36] text-[#f4faf1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
    : 'inline-flex h-8 w-8 items-center justify-center rounded-[0.75rem] bg-[#e5f0df] text-[#2f4a36] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showPolicyNotice, setShowPolicyNotice] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState(CHATBOT_DEFAULT_SUGGESTIONS.slice(0, 5));

  const scrollRef = useRef(null);
  const pendingReplyTimeoutRef = useRef(null);
  const lastKnownSessionUserRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = safeGetStorage(STORAGE_KEY, null);
    const soundPref = safeGetStorage(SOUND_STORAGE_KEY, null);
    const savedChatState = safeGetStorage(CHAT_STATE_STORAGE_KEY, null);
    setIsMinimized(saved === '1');
    setSoundEnabled(soundPref !== '0');
    if (savedChatState) {
      try {
        const parsed = JSON.parse(savedChatState);
        const restoredMessages = sanitizeStoredMessages(parsed?.messages);
        if (restoredMessages.length > 0) {
          setMessages(restoredMessages);
          setHasUserInteracted(true);
          setShowPolicyNotice(false);
          setSuggestedPrompts([]);
        }
      } catch {
        // ignore malformed saved chatbot state
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
      try {
        window.localStorage.removeItem(CHAT_STATE_STORAGE_KEY);
      } catch {
        // ignore storage clear failures
      }
      setMessages([]);
      setInputValue('');
      setIsTyping(false);
      setShowPolicyNotice(true);
      setHasUserInteracted(false);
      setIsOpen(false);
      setIsMinimized(false);
      setSuggestedPrompts(CHATBOT_DEFAULT_SUGGESTIONS.slice(0, 5));
    }

    lastKnownSessionUserRef.current = currentUser;
  }, [pathname]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(CHAT_STATE_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(
        CHAT_STATE_STORAGE_KEY,
        JSON.stringify({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            text: message.text,
            intentId: message.intentId || '',
            confidence: Number.isFinite(Number(message.confidence)) ? Number(message.confidence) : 0,
            actions: sanitizeChatActions(message.actions),
          })),
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [messages]);

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
      const lastActionableBotIntent =
        [...messages].reverse().find(
          (item) => item?.role === 'bot' && item?.intentId && Array.isArray(item?.actions) && item.actions.length > 0
        )?.intentId || '';

      setMessages((prev) => [...prev, createUserMessage(trimmed)]);
      setInputValue('');
      setIsTyping(true);
      setHasUserInteracted(true);
      setShowPolicyNotice(false);
      setSuggestedPrompts([]);

      if (pendingReplyTimeoutRef.current) {
        window.clearTimeout(pendingReplyTimeoutRef.current);
      }

      const startedAt = Date.now();
      const typingDelay = Math.min(1300, 420 + Math.round(trimmed.length * 10));

      (async () => {
        let replyPayload;
        try {
          replyPayload = await requestChatbotMessage(trimmed, { lastIntent: lastActionableBotIntent });
        } catch {
          replyPayload = {
            reply: getChatbotErrorReply(),
            intent: 'fallback',
            confidence: 0,
            actions: [],
          };
        }

        const elapsed = Date.now() - startedAt;
        const remainingDelay = Math.max(0, typingDelay - elapsed);
        pendingReplyTimeoutRef.current = window.setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            createBotMessage(replyPayload.reply, {
              intentId: replyPayload.intent,
              confidence: replyPayload.confidence,
              actions: Array.isArray(replyPayload.actions) ? replyPayload.actions : [],
            }),
          ]);
          setSuggestedPrompts([]);
          setIsTyping(false);
          playBotSound();
          pendingReplyTimeoutRef.current = null;
        }, remainingDelay);
      })();
    },
    [isTyping, messages, playBotSound]
  );

  const startNewChat = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAT_STATE_STORAGE_KEY);
    } catch {
      // ignore storage clear failures
    }
    setMessages([]);
    setInputValue('');
    setIsTyping(false);
    setShowPolicyNotice(true);
    setHasUserInteracted(false);
    setIsMenuOpen(false);
    setSuggestedPrompts(CHATBOT_DEFAULT_SUGGESTIONS.slice(0, 5));
  }, []);

  const toggleLauncher = () => {
    if (isMinimized) {
      setIsMinimized(false);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={anchorClassName}>
      {isOpen && !isMinimized ? (
        <div
          className={`mb-3 flex h-[min(88vh,820px)] max-h-[calc(100vh-36px)] w-[min(94vw,390px)] flex-col overflow-hidden rounded-3xl border shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${
            isDark ? 'border-[#3b434b] bg-[#1a1d20] text-white' : 'border-[#a3b18a] bg-[#f7f6f1] text-[#102a1b]'
          }`}
        >
          <div className={`relative shrink-0 px-4 py-4 ${isDark ? 'border-b border-[#3b434b] bg-[#121416]' : 'border-b border-[#c9d4ba] bg-white text-[#102a1b]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChatbotBrandMark size="md" isDark={isDark} />
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em]">KapIT Assistant</p>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-[#9fd3a6]' : 'text-[#588157]'}`}>Online now</p>
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
              </div>
            ) : null}
          </div>

          <div className={`flex min-h-0 flex-1 flex-col p-3 ${isDark ? 'bg-[#1a1d20] text-white' : 'bg-[#f7f6f1] text-[#102a1b]'}`}>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2 pb-1">
                <div className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm ${isDark ? 'bg-white/10' : 'bg-[#ebe6da] text-[#344e41]'}`}>
                  {CHATBOT_WELCOME_MESSAGE}
                </div>
                <div className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm ${isDark ? 'bg-white/10' : 'bg-[#ebe6da] text-[#344e41]'}`}>
                  Ask anything, even short or informal messages. I will guide you step by step.
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
                        {message.role === 'bot' && Array.isArray(message.actions) && message.actions.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions.map((action) => (
                              <button
                                key={`${message.id}-${action.href}-${action.label}`}
                                type="button"
                                onClick={() => {
                                  setShowPolicyNotice(false);
                                  setHasUserInteracted(true);
                                  router.push(action.href);
                                }}
                                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                  isDark
                                    ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                                    : 'border-[#bcc6b1] bg-white text-[#2f4739] hover:bg-[#f3f6ef]'
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
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
            {suggestedPrompts.length > 0 && !hasUserInteracted && messages.length === 0 ? (
              <div className="mb-3">
                <div className="flex flex-wrap items-center justify-center gap-2 px-1 py-1">
                  {(messages.length === 0 ? INITIAL_PROMPTS : suggestedPrompts.map((item) => item.prompt || item.label)).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-[#cfd5c8] bg-[#f8f7f5] px-3 py-1.5 text-xs text-[#1f2a1f] transition hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/15"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#8b8f8a]">
                  <ChatbotBrandMark size="xs" showStatus={false} isDark={isDark} />
                  <span>Powered by KapIT Assistant</span>
                </div>
              </div>
            ) : null}
            {showPolicyNotice && !hasUserInteracted && messages.length === 0 ? (
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
            {isTyping ? (
              <p className={`px-2 pt-2 text-[11px] ${isDark ? 'text-white/50' : 'text-[#102a1b]/55'}`}>KapIT Assistant is typing...</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {(!isOpen || isMinimized) ? (
        <div className="flex items-center justify-end">
          {isLandingPage ? (
            <button
              type="button"
              onClick={toggleLauncher}
              className={landingLauncherClass}
              aria-label={isOpen ? 'Toggle chatbot' : 'Open chatbot'}
            >
              <span className="hidden whitespace-nowrap sm:inline">Chat with us now!</span>
              <span className={landingLauncherIconClass} aria-hidden="true">
                <ChatbotBrandMark size="md" isDark={isDark} emphasis={isDark} showStatus={false} shell="none" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleLauncher}
              className={launcherButtonClass}
              aria-label={isOpen ? 'Toggle chatbot' : 'Open chatbot'}
            >
              <ChatbotBrandMark size="lg" isDark={isDark} showStatus={false} shell="none" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
