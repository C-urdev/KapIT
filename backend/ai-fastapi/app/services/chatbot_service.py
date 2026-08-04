import re

from app.data.chatbot_intents import (
    EMPLOYER_FALLBACK_RESPONSES,
    EMPLOYER_INTENT_DEFINITIONS,
    EMPLOYER_NAVIGATION_ACTIONS_BY_INTENT,
    EMPLOYER_NONSENSE_RESPONSES,
    FALLBACK_RESPONSES,
    FOLLOW_UP_NAVIGATION_PHRASES,
    INTENT_DEFINITIONS,
    NAVIGATION_ACTIONS_BY_INTENT,
    NONSENSE_RESPONSES,
)
from app.utils.fuzzy import score_keyword, similarity
from app.utils.text import is_nonsense_input, normalize_message

QUESTION_PUNCTUATION_ONLY_PATTERN = re.compile(r'^[\s?!.,]+$')
SHORT_FOLLOW_UP_TOKENS = {'where', 'what', 'which', 'page', 'link', 'huh', 'again', 'sorry'}

INTENT_LEXICON = tuple(
    {
        token
        for intent in INTENT_DEFINITIONS
        for keyword in intent.keywords
        for token in normalize_message(keyword).split(' ')
        if token
    }
)


def _contains_exact_keyword_tokens(message_tokens: list[str], keyword_tokens: list[str]) -> bool:
    if not message_tokens or not keyword_tokens:
        return False
    if len(keyword_tokens) == 1:
        return keyword_tokens[0] in message_tokens

    window_size = len(keyword_tokens)
    for index in range(0, len(message_tokens) - window_size + 1):
        if message_tokens[index:index + window_size] == keyword_tokens:
            return True
    return False


def _pick_response(options: tuple[str, ...], seed_source: str) -> str:
    if not options:
        return ''
    seed = sum(ord(char) for char in seed_source)
    return options[seed % len(options)]


def _resolve_intent_score(normalized_message: str, message_tokens: list[str], keywords: tuple[str, ...]) -> float:
    best_score = 0.0
    for keyword in keywords:
        best_score = max(best_score, score_keyword(normalized_message, message_tokens, normalize_message(keyword)))
    return best_score


def _resolve_exact_keyword_strength(message_tokens: list[str], keywords: tuple[str, ...]) -> int:
    best_strength = 0
    for keyword in keywords:
        keyword_tokens = [token for token in normalize_message(keyword).split(' ') if token]
        if _contains_exact_keyword_tokens(message_tokens, keyword_tokens):
            best_strength = max(best_strength, len(keyword_tokens))
    return best_strength


def _resolve_lexical_coverage(message_tokens: list[str]) -> tuple[float, float, int]:
    if not message_tokens:
        return 0.0, 0.0, 0

    hits = 0
    strongest_similarity = 0.0
    for token in message_tokens:
        token_best = 0.0
        for lexicon_token in INTENT_LEXICON:
            token_best = max(token_best, similarity(token, lexicon_token))
            if token_best == 1.0:
                break
        if token_best >= 0.82:
            hits += 1
        strongest_similarity = max(strongest_similarity, token_best)

    return hits / len(message_tokens), strongest_similarity, hits


def _build_actions(intent_id: str) -> list[dict[str, str]]:
    return [dict(action) for action in NAVIGATION_ACTIONS_BY_INTENT.get(intent_id, tuple())]


def _is_navigation_follow_up(normalized_message: str, message_tokens: list[str]) -> bool:
    if any(phrase in normalized_message for phrase in FOLLOW_UP_NAVIGATION_PHRASES):
        return True

    token_set = set(message_tokens)
    if len(message_tokens) <= 2 and token_set.intersection(SHORT_FOLLOW_UP_TOKENS):
        return True
    if token_set == {'huh'}:
        return True
    if 'where' in token_set and token_set.intersection({'that', 'it', 'this', 'page', 'link', 'find'}):
        return True
    if 'what' in token_set and token_set.intersection({'that', 'it', 'this', 'page', 'link'}):
        return True
    if 'link' in token_set and token_set.intersection({'where', 'page', 'that', 'it'}):
        return True
    return False


def _build_navigation_follow_up_reply(intent_id: str, actions: list[dict[str, str]]) -> str:
    if not actions:
        return _pick_response(FALLBACK_RESPONSES, intent_id)

    primary = actions[0]
    label = str(primary.get('label') or 'this page').strip()
    return f'You can find it here: {label}. Tap the button below and I will open it.'


