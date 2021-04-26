#!/bin/bash

export CORES=3
export OUTPUT=/work/output/$FUZZER-asan/$CORPUS/
export WHATSUP=/afl/afl-whatsup

INPUT="/corpus"
READELF="/work/bin/readelf-2.28"
READELF_ASAN='/work/bin/readelf-2.28-asan'
ARGS='-atcw -x 1 -p 1 -R 1'             # binutils 2.28 doesn't have LTO syms
PROG="$READELF_ASAN $ARGS"
PROG_NORMAL="$READELF $ARGS"
AFL=/afl/afl-fuzz
QSYM=/workdir/qsym/bin/run_qsym_afl.py
CMD="@@"

mkdir -p $OUTPUT
rm -rf $OUTPUT/*
echo "Launching leader AFL"
$AFL -t 1000+ -m none -M afl-leader -i $INPUT -o $OUTPUT -- $PROG $CMD &>/dev/null &
echo Waiting for fuzzing stats
while [[ ! -f $OUTPUT/afl-leader/fuzzer_stats ]]; do
  sleep 1
done

echo "Launching follower"
$AFL -t 1000+ -m none -S afl-follower-1 -i $INPUT -o $OUTPUT -- $PROG $CMD &>/dev/null &
STATS=$OUTPUT/afl-follower-1/fuzzer_stats
echo Waiting for fuzzing stats
while [[ ! -f $STATS ]]; do
  sleep 1
done
echo "Launching QSYM"
$QSYM -a afl-follower-1 -o $OUTPUT -n qsym-1 -- $PROG_NORMAL $CMD &>/dev/null &
sleep 5
echo Running monitor
/work/script/monitor.js
