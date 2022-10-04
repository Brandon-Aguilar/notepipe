import secrets
import json
from Controllers.CanvasController import canvasUpdate, canvasDrawUpdate

from Models.responses import initializeHostSuccess, initializeStudentSuccess
from Models.errorHandler import sendError


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

    # associate host key with student key
    # Store list of connections to be broadcasted to
    HOST_KEYS[hostKey] = studentKey
    JOINED[studentKey] = {websocket}

    response = initializeHostSuccess()
    response.hostKey = hostKey
    response.studentKey = studentKey

    try:
        await websocket.send(response.toJson())
        await hostConnection(websocket, hostKey, studentKey)
    finally:
        # this will need to be changed to allow a reconnect.
        # this drops connections as soon as host loses connection
        del HOST_KEYS[hostKey]


async def hostConnection(websocket, hostKey, studentKey):
    """Process messages for a host connection, loops until disconnected"""
    async for message in websocket:
        messageJSON = json.loads(message)
        match messageJSON["type"]:
            case "canvasUpdate":
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "canvasDrawUpdate":
                await canvasDrawUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])


async def initializeStudent(websocket, studentKey):
    """Check for valid key and add connection to host's connections"""
    try:
        connected = JOINED[studentKey]
    except KeyError:
        await sendError(websocket, "Invalid Key")
        return

    connected.add(websocket)

    response = initializeStudentSuccess()
    response.studentKey = studentKey

    try:
        await websocket.send(response.toJson())
        await studentConnection(websocket, studentKey)
    finally:
        connected.remove(websocket)


async def studentConnection(websocket, studentKey):
    """Process messages for a student connection, loops until disconnected"""

    async for message in websocket:
        messageJSON = json.loads(message)
        match messageJSON["type"]:
            # Button events
            case "placeholder":
                message = "placeholder"
