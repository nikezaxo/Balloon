# Rebuilds audio/voices/: speaks every line with the open-source Kokoro model (kokoro-onnx), then gives each
# character its cartoon voice with ffmpeg (rubberband pitch shift, growl, robot, chorus, echo).
# Usage: pip install kokoro-onnx soundfile; download kokoro-v1.0.int8.onnx and voices-v1.0.bin from the
# kokoro-onnx releases into this folder; run: python make_voices.py ../audio/voices [only these characters]
# Keep the lines here in sync with VOICE_LINES in voices.js.
# Generates cartoon voice clips: Kokoro speech, then per-character ffmpeg processing.
import json, os, subprocess, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
OUT = sys.argv[1]
k = Kokoro('kokoro-v1.0.int8.onnx', 'voices-v1.0.bin')
ROBOT = "afftfilt=real='hypot(re,im)':imag='0':win_size=512:overlap=0.75"
# voice, speed, rubberband pitch ratio, extra ffmpeg filters
CHARS = {
 'classic': ('af_heart', 1.1, 1.38, 'equalizer=f=3000:t=q:w=1:g=3'),
 'gumball': ('af_bella', 1.12, 1.78, 'chorus=0.6:0.8:30:0.3:0.25:2'),
 'clown':   ('am_puck', 1.12, 1.5, 'vibrato=f=6.5:d=0.25'),
 'toy':     ('am_echo', 1.0, 1.15, ROBOT + ',acrusher=bits=10:mix=0.4'),
 'melon':   ('af_sky', 1.12, 1.58, 'tremolo=f=7:d=0.3'),
 'monster': ('am_onyx', 1.08, 0.72, 'tremolo=f=34:d=0.45,asoftclip=type=tanh,lowpass=f=3200'),
 'ninja':   ('am_michael', 1.1, 0.96, 'highpass=f=180,aecho=0.8:0.5:60:0.25'),
 'galaxy':  ('af_aoede', 0.98, 1.22, 'chorus=0.5:0.9:50|60:0.4|0.32:0.25|0.4:2|1.3,aecho=0.8:0.5:140:0.14'),
 'gold':    ('bm_george', 0.95, 0.86, 'aecho=0.8:0.6:70:0.12'),
 'dragon':  ('am_fenrir', 1.05, 0.8, 'tremolo=f=28:d=0.3,asoftclip=type=tanh,aecho=0.8:0.5:70:0.2'),
 'unicorn': ('af_kore', 1.1, 1.52, 'chorus=0.6:0.9:40|55:0.3|0.25:0.3|0.4:3|2'),
 'diamond': ('bf_emma', 1.05, 1.12, 'flanger=delay=2:depth=2:speed=0.4'),
 'prism':   ('af_nova', 1.08, 1.3, 'aphaser=type=t:speed=0.7,chorus=0.6:0.9:35|50:0.3|0.25:0.3|0.4:2.5|1.8'),
 'starlight': ('bm_fable', 0.95, 0.9, 'chorus=0.5:0.9:50|70:0.35|0.3:0.25|0.35:1.5|1,aecho=0.8:0.6:150:0.18'),
 'dog':     ('am_adam', 0.82, 0.9, 'lowpass=f=5200,tremolo=f=3:d=0.12'),
 'chicks':  ('af_jessica', 1.1, 1.8, 'chorus=0.6:0.9:25|40|55:0.3|0.25|0.2:0.25|0.3|0.4:2|2.3|2.6'),
 'fox':     ('am_liam', 1.16, 1.2, 'equalizer=f=1400:t=q:w=1.2:g=5,highpass=f=200'),
 'wolf':    ('bm_lewis', 0.95, 0.85, 'equalizer=f=160:t=q:w=1:g=3,aecho=0.8:0.5:50:0.1'),
 'boss_sky':      ('am_fenrir', 0.95, 0.7, 'aecho=0.8:0.6:110:0.16,lowpass=f=4500'),
 'boss_jungle':   ('am_onyx', 0.95, 0.66, 'tremolo=f=30:d=0.4,asoftclip=type=tanh,lowpass=f=3000'),
 'boss_cave':     ('bf_isabella', 1.05, 1.3, 'flanger=delay=3:depth=4:speed=1.5,aecho=0.8:0.5:80:0.14'),
 'boss_factory':  ('am_echo', 0.95, 0.72, ROBOT + ',acrusher=bits=8:mix=0.5'),
 'boss_space':    ('am_eric', 1.0, 1.3, ROBOT + ',aphaser=type=t:speed=1.2'),
 'boss_universe': ('am_santa', 0.9, 0.6, 'aecho=0.8:0.6:160:0.16,lowpass=f=4200'),
}
EV = ['select','launch','boost','hit','oof','star','fatality','win','die','revive']
L = {
 'classic': ["Hiya! Let's fly!","Wheee! Here we go!","Woohoo! Turbo!",["Take that!","Hah! Outta my way!"],"Ouch!","Yay! A star!","Balloon slam!","Yes! I did it!","Oh nooo! I popped!","I'm baaack!"],
 'gumball': ["Hee hee! I'm Gumball!","Bubble time!","Zoom zoom zoom!",["Pop!","Get sticky!"],"Hey! Rude!","Sweeet!","Bubble trap!","Too sweet for you!","Nooo! My bubble!","Fresh and chewy!"],
 'clown':   ["Honk honk! Wanna hear a joke?","Liftoff! Honk honk!","Hold on to your noses!",["Pie in your face!","Honk honk!"],"Hey! Not funny!","Ta-daaa!","Pie party!","Ha ha ha! The joke's on you!","That's... not funny...","The show must go on!"],
 'toy':     ["Beep boop. Hello, human.","Launch sequence, go!","Turbo mode, activated!",["Target destroyed.","Obstacle removed."],"Damage detected!","Star collected.","Laser eyes!","Victory. Computed.","System... failure...","Rebooting. I am online!"],
 'melon':   ["Watermelon, ready to roll!","Wheee! So juicy!","Spin to win!",["Splat!","Seeds away!"],"Ow! My rind!","Juicy star!","Seed storm!","Fresh victory!","I'm all smashed...","Still fresh!"],
 'monster': ["Rawr! I'm hungry!","Rawr! Let's go!","Monster boost!",["Crunch!","Grr! Smash!"],"Grr! That hurt!","Mine! All mine!","Mega chomp!","Yum! Boss for dinner!","Nooo... monster down...","Monster is back! Rawr!"],
 'ninja':   ["I am the shadow.","Silent liftoff.","Shadow speed!",["Hi-yah!","Too slow!"],"Just a scratch.","As planned.","Shadow slash!","You never saw me coming.","Defeated... with honor.","The shadow returns."],
 'galaxy':  ["Greetings from the galaxy!","To the stars!","Warp speed!",["Cosmic bonk!","Space smash!"],"Ow! Space hurts!","Another star for my sky!","Black hole!","The universe is mine!","Lost in space...","Reborn from stardust!"],
 'gold':    ["Behold! Your king!","Make way for the king!","Royal rocket!",["Bow before me!","Off with your head!"],"How dare you!","A star fit for a king!","Midas touch!","Long live the king!","The king... has fallen...","The king returns!"],
 'dragon':  ["I am the dragon! Roar!","Spread your wings!","Dragon fire!",["Burn!","Roasted!"],"Grr! My scales!","Shiny! Mine!","Dragon breath!","Bow to the dragon!","My fire... is out...","Rise from the ashes!"],
 'unicorn': ["Hello, sparkles!","Rainbow, go!","Sparkle speed!",["Magic poke!","Sparkle bonk!"],"Eek! My mane!","So sparkly!","Rainbow blast!","Magic always wins!","My rainbow... faded...","Sparkles are back!"],
 'diamond': ["Shine bright, like a diamond.","Brilliant!","Crystal rush!",["Shatter!","Too hard for you!"],"Hey! A scratch!","Flawless!","Diamond storm!","Unbreakable!","Cracked...","Polished and perfect!"],
 'prism':   ["Prism power! Taste the rainbow light!","Light speed!","Full spectrum!",["Rainbow beam!","Blinded by the light!"],"Hey! My facets!","Pure light!","Rainbow shatter!","Light always wins!","My light... is fading...","Shining again!"],
 'starlight': ["I am the Star Legend!","Rise, starlight!","Supernova!",["Starfall!","Bow to the legend!"],"You dare touch a legend?","Another star. Of course.","Supernova strike!","Legends never lose!","Even legends... fall...","A legend never dies!"],
}
# The talking characters have several lines for each moment, plus chatter they say on their own while flying.
L.update({
 'dog':    [["Huh? Oh... hi. Is it nap time?","Yawn... I'm awake. Mostly.","Five more minutes, please..."],["Okay... let's float... slowly...","Up we go... yawn...","Wake me when we land."],["Whoa! Too fast! I'm awake!","Zoomies!","Woof! Speedy!"],["Woof! Bonk!","Shoo! Go away!","Bad critter!"],["Ow! I was napping!","Hey! My ears!","Yelp! Not nice!"],["Ooh... a sparkly treat.","Good boy gets a star!","Shiny... nice..."],["Sleepy slam!","Nap attack!"],["Good boy! Now... nap time.","I did it! Can I sleep now?","Woof! Victory!"],["Goodnight... everyone...","Zzz... huh? Oh no..."],["I'm up! I'm up!","That was a nice nap. Let's go!"]],
 'chicks': [["Peep peep! We're the chicks!","Hi! Hi! Hi! Let's play!","Three chicks, one balloon!"],["Wheee! We're flying!","Up, up, up we go!","Look, mama! No feet!"],["Super chick speed!","Faster! Faster!","Peep peep, zoom!"],["Peck peck!","Take that! Peep!","Chick attack!"],["Ouchie! Mama!","Hey! Rude!","Peep! That hurt!"],["Shiny! Can we eat it?","A star! Yay yay yay!","Ooh, sparkly!"],["Peck peck peck!","Chick stampede!"],["We did it! Group hug!","Chicks rule!","Yay! Let's do it again!"],["Mama... help...","Uh oh... we popped..."],["We're back! Peep peep!","Again! Again!"]],
 'fox':    [["I'm the big bad fox! Fear me!","Hehe. Nobody suspects the fox.","Sneaky, clever, and very handsome!"],["Time for a sneaky flight!","Shh! Tiptoe into the sky!","Off we go, quietly!"],["Hehe! Too fast to catch!","Fox speed!","Nobody outfoxes me!"],["Outfoxed you!","Ha! Tricked you!","Gotcha, sucker!"],["Ow! My beautiful tail!","Hey! That wasn't in my plan!","Ouch! Okay, okay!"],["A shiny star for a clever fox!","Another trophy for the fox!","Hehe, mine now!"],["Fox trick!","Feather frenzy!"],["Who's the big bad fox now?","Clever beats strong! Hehe!","The fox wins again!"],["My plan... was perfect...","Oh no... not again..."],["The fox is back, baby!","Did you miss me? Hehe!"]],
 'wolf':   [["Hmph. I am the big bad wolf.","What do you want? I'm busy.","Don't make me huff and puff."],["Fine. Let's go.","Ugh. Up we go.","Move it, sky!"],["I'll huff, and I'll puff!","Out of my way!","Grr! Full speed!"],["Get lost!","Hmph! Pathetic!","Grr! Beat it!"],["Ow! That's it, I'm angry!","Grr! Who did that?","You'll pay for that!"],["Hmph. Not bad.","A star. Whatever.","Fine, I'll take it."],["Huff and puff!","Big bad blow!"],["Nobody beats the big bad wolf!","Hmph. Too easy.","That's what you get!"],["Ugh... I hate balloons...","This... is so embarrassing..."],["The wolf is back. And grumpier!","Round two. Let's go."]],
})
CHAT = {
 'dog':    ["Zzz... huh? I'm awake!","Is it dinner time yet?","I could really use a nap.","Who's a good boy? Me?","This cloud looks comfy.","Yawn... flying is tiring.","I smell... sausages?","Five more minutes..."],
 'chicks': ["Are we there yet?","Is that a worm? I want it!","Mama says don't fly too high.","I'm the oldest! No, I am!","Peep! Peep! Peep!","Can we be big bad foxes too?","I'm hungry. Are clouds yummy?","Let's play hide and seek!"],
 'fox':    ["Am I scary yet? Be honest.","One day, I'll catch a chicken. One day!","Grr! See? Very scary.","I have a plan. A brilliant plan!","Nobody tell the chicks I'm up here.","Who needs wings? I've got brains!","Hmm, that cloud looks like a chicken.","Big. Bad. Fox. Remember that!"],
 'wolf':   ["Why am I a balloon? Ugh.","I'm not grumpy. I'm just hungry.","Grr. Stop staring at me.","In my day, wolves walked.","If I see that fox again...","Hmph. Nice view. I guess.","Don't tell anyone I'm having fun.","My stomach is growling. Or is that me?"],
}
BOSS = {'sky':"Feel the thunder! Ha ha ha!",'jungle':"You dare enter my jungle?",'cave':"Welcome to my cave, little balloon!",'factory':"Target acquired. Prepare to be crushed.",'space':"Earthling! Surrender now!",'universe':"I will swallow your stars!"}
MOOD_SPEED = {'hit':1.12,'oof':1.1,'fatality':1.05,'die':0.85,'tired':0.8}
MOOD_PITCH = {'die':0.93,'tired':0.94,'select':1.03,'win':1.04,'star':1.04,'launch':1.03,'boost':1.04}
lines = {}
def make(char, ev, i, text):
    voice, speed, pitch, extra = CHARS[char]
    s, sr = k.create(text, voice=voice, speed=min(1.6, speed*MOOD_SPEED.get(ev,1.0)), lang='en-us')
    tmp = f'/tmp/claude-0/kk_{char}_{ev}{i}.wav'; sf.write(tmp, s, sr)
    p = pitch*MOOD_PITCH.get(ev,1.0)
    chain = f"silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB:stop_duration=0.25,rubberband=pitch={p:.3f}:formant=shifted,{extra},highpass=f=90,aresample=24000"
    d = os.path.join(OUT, char.replace('boss_','boss-')); os.makedirs(d, exist_ok=True)
    out = os.path.join(d, f'{ev}{i}.mp3'); mid = tmp.replace('.wav','_fx.wav')
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',tmp,'-af',chain,'-ac','1','-c:a','pcm_f32le',mid], check=True)
    a, r = sf.read(mid); a = np.nan_to_num(a, nan=0.0, posinf=0.0, neginf=0.0)
    rms = np.sqrt(np.mean(a[np.abs(a) > 0.01]**2)) if np.any(np.abs(a) > 0.01) else 1
    a = a * (0.16 / rms); peak = np.max(np.abs(a))
    if peak > 0.9: a = a * (0.9 / peak)
    a = np.concatenate([np.zeros(240), a, np.zeros(1200)])
    sf.write(mid, a.astype(np.float32), r, subtype='FLOAT')
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',mid,'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','40k',out], check=True)
    os.remove(mid)
    os.remove(tmp); return out
ONLY = set(sys.argv[2:])
for char, texts in L.items():
    if ONLY and char not in ONLY: continue
    lines[char] = {}
    for ev, t in zip(EV, texts):
        variants = t if isinstance(t, list) else [t]
        lines[char][ev] = []
        for i, txt in enumerate(variants):
            make(char, ev, i, txt); lines[char][ev].append(txt)
    if char in CHAT:
        lines[char]['chat'] = []
        for i, txt in enumerate(CHAT[char]):
            make(char, 'chat', i, txt); lines[char]['chat'].append(txt)
    print(char, flush=True)
for st, taunt in ({} if ONLY else BOSS).items():
    c = 'boss_'+st; lines['boss-'+st] = {}
    for ev, txt in [('taunt',taunt),('tired',"I need... a break..."),('defeat',"Nooo! Impossible!")]:
        make(c, ev, 0, txt); lines['boss-'+st][ev] = [txt]
    print(c, flush=True)
if not ONLY: json.dump(lines, open(os.path.join(OUT,'lines.json'),'w'), indent=0)
else: print(json.dumps(lines, separators=(',',':')))
