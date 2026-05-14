from app.services.chatbot_service import process_message


def test_greeting_intent_is_detected():
    result = process_message('hello there')
    assert result['intent'] == 'greeting'
    assert result['confidence'] > 0.5


def test_greeting_typo_is_detected():
    result = process_message('ehy there')
    assert result['intent'] == 'greeting'
    assert result['confidence'] > 0.5


def test_single_word_time_of_day_is_greeting():
    result = process_message('morning')
    assert result['intent'] == 'greeting'
    assert result['confidence'] > 0.5


def test_compact_gud_morning_typo_is_greeting():
    result = process_message('gudmorning')
    assert result['intent'] == 'greeting'
    assert result['confidence'] > 0.5


def test_common_typo_normalization_paths_are_detected():
    samples = ['helo', 'hiii', 'gud morning', 'suport', 'hlp']
    intents = [process_message(sample)['intent'] for sample in samples]
    assert intents[0] == 'greeting'
    assert intents[1] == 'greeting'
    assert intents[2] == 'greeting'
    assert intents[3] == 'help'
    assert intents[4] == 'help'


def test_help_intent_is_detected():
    result = process_message('can you help me')
    assert result['intent'] == 'help'
    assert result['confidence'] > 0.5


def test_account_intent_is_detected():
    result = process_message('how do i create account')
    assert result['intent'] == 'account'
    assert result['confidence'] > 0.5


def test_auth_question_is_detected():
    result = process_message('i forgot password and cant login')
    assert result['intent'] == 'auth'
    assert result['confidence'] > 0.5


def test_pricing_and_support_intents_are_detected():
    pricing = process_message('tell me your pricing plans')
    support = process_message('contact support team')
    assert pricing['intent'] == 'pricing'
    assert pricing['confidence'] > 0.5
    assert isinstance(pricing['actions'], list)
    assert any(str(action.get('href')) == '/pricing' for action in pricing['actions'])
    assert support['intent'] == 'support'
    assert support['confidence'] > 0.5
    assert isinstance(support['actions'], list)


def test_numeric_nonsense_input_uses_fallback():
    result = process_message('123123')
    assert result['intent'] == 'fallback'
    assert result['confidence'] == 0.0


def test_gibberish_nonsense_input_uses_fallback():
    result = process_message('asdasd')
    assert result['intent'] == 'fallback'
    assert result['confidence'] == 0.0


def test_symbol_only_nonsense_input_uses_fallback():
    result = process_message('???')
    assert result['intent'] == 'fallback'
    assert result['confidence'] == 0.0


def test_emoji_only_nonsense_input_uses_fallback():
    result = process_message('\U0001F642\U0001F642')
    assert result['intent'] == 'fallback'
    assert result['confidence'] == 0.0


def test_unknown_but_valid_sentence_uses_safe_fallback():
    result = process_message('please explain quantum tomato protocol')
    assert result['intent'] == 'fallback'
    assert result['confidence'] == 0.0
    assert result['actions'] == []


def test_navigation_follow_up_uses_last_intent_actions():
    result = process_message('where is that?', last_intent='pricing')
    assert result['intent'] == 'pricing'
    assert result['confidence'] > 0.5
    assert isinstance(result['actions'], list)
    assert any(str(action.get('href')) == '/pricing' for action in result['actions'])


def test_short_where_follow_up_uses_last_intent_actions():
    result = process_message('where?', last_intent='pricing')
    assert result['intent'] == 'pricing'
    assert result['confidence'] > 0.5
    assert any(str(action.get('href')) == '/pricing' for action in result['actions'])


def test_question_mark_only_follow_up_uses_last_intent_actions():
    result = process_message('??', last_intent='auth')
    assert result['intent'] == 'auth'
    assert result['confidence'] > 0.5
    assert any(str(action.get('href')) == '/auth/login' for action in result['actions'])


def test_huh_follow_up_uses_last_intent_actions():
    result = process_message('huh', last_intent='support')
    assert result['intent'] == 'support'
    assert result['confidence'] > 0.5
    assert any(str(action.get('href')) == '/company/help' for action in result['actions'])


def test_huh_with_question_mark_follow_up_uses_last_intent_actions():
    result = process_message('huh?', last_intent='pricing')
    assert result['intent'] == 'pricing'
    assert result['confidence'] > 0.5
    assert any(str(action.get('href')) == '/pricing' for action in result['actions'])
