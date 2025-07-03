---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

# CLAUDE.md

Этот файл предоставляет руководство для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Это расширение VS Code под названием "collapse-automation", которое автоматически сворачивает блоки кода на основе паттернов или прагм. Расширение написано на TypeScript, собирается с помощью Vite и использует Bun в качестве среды выполнения.

## Команды сборки и разработки

```bash
bun install              # Установить зависимости
bun run compile         # Компилировать TypeScript
bun run watch           # Компилировать TypeScript в режиме наблюдения
bun run lint            # Запустить линтер/форматтер Biome
bun run build           # Компилировать TS и собрать расширение с помощью Vite
bun run test            # Запустить тесты расширения VS Code
bun run package         # Создать .vsix пакет
bun run publish         # Опубликовать в VS Code marketplace
bun run version:patch   # Увеличить patch версию
```

## Архитектура

Расширение работает в двух режимах:

1. **Режим прагмы**: Когда в файле найдено `// @collapse`, сворачивает все блоки кода с учетом настроек `collapseLevel` и паттернов `neverFold`
2. **Режим паттернов**: Сворачивает строки, соответствующие паттернам `alwaysFold` (например, `logger.info`, `logger.error`)

### Ключевые компоненты

- **lib/extension.ts**: Основная логика расширения
  - `activate()`: Точка входа расширения, настраивает слушатели событий
  - `analyzeAndFold()`: Основная функция анализа, обрабатывающая документы
  - `findFunctionCalls()`: Сопоставление паттернов на основе AST для вызовов функций

- **Триггеры событий**:
  - Открытие файла: Немедленный анализ
  - Переключение файла: Немедленный анализ
  - Редактирование файла: Отложенный анализ (500мс)
  - Ручная команда: `collapse-automation.activate`

### Сопоставление паттернов

Для паттернов с точками (например, `logger.info`) расширение использует парсинг AST TypeScript через @typescript-eslint/typescript-estree, чтобы гарантировать совпадение только реальных вызовов функций, а не строк или комментариев. Однострочные вызовы функций автоматически пропускаются, так как их нельзя свернуть.

### Отслеживание пользовательских предпочтений

Расширение запоминает, когда пользователь вручную разворачивает свернутые функции, и не будет сворачивать их повторно до следующего ручного запуска команды. Это обеспечивает лучший пользовательский опыт и уважает действия пользователя.

## Схема конфигурации

```json
{
  "collapse-automation.alwaysFold": ["logger.info", "logger.error", "logger.warn"],
  "collapse-automation.neverFold": ["main"],
  "collapse-automation.collapseLevel": 1,
  "collapse-automation.enableCollapsePragma": true
}
```

## Заметки по разработке

- Расширение использует API сворачивания VS Code и пытается свернуть каждую подходящую строку индивидуально
- Однострочные выражения автоматически пропускаются VS Code
- Расширение выводит подробные логи в канал вывода "Collapse Automation"
- Поддерживаемые языки: javascript, javascriptreact, typescript, typescriptreact
- Расширение фильтрует только многострочные вызовы функций для сворачивания

## Тестирование

Тесты используют фреймворк тестирования расширений VS Code. Запускайте с помощью `bun run test`. Файлы тестов находятся в `test/suite/`.

## Публикация

Расширение опубликовано в VS Code marketplace под ID `a-x-.collapse-automation`. Перед публикацией необходимо обновить версию в `package.json`.

## Bun.sh

Bun - это современная среда выполнения JavaScript, которая заменяет Node.js, npm и другие инструменты единым, быстрым и эффективным решением. Он предоставляет встроенную поддержку TypeScript, JSX и CSS, что делает его идеальным как для backend, так и для frontend разработки.

По умолчанию используйте Bun вместо Node.js.

- Используйте `bun <file>` вместо `node <file>` или `ts-node <file>`
- Используйте `bun test` вместо `jest` или `vitest`
- Используйте `bun build <file.html|file.ts|file.css>` вместо `webpack` или `esbuild`
- Используйте `bun install` вместо `npm install` или `yarn install` или `pnpm install`
- Используйте `bun run <script>` вместо `npm run <script>` или `yarn run <script>` или `pnpm run <script>`
- Bun автоматически загружает .env, поэтому не используйте dotenv.

### API

- `Bun.serve()` поддерживает WebSockets, HTTPS и маршруты. Не используйте `express`.
- `bun:sqlite` для SQLite. Не используйте `better-sqlite3`.
- `Bun.redis` для Redis. Не используйте `ioredis`.
- `Bun.sql` для Postgres. Не используйте `pg` или `postgres.js`.
- `WebSocket` встроен. Не используйте `ws`.
- Предпочитайте `Bun.file` вместо `node:fs` readFile/writeFile
- Bun.$`ls` вместо execa.

### Frontend

Используйте HTML импорты с `Bun.serve()`. Не используйте `vite`. HTML импорты полностью поддерживают React, CSS, Tailwind.

Сервер:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // опциональная поддержка websocket
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // обработка закрытия
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML файлы могут импортировать .tsx, .jsx или .js файлы напрямую, и бандлер Bun автоматически транспилирует и соберет их. Теги `<link>` могут указывать на таблицы стилей, и CSS бандлер Bun их соберет.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

С следующим `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// импортируйте .css файлы напрямую и это работает
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Затем запустите index.ts

```sh
bun --hot ./index.ts
```

Для получения дополнительной информации читайте документацию API Bun в `node_modules/bun-types/docs/**.md`.