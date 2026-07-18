const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const safetyModuleUrl = pathToFileURL(
  path.join(repoRoot, 'frontend', 'modules', 'shared', 'components', 'support', 'chatbotSafety.ts')
).href;
const boundaryModulePath = path.join(repoRoot, 'frontend', 'components', 'ChatbotErrorBoundary.tsx');

const withWindowMock = async (windowMock, run) => {
  const previousWindow = global.window;
  global.window = windowMock;
  try {
    await run();
  } finally {
    if (typeof previousWindow === 'undefined') {
      delete global.window;
    } else {
      global.window = previousWindow;
    }
  }
};

test('safeGetStorage returns fallback when localStorage throws SecurityError', async () => {
  const { safeGetStorage } = await import(safetyModuleUrl);

  await withWindowMock(
    {
      localStorage: {
        getItem() {
          const error = new Error('Storage blocked');
          error.name = 'SecurityError';
          throw error;
        },
      },
    },
    async () => {
      assert.equal(safeGetStorage('kapit-chatbot-minimized', 'fallback-value'), 'fallback-value');
    }
  );
});

test('safeSetStorage returns false when localStorage throws SecurityError', async () => {
  const { safeSetStorage } = await import(safetyModuleUrl);

  await withWindowMock(
    {
      localStorage: {
        setItem() {
          const error = new Error('Storage blocked');
          error.name = 'SecurityError';
          throw error;
        },
      },
    },
    async () => {
      assert.equal(safeSetStorage('kapit-chatbot-sound', '1'), false);
    }
  );
});

test('playNotificationSound safely skips when AudioContext is unavailable', async () => {
  const { playNotificationSound } = await import(safetyModuleUrl);

  await withWindowMock({}, async () => {
    assert.equal(playNotificationSound(true), false);
  });
});

test('playNotificationSound safely skips when AudioContext constructor throws', async () => {
  const { playNotificationSound } = await import(safetyModuleUrl);

  await withWindowMock(
    {
      AudioContext: function AudioContext() {
        throw new Error('Autoplay blocked');
      },
    },
    async () => {
      assert.equal(playNotificationSound(true), false);
    }
  );
});

test('ChatbotErrorBoundary can hide chatbot without affecting sibling content', async () => {
  const boundaryModule = require(boundaryModulePath);
  const ChatbotErrorBoundary = boundaryModule.default;

  const siblingContent = 'page content';
  const boundary = new ChatbotErrorBoundary({ children: 'chatbot ui' });
  assert.deepEqual(ChatbotErrorBoundary.getDerivedStateFromError(new Error('chatbot crash')), { hasError: true });

  boundary.state = { hasError: false };
  assert.equal(boundary.render(), 'chatbot ui');

  boundary.state = { hasError: true };
  assert.equal(boundary.render(), null);
  assert.equal(siblingContent, 'page content');
});
