### Bug Hunting Experiment

Campaign outputs are written to output/
Collected analyses are written to analysis/

### Scripts

*collect.js*
  - Collects crash results, sorts them by time, then runs afl-collect on them
  - Expects env variables CORPUS and FUZZER
*monitor.js*
  - Runs fuzzing campaign for set number of hours
  - Expects env variables CORPUS, FUZZER, CORES and WHATSUP
*campaign-X.sh*
  - Executes a fuzzing campaign. Intended to be run in docker
  - Expects env variables CORPUS\_REPO and CORPUS
*run-X.sh*
  - Executes fuzzing campaign in a docker, then collects results

*collect-asan.sh*
  - Use collector script inside docker
  - Expects env variables CORPUS and FUZZER


### Dockers

Docker container names are hardcoded in and expected to be _my/afl_,_my/mopt_ and _my/qsym_.
Docker containers are just additions of nodeJS to zjuchenyuan's Unifuzz images
The AFL container also adds gdb, exploitable and afl-utils

```
[sudo] docker build --network=host -t my/afl docker/afl
[sudo] docker build --network=host -t my/mopt docker/mopt
[sudo] docker build --network=host -t my/qsym docker/qsym

```


### Run experiment

```
# May need sudo depending on docker permissions

export CORPUS_ROOT=/path/to/corpi
[sudo] CORPUS=standard   script/run-mopt.sh
[sudo] CORPUS=engineered script/run-mopt.sh
[sudo] CORPUS=standard   script/run-afl.sh
[sudo] CORPUS=engineered script/run-afl.sh
[sudo] CORPUS=standard   script/run-qsym.sh
[sudo] CORPUS=engineered script/run-qsym.sh
```
