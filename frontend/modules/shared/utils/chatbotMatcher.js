import {
  CHATBOT_DEFAULT_SUGGESTIONS,
  CHATBOT_ERROR_RESPONSES,
  CHATBOT_FALLBACK_RESPONSES,
  CHATBOT_INTENTS,
  CHATBOT_NONSENSE_RESPONSES,
} from '../data/chatbotFaq.js';

const LETTER_REPEAT_PATTERN = /([a-z])\1{2,}/g;
const REPEATED_PUNCTUATION_PATTERN = /([!?.,])\1+/g;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9\s']/g;

const CASUAL_WORD_MAP = {
  ehy: 'hey',
  helo: 'hello',
  hloo: 'hello',
  hiii: 'hi',
  hii: 'hi',
  heyy: 'hey',
  gud: 'good',
  suport: 'support',
  suppot: 'support',
  hlp: 'help',
  pls: 'please',
  plshelp: 'please help',
  whatsup: 'whats up',
  u: 'you',
};

const pickByInputHash = (options, input) => {
  if (!Array.isArray(options) || options.length === 0) return '';
  const seed = String(input || '')
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return options[seed % options.length];
};

const levenshteinDistance = (left, right) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const matrix = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));
  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row;
  for (let col = 0; col <= right.length; col += 1) matrix[0][col] = col;

  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
};

const wordSimilarity = (left, right) => {
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  const distance = levenshteinDistance(left, right);
  return 1 - distance / maxLength;
};

export const normalizeChatInput = (inputValue) => {
  const cleaned = String(inputValue || '')
    .toLowerCase()
    .trim()
    .replace(REPEATED_PUNCTUATION_PATTERN, '$1')
    .replace(LETTER_REPEAT_PATTERN, '$1$1')
    .replace(/\s+/g, ' ');

  const tokens = cleaned
    .replace(NON_ALPHANUMERIC_PATTERN, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => CASUAL_WORD_MAP[token] || token);

  return tokens.join(' ').trim();
};

const isNonsenseInput = (rawInput, normalizedInput) => {
  const raw = String(rawInput || '').trim();
  if (!raw) return false;

  const alphanumericOnly = raw.replace(/[a-z0-9]/gi, '');
  if (alphanumericOnly.length === raw.length) {
    return true;
  }

  const tokens = normalizedInput.split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  if (tokens.every((token) => /^\d+$/.test(token))) return true;

  const shortUniqueTokens = new Set(tokens);
  if (tokens.length >= 4 && shortUniqueTokens.size === 1) return true;

  const totalCharacters = tokens.join('').length;
  const vowelCount = tokens.join('').replace(/[^aeiou]/g, '').length;
  if (totalCharacters >= 8 && vowelCount === 0) return true;

  return false;
};

const buildIntentLexicon = () => {
  const lexicon = new Set();
  CHATBOT_INTENTS.forEach((intent) => {
    intent.keywords.forEach((keyword) => {
      normalizeChatInput(keyword)
        .split(' ')
        .filter(Boolean)
        .forEach((token) => lexicon.add(token));
    });
  });
  return lexicon;
};

const INTENT_TOKEN_LEXICON = buildIntentLexicon();
const INTENT_TOKEN_LIST = Array.from(INTENT_TOKEN_LEXICON);

const scoreKeywordMatch = (normalizedMessage, messageTokens, keyword) => {
  const normalizedKeyword = normalizeChatInput(keyword);
  if (!normalizedKeyword) return 0;

  if (normalizedMessage.includes(normalizedKeyword)) {
    return 1;
  }

  const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);
  if (!keywordTokens.length || !messageTokens.length) {
    return 0;
  }

  const totalSimilarity = keywordTokens.reduce((sum, keywordToken) => {
    const bestTokenScore = messageTokens.reduce((best, messageToken) => {
      if (messageToken === keywordToken) return 1;
      return Math.max(best, wordSimilarity(messageToken, keywordToken));
    }, 0);
    return sum + bestTokenScore;
  }, 0);

  return totalSimilarity / keywordTokens.length;
};

