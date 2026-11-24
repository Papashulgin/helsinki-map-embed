#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { DEFAULT_DB_PATH: DEFAULT_CRM_DB } = require('../lib/crm-store');
const { DEFAULT_DB_PATH: DEFAULT_SCAFFOLD_DB } = require('../lib/scaffold-project-store');
const { backupDatabases } = require('./backup-local-data');

function sha256(filename){return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');}

async function restoreDatabases(directory,databasePaths={
  crm:process.env.TELINEHALLINTA_CRM_DB||DEFAULT_CRM_DB,
  scaffold:process.env.TELINEHALLINTA_SCAFFOLD_DB||DEFAULT_SCAFFOLD_DB,
}){
  const manifestPath=path.join(directory,'manifest.json');
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(manifest.schemaVersion!==1||!manifest.files||typeof manifest.files!=='object')throw new Error('Unsupported or invalid local backup manifest.');
  const selected=Object.entries(manifest.files).filter(([,entry])=>entry.present);
  if(!selected.length)throw new Error('Backup manifest contains no SQLite database files.');
  for(const [name,entry] of selected){
    const source=path.join(directory,entry.file||'');
    if(path.dirname(source)!==path.resolve(directory)||!fs.existsSync(source))throw new Error('Backup file missing or outside the selected backup directory: '+name);
    if(sha256(source)!==entry.sha256)throw new Error('Backup file SHA-256 mismatch: '+name);
    const db=new Database(source,{readonly:true,fileMustExist:true});
    try{if(db.pragma('integrity_check',{simple:true})!=='ok')throw new Error('Backup SQLite integrity check failed: '+name);}
    finally{db.close();}
  }
  const before=path.join(__dirname,'..','.local-backups','pre-restore-'+new Date().toISOString().replace(/[:.]/g,'-'));
  const existingPaths=Object.fromEntries(Object.entries(databasePaths).filter(([,file])=>fs.existsSync(file)));
  if(Object.keys(existingPaths).length)await backupDatabases(before,existingPaths);
  for(const [name,entry] of selected){
    const destination=databasePaths[name];
    if(!destination)throw new Error('No configured restore target for database: '+name);
    fs.mkdirSync(path.dirname(destination),{recursive:true,mode:0o700});
    const temporary=destination+'.restore-'+process.pid;
    fs.copyFileSync(path.join(directory,entry.file),temporary);
    try{fs.chmodSync(temporary,0o600);}catch{}
    fs.renameSync(temporary,destination);
    for(const sidecar of [destination+'-wal',destination+'-shm'])if(fs.existsSync(sidecar))fs.rmSync(sidecar);
    const check=new Database(destination,{readonly:true,fileMustExist:true});
    try{if(check.pragma('integrity_check',{simple:true})!=='ok')throw new Error('Restored SQLite integrity check failed: '+name);}
    finally{check.close();}
  }
  return {restored:selected.map(([name])=>name),preRestoreBackup:Object.keys(existingPaths).length?before:null};
}

if(require.main===module){
  const source=process.argv[2];
  if(!source||!process.argv.includes('--confirm')){
    process.stderr.write('Usage: node scripts/restore-local-data.js <backup-directory> --confirm\nStop the local app before restoring; --confirm is required because restore replaces database files.\n');
    process.exitCode=2;
  }else restoreDatabases(path.resolve(source)).then((result)=>process.stdout.write('Restore complete: '+result.restored.join(', ')+'\nPre-restore snapshot: '+(result.preRestoreBackup||'not needed')+'\n')).catch((error)=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
}

module.exports={restoreDatabases};
