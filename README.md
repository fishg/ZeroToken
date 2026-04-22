# ZeroToken

Standalone OpenClaw plugin that exposes browser-authenticated web providers without standard API keys.

## Install on another machine

This repository is self-contained. The built `dist/` bundle is committed, so you can install it directly after cloning.

### macOS

After cloning, the recommended zero-prerequisite path on macOS is:

```bash
git clone https://github.com/wangedoo518/ZeroToken.git
cd ZeroToken
chmod +x Zero-Token.command
./Zero-Token.command
```

`Zero-Token.command` can automatically:

- install Homebrew if it is missing
- install Node.js 22 if it is missing
- launch the macOS setup flow

If Node.js 22 is already installed, you can also run:

```bash
npm run mac
```

The macOS launcher will:

- install a local OpenClaw runtime under `.zero-token-runtime/`
- install the plugin into OpenClaw
- patch the local OpenClaw `api-registry.js`
- offer to install Chrome / Edge / Brave / Chromium automatically if none is found
- let you pick a browser, log in to providers, and start the gateway

### Linux

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
