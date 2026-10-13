.PHONY: help setup install-hooks badge bump dev build

help:
	@echo "LID-sim development targets:"
	@echo "  make setup          - Setup symlinks in public/ and install git hooks"
	@echo "  make install-hooks  - Install pre-push git hook"
	@echo "  make badge          - Generate logo.svg and badge.svg via logogen"
	@echo "  make bump [V=x.y.z] - Bump version, regenerate assets, and commit"
	@echo "  make dev            - Start Vite dev server"
	@echo "  make build          - Build production assets"

setup:
	ln -sf ../data/questions/questions.json public/questions.json
	ln -sf ../data/sets/sets.json public/sets.json
	$(MAKE) install-hooks
	@echo "✓ Setup complete"

install-hooks:
	cp .github/hooks/pre-push .git/hooks/pre-push
	chmod +x .git/hooks/pre-push
	@echo "✓ Pre-push hook installed"

badge:
	@node tools/generate_logo.mjs

bump:
	@node tools/bump.mjs $(V)

dev:
	npm run dev

build:
	npm run build
