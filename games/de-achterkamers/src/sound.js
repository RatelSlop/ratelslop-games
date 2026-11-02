export class Sound {
 constructor(){this.context=null;this.volume=.45;this.enabled=true;this.nextStep=0;this.music=null;this.matchActive=false;}
 init(){if(this.context){this.context.resume();return;}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const c=this.context=new Audio();this.master=c.createGain();this.master.gain.value=this.volume;this.master.connect(c.destination);this.hum=c.createOscillator();this.hum.type='sine';this.hum.frequency.value=58;this.humGain=c.createGain();this.humGain.gain.value=0;this.hum.connect(this.humGain).connect(this.master);this.hum.start();this.chase=c.createOscillator();this.chase.type='sine';this.chase.frequency.value=41;this.chaseGain=c.createGain();this.chaseGain.gain.value=0;this.chase.connect(this.chaseGain).connect(this.master);this.chase.start();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.08);if(this.music)this.music.volume=this.enabled?this.volume*.55:0;}
 startMatch(){
  this.matchActive=true;
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
 update(run,distance){if(!this.context)return;const t=this.context.currentTime;this.chaseGain.gain.setTargetAtTime(run.status==='playing'?Math.max(0,1-distance/19)*.10:0,t,.2);if(run.status==='playing'&&run.noise>.1&&t>this.nextStep){this.nextStep=t+(run.sprint?.27:.45);this.tone(90+Math.random()*14,.055,.065,'triangle');}}
 pause(){this.matchActive=false;this.music?.pause();if(this.humGain)this.humGain.gain.setTargetAtTime(0,this.context.currentTime,.1);if(this.chaseGain)this.chaseGain.gain.setTargetAtTime(0,this.context.currentTime,.1);}
 stopMatch(){this.pause();if(this.music)this.music.currentTime=0;}
}
