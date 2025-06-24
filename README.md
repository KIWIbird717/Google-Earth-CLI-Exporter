# TypeScript Template Project

Проект для работы с 3D данными Google Earth, переписанный на TypeScript с использованием ООП принципов.

## Структура проекта

```
ts-template/
├── src/
│   ├── dump_obj.ts          # Основной TypeScript файл (ООП версия)
│   ├── constants/
│   │   └── constants.ts     # Константы проекта
│   └── index.ts             # Точка входа
├── scripts/                 # JavaScript утилиты с типизацией
│   ├── decode-texture.js    # Декодирование текстур
│   ├── parse-command-line.js # Парсинг аргументов командной строки
│   ├── get-url.js          # Загрузка URL с retry логикой
│   ├── utils.js            # Основные утилиты
│   ├── decode-resource.js  # Декодирование ресурсов
│   ├── convert-lat-long-to-octant.js # Конвертация координат в октанты
│   ├── convert-lat-long-to-octant.example.js # Пример использования
│   └── *.d.ts              # TypeScript декларации
├── types/
│   └── index.d.ts          # Основные типы проекта
├── build/                  # Скомпилированные файлы
├── package.json
├── tsconfig.json
└── README.md
```

## Основные типы

### Node (Узел)

```typescript
interface Node {
  meshes: Record<string, Mesh>;
}
```

### Mesh (Сетка)

```typescript
interface Mesh {
  texture: Texture;
  vertices: Float32Array;
  indices: Uint32Array;
  normals?: Float32Array;
  uvOffsetAndScale?: Float32Array;
  layerBounds?: Float32Array;
  vertexAlphas?: Uint8Array;
  numNonDegenerateTriangles: number;
  meshId: number;
  octantCounts?: Uint32Array;
}
```

### Texture (Текстура)

```typescript
interface Texture {
  textureFormat: number; // 1 для JPEG, 6 для DXT1
  bytes: number[];
  width: number;
  height: number;
}
```

### LatLonBox (Границы координат)

```typescript
interface LatLonBox {
  n: number; // north latitude
  s: number; // south latitude
  w: number; // west longitude
  e: number; // east longitude
}
```

### FoundOctants (Найденные октанты)

```typescript
interface FoundOctants {
  [level: number]: {
    octants: string[];
    box: LatLonBox;
  };
}
```

## ООП архитектура в dump_obj.ts

### Semaphore

Класс для управления параллельными операциями:

```typescript
class Semaphore {
  async wait(highestPriority?: boolean): Promise<void>;
  signal(): void;
}
```

### ObjWriter

Класс для записи OBJ файлов:

```typescript
class ObjWriter {
  writeNode(node: Node, nodeName: string, exclude: number[]): void
  private writeMeshOBJ(...): string
}
```

### NodeSearcher

Класс для поиска и загрузки узлов:

```typescript
class NodeSearcher {
  async search(k: string, maxLevel?: number): Promise<boolean>;
  private checkNodeAtNodePath(nodePath: string): Promise<NodeCheckResult | null>;
}
```

### DumpObjApp

Основной класс приложения:

```typescript
class DumpObjApp {
  async run(): Promise<void>;
  private nodeFound(path: string): void;
  private nodeDownloaded(path: string, node: Node, octantsToExclude: number[]): void;
}
```

## Утилиты

### convert-lat-long-to-octant.js

Скрипт для конвертации географических координат в октанты Google Earth:

```javascript
const initConvertLatLongToOctant = require('./scripts/convert-lat-long-to-octant');
const convertFunction = initConvertLatLongToOctant(utils);

// Конвертация координат Москвы
const result = await convertFunction(55.7558, 37.6176, 10);
```

**Параметры:**

- `lat` - широта (-90 до 90)
- `lon` - долгота (-180 до 180)
- `maxLevel` - максимальный уровень глубины октантов

**Возвращает:** объект с найденными октантами по уровням

## Использование

### Установка зависимостей

```bash
npm install
```

### Разработка

```bash
npm run dev
```

### Сборка

```bash
npm run build
```

### Запуск

```bash
npm start
```

### Проверка типов

```bash
npm run type-check
```

### Пример конвертации координат

```bash
node scripts/convert-lat-long-to-octant.example.js
```

## Преимущества TypeScript версии

1. **Типобезопасность**: Все функции и переменные имеют строгую типизацию
2. **ООП архитектура**: Код организован в классы с четким разделением ответственности
3. **Лучшая читаемость**: Код более структурирован и понятен
4. **IDE поддержка**: Автодополнение, навигация по коду, рефакторинг
5. **Обработка ошибок**: Компилятор TypeScript выявляет ошибки на этапе разработки
6. **Модульность**: Каждый класс отвечает за свою область функциональности

## Конфигурация

Проект использует строгие настройки TypeScript:

- `strict: true` - включены все строгие проверки
- `allowJs: true` - поддержка JavaScript файлов
- `checkJs: false` - отключена проверка типов в JavaScript файлах
- `esModuleInterop: true` - совместимость с CommonJS модулями

## Скрипты

- `dev` - запуск в режиме разработки с ts-node
- `build` - компиляция TypeScript в JavaScript
- `start` - запуск скомпилированного приложения
- `type-check` - проверка типов без компиляции
- `lint` - проверка кода с ESLint
