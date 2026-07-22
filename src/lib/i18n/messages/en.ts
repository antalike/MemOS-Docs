import type { Messages } from './types';

// English message catalog. This is the fallback locale, so it also acts as the
// structural source of truth: `cn.ts` must mirror this shape (enforced by the
// shared `Messages` type). Ported from the legacy `i18n/locales/en.js`.
export const en: Messages = {
  home: {
    title: "Don't let your AI forget again, Empower it with MemOS!",
    titlePrefix: "Don't let your AI forget again, Empower it with",
    titleSuffix: '!',
    description:
      'Guides from onboarding through production deployment—integrate MemOS in the shortest time.',
    buttonText: 'Write your first memory',
    openclawButton: 'Agent Configuration',
    items: [
      {
        title: 'Understand memory',
        description:
          'Start with what MemOS solves and how memory production, recall, and lifecycle management fit together.',
      },
      {
        title: 'MemOS Cloud',
        description:
          'Production-grade memory hosting, ready out of the box—complete your first integration in five minutes.',
      },
      {
        title: 'Open Source',
        description:
          'Self-hosted open-source memory—deploy privately, stay in control, customize and extend freely.',
      },
      {
        title: 'Sample Projects',
        description:
          'Real-world examples to help you quickly build production-ready AI apps with long-term memory.',
      },
      {
        title: 'MCP & Agent Framework',
        description:
          'One-click integration with Coze, Dify, and other Agent frameworks via MCP or SDK as a unified memory backend.',
      },
      {
        title: 'API Documentation',
        description:
          'Complete REST API and SDK reference covering auth, memory read/write, retrieval, and more.',
      },
    ],
  },
  interactive: {
    assistant: {
      title: 'Assistant',
      suggestions: 'Suggestions',
      inputPlaceholder: 'Type your messages here...',
      welcome:
        "Hi, I'm Xiao Yi, your MemOS Knowledge Base Assistant. Feel free to ask me anything you'd like to know!",
      systemError: 'System is busy, please try again later',
      open: 'Ask the MemOS assistant',
      close: 'Close',
      stop: 'Stop',
      send: 'Send',
      clear: 'Clear conversation',
    },
    apiKeyPicker: {
      title: 'Select an API Key',
      description: 'The selected key will replace the placeholder in the copied code.',
      projectLabel: 'Project',
      keyLabel: 'API Key',
      empty: 'No available API Key under this project. Create one right here.',
      emptyProject: 'No project yet. Create one in Dashboard first.',
      goDashboard: 'Go to Dashboard',
      keyNameLabel: 'Key Name',
      keyNamePlaceholder: 'Enter a key name',
      defaultKeyName: 'Default Key',
      create: 'Create & Use',
      createFailed: 'Failed to create the key. Please retry, or create one in the Dashboard.',
      cancel: 'Cancel',
      confirm: 'Use this key',
      loadFailed: 'Failed to load API Keys, please try again later.',
      copy: 'Copy code to clipboard',
    },
  },
  changelog: {
    title: 'Changelog',
    description: 'All notable changes to MemOS will be documented here',
    tabs: {
      highlight: 'Highlight',
      openSource: 'Open Source',
    },
    github: 'GitHub',
    productLines: {
      cloud: 'MemOS Cloud',
      docs: 'Documentation',
      playground: 'Playground',
      plugin: 'Plugin',
      mcp: 'MCP',
      opensource: 'Open Source',
    },
    categories: {
      'New Features': 'New Features',
      Improvements: 'Improvements',
      'Bug Fixes': 'Bug Fixes',
    },
  },
  nav: {
    welcome: 'Guide',
    cloud: 'MemOS Cloud',
    openSource: 'Open Source',
    selfDevelopedModel: 'Self-developed Models',
    openclaw: 'OpenClaw & Hermes',
    mcpAgent: 'MCP & Agent Framework',
    apiDocs: 'API Documentation',
    samples: 'Sample Projects',
    changelog: 'Changelog',
  },
  // English is the fumadocs-ui default, so no framework overrides are needed.
  ui: {},
};
