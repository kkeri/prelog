#!/bin/sh

thisdir=$(dirname $0)
prgname=$(basename $0)

node "$thisdir/../lib/cli/$prgname.js" "$@"
