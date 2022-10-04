import websockets

from Models.responses import canvasBroadcast, canvasUpdateSuccess, canvasDrawUpdateBroadcast


async def canvasUpdate(websocket, messageJSON, connected, studentKey: str):
    """Save updated canvas to redis and send update to students"""
    # send image to redis
    # send updates to students
    broadcast = canvasBroadcast()
    broadcast.imageURL = messageJSON["imageURL"]
    broadcast.page = messageJSON["page"]
    websockets.broadcast(connected, broadcast.toJson())

    response = canvasUpdateSuccess()
    await websocket.send(response.toJson())

async def canvasDrawUpdate(websocket, messageJSON, connected, studentKey: str):
    """Save updated canvas to redis and send update to students"""
    # send image to redis
    # send updates to students
    broadcast = canvasDrawUpdateBroadcast()
    broadcast.drawData = messageJSON["drawData"]
    websockets.broadcast(connected, broadcast.toJson())

    response = canvasUpdateSuccess()
    await websocket.send(response.toJson())
