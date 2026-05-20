#!/usr/bin/env bash
# Slow-thinking cross-platform installer.
# Installs TWO skills: slow-thinking (main) + setup-slow-thinking (one-time config wizard).
# Detects Claude Code / Codex / OpenClaw layouts and symlinks both skills into each.
#
# Usage:  bash install.sh
# Idempotent — safe to re-run.

set -e

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_SKILL_NAME="slow-thinking"
SETUP_SKILL_NAME="setup-slow-thinking"
SETUP_SUBDIR="$SOURCE_DIR/$SETUP_SKILL_NAME"

echo "🏃 Installing slow-thinking from: $SOURCE_DIR"
echo ""

link_one() {
  local target_parent="$1"
  local skill_name="$2"
  local src="$3"
  local target="$target_parent/$skill_name"

  if [ -L "$target" ]; then
    local existing
    existing="$(readlink "$target")"
    if [ "$existing" = "$src" ]; then
      echo "    ✅ $skill_name already linked"
      return
    fi
    echo "    🔄 $skill_name re-linking (was -> $existing)"
    rm "$target"
  elif [ -e "$target" ]; then
    echo "    ⚠️  $skill_name has existing non-symlink at $target — backing up to $target.bak"
    mv "$target" "$target.bak"
  fi
  ln -s "$src" "$target"
  echo "    ✅ $skill_name -> $target"
}

install_into() {
  local target_parent="$1"
  local label="$2"
  if [ ! -d "$target_parent" ]; then
    echo "  ⏭️  $label not detected ($target_parent missing) — skipped"
    return
  fi
  echo "  📦 $label"
  link_one "$target_parent" "$MAIN_SKILL_NAME"  "$SOURCE_DIR"
  link_one "$target_parent" "$SETUP_SKILL_NAME" "$SETUP_SUBDIR"
}

# 1. Claude Code
mkdir -p "$HOME/.claude/skills" 2>/dev/null || true
install_into "$HOME/.claude/skills" "Claude Code"

# 2. Codex
mkdir -p "$HOME/.codex/skills" 2>/dev/null || true
install_into "$HOME/.codex/skills" "Codex"

# 3. OpenClaw detection (layout overlay on Claude Code's workspace)
echo ""
if [ -f "$HOME/.claude/workspace/MEMORY.md" ]; then
  echo "  ✅ OpenClaw detected — state.mjs will respect ~/.claude/workspace/MEMORY.md"
else
  echo "  ⏭️  OpenClaw not detected — state stored in $SOURCE_DIR/state/"
fi

# 4. Sanity check Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VER="$(node -v)"
  echo "  ✅ Node.js available: $NODE_VER"
else
  echo "  ⚠️  Node.js NOT found — install Node 18+ first:  brew install node"
fi

# 5. Make scripts executable
chmod +x "$SOURCE_DIR/scripts/"*.mjs 2>/dev/null || true

echo ""
echo "🎉 Done. Next steps:"
echo "    1. /setup-slow-thinking     # one-time config (身份/Obsidian/飞书)"
echo "    2. /slow-thinking           # daily 5-min thinking session"
