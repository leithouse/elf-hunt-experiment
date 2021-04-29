#!/bin/bash
RUN_DIR="$( cd "$(dirname "$0")" && pwd )"
echo $FUZZER $CORPUS
if [ -z $NO_ASAN ]; then
  USE_ASAN=1
fi
docker run --rm -w /work -it --cap-add=SYS_PTRACE --security-opt seccomp=unconfined -v "$RUN_DIR"/../:/work my/afl sh -c "TSTAMP=$TSTAMP FUZZER=$FUZZER CORPUS=$CORPUS USE_ASAN=$USE_ASAN /work/script/collect.js"
