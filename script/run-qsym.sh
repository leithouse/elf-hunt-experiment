#!/bin/bash
RUN_DIR="$( cd "$(dirname "$0")" && pwd )"
export FUZZER=qsym
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
rm $TMP/*
cp $CORPUS_REPO/$CORPUS/* $TMP
if [ $? -ne 0 ]; then
  echo Invalid CORPUS
  exit 3
fi
if [ $CORPUS == 'engineered' ]; then
  rm $TMP/mach-flags.a
  rm $TMP/nds32-attributes
  rm $TMP/ia64-unwind
fi

docker run --rm -w /work --cpus 3 -it -v "$RUN_DIR/..":/work -v "$TMP":/corpus my/qsym sh -c "FUZZER=$FUZZER CORPUS=$CORPUS TSTAMP=$TSTAMP /work/script/campaign-qsym.sh"

rm $TMP/*
rmdir $TMP

TSTAMP=$TSTAMP FUZZER=$FUZZER CORPUS=$CORPUS $RUN_DIR/collect-asan.sh
