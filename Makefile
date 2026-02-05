COMPOSE = docker compose -f docker-compose.local.yml

.PHONY: up down logs restart reset-db health setup

## ---- Local-stack helpers ----

setup: ## Copy env templates and boot the stack
	@test -f backend/.env.local  || cp backend/.env.local.example  backend/.env.local
	@test -f frontend/.env.local || cp frontend/.env.local.example frontend/.env.local
	@echo "✓ .env.local files ready — edit them if needed, then run: make up"

up: ## Start all services (build if needed)
	$(COMPOSE) up --build -d

down: ## Stop all services
	$(COMPOSE) down

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

restart: ## Restart all services
	$(COMPOSE) restart

reset-db: ## Destroy and recreate the local Postgres volume
	$(COMPOSE) down -v
	@echo "✓ Postgres volume removed. Run 'make up' to recreate."

health: ## Check backend health endpoints
	@echo "--- /health ---"
	@curl -sf http://localhost:8000/health || echo "FAIL"
	@echo "\n--- /health/db ---"
	@curl -sf http://localhost:8000/health/db || echo "FAIL"
	@echo ""
