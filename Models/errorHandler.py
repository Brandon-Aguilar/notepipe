from Models.responses import error

async def sendError(websocket, message):
    event = error()
    event.message = message
    await websocket.send(event.toJson())
