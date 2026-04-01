.PHONY: dev backend frontend analytics clean

# ==============================================================================
# 開発用コマンド (Development Commands)
# ==============================================================================

# 『make dev』で2つのサービス（バックエンド・フロントエンド）を同時に起動します
# ※ -j 2 は「2つのタスクを並列で実行する」というオプションです。Ctrl+Cを押すとすべて順番に停止します。
dev:
	@echo "🚀 Starting microservices (Backend, Frontend)..."
	@echo "⚠️ Notice: Python Analytics Engine is expected to be running on the Windows Host!"
	make -j 2 backend frontend

backend:
	@echo "🟢 Starting Hono / Cloudflare Workers Backend (Port 8787)..."
	cd apps/backend && bun run dev

frontend:
	@echo "🌐 Starting vinext Frontend (Port 3001)..."
	cd apps/frontend && bun run dev:vinext

# ==============================================================================
# データベース管理コマンド (Database Management)
# ==============================================================================
init-db:
	@echo "🗄️ Initializing Cloudflare D1 Local Database..."
	cd apps/backend && bunx wrangler d1 execute gold_vola_db --local --file=./migrations/0001_initial_schema.sql

setup: init-db
	@echo "📦 Setup complete! You can now run 'make dev'."

# ==============================================================================
# お掃除コマンド (Utility)
# ==============================================================================
# 『make clean』で、ポートが裏で残ってしまった（address already in use）時のゾンビプロセスを一掃します
clean:
	@echo "🧹 Cleaning up zombie processes..."
	-fuser -k 8080/tcp 2>/dev/null || true
	-fuser -k 8787/tcp 2>/dev/null || true
	-fuser -k 3000/tcp 2>/dev/null || true
	-fuser -k 8000/tcp 2>/dev/null || true
	@echo "✨ Clean up complete!"
