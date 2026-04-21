# 项目开发规范

## 技术栈
- Vue3 + Composition API + <script setup>
- TypeScript 严格模式
- 禁止使用 any 类型，用 unknown 替代

## 组件规范
- Props 必须定义类型和默认值
- Emits 必须用 defineEmits 显式声明
- 组件文件名使用 PascalCase
- 超过200行的组件必须拆分

## 代码风格
- 使用 const 优先于 let，禁止 var
- 异步操作统一用 async/await，不用 .then 链
- CSS 使用 scoped，类名遵循 BEM：block__element--modifier

## 注释规范
- 复杂逻辑必须加注释
- 函数注释说明：入参、返回值、副作用
- 禁止无意义注释如 // 循环遍历

## 文件结构
每个Vue组件按以下顺序组织：
1. <script setup>
2. <template>
3. <style scoped>

## 你不做的事
- 不生成 Options API 代码
- 不省略 TypeScript 类型
- 不生成内联样式