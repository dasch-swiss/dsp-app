DSP_APP_REPO := daschswiss/dsp-app

ifeq ($(BUILD_TAG),)
	BUILD_TAG := $(shell git describe --tag --match 'v[0-9]*' --dirty --abbrev=7 --always)
endif

ifeq ($(DSP_APP_IMAGE),)
	DSP_APP_IMAGE := $(DSP_APP_REPO):$(BUILD_TAG)
endif