def _process_employer_message(message: str, last_intent: str | None = None) -> dict[str, str | float | list[dict[str, str]]]:
    raw_message = str(message or '')
    normalized = normalize_message(raw_message)
    normalized_last_intent = str(last_intent or '').strip().lower()
    if not normalized:
        return {
            'reply': _pick_response(EMPLOYER_NONSENSE_RESPONSES, raw_message),
            'intent': 'fallback',
            'confidence': 0.0,
            'actions': [],
        }

    for intent in EMPLOYER_INTENT_DEFINITIONS:
        if any(keyword in normalized for keyword in intent.keywords):
            return {
                'reply': _pick_response(intent.responses, normalized),
                'intent': intent.intent_id,
                'confidence': 0.9,
                'actions': [dict(action) for action in EMPLOYER_NAVIGATION_ACTIONS_BY_INTENT.get(intent.intent_id, tuple())],
            }

    if normalized_last_intent and any(token in normalized.split(' ') for token in ('where', 'which', 'link', 'page')):
        actions = [dict(action) for action in EMPLOYER_NAVIGATION_ACTIONS_BY_INTENT.get(normalized_last_intent, tuple())]
        if actions:
            return {
                'reply': _build_navigation_follow_up_reply(normalized_last_intent, actions),
                'intent': normalized_last_intent,
                'confidence': 0.88,
                'actions': actions,
            }

    return {
        'reply': _pick_response(EMPLOYER_FALLBACK_RESPONSES, normalized),
        'intent': 'fallback',
        'confidence': 0.0,
        'actions': [],
    }


def process_message(message: str, last_intent: str | None = None, audience: str = 'general') -> dict[str, str | float | list[dict[str, str]]]:
    if audience == 'employer':
        return _process_employer_message(message, last_intent)

    raw_message = str(message or '')
    normalized = normalize_message(raw_message)
    normalized_last_intent = str(last_intent or '').strip().lower()
    raw_trimmed = raw_message.strip()
    follow_up_actions = _build_actions(normalized_last_intent) if normalized_last_intent else []

    if normalized_last_intent and follow_up_actions and QUESTION_PUNCTUATION_ONLY_PATTERN.match(raw_trimmed):
        return {
            'reply': _build_navigation_follow_up_reply(normalized_last_intent, follow_up_actions),
            'intent': normalized_last_intent,
            'confidence': 0.88,
            'actions': follow_up_actions,
        }

    if not normalized:
        if raw_message.strip():
            return {
                'reply': _pick_response(NONSENSE_RESPONSES, raw_message),
                'intent': 'fallback',
                'confidence': 0.0,
                'actions': [],
            }
        return {
            'reply': _pick_response(FALLBACK_RESPONSES, ''),
            'intent': 'fallback',
            'confidence': 0.0,
            'actions': [],
        }

    if is_nonsense_input(raw_message, normalized):
        return {
            'reply': _pick_response(NONSENSE_RESPONSES, normalized),
            'intent': 'fallback',
            'confidence': 0.0,
            'actions': [],
        }

    message_tokens = [token for token in normalized.split(' ') if token]
    if normalized_last_intent and follow_up_actions and _is_navigation_follow_up(normalized, message_tokens):
        return {
            'reply': _build_navigation_follow_up_reply(normalized_last_intent, follow_up_actions),
            'intent': normalized_last_intent,
            'confidence': 0.9,
            'actions': follow_up_actions,
        }

    lexical_coverage, strongest_similarity, lexicon_hits = _resolve_lexical_coverage(message_tokens)
    if lexicon_hits == 0:
        return {
            'reply': _pick_response(FALLBACK_RESPONSES, normalized),
            'intent': 'fallback',
            'confidence': 0.0,
            'actions': [],
        }

    scored_intents = []
    for intent in INTENT_DEFINITIONS:
        exact_strength = _resolve_exact_keyword_strength(message_tokens, intent.keywords)
        score = _resolve_intent_score(normalized, message_tokens, intent.keywords)
        scored_intents.append((intent, exact_strength, score))

    scored_intents.sort(key=lambda item: (item[1], item[2]), reverse=True)
    best_intent, exact_strength, top_score = scored_intents[0]

    if exact_strength > 0 and top_score >= 0.5:
        return {
            'reply': _pick_response(best_intent.responses, normalized),
            'intent': best_intent.intent_id,
            'confidence': round(float(max(top_score, 0.75)), 3),
            'actions': _build_actions(best_intent.intent_id),
        }

    minimum_confidence = 0.52 if lexical_coverage > 0.5 else 0.62
    if top_score < minimum_confidence:
        return {
            'reply': _pick_response(FALLBACK_RESPONSES, normalized),
            'intent': 'fallback',
            'confidence': 0.0,
            'actions': [],
        }

    # Phase 2 extension point:
    # - replace or enrich static responses from DB
    # - persist conversation logs for analytics and QA
    # - route high-confidence cases to AI/RAG pipelines
    return {
        'reply': _pick_response(best_intent.responses, normalized),
        'intent': best_intent.intent_id,
        'confidence': round(float(top_score), 3),
        'actions': _build_actions(best_intent.intent_id),
    }
