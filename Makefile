# Determine this makefile's path.
# Be sure to place this BEFORE `include` directives, if any.
# THIS_FILE := $(lastword $(MAKEFILE_LIST))
THIS_FILE := $(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

include vars.mk

.PHONY: build-dsp-app-image
build-dsp-app-image: npm version $(BUILD_TAG) ## build and publish DSP APP image locally
	docker build -t $(DSP_APP_IMAGE) .
	docker tag $(DSP_APP_IMAGE) $(DSP_APP_REPO):latest

.PHONY: publish-dsp-app-image
publish-dsp-app-image: build-dsp-app-image ## publish DSP APP Docker image to Docker-Hub
	docker push $(DSP_APP_REPO)

.PHONY: help
help: ## this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.DEFAULT_GOAL := help
