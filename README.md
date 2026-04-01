# ZeroToken

Standalone OpenClaw plugin that exposes browser-authenticated web providers without standard API keys.

## Install on another machine

This repository is self-contained. The built `dist/` bundle is committed, so you can install it directly after cloning.

### macOS / Linux

```bash
git clone https://github.com/wangedoo518/ZeroToken.git
cd ZeroToken
openclaw plugins install .
openclaw models auth login --provider deepseek-web --set-default
```

### Windows PowerShell

```powershell
git clone https://github.com/wangedoo518/ZeroToken.git
cd ZeroToken
openclaw plugins install .
openclaw models auth login --provider deepseek-web --set-default
```

If you modify source files, rebuild before reinstalling:

```bash
npm install
npm run build
openclaw plugins install .
```

## Supported providers

- `chatgpt-web`
- `claude-web`
- `deepseek-web`
- `doubao-web`
- `gemini-web`
- `glm-intl-web`
- `glm-web`
- `grok-web`
- `kimi-web`
- `perplexity-web`
- `qwen-cn-web`
- `qwen-web`
- `xiaomimo-web`

## Notes

- The plugin uses the host OpenClaw runtime via `openclaw/plugin-sdk/core`.
- Browser credentials are stored through OpenClaw auth profiles and resolved at runtime.
- Chrome/Edge/Brave/Chromium discovery is included for macOS, Linux, and Windows.
