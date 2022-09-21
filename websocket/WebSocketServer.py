#!/usr/bin/env python

import asyncio
import json
import websockets

from Controllers.ConnectionController import initializeHost, initializeStudent
from Models.errorHandler import sendError

async def handler(websocket):
    """Handle initial connections to websocket"""
    while True:
        try:
            message = await websocket.recv()
            messageJSON = json.loads(message)
        

            match messageJSON["type"]:
                case "initializeHost":
                     await initializeHost(websocket)
                case "initializeStudent":
                    await initializeStudent(websocket, messageJSON["studentKey"])

        except websockets.ConnectionClosedOK:
            break
        except KeyError:
            await sendError(websocket, "Missing required key/value pair")
            return



#   SSL stuff, does not work since we don't have a valid SSL certificate
#   ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
#   localhost_pem = pathlib.Path(__file__).with_name("localhost.cer")
#   ssl_context.load_cert_chain(localhost_pem)
#   Use this if we ever implement it
#     async with websockets.serve(handler, "", 8001, ssl=ssl_context):


async def main():
    async with websockets.serve(handler, "", 8001, subprotocols=["json"]):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())