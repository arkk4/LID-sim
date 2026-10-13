.PHONY: help setup install-hooks badge dev build

help:
	@echo "LID-sim development targets:"
	@echo "  make setup          - Setup symlinks in public/ and install git hooks"
	@echo "  make install-hooks  - Install pre-push git hook"
	@echo "  make badge          - Generate logo.svg and badge.svg via logogen"
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
	@VERSION=$$(node -e "console.log(require('./version.json').version)") && \
	node $$HOME/git-repos/logogen/logogen.mjs \
	  --name "LID-sim" --version "v$$VERSION" \
	  --pattern rings --palette "#09090b,#27272a,#52525b,#a1a1aa,#fafafa" \
	  --out public/logo.svg && \
	node $$HOME/git-repos/logogen/logogen.mjs \
	  --badge --name "LID-sim" --version "v$$VERSION" \
	  --pattern rings --palette "#09090b,#27272a,#52525b,#a1a1aa,#fafafa" \
	  --out public/badge.svg && \
	echo "✓ logo.svg & badge.svg updated (v$$VERSION)"

dev:
	npm run dev

build:
	npm run build
