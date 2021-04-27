#!/bin/bash
RUN_DIR="$( cd "$(dirname "$0")" && pwd )"
export FUZZER=afl
export TSTAMP=$(date +%s)
if [[ -z "$CORPUS_REPO" ]]; then
  echo Must supply CORPUS_REPO env variable
  exit 1
fi
if [[ -z "$CORPUS" ]]; then
  echo Must supply CORPUS env variable
  exit 2
fi

TMP=$RUN_DIR/../tmp-$TSTAMP
mkdir -p $TMP
rm -rf $TMP/*
cp -r $CORPUS_REPO/$CORPUS/* $TMP/
if [ $? -ne 0 ]; then
  echo Invalid CORPUS
  exit 3
fi
if [ $CORPUS == 'engineered' ]; then
  rm $TMP/ia64-unwind
  rm $TMP/mach-flags.a
  rm $TMP/nds32-attributes
fi

docker run --rm -w /work -it -v "$RUN_DIR/..":/work -v "$INPUT":/corpus my/qsym sh -c "FUZZER=$FUZZER CORPUS=$CORPUS TSTAMP=$TSTAMP USE_ASAN=1 /work/script/campaign-afl.sh"

rm $TMP/*
rmdir $TMP

TSTAMP=$TSTAMP FUZZER=$FUZZER CORPUS=$CORPUS $RUN_DIR/collect-asan.sh
