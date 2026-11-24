#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { DEFAULT_DB_PATH: DEFAULT_CRM_DB } = require('../lib/crm-store');
const { DEFAULT_DB_PATH: DEFAULT_SCAFFOLD_DB } = require('../lib/scaffold-project-store');

function sha256(filename) { return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'); }

async function backupDatabases(directory, databasePaths = {
  crm: process.env.TELINEHALLINTA_CRM_DB || DEFAULT_CRM_DB,
  scaffold: process.env.TELINEHALLINTA_SCAFFOLD_DB || DEFAULT_SCAFFOLD_DB,
}) {
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  try { fs.chmodSync(directory,0o700); } catch {}
  const manifest={schemaVersion:1,createdAt:new Date().toISOString(),files:{}};
  for(const [name,source] of Object.entries(databasePaths)){
    if(!fs.existsSync(source)) { manifest.files[name]={present:false}; continue; }
    const destination=path.join(directory,name+'.sqlite');
    const db=new Database(source,{readonly:true,fileMustExist:true});
    try {
      const integrity=db.pragma('integrity_check',{simple:true});
      if(integrity!=='ok')throw new Error(name+' SQLite integrity check failed: '+integrity);
      await db.backup(destination);
    } finally { db.close(); }
    const verify=new Database(destination,{readonly:true,fileMustExist:true});
    try { if(verify.pragma('integrity_check',{simple:true})!=='ok')throw new Error(name+' backup failed its SQLite integrity check.'); }
    finally { verify.close(); }
    manifest.files[name]={present:true,file:name+'.sqlite',sha256:sha256(destination),bytes:fs.statSync(destination).size};
  }
  if(!Object.values(manifest.files).some((entry)=>entry.present))throw new Error('No local SQLite data files were found to back up.');
  const manifestPath=path.join(directory,'manifest.json');
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'});
  return manifest;
}

if(require.main===module){
  const target=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'..','.local-backups',new Date().toISOString().replace(/[:.]/g,'-'));
  backupDatabases(target).then((manifest)=>process.stdout.write('Backup complete: '+target+' ('+Object.values(manifest.files).filter((row)=>row.present).length+' SQLite files)\n')).catch((error)=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
}

module.exports={backupDatabases};
