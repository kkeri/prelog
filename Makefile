
TAP = node_modules/.bin/tap -no-cov --no-coverage-report
TSC = node_modules/.bin/tsc

all: parser ts libdir bindir cli

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

parser: lib/recipe.js

lib/recipe.js: libdir src/prelog.ohm
	script/build-ohm.js src/prelog.ohm $@

cli: bindir
	cp starter bin/prelog

test:
	$(TAP) src/test/*.ts -R terse
