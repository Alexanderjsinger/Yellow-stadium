
"use strict";
(() => {
  const panel=document.getElementById('save-tools'),label=document.getElementById('save-status'),help=document.getElementById('save-help');
  let lastWritten='';
  function status(ok){if(ok)lastWritten=JSON.stringify(save);label.textContent=ok?'Saved in this browser':'Not saved — export a backup';panel.dataset.saved=String(ok);if(!ok){panel.open=true;help.textContent='Browser storage could not save your progress. Export a backup now. Your current session is still playable.';}}
  function payload(){return JSON.stringify({format:'yellow-stadium-backup',version:1,exportedAt:new Date().toISOString(),save},null,2);}
  function restore(raw){
    if(battle && !battle.over)throw Error('Finish your battle before restoring a backup.');
    if(raw.length>1000000)throw Error('That backup is too large. Select a Yellow Stadium JSON backup.');
    const parsed=JSON.parse(raw),data=parsed?.format==='yellow-stadium-backup'?parsed.save:parsed;
    if(!validSave(data)||!data.owned.every(id=>typeof id==='string'&&SPECIES[id]))throw Error('This is not a valid Yellow Stadium save.');
    if(data.onboardingComplete && data.owned.length<3)throw Error('The backup is missing party Pokémon.');
    if(save.owned.length && !window.confirm('Replace your current progress with this backup? Export your current save first if you want to keep it.'))return false;
    const restored=loadSave(data);
    save=restored;selected=[];battle=null;
    window.TrainerScenes?.finish();els['result-modal'].hidden=true;
    window.StadiumUpgrade?.migrateTraining();
    const ok=writeSave();renderApp();
    help.textContent=ok?'Backup restored and saved in this browser.':'Backup restored for this session, but browser storage is unavailable. Keep your backup file.';
    return true;
  }
  document.getElementById('save-now').onclick=async()=>{
    const ok=writeSave();
    help.textContent=ok?'Progress saved in this browser. Export a backup to move it to another browser or device.':'Saving failed. Export your progress before closing the game.';
    if(ok && navigator.storage?.persist)try{await navigator.storage.persist();}catch{}
  };
  document.getElementById('export-save').onclick=async()=>{
    const json=payload(),name='yellow-stadium-save.json';
    const file=new File([json],name,{type:'application/json'});
    try {
      if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Yellow Stadium save'});help.textContent='Choose Save to Files in the share sheet to keep your backup.';return;}
      const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      help.textContent='Backup download requested. Keep the JSON file to restore your progress later.';
    }catch(error){help.textContent=error.name==='AbortError'?'Backup sharing cancelled.':'Could not export. Try opening the game directly in your browser, then export again.';}
  };
  document.getElementById('import-save').onchange=async event=>{
    const input=event.target,file=input.files?.[0];if(!file)return;
    try{if(file.size>1000000)throw Error('That file is too large to be a game save.');restore(await file.text());}catch(error){help.textContent=error instanceof SyntaxError?'That file is not a readable JSON backup.':error.message;}finally{input.value='';}
  };
  const flush=()=>{if(JSON.stringify(save)!==lastWritten)writeSave();};
  window.addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
  window.SaveTools={status,payload,restore};
  label.textContent = 'Session ready';
  panel.dataset.saved = 'unknown';
})();

