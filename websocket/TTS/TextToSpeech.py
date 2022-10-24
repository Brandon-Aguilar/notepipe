from google.cloud import texttospeech
import os
import redis

# Replace `<json key filename>` and call testAudio() to test tts
#os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "<json key filename>"

""" Retrieve text generated from ocr script (probably from redis database) """

# Take in some text and turn it into audio using customizable speech synthesis
def createAudio(text):
    client = texttospeech.TextToSpeechClient()
    syn_input = texttospeech.SynthesisInput(ssml=text)

    # Customization for how the voice sounds and how it gets encoded
    voice = texttospeech.VoiceSelectionParams(language_code = "en-US", name = "en-US-Wavenet-G")
    audio_config = texttospeech.AudioConfig(audio_encoding = texttospeech.AudioEncoding.MP3)

    # Create the audio and output it (as an mp3 file here)
    response = client.synthesize_speech(input = syn_input, voice = voice, audio_config = audio_config)
    with open("test.mp3", "wb") as out:
        out.write(response.audio_content)

# Test the createAudio function
def testAudio():
    text = "<speak> This is a test. Text should be converted to audio. </speak>" # Uses ssml tags
    createAudio(text)

# redis test
def storeData():
    database = redis.StrictRedis(host = "localhost", port = 8002, decode_responses = True)
    database.set("redis_test", "this should be outputted")

# redis test
def getData():
    database = redis.StrictRedis(host = "localhost", port = 8002, decode_responses = True)
    text = database.get("redis_test")
    print(text)

""" Store generated audio into redis database """
# Uncomment two function calls below to test redis
#storeData()
#getData()