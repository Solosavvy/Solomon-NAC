#!/usr/bin/env bash
set -e

BRANCH_NAME="feat/android-background-audio"
MAIN_BRANCH="main"

echo "========================================================"
echo "Creating Git Branch & Preparing PR: $BRANCH_NAME"
echo "========================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing local git repository..."
    git init
    git config user.name "AI Studio Assistant"
    git config user.email "assistant@aistudio.google.com"
fi

# Switch to main or create it
git checkout -b "$MAIN_BRANCH" 2>/dev/null || git checkout "$MAIN_BRANCH" 2>/dev/null || true

# Checkout feature branch
echo "Creating feature branch $BRANCH_NAME..."
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Add deliverables
git add .env.example \
        capacitor.config.json \
        metadata.json \
        package.json \
        package-lock.json \
        plugins/capacitor-android-audio/ \
        web/src/plugins/nac-audio.ts \
        src/plugins/nac-audio.ts \
        scripts/install-android-plugin.sh \
        android/ \
        .github/workflows/android-build.yml \
        src/ \
        README.md 2>/dev/null || git add .

# Commit changes
git commit -m "feat(android): add Capacitor foreground audio plugin, ExoPlayer service, minimal android project & CI workflow" || echo "No changes to commit or already committed."

echo ""
echo "✓ Branch '$BRANCH_NAME' created and files committed!"
echo ""
echo "Attempting git push to origin..."
if git remote | grep -q "origin"; then
    if git push -u origin "$BRANCH_NAME"; then
        echo "✓ Successfully pushed to origin/$BRANCH_NAME"
        if command -v gh &> /dev/null; then
            echo "Opening Pull Request using GitHub CLI..."
            gh pr create --title "feat(android): ExoPlayer foreground background audio plugin & CI" \
                         --body "Adds Capacitor 5.x Android foreground audio service plugin, ExoPlayer 2.20.0 integration, minimal Android project, install script, and GitHub Actions workflow." \
                         --base main --head "$BRANCH_NAME" || true
        fi
    else
        echo "⚠️ Git push failed or required permissions. Please review instructions."
    fi
else
    echo "Notice: No git remote 'origin' configured yet. To push to GitHub, add a remote:"
    echo "  git remote add origin git@github.com:YOUR_ORG/YOUR_REPO.git"
    echo "  git push -u origin $BRANCH_NAME"
fi
