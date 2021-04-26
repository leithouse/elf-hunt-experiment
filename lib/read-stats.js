const fsp = require('fs').promises,
     path = require('path');

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

readStats.parseStats = parseStats;
module.exports = readStats;
