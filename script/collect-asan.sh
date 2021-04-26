#!/bin/bash
RUN_DIR="$( cd "$(dirname "$0")" && pwd )"
echo $FUZZER $CORPUS
docker run --rm -w /work -it --cap-add=SYS_PTRACE --security-opt seccomp=unconfined -v "$RUN_DIR"/../:/work my/afl sh -c "FUZZER=$FUZZER CORPUS=$CORPUS USE_ASAN=1 /work/script/collect.js"
