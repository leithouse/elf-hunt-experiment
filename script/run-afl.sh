#!/bin/bash
RUN_DIR="$( cd "$(dirname "$0")" && pwd )"
export FUZZER=afl
INPUT=$CORPUS_REPO/$CORPUS/
TMP=$RUN_DIR/../tmp
mkdir -p $TMP
rm -rf $TMP/*
cp -r $INPUT/* $TMP/
if [ $CORPUS == 'engineered' ]; then
  rm $TMP/ia64-unwind
  rm $TMP/mach-flags.a
  rm $TMP/nds32-attributes
fi

INPUT=$TMP

docker run --rm -w /work -it -v "$RUN_DIR/..":/work -v "$INPUT":/corpus my/qsym sh -c "FUZZER=$FUZZER CORPUS=$CORPUS /work/script/campaign-afl.sh"

FUZZER=$FUZZER CORPUS=$CORPUS $RUN_DIR/collect.js

docker run --rm -w /work -it -v "$RUN_DIR/..":/work -v "$INPUT":/corpus my/qsym sh -c "FUZZER=$FUZZER CORPUS=$CORPUS USE_ASAN=1 /work/script/campaign-afl.sh"

FUZZER=$FUZZER CORPUS=$CORPUS $RUN_DIR/collect-asan.sh

rm $TMP/*
rmdir $TMP
