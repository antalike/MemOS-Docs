import type { Messages } from './types';
import { cnFrameworkTranslations } from './framework-cn';

// Chinese (Simplified) message catalog for the `/cn` tree. Mirrors `en.ts`.
// Ported from the legacy `i18n/locales/cn.js`.
export const cn: Messages = {
  home: {
    title: '别让你的 AI 再忘来忘去，用 MemOS',
    titlePrefix: '别让你的 AI 再忘来忘去，用',
    titleSuffix: '',
    description: '提供从上手入门到生产部署的一切指南，帮你最短时间集成 MemOS',
    buttonText: '写入你的第一条记忆',
    openclawButton: 'OpenClaw 配置指南',
    items: [
      {
        title: '理解记忆机制',
        description: '先看 MemOS 解决什么问题，以及记忆生产、召回和生命周期的基本链路。',
      },
      {
        title: 'MemOS 云服务',
        description: '生产级记忆服务托管平台，开箱即用，五分钟完成首次集成与调试。',
      },
      {
        title: 'MemOS 开源项目',
        description: '自托管开源记忆方案，私有部署、安全可控，支持自由定制与深度扩展。',
      },
      {
        title: '示例项目',
        description: '面向真实业务场景的实战示例，助你快速搭建可上线的长期记忆 AI 应用。',
      },
      {
        title: 'MCP与Agent框架支持',
        description: '通过 MCP 或 SDK 一键接入 Coze、Dify 等主流 Agent 框架，统一记忆后端。',
      },
      {
        title: 'API接口文档',
        description: '完整的 REST API 与 SDK 参考，涵盖鉴权、记忆读写、检索等核心接口。',
      },
    ],
  },
  interactive: {
    assistant: {
      title: '助手',
      suggestions: '参考问题',
      inputPlaceholder: '请输入你想了解的问题...',
      welcome: 'Hi，我是MemOS知识库助手小忆，您有什么问题可以直接向我提问！',
      systemError: '系统繁忙，请稍后再试',
      open: '咨询 MemOS 助手',
      close: '关闭',
      stop: '停止',
      send: '发送',
      clear: '清空对话',
    },
    apiKeyPicker: {
      title: '选择 API Key',
      description: '所选密钥将自动替换复制内容中的占位符。',
      projectLabel: '项目',
      keyLabel: 'API Key',
      empty: '该项目下暂无可用的 API Key，可在此直接创建。',
      emptyProject: '尚未创建项目，请先到 Dashboard 创建。',
      goDashboard: '前往 Dashboard',
      keyNameLabel: 'Key 名称',
      keyNamePlaceholder: '请输入 Key 名称',
      defaultKeyName: '默认密钥',
      create: '创建并使用',
      createFailed: '创建失败，请稍后重试，或前往 Dashboard 创建。',
      cancel: '取消',
      confirm: '使用该密钥',
      loadFailed: 'API Key 加载失败，请稍后重试。',
      copy: '复制代码到剪贴板',
    },
  },
  changelog: {
    title: '更新日志',
    description: '所有值得注意的更新和改进都将记录在这里',
    tabs: {
      highlight: 'Highlight',
      openSource: 'Open Source',
    },
    github: 'GitHub',
    productLines: {
      cloud: '云服务',
      docs: '官方文档',
      playground: 'Playground',
      plugin: '插件',
      mcp: 'MCP',
      opensource: '开源项目',
    },
    categories: {
      'New Features': '功能更新',
      Improvements: '优化改进',
      'Bug Fixes': '问题修复',
    },
  },
  nav: {
    welcome: '导览',
    cloud: '云服务',
    openSource: '开源项目',
    selfDevelopedModel: '自研模型',
    openclaw: 'OpenClaw与Hermes',
    mcpAgent: 'MCP与Agent框架支持',
    apiDocs: 'API接口文档',
    samples: '示例项目',
    changelog: '更新日志',
  },
  ui: cnFrameworkTranslations,
};
