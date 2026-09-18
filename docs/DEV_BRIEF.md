# st贪吃蛇开发实现简报

## 1. 开发任务

按 `docs/DESIGN.md` 实现浏览器端 MVP。本文给出落地顺序和模块契约；未写明的玩法不得自行扩展。出现歧义时先以 `DESIGN.md` 的规则、数据不变量和状态机为准。

技术基线：TypeScript strict、React、Vite、Canvas 2D、Vitest + Testing Library；关键浏览器流程建议使用 Playwright。项目是纯前端应用，不需要后端、账号或数据库。

## 2. 固定产品常量

```ts
export const BOARD_COLUMNS = 24;
export const BOARD_ROWS = 18;
export const STEP_MS = 125; // 默认 8 格/秒；不要改这个默认值
export const MIN_CPS = 4;
export const MAX_CPS = 15;
export const DEFAULT_CPS = 8;
export const POINTS_PER_FOOD = 10;
export const MAX_CATCH_UP_STEPS = 2;
export const HIGH_SCORE_KEY = 'st-snake.highScore.v1';
export const SPEED_CPS_KEY = 'st-snake.speedCps.v1';
```

速度映射：`stepMs = 1000 / cps`。滑块与存储使用整数格/秒；`BoardConfig.stepMs` 和 RAF 累计器必须读当前值，不能把 `STEP_MS` 冻死在循环里。速度控件放在棋盘正下方，菜单/暂停/结束时仍可见。

初始蛇按“头到尾”为 `[(12, 9), (11, 9), (10, 9)]`，初始方向 `right`。不要把这些值散落在组件中。

## 3. 实现顺序

每一步完成后先运行对应测试或人工检查，再进入下一步。

1. **创建工程与质量基线**
   建立 Vite React TypeScript 工程，开启 TypeScript strict，配置 `dev`、`build`、`test`、`lint` 脚本和测试环境。
   独立验证：空壳页面可启动；`npm run build`、`npm test`、`npm run lint` 均能执行。

2. **定义常量、类型和初始状态**
   建立 `constants.ts`、`types.ts`、`state.ts`，实现 `createInitialState(highScore)`。此时不接 UI。
   独立验证：断言棋盘、初始蛇坐标、方向、0 分、菜单状态和传入的最高分均正确。

3. **实现纯规则核心**
   依次实现方向判断、下一头坐标、墙体/自身碰撞、普通移动、吃食物增长、计分和空格生成。随机源必须可注入。
   独立验证：用固定状态直接调用纯函数，覆盖四方向、尾格可进入、身体不可进入、食物不落蛇身、棋盘占满返回 `null`。

4. **实现状态机和输入缓冲**
   实现开始、暂停、继续、结束、重开，以及“每逻辑步只收第一个合法转向”。事件处理只产生命令或新状态，不直接绘图。
   独立验证：表驱动测试所有合法/非法状态转换；重点测试当前向右时同一逻辑步快速输入“上、左”最终只向上。

5. **实现可变步长游戏循环**
   用 `requestAnimationFrame` 调度、按当前 `board.stepMs` 推进（默认 `125 ms`）；卸载时取消帧并移除监听。暂停/标签页隐藏或改速时清空累计时间，单帧最多追赶 2 步。
   独立验证：使用假时钟或抽出的 accumulator 函数验证未满一步不走、满一步走一步、两倍步长走两步、超量不无限追帧。

6. **实现 Canvas 渲染**
   渲染背景、可辨识网格、蛇头、蛇身、食物；按容器和 DPR 调整清晰度。渲染函数只读状态。
   独立验证：传入静态状态能正确绘制对应格子；改变 CSS 尺寸后棋盘仍完整且坐标不受影响。

7. **组装 React UI**
   接入菜单、分数/最高分、键位提示、暂停层、结束层和原生按钮；实现键盘映射、默认滚动控制和焦点管理。
   独立验证：只用键盘可开始、暂停、继续和重开；菜单/暂停/结束时方向键不改变游戏。

8. **接入最高分和异常降级**
   安全封装 `localStorage`；无效值按 0，访问异常不阻断游戏。
   独立验证：刷新后最高分保留；模拟 `getItem`/`setItem` 抛错后仍可开局和得分。

