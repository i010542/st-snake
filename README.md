# st贪吃蛇

本地离线的经典贪吃蛇。可以在浏览器里开发，也可以打包成 Windows 桌面应用。无需登录、无需联网。

应用标识：`com.i010542.st-snake`  
默认可执行文件：`st贪吃蛇.exe`

## 本地开发

```bash
npm install
npm run dev
```

浏览器开发服务器默认使用 Vite。`window.desktop` 不存在时会自动退化为网页版，不会报错。

同时启动 Vite 和 Electron：

```bash
npm run dev:desktop
```

关闭 Electron 窗口后，相关开发子进程会一起退出。

## 常用脚本

```bash
npm run build          # 类型检查 + Web 构建
npm run build:desktop  # 构建渲染进程、主进程和预加载脚本
npm run dist:win       # 生成 Windows NSIS 安装包和 Portable 免安装版
npm run lint           # 检查前端与 Electron TypeScript
npm test               # 单元与组件测试
npm run test:e2e       # Web 关键流程
npm run test:desktop   # Electron 生产构建冒烟测试
```

## 操作

- 方向键或 WASD：转向
- P / Esc：暂停或继续
- Enter / 空格：开始或重开
- 桌面菜单 `Ctrl+N`：新游戏（不确认，保留最高分和设置）
- `F11`：全屏
- `F1`：操作说明
- 设置打开时，Esc 先关闭设置

## Windows 安装与卸载

先执行：

```bash
npm run dist:win
```

产物在 `release/`：

- NSIS 安装包：适合普通用户安装、开始菜单/桌面快捷方式和卸载
- Portable：免安装，双击即可运行

安装不需要管理员权限。卸载使用系统「应用和功能」或安装目录中的卸载程序。Portable 版直接删除文件即可。

首版安装包**没有代码签名**。Windows 可能显示 SmartScreen 提示，这是未签名应用的正常系统行为，不是绕过安全提示的理由。

当前图标是仓库内生成的原创首版图标（深蓝底、绿色像素蛇和橙色食物）。发布前如需替换，请更新 `assets/icon.png` 与 `assets/icon.ico`，并检查任务栏、标题栏、开始菜单和桌面快捷方式。

## 设置与存档

本机只保存：

- 最高分 `st-snake.highScore.v1`
- 速度 `st-snake.speedCps.v1`
- 音效 `st-snake.soundEnabled.v1`
- 音量 `st-snake.volume.v1`
- 网格 `st-snake.gridVisible.v1`
- 窗口位置（Electron 用户数据目录中的 `window-state.json`）

进行中的一局不会在重启后恢复。「恢复默认设置」不会清除最高分。

## 设计文档

- `docs/DESIGN.md`：玩法规则
- `docs/DEV_BRIEF.md`：Web 模块边界
- `docs/TEST_BRIEF.md`：玩法验收
- `docs/WINDOWS_DESKTOP_DESIGN.md`：桌面化、窗口、打包和验收
