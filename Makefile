# Determine this makefile's path.
# Be sure to place this BEFORE `include` directives, if any.
# THIS_FILE := $(lastword $(MAKEFILE_LIST))
THIS_FILE := $(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

include vars.mk

#################################
# Test and lint targets
#################################
.PHONY: find-ignored-tests
find-ignored-tests: ## find all ignored tests (e.g. fdescribe)
	./find-ignored-tests.sh

#################################
# Documentation targets
#################################

.PHONY: docs-build
docs-build: ## build docs into the local 'site' folder
	mkdocs build --strict

.PHONY: docs-serve
docs-serve: ## serve docs for local viewing
	mkdocs serve --strict

.PHONY: docs-install-requirements
docs-install-requirements: ## install requirements
	pip3 install -r docs/requirements.txt

.PHONY: docs-clean
docs-clean: ## cleans the project directory
	@rm -rf site/

.PHONY: docs-lint
docs-lint: ## runs the markdownlint linter on the docs
	docker run -v $$(pwd):/workdir ghcr.io/igorshubovych/markdownlint-cli:latest --config .markdownlint.json -i docs/contribution/release-notes.md -i docs/index.md --disable MD033 -- "docs/**/*.md"

#################################
# Build and publish targets
#################################
.PHONY: docker-build-app
docker-build-app: app-build-prod ## build and publish DSP-APP Docker image locally
	docker buildx build -t $(DSP_APP_IMAGE) --load .

.PHONY: docker-image-tag
docker-image-tag: ## prints the docker image tag
	@echo $(BUILD_TAG)

.PHONY: docker-publish-app
docker-publish-app: app-build-prod ## publish DSP-APP Docker image to Docker-Hub for AMD64 and ARM64
	docker buildx build --platform linux/amd64,linux/arm64/v8 --build-arg build_tag=$(BUILD_TAG) -t $(DSP_APP_IMAGE) --push .


.PHONY: docker-publish
docker-publish: docker-publish-app ## publish all Docker images in the monorepo.

.PHONY: app-build-prod
app-build-prod: install-dependencies
	npx nx run dsp-app:build:production

.PHONY: install-dependencies
install-dependencies:
	npm install

.PHONY: help
help: ## this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.DEFAULT_GOAL := help
