#!/usr/bin/env bash

# find deactivated and exclusive tests: fdescirbe / fit / xdescribe / xit
# list=$(find . -name "*spec.ts" | xargs grep 'fit\|fdescribe\|xdescribe\|xit')

# TODO: the following command has to be replaced with the one above
# as soon DSP-Admin is connected with DSP-VRE again

# Find exclusive tests: fdescribe / fit
exclusive=$(find . -name "*spec.ts" | xargs grep 'fit\|fdescribe')

# get all exclusive tests
hits=$(find . -name "*spec.ts" | xargs grep 'fit\|fdescribe' | wc -l)
if [ $hits -ne 0 ]; then
    for i in "${exclusive[@]}"; do
        echo "WARNING: Exclusive tests found: "
        echo "$i"
    done
    exit 1
fi
