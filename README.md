# ZeroToken

Standalone OpenClaw plugin that exposes browser-authenticated web providers without standard API keys.

## Before you install

Current OpenClaw builds may block local plugin installs when a plugin contains
browser-launch or `child_process` code. ZeroToken falls into that bucket, so
manual local installs should use:

```bash
openclaw plugins install . --dangerously-force-unsafe-install
```

If you use `plugins.allow`, add `"zero-token"` there as an explicitly trusted
plugin ID.

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
- offer to install Chrome / Edge / Brave / Chromium automatically if none is found
- let you pick a browser, log in to providers, and start the gateway

### Linux

```bash
git clone https://github.com/wangedoo518/ZeroToken.git
cd ZeroToken
openclaw plugins install . --dangerously-force-unsafe-install
openclaw gateway restart
openclaw models auth login --provider deepseek-web --method browser-login --set-default
```

### Windows PowerShell

```powershell
git clone https://github.com/wangedoo518/ZeroToken.git
cd ZeroToken
openclaw plugins install . --dangerously-force-unsafe-install
openclaw gateway restart
openclaw models auth login --provider deepseek-web --method browser-login --set-default
```

If you modify source files, rebuild before reinstalling:

```bash
npm install
npm run build
openclaw plugins install . --force --dangerously-force-unsafe-install
openclaw gateway restart
```

After installation, verify that OpenClaw loaded the plugin:

```bash
openclaw plugins inspect zero-token --runtime --json
```

To log into a different provider, swap `deepseek-web` for any provider ID from
the supported list below.

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

## Notes

- The plugin integrates only through public `openclaw/plugin-sdk/*` entrypoints.
- Browser credentials are stored through OpenClaw auth profiles and resolved at runtime.
- Chrome/Edge/Brave/Chromium discovery is included for macOS, Linux, and Windows.
