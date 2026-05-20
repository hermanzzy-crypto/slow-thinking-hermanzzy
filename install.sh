#!/usr/bin/env bash
# Slow-thinking cross-platform installer.
# Detects Claude Code / Codex / OpenClaw layouts and symlinks the skill into each.
#
# Usage:  bash install.sh
# Idempotent — safe to re-run.

set -e

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_NAME="slow-thinking"

echo "🏃 Installing slow-thinking from: $SOURCE_DIR"
echo ""

link_into() {
  local target_parent="$1"
  local label="$2"
  if [ ! -d "$target_parent" ]; then
    echo "  ⏭️  $label not detected ($target_parent missing) — skipped"
    return
  fi
  local target="$target_parent/$SKILL_NAME"
  if [ -L "$target" ]; then
    local existing
    existing="$(readlink "$target")"
    if [ "$existing" = "$SOURCE_DIR" ]; then
      echo "  ✅ $label already linked → $target"
      return
    fi
    echo "  🔄 $label re-linking (was → $existing)"
    rm "$target"
  elif [ -e "$target" ]; then
    echo "  ⚠️  $label has existing non-symlink at $target — backing up to $target.bak"
    mv "$target" "$target.bak"
  fi
  ln -s "$SOURCE_DIR" "$target"
  echo "  ✅ $label linked → $target"
}

# 1. Claude Code
mkdir -p "$HOME/.claude/skills" 2>/dev/null || true
link_into "$HOME/.claude/skills" "Claude Code"

# 2. Codex
mkdir -p "$HOME/.codex/skills" 2>/dev/null || true
link_into "$HOME/.codex/skills" "Codex"

# 3. OpenClaw detection (it's a layout overlay on Claude Code's workspace)
if [ -f "$HOME/.claude/workspace/MEMORY.md" ]; then
  echo "  ✅ OpenClaw detected — skill will respect ~/.claude/workspace/MEMORY.md for identity/feishu state"
else
  echo "  ⏭️  OpenClaw not detected — skill will use local state at $SOURCE_DIR/state/"
fi

# 4. Sanity check Node.js (required by scripts/)
if command -v node >/dev/null 2>&1; then
  NODE_VER="$(node -v)"
  echo "  ✅ Node.js available: $NODE_VER"
else
  echo "  ⚠️  Node.js NOT found — fetch-hn.mjs / render.mjs / sediment.mjs will not work."
  echo "      Install Node 18+ first:  brew install node"
fi

# 5. Make scripts executable
chmod +x "$SOURCE_DIR/scripts/"*.mjs 2>/dev/null || true

echo ""
echo "🎉 Done. Try:"
echo "    /slow-thinking          (in Claude Code or Codex)"
echo "    node $SOURCE_DIR/scripts/fetch-hn.mjs    (sanity check)"
