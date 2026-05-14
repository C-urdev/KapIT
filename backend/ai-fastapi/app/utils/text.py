import re

from app.data.chatbot_intents import PHRASE_REPLACEMENTS, TYPO_REPLACEMENTS

REPEATED_PUNCTUATION_PATTERN = re.compile(r'([!?.,])\1+')
REPEATED_LETTER_PATTERN = re.compile(r'([a-z])\1{2,}')
NON_ALPHANUMERIC_PATTERN = re.compile(r"[^a-z0-9\s']")
LETTER_OR_DIGIT_PATTERN = re.compile(r'[a-z0-9]', re.IGNORECASE)
DIGITS_ONLY_PATTERN = re.compile(r'^\d+$')


def _normalize_tokens(text: str) -> list[str]:
    cleaned = NON_ALPHANUMERIC_PATTERN.sub(' ', text)
    tokens = [token for token in cleaned.split(' ') if token]
    return [TYPO_REPLACEMENTS.get(token, token) for token in tokens]


def normalize_message(raw_message: str) -> str:
    lowered = str(raw_message or '').lower().strip()
    lowered = REPEATED_PUNCTUATION_PATTERN.sub(r'\1', lowered)
    lowered = REPEATED_LETTER_PATTERN.sub(r'\1\1', lowered)
    lowered = re.sub(r'\s+', ' ', lowered)

    for source, target in PHRASE_REPLACEMENTS.items():
        lowered = lowered.replace(source, target)

    tokens = _normalize_tokens(lowered)
    return ' '.join(tokens).strip()


def is_nonsense_input(raw_message: str, normalized_message: str) -> bool:
    raw = str(raw_message or '').strip()
    if not raw:
        return False

    if not LETTER_OR_DIGIT_PATTERN.search(raw):
        return True

    tokens = [token for token in normalized_message.split(' ') if token]
    if not tokens:
        return True

    if all(DIGITS_ONLY_PATTERN.match(token) for token in tokens):
        return True

    if len(tokens) >= 4 and len(set(tokens)) == 1:
        return True

    merged = ''.join(tokens)
    if len(merged) >= 6 and not re.search(r'[aeiou]', merged):
        return True

    return False
