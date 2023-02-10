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

.PHONY: docs-publish
docs-publish: ## build and publish docs to github Pages
	mkdocs gh-deploy

.PHONY: docs-build
docs-build: ## build docs into the local 'site' folder
	mkdocs build

.PHONY: docs-serve
docs-serve: ## serve docs for local viewing
	mkdocs serve

.PHONY: docs-install-requirements
docs-install-requirements: ## install requirements
	pip3 install -r docs/requirements.txt

.PHONY: docs-clean
docs-clean: ## cleans the project directory
	@rm -rf site/

#################################
# Build and publish targets
#################################
.PHONY: docker-build
docker-build: ## build and publish DSP-APP Docker image locally
	docker buildx build -t $(DSP_APP_IMAGE) -t $(DSP_APP_REPO):latest --load .

.PHONY: docker-publish
docker-publish4: ## publish DSP-APP Docker image to Docker-Hub for AMD64 and ARM64 with latest tag
	docker buildx build --platform linux/amd64,linux/arm64/v8 -t $(DSP_APP_IMAGE) -t $(DSP_APP_REPO):latest --push .

.PHONY: docker-publish-from-branch
docker-publish-from-branch: ## publish DSP-APP Docker image to Docker-Hub for AMD64 and ARM64 w/o latest tag
	docker buildx build --platform linux/amd64,linux/arm64/v8 -t $(DSP_APP_IMAGE) --push .

.PHONY: build-dsp-app-image
build-dsp-app-image: ## build DSP APP image locally
	docker build -t $(DSP_APP_IMAGE) .
	docker tag $(DSP_APP_IMAGE) $(DSP_APP_REPO):latest

.PHONY: publish-dsp-app-image
publish-dsp-app-image: build-dsp-app-image ## publish DSP APP Docker image to Docker-Hub
	docker image push --all-tags $(DSP_APP_REPO)

.PHONY: help
help: ## this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.DEFAULT_GOAL := help
