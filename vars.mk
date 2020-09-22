DSP_APP_REPO := daschswiss/dsp-app

ifeq ($(BUILD_TAG),)
	BUILD_TAG := $(shell git describe --tag --abbrev=0)
endif
ifeq ($(BUILD_TAG),)
	BUILD_TAG := $(shell git rev-parse --verify HEAD)
endif

ifeq ($(DSP_APP_IMAGE),)
	DSP_APP_IMAGE := $(DSP_APP_REPO):$(BUILD_TAG)
endif
