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
 assert.equal(music.loop,true);assert.equal(music.paused,false);assert.equal(music.volume,.6*.55);
 music.currentTime=42;sound.pause();
 assert.equal(music.paused,true);assert.equal(music.currentTime,42);
 sound.startMatch();assert.equal(music.paused,false);assert.equal(music.currentTime,42);
 assert.equal(created.length,1,'resume reuses the track');
 sound.toggle();assert.equal(music.volume,0);
 sound.toggle();assert.equal(music.volume,.6*.55);
 sound.stopMatch();assert.equal(music.paused,true);assert.equal(music.currentTime,0);
 sound.startMatch();assert.equal(music.currentTime,0);assert.equal(music.plays,3);
});
