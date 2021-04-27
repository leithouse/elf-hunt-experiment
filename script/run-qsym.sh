#!/bin/bash
RUN_DIR="$( cd "$(dirname "$0")" && pwd )"
export FUZZER=qsym
if [[ -z "$CORPUS_REPO" ]]; then
  echo Must supply CORPUS_REPO env variable
  exit 1
fi
if [[ -z "$CORPUS" ]]; then
  echo Must supply CORPUS env variable
  exit 2
fi

TMP=$RUN_DIR/../tmp-$(date +%s)
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

docker run --rm -w /work --cpu-quota 2 -it -v "$RUN_DIR/..":/work -v "$TMP":/corpus my/qsym sh -c "FUZZER=$FUZZER CORPUS=$CORPUS /work/script/campaign-qsym.sh"

rm $TMP/*
rmdir $TMP

FUZZER=$FUZZER CORPUS=$CORPUS $RUN_DIR/collect-asan.sh
