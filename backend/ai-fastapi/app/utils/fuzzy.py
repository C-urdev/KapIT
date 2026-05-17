from difflib import SequenceMatcher


def similarity(left: str, right: str) -> float:
    if left == right:
        return 1.0
    if not left or not right:
        return 0.0
    return float(SequenceMatcher(None, left, right).ratio())


def _contains_keyword_phrase(message_tokens: list[str], keyword_tokens: list[str]) -> bool:
    if not message_tokens or not keyword_tokens:
        return False
    if len(keyword_tokens) == 1:
        return keyword_tokens[0] in message_tokens

    window_size = len(keyword_tokens)
    for index in range(0, len(message_tokens) - window_size + 1):
        if message_tokens[index:index + window_size] == keyword_tokens:
            return True
    return False


def score_keyword(normalized_message: str, message_tokens: list[str], keyword: str) -> float:
    normalized_keyword = str(keyword or '').strip().lower()
    if not normalized_keyword:
        return 0.0

    keyword_tokens = [token for token in normalized_keyword.split(' ') if token]
    if not keyword_tokens or not message_tokens:
        return 0.0
    if _contains_keyword_phrase(message_tokens, keyword_tokens):
        return 1.0

    total = 0.0
    for keyword_token in keyword_tokens:
        best_score = 0.0
        for message_token in message_tokens:
            if message_token == keyword_token:
                best_score = 1.0
                break
            token_score = similarity(message_token, keyword_token)
            if len(keyword_token) <= 3 and token_score < 0.9:
                token_score = 0.0
            elif len(keyword_token) == 4 and token_score < 0.84:
                token_score = 0.0
            best_score = max(best_score, token_score)
        total += best_score

    return total / len(keyword_tokens)
