import logging
import secrets
import json
from Controllers.CanvasController import canvasUpdate, canvasDrawUpdate,retrieveImage,wipestudent,textToSpeech,resett,studentStorepage

from Models.responses import initializeHostSuccess, initializeStudentSuccess,textToSpeechRequest
from Models.errorHandler import sendError
#from OCR.imageToText import readImage

log = logging.getLogger(__name__)

HOST_KEYS = {str: str}
JOINED = {str: list}


async def createStudentKey():
    studentKey = secrets.token_urlsafe(16)
    while studentKey in JOINED:
        studentKey = secrets.token_urlsafe(16)
    return studentKey


async def createHostKey():
    hostKey = secrets.token_urlsafe(16)
    while hostKey in HOST_KEYS:
        hostKey = secrets.token_urlsafe(16)
    return hostKey


async def initializeHost(websocket):
    """ Create keys and initialize a room """
    hostKey = await createHostKey()
    studentKey = await createStudentKey()
    log.info("Created keys for websocket %s", websocket.id)

    # associate host key with student key
    # Store list of connections to be broadcasted to
    HOST_KEYS[hostKey] = studentKey
    JOINED[studentKey] = {websocket}

    response = initializeHostSuccess()
    response.hostKey = hostKey
    response.studentKey = studentKey

    try:
        await websocket.send(response.toJson())
        log.info("Successfully opened connection with host %s", websocket.id)
        await hostConnection(websocket, hostKey, studentKey)
    finally:
        # this will need to be changed to allow a reconnect.
        # this drops connections as soon as host loses connection
        del HOST_KEYS[hostKey]


async def hostConnection(websocket, hostKey, studentKey):
    """Process messages for a host connection, loops until disconnected"""
    async for message in websocket:
        messageJSON = json.loads(message)
        log.info("Received message from host websocket %s with message type %s", websocket.id, messageJSON["type"])
        match messageJSON["type"]:
            case "canvasUpdate":#image
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "canvasDrawUpdate":#array
                await canvasDrawUpdate(websocket, messageJSON, JOINED[studentKey],
                                       HOST_KEYS[hostKey])
            case "Addnewpage":
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])         
                await wipestudent(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "resetcanvas":
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])         
                await resett(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "storePage":
                await studentStorepage(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])

async def initializeStudent(websocket, studentKey, image):
    """Check for valid key and add connection to host's connections"""
    try:
        connected = JOINED[studentKey]
    except KeyError:
        await sendError(websocket, "Invalid Key")
        return

    connected.add(websocket)

    response = initializeStudentSuccess()
    response.studentKey = studentKey
    await retrieveImage(studentKey,response)

    try:
        await websocket.send(response.toJson())
        log.info("Successfully opened connection with student %s", websocket.id)
        await studentConnection(websocket, studentKey)
    finally:
        connected.remove(websocket)


async def studentConnection(websocket, studentKey):
    """Process messages for a student connection, loops until disconnected"""

    async for message in websocket:
        messageJSON = json.loads(message)
        log.info("Received message from student websocket %s with message type %s",
                 websocket.id, messageJSON["type"])

        match messageJSON["type"]:
            # Button events
            case "textToSpeech":
                response= textToSpeechRequest()
                response.studentKey = studentKey
                await textToSpeech(websocket, studentKey,response)
                image=response.imageURL
                #readImage(image)
                log.info("image was retrieved %s", image)
            
