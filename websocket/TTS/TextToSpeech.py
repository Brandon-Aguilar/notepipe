# - Have to put MIT license text somewhere here?
# - Might have to add `gTTS==2.2.4` to requirements.txt

# Based on documentation, gTTS is based on Google-translate's TTS API
from gtts import gTTS

""" This script needs to be fed the text outputted from ocr script """

# There should be two periods whenever you want the TTS to pause (it doesn't pause after a single period for some reason)
text = "this is a test.. audio file should be reading this text test"

# Generate audio file
audio = gTTS(text=text, lang="en", slow=False)
audio.save("test_audio.mp3")

""" Give this newly generated audio file to redis database? """