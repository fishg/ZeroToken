#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

print_banner() {
  clear
  echo
  echo "  =============================================="
  echo "       Zero-Token (macOS)"
  echo "       Auto-setup launcher"
  echo "  =============================================="
  echo
}

pause_on_error() {
  local status="$1"
  if [ "$status" -ne 0 ]; then
    echo
    echo "Zero-Token exited with status $status"
    echo "Press Enter to close..."
    read -r _
  fi
}

detect_brew() {
  if [ -x "/opt/homebrew/bin/brew" ]; then
    echo "/opt/homebrew/bin/brew"
    return 0
  fi
  if [ -x "/usr/local/bin/brew" ]; then
    echo "/usr/local/bin/brew"
    return 0
  fi
  command -v brew 2>/dev/null
}

setup_brew_env() {
  BREW_BIN="$(detect_brew)"
  if [ -n "$BREW_BIN" ]; then
    eval "$("$BREW_BIN" shellenv)"
  fi
}

install_homebrew() {
  print_banner
  echo "  Homebrew not found. Installing Homebrew automatically..."
  echo
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
}

ensure_homebrew() {
  setup_brew_env
  if [ -n "$BREW_BIN" ]; then
    return 0
  fi

  install_homebrew || return 1
  setup_brew_env

  if [ -z "$BREW_BIN" ]; then
    echo "  Failed to initialize Homebrew."
    return 1
  fi
}

find_node22_bin() {
  local node_path=""

  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -p 'process.versions.node.split(".")[0]')"
    if [ "$major" -ge 22 ] 2>/dev/null; then
      command -v node
      return 0
    fi
  fi

  if [ -n "$BREW_BIN" ]; then
    local prefix
    prefix="$("$BREW_BIN" --prefix node@22 2>/dev/null)"
    if [ -n "$prefix" ] && [ -x "$prefix/bin/node" ]; then
      echo "$prefix/bin/node"
      return 0
    fi
  fi

  return 1
}

install_node22() {
  print_banner
  echo "  Installing Node.js 22 with Homebrew..."
  echo
  "$BREW_BIN" install node@22
}

ensure_node22() {
  NODE_BIN="$(find_node22_bin)"
  if [ -n "$NODE_BIN" ]; then
    return 0
  fi

  ensure_homebrew || return 1
  install_node22 || return 1
  NODE_BIN="$(find_node22_bin)"

  if [ -z "$NODE_BIN" ]; then
    echo "  Failed to locate Node.js 22 after installation."
    return 1
  fi
}

main() {
  if [ "$(uname -s)" != "Darwin" ]; then
    echo "This launcher is for macOS only."
    return 1
  fi

  ensure_node22 || return 1
  "$NODE_BIN" "$SCRIPT_DIR/Zero-Token-mac.mjs"
}

main
status=$?
pause_on_error "$status"
exit "$status"
