#!/usr/bin/node

const {spawn} = require('child_process'),
          fsp = require('fs').promises,
         path = require('path'),
    readStats = require('../lib/read-stats');

const AFL_COLLECT = 'afl-collect',
          READELF = path.join(__dirname,'..','bin','readelf-2.28'),
             ARGS = ['-atcw','-x','1','-p','1','-R','1'];

const {FUZZER,CORPUS,USE_ASAN} = process.env;
if(!FUZZER || !CORPUS) {
  console.error('ERROR: Must supply CORPUS and FUZZER in environment');
  process.exit(1);
}

const PATH_TAIL = path.join(FUZZER+(USE_ASAN?'-asan':''),CORPUS)
         OUTPUT = path.resolve(__dirname,'..','output',PATH_TAIL),
       ANALYSIS = path.resolve(__dirname,'..','analysis',PATH_TAIL),
        CRASHES = path.join(ANALYSIS,'crashes'),
         SORTED = path.join(ANALYSIS,'sorted'),
         REPORT = path.join(ANALYSIS,'report.txt');

/**
 * @typedef {InputInfo}
 * @type {JSON}
 * @prop fpath  {String}  File path of input
 * @prop birth  {Integer} Time of birth in ms
 * @prop fuzzer {String}  Name of fuzzer harvested from
 */
/**
 * Iterates over fuzzer instances in output, collecting crash inputs and sorting them by birth
 * @async
 * @returns sorted {InputInfo[]}
 */
const collectAndSort = async () => {
  let parr = [];
  let list = [];
  let fuzzers = await fsp.readdir(OUTPUT);
  for(let i in fuzzers) {
    let fuzzer = fuzzers[i];
    let crashes = path.join(OUTPUT,fuzzer,'crashes');
    try {
      let files = await fsp.readdir(crashes);
      files.forEach((file)=>{
        if(/readme/i.test(file))
          return;
        let fpath = path.join(crashes,file);
        parr.push((async () => {
          let stats = await fsp.stat(fpath);
          let birth = stats.birthtimeMs;
          list.push({fpath,birth,fuzzer});
        })());
      });
    }
    catch(err) {};
  }
  await Promise.all(parr);
  list.sort((a,b)=>a.birth-b.birth);
  return list;
}

/**
 * Clean a directory of it's files
 * Not designed to handle directory
 * 
 * @param dir {String} Path of directory
 * @async
 */
const cleanDir = async (dir)=>{
  let parr = [];
  let ls = await fsp.readdir(dir);
  ls.forEach((file)=>{
    let fpath = path.join(dir,file);
    parr.push(fsp.unlink(fpath));
  });
  await Promise.all(parr);
}

/**
 * Write sorted crash inputs to ${SORTED}/sorted/crashes
 * @param sorted {InputInfo[]}
 * @async
 */
const writeSorted = async (sorted)=>{
  let crashes = path.join(SORTED,'sorted','crashes');
  await fsp.mkdir(crashes,{recursive:true});
  await cleanDir(crashes);
  for(let i in sorted) {
    let src = sorted[i].fpath;
    let dest = path.join(crashes,i.padStart(5,'0'));
    await fsp.copyFile(src,dest);
  }
}

/**
 * Run afl-collector on sorted crashes
 * @async
 *
 */
const runCollector = async () => {
  await fsp.mkdir(CRASHES,{recursive:true});
  await cleanDir(CRASHES);
  return new Promise((resolve,reject)=>{
    let args = [
      '-r',
      '-e', 'gdb-script',
    ];
    args.push(
      SORTED,
      CRASHES,
      '--',
      READELF+(USE_ASAN?'-asan':''),
      ...ARGS,
      '@@'
    );
    let env;
    if(USE_ASAN)
      env = {...process.env, ASAN_OPTIONS: 'abort_on_error=1:symbolize=0' }
    const cp = spawn(AFL_COLLECT, args, { stdio:'inherit', env });
    cp.on('error',reject);
    cp.on('exit',(code,signal)=>{
      if(signal)
        code = 'SIGNAL '+signal;
      if(!code)
        return resolve();
      return reject(new Error(`Exit code: ${code}`));
    });
  });
}

const getStartTime = async ()=>{
  let statList = await readStats(OUTPUT);
  let startTime = parseInt(statList[0].start_time)*1000;
  return startTime;
}

const getCores = async ()=>{
  let data = await fsp.readFile(path.join(OUTPUT,'cores'));
  return parseInt(data);
}

const msToHuman = (input)=>{
  let ret = '';
  let ms = input%1000;
  input = (input-ms)/1000;
  let s = input%60;
  input = (input-s)/60;
  let m = input%60;
  let hr = (input-m)/60;
  let pad = (x)=>x.toString().padStart(2,' ');
  return `${pad(hr)}hr ${pad(m)}m ${pad(s)}s ${ms.toFixed(2)}ms`;
}

const parseCollected = async (opt) => {
  let {sorted,startTime,cores} = opt;
  let ls = await fsp.readdir(CRASHES);
  let ret = [];
  ls.forEach((file)=>{
    if(/gdb/.test(file))
      return;
    let idx = file.substring('sorted:'.length);
    let el = sorted[parseInt(idx)];
    el.timeToFind = (el.birth-startTime)*cores;
    el.idx = idx;
    ret.push(el);
  });
  return ret;
}

const writeHr = () => {
  let ret = '';
  for(let i=0;i<100;i++)
    ret += '-';
  console.log(ret);
}

const main = async () => {
  let startTime,cores;
  console.log('Sorting crashes');
  let sorted = await collectAndSort();
  console.log('Writing sorted crashes');
  await writeSorted(sorted);
  await Promise.all([
    runCollector(),
    getStartTime().then(x=>startTime=x),
    getCores().then(x=>cores=x)
  ]);
  let collected = await parseCollected({sorted,startTime,cores}),
         report = `== Campaign Collection Report ==\n\n`
          files = ' = Original Inputs =\n\n';
           time = ' = Deduplicated Crashes =\n\n';

  report += `  Campaign Start: ${new Date(startTime).toLocaleString()}\n`
         +  `     Report Time: ${(new Date()).toLocaleString()}\n`
         +  `          Fuzzer: ${FUZZER}\n`
         +  `          Corpus: ${CORPUS}\n`
         +  `           Cores: ${cores}\n\n`;

  collected.forEach((el,i)=>{
    let key = el.idx;
    files += ` ${key}: ${path.relative(OUTPUT,el.fpath)}\n`;
    time += `[${key}] Crash Time   ${msToHuman(el.timeToFind)} [${el.timeToFind}]\n`;
  });
  report = report + time + '\n' + files;
  console.log();
  writeHr();
  console.log(report);
  writeHr();
  await fsp.writeFile(REPORT,report);
  console.log('\nReport written to', REPORT,'\n');
}

main()