9. **完成自动化与人工回归**
   按 `TEST_BRIEF.md` 执行 P0，再执行 P1；修复控制台报错、监听器泄漏和响应式问题。
   独立验证：构建、静态检查、单元/组件测试全部通过，Chrome 中所有验收用例有证据。

## 4. 建议目录与文件

```text
src/
  app/
    App.tsx                  # 页面骨架和顶层状态连接
    GameScreen.tsx           # 游戏区域、状态覆盖层和控制按钮
  game/
    constants.ts             # 固定棋盘、速度、分值
    types.ts                 # Point、Snake、GameState、事件类型
    state.ts                 # 初始菜单/新局状态工厂
    reducer.ts               # 状态机和逻辑步编排
    input.ts                 # 键位映射、反向判断、输入缓冲
    movement.ts              # 下一坐标、移动和增长
    collision.ts             # 墙体和自身碰撞
    food.ts                  # 空格枚举和食物生成
    loop.ts                  # 固定/可变步长 accumulator
    speed.ts                 # cps ↔ stepMs 与钳制
  render/
    CanvasBoard.tsx          # Canvas 生命周期和尺寸
    drawBoard.ts             # 无 React 依赖的绘制函数
  storage/
    highScore.ts             # localStorage 最高分安全读写
    speed.ts                 # localStorage 速度偏好安全读写
  styles/
    global.css
  main.tsx
tests/
  unit/
    input.test.ts
    movement.test.ts
    collision.test.ts
    food.test.ts
    reducer.test.ts
    loop.test.ts
    highScore.test.ts
    speed.test.ts
  component/
    App.test.tsx
  e2e/
    game.spec.ts
docs/
  DESIGN.md
  DEV_BRIEF.md
  TEST_BRIEF.md
```

可按工具默认约定调整测试文件位置，但必须保持 `game/` 规则层不依赖 React、Canvas 和 `localStorage`。

## 5. 接口约定

以下是模块边界，不要求逐字使用函数名，但职责和可测试性必须保持。

### 5.1 类型与状态

```ts
type GamePhase = 'menu' | 'running' | 'paused' | 'gameOver';
type Direction = 'up' | 'down' | 'left' | 'right';
type EndReason = 'wall' | 'self' | 'boardFilled' | null;
type RandomSource = () => number; // 约定返回 [0, 1)

interface Point { x: number; y: number }
interface Snake {
  segments: Point[];          // 头在索引 0
  direction: Direction;       // 已生效的移动方向
  pendingDirection: Direction | null;
}
interface GameState {
  phase: GamePhase;
  board: BoardConfig;
  snake: Snake;
  food: Point | null;
  score: number;
  highScore: number;
  endReason: EndReason;
}

createBoardConfig(stepMs?: number): BoardConfig;
createMenuState(highScore: number, stepMs?: number): GameState;
createNewGame(highScore: number, random: RandomSource, stepMs?: number): GameState;
```

`createNewGame` 直接进入 `running`，放置初始食物，并重置输入锁、当前分数和结束原因。

### 5.2 输入

```ts
mapKeyToAction(key: string): InputAction | null;
isOpposite(a: Direction, b: Direction): boolean;
queueDirection(snake: Snake, requested: Direction): Snake;
```

`queueDirection` 规则：

1. 若 `pendingDirection !== null`，原样返回。
2. 若 `requested` 与 `direction` 相同，原样返回；该无操作输入不锁定本步。
3. 若 `requested` 与 `direction` 相反，原样返回；该非法输入不锁定本步。
4. 否则写入 `pendingDirection`。

按键监听层必须忽略用于开始、重开和暂停的 `event.repeat`。不要在 `keydown` 内直接调用移动函数。

### 5.3 移动与碰撞

```ts
nextHead(head: Point, direction: Direction): Point;
isOutside(point: Point, board: BoardConfig): boolean;
isSelfCollision(
  next: Point,
  segments: readonly Point[],
  willGrow: boolean
): boolean;
moveSnake(
  snake: Snake,
  effectiveDirection: Direction,
  willGrow: boolean
): Snake;
```

`isSelfCollision` 检查集合为：

