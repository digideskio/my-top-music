help:
	@echo 'Usage:'
	@echo 'make watch    Watch source code, and serve, lint, and/or test. You probably want to run either:'
	@echo '               - "env RUN_LINT=1 make watch" to watch source and run lint tests or'
	@echo '               - "env RUN_DEVSRV=1 make watch" to watch source and serve :4000. or'
	@echo '               - "env RUN_LINT=1 RUN_DEVSRV=1 make watch" to do both.'
	@echo 'make build    Build production "dist/" folder'

NO_COLOR=\033[0m
OK_COLOR=\033[32;01m
ERROR_COLOR=\033[31;01m
WARN_COLOR=\033[33;01m
INFO_COLOR=\033[36;01m

OK_STRING=$(OK_COLOR)  ...ok!$(NO_COLOR)
TSC_STRING=my-top-songs/webapp$(INFO_COLOR): Building from tsconfig.json...$(NO_COLOR)
BUNDLE_PROD_STRING=my-top-songs/webapp$(INFO_COLOR): Bundling...$(NO_COLOR)
WATCH_STRING=my-top-songs/webapp$(INFO_COLOR): Watching from tsconfig.json...$(NO_COLOR)
LINT_STRING=my-top-songs/webapp$(INFO_COLOR): Linting *.ts...$(NO_COLOR)
CLEAN_STRING=my-top-songs/webapp$(INFO_COLOR): Deleting generated code ...$(NO_COLOR)

# -----------------------------
# ----   PDM dependencies  ----
# -----------------------------

TS_FILES = $(shell bash -c "find src/ -type f -name '*.ts' -or -type f -name '*.tsx'")

./node_modules: package.json
	@printf "$(WARN_COLOR)Regenerating node_modules...$(NO_COLOR)\n";
	@rm -fr ./node_modules
	@npm install

watch: ./node_modules
	@printf "$(WATCH_STRING)\n"
	@bash -c "rm -rf ./dist"
	@bash -c "CLEAN=\"1\"; \
	INIT=\"0\"; \
	./node_modules/.bin/tsc -w | \
	while read line; do \
	    if [[ \$$line == *Compilation\ complete.\ Watching\ for\ file\ changes* ]]; then \
		if [[ \"\$$CLEAN\" == \"1\" ]]; then \
			printf \"my-top-songs/webapp$(INFO_COLOR): \$$line$(NO_COLOR)\n\"; \
		    cd ./dist; \
		    find . -type f -name \"*.js\" -exec touch \"{}\" \";\" ; \
			cd ..; \
		    if [[ \"\$$INIT\" == \"0\" ]]; then \
			./node_modules/.bin/nodemon -I -e css --exec \"cd ./src; find . -type f -name \\\"*.css\\\" -exec install -m 644 \\\"{}\\\" ../dist/{} \\\";\\\"\" -w ./src/ -d 1 &\
			if [[ \"x\$$RUN_LINT\" != \"x\" ]]; then \
			    ./node_modules/.bin/nodemon -I -e js,ts,css --exec \"make lint || true\" -w ./dist/ -d 2 &\
			else \
				printf \"my-top-songs/webapp$(WARN_COLOR): Linting is disabled. Run 'env RUN_LINT=1 make watch' to run tests. $(NO_COLOR)\n\"; \
			fi; \
			if [[ \"x\$$RUN_DEVSRV\" != \"x\" ]]; then \
			    ./node_modules/.bin/webpack-dev-server \
				--devtool source-map \
				--output-pathinfo \
				--hot \
				--no-info \
				--progress \
				--history-api-fallback \
				--content-base static \
				--watch \
				--host 0.0.0.0 \
				--port 4000 & \
			else \
				printf \"my-top-songs/webapp$(WARN_COLOR): The dev server is disabled. Run 'env RUN_DEVSRV=1 make watch' to enable. $(NO_COLOR)\n\"; \
			fi; \
			INIT=\"1\"; \
		    fi; \
		else \
			printf \"my-top-songs/webapp$(ERROR_COLOR): \$$line$(NO_COLOR)\n\"; \
		fi; \
		elif [[ \$$line == *File\ change\ detected.\ Starting\ incremental\ compilation* ]]; then \
		echo ""; \
		echo ""; \
		echo ""; \
		echo ""; \
		CLEAN=\"1\"; \
		printf \"my-top-songs/webapp$(INFO_COLOR): \$$line$(NO_COLOR)\n\"; \
	    else \
		CLEAN=\"0\"; \
		printf \"my-top-songs/webapp$(ERROR_COLOR): \$$line$(NO_COLOR)\n\"; \
	    fi; \
	done;"

lint:
	@printf "$(LINT_STRING)\n"
	@bash -c "set -o pipefail; ./node_modules/.bin/tslint -c ./tslint.json $(TS_FILES) -t verbose | while read line; do \
		printf \"my-top-songs/webapp$(ERROR_COLOR): \$$line$(NO_COLOR)\n\"; \
	done;";

clean:
	rm -fr ./dist

distclean: clean
	rm -fr ./node_modules

build: clean lint ./node_modules
	@./node_modules/.bin/tsc
	@bash -c "cd ./src; find . -type f -name \"*.css\" -exec install -m 644 \"{}\" ../dist/{} \";\""
	@bash -c "./node_modules/.bin/webpack -p --config webpack.config.prod.js"

deploy:
	@echo "webapp/Makefile NOT IMPLEMENTED"
