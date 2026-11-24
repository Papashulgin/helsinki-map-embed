'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const Database=require('better-sqlite3');
const test=require('node:test');

test('SQLite backup checks integrity and restore replaces only from a verified snapshot', (t) => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'teline-backup-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const crm=path.join(root,'crm.sqlite'),scaffold=path.join(root,'scaffold.sqlite'),backup=path.join(root,'backup');
  for(const [filename,value] of [[crm,'crm original'],[scaffold,'scaffold original']]){
    const db=new Database(filename);db.exec('CREATE TABLE value_store (value TEXT NOT NULL)');db.prepare('INSERT INTO value_store VALUES (?)').run(value);db.close();
  }
  const env={...process.env,TELINEHALLINTA_CRM_DB:crm,TELINEHALLINTA_SCAFFOLD_DB:scaffold};
  const backupRun=spawnSync(process.execPath,['scripts/backup-local-data.js',backup],{cwd:path.join(__dirname,'..'),env,encoding:'utf8'});
  assert.equal(backupRun.status,0,backupRun.stderr);
  const manifest=JSON.parse(fs.readFileSync(path.join(backup,'manifest.json'),'utf8'));
  assert.equal(manifest.files.crm.present,true);
  assert.equal(manifest.files.scaffold.present,true);
  for(const filename of [crm,scaffold]){const db=new Database(filename);db.prepare('UPDATE value_store SET value=?').run('changed');db.close();}
  const restoreRun=spawnSync(process.execPath,['scripts/restore-local-data.js',backup,'--confirm'],{cwd:path.join(__dirname,'..'),env,encoding:'utf8'});
  assert.equal(restoreRun.status,0,restoreRun.stderr);
  for(const [filename,value] of [[crm,'crm original'],[scaffold,'scaffold original']]){
    const db=new Database(filename,{readonly:true});assert.equal(db.prepare('SELECT value FROM value_store').get().value,value);assert.equal(db.pragma('integrity_check',{simple:true}),'ok');db.close();
  }
  const missingConfirmation=spawnSync(process.execPath,['scripts/restore-local-data.js',backup],{cwd:path.join(__dirname,'..'),env,encoding:'utf8'});
  assert.equal(missingConfirmation.status,2);
});