- `willGrow === true`：检查全部现有 `segments`。
- `willGrow === false`：排除当前最后一个尾格后检查，允许头进入即将腾出的尾格。

发生碰撞时不得调用 `moveSnake` 提交非法坐标。`moveSnake` 返回的新蛇应将 `pendingDirection` 清为 `null`。

### 5.4 食物

```ts
listEmptyCells(board: BoardConfig, segments: readonly Point[]): Point[];
spawnFood(
  board: BoardConfig,
  segments: readonly Point[],
  random: RandomSource
): Point | null;
```

选择索引建议为：

```ts
const index = Math.min(
  emptyCells.length - 1,
  Math.floor(random() * emptyCells.length)
);
```

生产代码传 `Math.random`；测试传固定函数。若无空格返回 `null`，上层将结束原因为 `boardFilled`。

### 5.5 状态机与逻辑步

```ts
type GameCommand =
  | { type: 'START' }
  | { type: 'QUEUE_DIRECTION'; direction: Direction }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'VISIBILITY_HIDDEN' }
  | { type: 'SET_SPEED'; cps: number };

reduceGame(
  state: GameState,
  command: GameCommand,
  random: RandomSource
): GameState;

stepGame(state: GameState, random: RandomSource): GameState;
```

`stepGame` 只在 `running` 执行：

1. 取 `pendingDirection ?? direction` 为本步有效方向。
2. 计算下一蛇头，以及它是否等于食物（`willGrow`）。
3. 先判墙，再按 `willGrow` 判自身碰撞。
4. 碰撞则保留碰撞前蛇身和分数，进入 `gameOver`。
5. 无碰撞则移动；若成长，加 10 分并生成新食物。
6. 无空格则进入 `gameOver`，原因 `boardFilled`。

状态转换约束：

- `START` 仅对 `menu` 生效。
- `PAUSE` 仅对 `running` 生效。
- `RESUME` 仅对 `paused` 生效。
- `RESTART` 仅对 `paused`、`gameOver` 生效。
- `TICK` 和 `QUEUE_DIRECTION` 仅对 `running` 生效。
- `VISIBILITY_HIDDEN` 将 `running` 转为 `paused`。
- `SET_SPEED` 在任意阶段只更新 `board.stepMs`（按 `4..15` 钳制），不得改 phase、蛇身、分数或 `pendingDirection`。`START`/`RESTART` 必须带上当前 `stepMs`。

### 5.6 循环

```ts
interface AdvanceResult {
  steps: number;          // 0..2
  remainingMs: number;    // 超量追帧后可归零
}

advanceAccumulator(
  accumulatedMs: number,
  elapsedMs: number,
  stepMs: number,
  maxSteps: number
): AdvanceResult;
```

组件层维护帧 ID、上一帧时间和累计时间，每帧读取当前 `state.board.stepMs`。进入非 `running` 状态、页面隐藏或恢复、或 `stepMs` 变化时，重置上一帧时间和累计时间。不得创建多个并行 RAF 循环。

### 5.7 渲染

```ts
interface RenderMetrics {
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
}

resizeCanvas(canvas: HTMLCanvasElement, metrics: RenderMetrics): void;
drawBoard(
  context: CanvasRenderingContext2D,
  state: GameState,
  viewport: RenderMetrics
): void;
```

Canvas 只表现游戏内容；分数、状态和按钮必须同时存在于 HTML。蛇头应有区别于身体的形状或标记，食物不能只通过颜色区分。

### 5.8 最高分

```ts
readHighScore(storage?: Storage): number;
writeHighScore(score: number, storage?: Storage): void;
sanitizeHighScore(raw: string | null): number;
```

所有存储访问使用 `try/catch`。`sanitizeHighScore` 对缺失、`NaN`、小数、负数返回 0。写入失败不向上抛出导致游戏中断。

### 5.9 速度偏好

```ts
readSpeedCps(storage?: Storage): number;
writeSpeedCps(cps: number, storage?: Storage): void;
sanitizeSpeedCps(raw: string | null): number;
clampCps(cps: number): number;
cpsToStepMs(cps: number): number; // 1000 / clampCps(cps)
stepMsToCps(stepMs: number): number;
```

