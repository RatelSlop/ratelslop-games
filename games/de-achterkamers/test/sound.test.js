import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound} from '../src/sound.js';

test('match music is lazy, loops, pauses and resumes, and restarts after leaving a match',t=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document,created=[];
 class FakeAudio{
  constructor(src){this.src=src;this.currentTime=0;this.paused=true;this.plays=0;created.push(this);}
  play(){this.paused=false;this.plays++;return Promise.resolve();}
  pause(){this.paused=true;}
 }
 globalThis.window={Audio:FakeAudio};
 globalThis.document={baseURI:'https://example.test/hub/games/de-achterkamers/index.html',body:{append(){}}};
 t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;});
 const sound=new Sound();
 assert.equal(created.length,0,'menu does not create or start music');
 sound.setVolume(.6);sound.startMatch();
 const music=created[0];
 assert.equal(music.src,'https://example.test/hub/games/de-achterkamers/audio/charlies-inferno.mp3');
 assert.equal(music.loop,true);assert.equal(music.paused,false);assert.equal(music.volume,.6*.2);
 music.currentTime=42;sound.pause();
 assert.equal(music.paused,true);assert.equal(music.currentTime,42);
 sound.startMatch();assert.equal(music.paused,false);assert.equal(music.currentTime,42);
 assert.equal(created.length,1,'resume reuses the track');
 sound.toggle();assert.equal(music.volume,0);
 sound.toggle();assert.equal(music.volume,.6*.2);
 sound.stopMatch();assert.equal(music.paused,true);assert.equal(music.currentTime,0);
 sound.startMatch();assert.equal(music.currentTime,0);assert.equal(music.plays,3);
});

test('Mijke proximity audio follows her distance and direction and stops outside a match',()=>{
 const sources=[];
 const parameter=()=>({value:0,setTargetAtTime(value){this.value=value;}});
 const node=()=>({connect(other){return other;},disconnect(){}});
 const c={currentTime:5,
  createGain:()=>({...node(),gain:parameter()}),
  createStereoPanner:()=>({...node(),pan:parameter()}),
  createBufferSource:()=>{const source={...node(),starts:0,start(){this.starts++;},stop(time){this.stoppedAt=time;}};sources.push(source);return source;},
 };
 const sound=new Sound();sound.context=c;sound.master=c.createGain();sound.mijkeBuffer={};sound.matchActive=true;
 const mijke={id:'mijke',active:true,x:11,z:0};
 const run={status:'playing',player:{x:0,z:0,yaw:0},enemies:[{id:'marola',active:true,x:1,z:0},mijke]};
 sound.updateMijke(run);assert.equal(sources.length,0,'a different nearby chaser must not trigger her clip');
 mijke.x=9;sound.updateMijke(run);
 assert.equal(sources.length,1);assert.equal(sources[0].loop,true);assert.equal(sources[0].starts,1);
 const farGain=sound.mijkeVoice.gain.gain.value;assert.equal(sound.mijkeVoice.pan.pan.value,1);
 mijke.x=-3;sound.updateMijke(run);
 assert.equal(sources.length,1,'updates do not overlap or restart the clip');
 assert.ok(sound.mijkeVoice.gain.gain.value>farGain);assert.equal(sound.mijkeVoice.pan.pan.value,-1);
 mijke.x=11;sound.updateMijke(run);assert.ok(sound.mijkeVoice,'the exit margin avoids boundary chatter');
 mijke.x=13;sound.updateMijke(run);assert.equal(sound.mijkeVoice,null);assert.equal(sources[0].stoppedAt,5.12);
 mijke.x=9;sound.updateMijke(run);assert.equal(sources.length,2);
 sound.pause();assert.equal(sound.mijkeVoice,null);assert.equal(sources[1].stoppedAt,5);
 sound.updateMijke(run);assert.equal(sources.length,2,'a paused match stays silent');
 sound.matchActive=true;mijke.active=false;sound.updateMijke(run);assert.equal(sources.length,2);
 mijke.active=true;sound.updateMijke(run);assert.equal(sources.length,3);
 run.status='caught';sound.updateMijke(run);assert.equal(sound.mijkeVoice,null);assert.equal(sources[2].stoppedAt,5);
});