const scoreIntent = (normalizedMessage, messageTokens, intent) => {
  return intent.keywords.reduce((best, keyword) => {
    return Math.max(best, scoreKeywordMatch(normalizedMessage, messageTokens, keyword));
  }, 0);
};

const resolveSuggestionsForIntent = (intentId) => {
  const intentSpecificSuggestions = CHATBOT_DEFAULT_SUGGESTIONS.filter((item) => item.id !== intentId).slice(0, 4);
  return intentSpecificSuggestions.length > 0 ? intentSpecificSuggestions : CHATBOT_DEFAULT_SUGGESTIONS.slice(0, 4);
};

const resolveFallback = (normalizedInput, type = 'fallback') => {
  const fallbackPool = type === 'nonsense' ? CHATBOT_NONSENSE_RESPONSES : CHATBOT_FALLBACK_RESPONSES;
  return {
    kind: type,
    intentId: type,
    confidence: 0,
    response: pickByInputHash(fallbackPool, normalizedInput),
    suggestions: CHATBOT_DEFAULT_SUGGESTIONS.slice(0, 5),
  };
};

export const resolveChatbotResponse = (userMessage) => {
  const rawInput = String(userMessage || '');
  const normalizedInput = normalizeChatInput(userMessage);
  if (!normalizedInput) {
    if (rawInput.trim()) {
      return resolveFallback(rawInput, 'nonsense');
    }
    return resolveFallback('', 'fallback');
  }

  if (isNonsenseInput(rawInput, normalizedInput)) {
    return resolveFallback(normalizedInput, 'nonsense');
  }

  const messageTokens = normalizedInput.split(' ').filter(Boolean);
  const lexiconHits = messageTokens.filter((token) => {
    if (INTENT_TOKEN_LEXICON.has(token)) return true;
    return INTENT_TOKEN_LIST.some((lexiconToken) => wordSimilarity(token, lexiconToken) >= 0.82);
  }).length;
  const strongestLexiconSimilarity = messageTokens.reduce((bestScore, token) => {
    const tokenBest = INTENT_TOKEN_LIST.reduce((bestTokenScore, lexiconToken) => {
      return Math.max(bestTokenScore, wordSimilarity(token, lexiconToken));
    }, 0);
    return Math.max(bestScore, tokenBest);
  }, 0);

  const lexicalCoverage = messageTokens.length > 0 ? lexiconHits / messageTokens.length : 0;
  if (lexiconHits === 0 && messageTokens.join('').length >= 5 && strongestLexiconSimilarity < 0.46) {
    return resolveFallback(normalizedInput, 'nonsense');
  }

  const scoredIntents = CHATBOT_INTENTS.map((intent) => ({
    intent,
    score: scoreIntent(normalizedInput, messageTokens, intent),
  })).sort((left, right) => right.score - left.score);

  const bestMatch = scoredIntents[0];
  const topScore = bestMatch?.score || 0;
  const minimumConfidence = lexicalCoverage > 0.5 ? 0.52 : 0.62;
  if (!bestMatch || topScore < minimumConfidence) {
    return resolveFallback(normalizedInput, 'fallback');
  }

  return {
    kind: 'intent',
    intentId: bestMatch.intent.id,
    confidence: Number(topScore.toFixed(3)),
    response: pickByInputHash(bestMatch.intent.responses, normalizedInput),
    suggestions: resolveSuggestionsForIntent(bestMatch.intent.id),
  };
};

export const resolveChatbotReply = (userMessage) => {
  return resolveChatbotResponse(userMessage).response;
};

export const resolveChatbotErrorResponse = (userMessage) => {
  const normalizedInput = normalizeChatInput(userMessage);
  return pickByInputHash(CHATBOT_ERROR_RESPONSES, normalizedInput);
};