键名 `st-snake.speedCps.v1`。缺失/非整数/非数字 → `8`；越界整数钳制到 `4` 或 `15`。存储异常不阻断游戏。UI 滑块放在棋盘下方，中文标注慢—快和当前格/秒（及毫秒/步）。

## 6. 自动化测试最低集合

- 初始状态和新局重置。
- 四方向下一坐标。
- 反向输入拒绝、非法输入后可接合法输入、单步第二次合法输入拒绝。
- 普通移动移尾、吃食物不移尾且长度 `+1`、分数 `+10`。
- 四面墙碰撞；身体碰撞；普通移动进入旧尾格合法。
- 食物永不生成在蛇上；固定随机值映射确定；占满棋盘返回 `null`。
- 菜单、进行中、暂停、结束的全部允许和禁止转换。
- 固定步长与最多追赶 2 步。
- 最高分有效值、脏值和存储异常。
- 速度钳制、默认 8 格/秒、脏存储回落、改速不破坏暂停/输入锁。
- UI 可通过按钮和键盘开始、暂停、继续、重开，并显示分数与结束原因。

不应为了覆盖率写无断言或仅快照测试。核心 `game/` 分支应以行为断言覆盖，覆盖率数值不是唯一验收标准。

## 7. Definition of Done（开发自测清单）

### 7.1 功能

- [ ] 菜单显示真实游戏名、玩法和键位，可用按钮、Enter 或 Space 开始。
- [ ] 蛇默认以 8 格/秒稳定移动；滑块可调 4–15 格/秒；方向键和 WASD 均有效。
- [ ] 同一逻辑步只接受首个合法转向，任何快速连按都不能造成 180° 掉头。
- [ ] 食物只在空格出现；吃到后长度增加 1、分数增加 10、生成下一食物。
- [ ] 四面撞墙和撞身体均结束，死亡步不提交非法蛇头。
- [ ] 普通移动进入即将移走的尾格不会误判自撞。
- [ ] 暂停期间状态冻结；继续后不会立即连跳。
- [ ] 后台标签页自动暂停，回到前台不自动继续。
- [ ] 结束原因、当前分和最高分显示正确；重开完整重置当前局。
- [ ] 最高分刷新后保留，存储不可用时游戏仍可玩。

### 7.2 工程质量

- [ ] `npm run build` 成功。
- [ ] `npm run lint` 无错误。
- [ ] `npm test` 全部通过，无 `.only`、跳过的 P0 测试或无意义快照。
- [ ] TypeScript strict 下无类型错误，不用 `any` 绕过核心模型。
- [ ] 规则层无 React、Canvas、DOM 和存储依赖，随机源可注入。
- [ ] 键盘、RAF、ResizeObserver/窗口监听器在卸载时正确清理。
- [ ] Chrome 控制台游玩完整一局无未处理异常、React 警告或资源 404。
- [ ] 320 px 宽视口无横向溢出；高 DPR 下 Canvas 不模糊或裁切。
- [ ] 原生按钮可聚焦，焦点可见；状态、分数和操作说明有文本版本。
- [ ] `TEST_BRIEF.md` 的全部 P0 和 P1 已执行并通过。

## 8. 明确禁止项

- 不做后端、账号、在线排行、多人、广告或分析埋点。
- 不做关卡、障碍、道具、皮肤、音效、粒子特效、屏幕震动或复杂转场。
- 不做随分数自动加速、穿墙、可配置棋盘；不要改默认 `STEP_MS=125`、棋盘 24×18 或 +10 分。玩家速度滑块是允许的。
- 不引入 Redux 等全局状态库、物理引擎、游戏引擎或第二套 UI 框架。
- 不把核心规则写进 React 组件、Canvas 绘制函数或键盘事件回调。
- 不用 DOM 像素位置做碰撞，不用渲染帧数决定蛇速。
- 不允许食物生成后再递归“碰运气”避开蛇身；应从空格集合一次选择，保证终止。
- 不把高分或得分作为字符串在核心状态中运算。
- 不通过关闭 lint、降低 strict、滥用 `any`、吞掉非存储异常来让构建变绿。
- 不以自动化测试替代人工浏览器验收，也不提交密钥、生成产物或调试日志。
