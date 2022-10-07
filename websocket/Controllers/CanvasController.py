import websockets
import logging
import redis
import json

redisServer = redis.Redis(host="172.18.0.4",port=6379)

from Models.responses import canvasBroadcast, canvasUpdateSuccess, canvasDrawUpdateBroadcast
from Models.redisObjects import hostPages, loadHostPagesFromJSON

log = logging.getLogger(__name__)


async def canvasUpdate(websocket, messageJSON, connected, studentKey: str):
    """Save updated canvas to redis"""
    # send image to redis
    log.info("Saving image on key %s, with websocket id %s", studentKey, websocket.id)
    imageURL = messageJSON["imageURL"]
    pageNumber = messageJSON["pageNumber"]

    if redisServer.exists(studentKey):
        log.info("Updating hostPage object for %s", studentKey)
        
        pages: hostPages = loadHostPagesFromJSON(redisServer.get(
            studentKey))
        pages.updatePage(imageURL, pageNumber)
        redisServer.set(studentKey, pages.toJson())
    else:
        log.info("Created new hostPage object for %s", studentKey)

        pages: hostPages = hostPages([imageURL], studentKey)
        redisServer.set(studentKey, pages.toJson())


    log.info("Set image in redis for studentKey %s", studentKey)

    response = canvasUpdateSuccess()
    await websocket.send(response.toJson())


async def canvasDrawUpdate(websocket, messageJSON, connected, studentKey: str):
    """Send draw instructions to students"""
    # send image to redis
    # send updates to students
    log.info("Sending out stroke on key %s, with websocket id %s",
             studentKey, websocket.id)

    broadcast = canvasDrawUpdateBroadcast()
    broadcast.drawData = messageJSON["drawData"]
    websockets.broadcast(connected, broadcast.toJson())

    response = canvasUpdateSuccess()
    await websocket.send(response.toJson())
