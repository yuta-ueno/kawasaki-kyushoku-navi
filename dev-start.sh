#!/bin/bash
echo "🚀 かわさき給食ナビ 開発環境起動中..."

# Git の状態確認
echo "📋 Git Status:"
git status --short

# 依存関係確認
echo "📦 Installing dependencies..."
npm install

# 開発サーバー起動
echo "🏃 Starting development server..."
npm run dev
