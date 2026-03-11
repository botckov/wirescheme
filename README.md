# WireScheme — Конструктор схем проводов v2.0

React + TypeScript + Vite портирование оригинального HTML/Canvas проекта.

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер
npm run dev

# 3. Открыть http://localhost:5173
```

## Структура проекта

```
wirescheme/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Корневой компонент, оркестрирует всё
│   │   ├── Canvas.tsx           # SVG-холст, drag & drop, zoom/pan
│   │   ├── Node.tsx             # SVG-компонент коннектора (фишки)
│   │   ├── Wire.tsx             # SVG-компонент провода (Bezier path)
│   │   ├── Toolbar.tsx          # Верхняя панель инструментов
│   │   ├── LibraryPanel.tsx     # Левая панель — библиотека компонентов
│   │   ├── PropertiesPanel.tsx  # Правая панель — свойства выбранного
│   │   ├── ColorPickerPopup.tsx # Попап выбора цвета при создании провода
│   │   └── Toast.tsx            # Уведомления
│   ├── hooks/
│   │   └── useAppReducer.ts     # useReducer: весь app state + actions
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces (Connector, Wire, …)
│   ├── utils/
│   │   └── geometry.ts          # Геометрические расчёты (пины, Bezier, hit-test)
│   ├── constants/
│   │   └── index.ts             # LIBRARY, WIRE_COLORS, токены
│   ├── styles/
│   │   └── global.css           # Дизайн-система (CSS vars + все классы)
│   └── main.tsx                 # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Архитектурные решения

### State Management
- `useReducer` в `App.tsx` — единственный источник истины
- Actions: `ADD_CONNECTOR`, `MOVE_CONNECTOR`, `ADD_WIRE`, `DELETE_WIRE`, `UNDO`, и др.
- History stack (до 20 шагов) встроен в reducer

### SVG Rendering
- Всё рендерится в одном `<svg>` контейнере в `Canvas.tsx`
- Провода — `<path>` с кубическими кривыми Безье
- Пин-сетка коннекторов — SVG `<rect>` с `<feDropShadow>` фильтрами
- Viewport-трансформация через `<g transform="translate/scale">`
- Пунктирная ghost-линия при создании соединения

### Drag & Drop
- `onPointerDown/Move/Up` + `setPointerCapture` — плавное перетаскивание без потери захвата
- Drag из библиотеки — нативный HTML5 `draggable` + `dragstart/drop`

### Keyboard Shortcuts
| Клавиша     | Действие                   |
|-------------|----------------------------|
| `V`         | Режим выбора               |
| `H`         | Режим панорамирования      |
| `W`         | Показать/скрыть провода    |
| `Ctrl+Z`    | Отменить                   |
| `Delete`    | Удалить выбранное          |
| `ESC`       | Отменить соединение        |

## Дальнейшее развитие

- [ ] Minimap
- [ ] Context menu (правый клик)
- [ ] Сетка привязки (snap to grid) при перемещении
- [ ] Экспорт схемы в SVG/PNG
- [ ] Множественное выделение (Shift+click, лассо)
- [ ] Аннотации / текстовые метки
- [ ] Тёмная / светлая тема
