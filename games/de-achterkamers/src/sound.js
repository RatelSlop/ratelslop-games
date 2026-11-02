export class Sound {
 constructor(){this.context=null;this.volume=.45;this.enabled=true;this.nextStep=0;this.music=null;this.matchActive=false;this.mijkeBuffer=null;this.mijkeVoice=null;this.mijkeNear=false;}
 init(){if(this.context){this.context.resume();return;}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const c=this.context=new Audio();this.master=c.createGain();this.master.gain.value=this.volume;this.master.connect(c.destination);this.hum=c.createOscillator();this.hum.type='sine';this.hum.frequency.value=58;this.humGain=c.createGain();this.humGain.gain.value=0;this.hum.connect(this.humGain).connect(this.master);this.hum.start();this.chase=c.createOscillator();this.chase.type='sine';this.chase.frequency.value=41;this.chaseGain=c.createGain();this.chaseGain.gain.value=0;this.chase.connect(this.chaseGain).connect(this.master);this.chase.start();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.08);if(this.music)this.music.volume=this.enabled?this.volume*.55:0;}
 startMatch(){
  this.matchActive=true;
  if(this.context&&!this.mijkeLoad){
   this.mijkeLoad=fetch(new URL('audio/mijke-meubilair.mp3',document.baseURI).href)
    .then(response=>{if(!response.ok)throw new Error('Mijke audio unavailable');return response.arrayBuffer();})
    .then(bytes=>this.context.decodeAudioData(bytes))
    .then(buffer=>{this.mijkeBuffer=buffer;})
    .catch(error=>console.warn('Mijke proximity audio could not load',error));
  }
  if(!this.music){
   this.music=new window.Audio(new URL('audio/charlies-inferno.mp3',document.baseURI).href);
   this.music.id='match-music';this.music.hidden=true;this.music.loop=true;this.music.preload='metadata';document.body.append(this.music);
  }
  this.setVolume(this.volume);
  if(this.humGain)this.humGain.gain.setTargetAtTime(.01,this.context.currentTime,.1);
  // Browser audio restrictions or an interrupted load must not break gameplay.
  this.music.play()?.catch(()=>{});
 }
 toggle(){this.enabled=!this.enabled;this.setVolume(this.volume);return this.enabled;}
 tone(frequency,duration=.18,volume=.12,type='sine'){if(!this.context)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,frequency*.55),c.currentTime+duration);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(this.master);o.start();o.stop(c.currentTime+duration);}
 updateMijke(run){
  if(!this.context)return;
  if(!this.matchActive||run.status!=='playing'){this.mijkeNear=false;this.stopMijke();return;}
  const mijke=run.enemies.find(enemy=>enemy.id==='mijke'&&enemy.active),p=run.player;
  const distance=mijke?Math.hypot(mijke.x-p.x,mijke.z-p.z):Infinity;
  // Hysteresis keeps the clip from restarting at the edge of hearing range.
  this.mijkeNear=!!(this.matchActive&&run.status==='playing'&&distance<(this.mijkeNear?12:10));
  if(!this.mijkeNear){this.stopMijke(.12);return;}
  if(!this.mijkeBuffer)return;
  const c=this.context,t=c.currentTime;
  if(!this.mijkeVoice){
   const source=c.createBufferSource(),gain=c.createGain(),pan=c.createStereoPanner();
   source.buffer=this.mijkeBuffer;source.loop=true;gain.gain.value=0;
   source.connect(pan).connect(gain).connect(this.master);
   source.onended=()=>{source.disconnect();pan.disconnect();gain.disconnect();};
   source.start();this.mijkeVoice={source,gain,pan};
  }
  const voice=this.mijkeVoice;
  voice.gain.gain.setTargetAtTime(.18+.62*Math.max(0,1-distance/12),t,.08);
  const dx=mijke.x-p.x,dz=mijke.z-p.z;
  voice.pan.pan.setTargetAtTime(Math.max(-1,Math.min(1,(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/Math.max(.01,distance))),t,.08);
 }
 stopMijke(fade=0){
  const voice=this.mijkeVoice;if(!voice)return;
  const t=this.context.currentTime;voice.gain.gain.setTargetAtTime(0,t,.03);voice.source.stop(t+fade);this.mijkeVoice=null;
 }
 update(run,distance){if(!this.context)return;this.updateMijke(run);const t=this.context.currentTime;this.chaseGain.gain.setTargetAtTime(run.status==='playing'?Math.max(0,1-distance/19)*.10:0,t,.2);if(run.status==='playing'&&run.noise>.1&&t>this.nextStep){this.nextStep=t+(run.sprint?.27:.45);this.tone(90+Math.random()*14,.055,.065,'triangle');}}
 pause(){this.matchActive=false;this.mijkeNear=false;this.stopMijke();this.music?.pause();if(this.humGain)this.humGain.gain.setTargetAtTime(0,this.context.currentTime,.1);if(this.chaseGain)this.chaseGain.gain.setTargetAtTime(0,this.context.currentTime,.1);}
 stopMatch(){this.pause();if(this.music)this.music.currentTime=0;}
}
