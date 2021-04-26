#!/bin/bash

if [ $USE_ASAN ]; then
  export FUZZER=${FUZZER}-asan
fi

export CORES=8
export OUTPUT=/work/output/$FUZZER/$CORPUS
export WHATSUP=/afl/afl-whatsup

INPUT=/corpus
AFL=/afl/afl-fuzz
READELF='/work/bin/readelf-2.28'
ARGS='-atcw -x 1 -p 1 -R 1'             # binutils 2.28 doesn't have LTO syms
CMD='@@'

if [ $USE_ASAN ]; then
  READELF=${READELF}-asan
  AFL_ARGS='-t 1000+ -m none'
else
  READELF=${READELF}-afl
  AFL_ARGS='-t 500 -m 2048'
fi
PROGRAM="$READELF $ARGS"

mkdir -p $OUTPUT
rm -rf $OUTPUT/*

echo "Launching leader"
$AFL $AFL_ARGS -M afl-leader -i $INPUT -o $OUTPUT -- $PROGRAM $CMD &>/dev/null &
echo Waiting for fuzzing stats
while [[ ! -f $OUTPUT/afl-leader/fuzzer_stats ]]; do
  sleep 1
done
counter=1
while [ $counter -lt $CORES ]; do
  echo Launching follower $counter
  $AFL $AFL_ARGS -S afl-follower-$counter -i $INPUT -o $OUTPUT -- $PROGRAM $CMD &>/dev/null &
  STATS=$OUTPUT/afl-follower-$counter/fuzzer_stats
  echo Waiting for fuzzing stats
  while [[ ! -f $STATS ]]; do
    sleep 1
  done
  ((counter++))
done
echo Beginning monitoring
/work/script/monitor.js
