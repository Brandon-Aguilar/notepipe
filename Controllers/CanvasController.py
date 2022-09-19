import json
import string
import websockets

from Models.responses import canvasBroadcast, canvasUpdateSuccess

async def canvasUpdate(websocket, messageJSON, connected, studentKey: string):
    # send image to redis
    # send updates to students
    broadcast = canvasBroadcast()
    broadcast.imageURL = messageJSON["imageURL"]
    broadcast.page = messageJSON["page"]
    websockets.broadcast(connected, broadcast.toJson())

    response = canvasUpdateSuccess()
    await websocket.send(response.toJson())