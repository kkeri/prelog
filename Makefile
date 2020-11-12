
TAP = node_modules/.bin/tap -no-cov --no-coverage-report
TSC = node_modules/.bin/tsc

all: libdir bindir parser ts cli

ts:
	$(TSC) -p .

watch:
	$(TSC) -w -p .

clean:
	rm -rf bin lib

bindir:
	mkdir -p bin

libdir:
	mkdir -p lib

parser: libdir lib/recipe.js

lib/recipe.js: src/core/prelog.ohm
	script/build-ohm.js $< $@

cli: bindir
	cp script/starter.sh bin/prelog

test:
	$(TAP) src/test/*.ts -R terse
