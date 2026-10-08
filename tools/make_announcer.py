# Rebuilds audio/voices/announcer/: the deep announcer for power-ups, the boss and fatalities.
# Same setup as make_voices.py; run: python make_announcer.py ../audio/voices/announcer [kokoro voice]
# Keep the lines in sync with VOICE_LINES.announcer in voices.js.
# Announcer: deep voice dropped in pitch, an octave-lower layer underneath, soft distortion and a cavernous echo.
import os, subprocess, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
k = Kokoro('kokoro-v1.0.int8.onnx', 'voices-v1.0.bin')
LINES = {'energy':'Energy!','ready':'Boost ready!','engine':'Engine boost!','turbo':'Turbo!','magnet':'Coin magnet!','shield':'Shield!','double':'Double coins!','boss':'Boss incoming!','fatality':'Fatality!'}
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'am_fenrir'
for key, text in LINES.items():
    s, sr = k.create(text, voice=VOICE, speed=0.82, lang='en-us')
    tmp = f'/tmp/claude-0/ann_{key}.wav'; mid = tmp.replace('.wav', '_fx.wav'); sf.write(tmp, s, sr)
    fc = ("[0:a]silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB:stop_duration=0.3,asplit=2[a][b];"
          "[a]rubberband=pitch=0.76:formant=shifted,equalizer=f=180:t=q:w=1:g=4[hi];"
          "[b]rubberband=pitch=0.5:formant=shifted,lowpass=f=1400,volume=0.55[lo];"
          "[hi][lo]amix=inputs=2:normalize=0,asoftclip=type=tanh:threshold=0.6,"
          "apad=pad_dur=1.2,aecho=0.8:0.8:70|160|320:0.3|0.22|0.14,highpass=f=55,aresample=24000[out]")
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',tmp,'-filter_complex',fc,'-map','[out]','-ac','1','-c:a','pcm_f32le',mid], check=True)
    a, r = sf.read(mid); a = np.nan_to_num(a)
    loud = a[np.abs(a) > 0.01]; rms = np.sqrt(np.mean(loud**2)) if loud.size else 1
    a = a * (0.2 / rms); a = a * min(1, 0.92 / np.max(np.abs(a)))
    end = len(a) - np.argmax(np.abs(a[::-1]) > 0.004); a = a[:end + 400]
    sf.write(mid, a.astype(np.float32), r, subtype='FLOAT')
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',mid,'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','48k',os.path.join(OUT, f'{key}0.mp3')], check=True)
    os.remove(tmp); os.remove(mid); print(key, round(len(a)/r, 2), 's', flush=True)
