.SHELL = /bin/bash

build: clean lint
	yarn tsc -p tsconfig.json

lint:
	yarn tslint -p tsconfig.json

clean:
	rm -rf ./build

start: lint
	yarn ts-node ./src/index.ts