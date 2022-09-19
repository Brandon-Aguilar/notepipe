import secrets
import json
from Controllers.CanvasController import canvasUpdate

from Models.responses import initializeHostSuccess, initializeStudentSuccess
from Models.errorHandler import sendError


HOST_KEYS = {str : str}
STUDENT_KEYS = set()
JOINED = {}

async def createStudentKey():
    studentKey = secrets.token_urlsafe(16)
    while studentKey in STUDENT_KEYS:
        studentKey = secrets.token_urlsafe(16)
    STUDENT_KEYS.add(studentKey)
    return studentKey

async def initializeHost(websocket):
    hostKey = secrets.token_urlsafe(16)
    while hostKey in HOST_KEYS:
        hostKey = secrets.token_urlsafe(16)

    studentKey = await createStudentKey()
    HOST_KEYS[hostKey] = studentKey
    JOINED[studentKey] = {websocket}

    response = initializeHostSuccess()
    response.hostKey = hostKey
    response.studentKey = studentKey

    try:
        await websocket.send(response.toJson())
        await hostConnection(websocket, hostKey, studentKey)
    finally:
        # this will need to be changed to allow a reconnect. this drops connections as soon as host loses connection
        del HOST_KEYS[hostKey]
        STUDENT_KEYS.remove(studentKey)

    
async def hostConnection(websocket, hostKey, studentKey):
    async for message in websocket:
        messageJSON = json.loads(message)
        match messageJSON["type"]:
            case "canvasUpdate":
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])

async def initializeStudent(websocket, studentKey):
    try:
        connected = JOINED[studentKey]
    except KeyError:
        await sendError(websocket, "Invalid Key")
        return

    connected.add(websocket)

    response = initializeStudentSuccess()
    response.studentKey = studentKey

    await websocket.send(response.toJson())

    try:
        await studentConnection(websocket, studentKey)
    finally:
        connected.remove(websocket)

async def studentConnection(websocket, studentKey):
    async for message in websocket:
        messageJSON = json.loads(message)
        match messageJSON["type"]:
            # Button events
            case default:
                message = "placeholder"
