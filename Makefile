# Determine this makefile's path.
# Be sure to place this BEFORE `include` directives, if any.
# THIS_FILE := $(lastword $(MAKEFILE_LIST))
THIS_FILE := $(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

include vars.mk

define update-version
	# update version: first as dry-run.
	# The user has to confirm the update.
	# If everything is fine, it will commit and push the updated packages
	CURRENT_VERSION=`node -pe "require('./package.json').version"` && \
	npm version $(1) --preid=$(2) --git-tag-version=false --commit-hooks=false && \
	NEXT_VERSION=`node -pe "require('./package.json').version"` && \
	echo "This will update from $$CURRENT_VERSION to $$NEXT_VERSION ($(1)). Do you want to continue? [Y/n]" && \
	read ans && \
	([ $${ans:-N} != Y ] && npm version $$CURRENT_VERSION --git-tag-version=false --commit-hooks=false && exit 1) || \
	([ $${ans:-N} == Y ]) && \
	git add package.json && \
	git add package-lock.json && \
	git commit -m "release($(1)): $$NEXT_VERSION" && \
	git push
endef

.PHONY: build-dsp-app-image
build-dsp-app-image: ## build and publish DSP APP image locally
	docker build -t $(DSP_APP_IMAGE) .
	docker tag $(DSP_APP_IMAGE) $(DSP_APP_REPO):latest

.PHONY: publish-dsp-app-image
publish-dsp-app-image: build-dsp-app-image ## publish DSP APP Docker image to Docker-Hub
	docker push $(DSP_APP_REPO)

.PHONY: next-release-candidate
next-release-candidate: ## updates version to next release candidate e.g. from 3.0.0-rc.0 to 3.0.0-rc.1 or from 3.0.0 to 3.0.1-rc.0
	@$(call update-version,prerelease,rc)

.PHONY: release-patch
release-patch: ## updates version to next PATCH version e.g. from 3.0.0 to 3.0.1
	@$(call update-version,patch)

.PHONY: prerelease-patch
prerelease-patch: ## updates version to next PATCH as release-candidate e.g. from 3.0.1 to 3.0.2-rc.0
	@$(call update-version,prepatch,rc)

.PHONY: release-minor
release-minor: ## updates version to next MINOR version e.g. from 3.0.0 to 3.1.0
	@$(call update-version,minor)

.PHONY: prerelease-minor
prerelease-minor: ## updates version to next MINOR as release-candidate e.g. from 3.1.0 to 3.2.0-rc.0
	@$(call update-version,preminor,rc)

.PHONY: release-major
release-major: ## updates version to next MAJOR version e.g. from 3.0.0 to 4.0.0
	@$(call update-version,major)

.PHONY: prerelease-major
prerelease-major: ## updates version to next MAJOR as release candidate e.g. from 4.0.0 to 5.0.0-rc.0
	@$(call update-version,premajor,rc)


.PHONY: help
help: ## this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST) | sort

.DEFAULT_GOAL := help
