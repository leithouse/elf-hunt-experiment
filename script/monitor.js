#!/usr/bin/node

const HOURS = process.env.HOURS || 4;

const {CORES,OUTPUT,FUZZER,WHATSUP} = process.env;
if(!CORES || !OUTPUT || !WHATSUP) {
  console.error("Must have CORES, OUTPUT and WHATSUP defined");
  process.exit(1);
}
const TOTAL_TIME = HOURS * 60 * 60000, // 4 hours
        CHK_MINS = 5, // 5 minutes
        CHK_TIME = CHK_MINS * 60000, 
       CHK_INTVL = CHK_TIME / CORES;

const {execSync} = require('child_process'),
             fsp = require('fs').promises,
            path = require('path'),
              rl = require('readline').createInterface({
                input: process.stdin,
                output:process.stdout
              });

const parseStats = (stats)=>{
  let parsed = {};
  stats.trim().split('\n').forEach((line)=>{
    let match = line.match(/(\w*\b)\s{1,}:\s(.*)/);
    parsed[match[1]] = match[2];
  });
  return parsed;
}

const readStats = async (outputDir)=>{
  let ls = await fsp.readdir(outputDir);
  let ret = [];
  let rd = async (key)=>{
    try {
      let data = await fsp.readFile(path.join(outputDir,key,'fuzzer_stats'),'utf8');
      let stats = parseStats(data);
      stats.key = key;
      ret.push(stats);
    }
    catch(err) {}
  }
  let parr = [];
  ls.forEach((key)=>parr.push(rd(key)));
  await Promise.all(parr);
  return ret;
}

const statLog = async () => {
  let statList = await readStats(OUTPUT);
  let sums = {
    total: 0,
    favored: 0,
    max_depth: 0,
    bitmap:0,
    unique_hangs:0,
    unique_crashes:0
  }
  statList.forEach((stats)=>{
    sums.total += parseInt(stats.paths_total);
    sums.favored += parseInt(stats.paths_favored);
    sums.max_depth += parseInt(stats.max_depth);
    sums.bitmap += Number(stats.bitmap_cvg.substring(0,stats.bitmap_cvg.length-1));
    sums.unique_crashes += parseInt(stats.unique_crashes)
    sums.unique_hangs += parseInt(stats.unique_hangs)
  });
  let avg = {};
  for(let prop in sums) {
    let val = sums[prop];
    if(/!unique/.test(prop)) {
      val = sums[prop]/CORES;
      if(prop != 'bitmap')
        val = Math.floor(val);
    }
    avg[prop] = val;
  }
  return avg;
}

let to = setTimeout(()=>{
  console.log('12 hours complete');
  rl.close();
  let ret = execSync(`${WHATSUP} ${OUTPUT}`);
  console.log(ret.toString());
},TOTAL_TIME/CORES);

let ask = () => {
  rl.question('Type q[uit] to quit. Anything else for afl-whatsup: ',(answer)=>{
    if(/^q/.test(answer)) {
      clearTimeout(to);
      rl.close();
      return;
    }
    let ret = execSync(`${WHATSUP} ${OUTPUT}`);
    console.log(ret.toString());
    console.log();
    ask();
  });
}

fsp.writeFile(path.join(OUTPUT,'cores'),CORES.toString());
ask();
