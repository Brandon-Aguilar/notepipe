# Introduction
Barebones prototype of note livestreaming, does not include most features.

# Requirements
Check requirements.txt for more info
* websockets 10.3
* Python 3.10.6

# How to Run
Run ```Python3 WebSocketServer.py``` to launch the web socket server. It will launch on ```127.0.0.1:8001``` by default.

Launch a local web server and connect to ```teacher.html```. It should connect and provide the URL to connect to the room as a student at the top right.

Use another window and connect to the URL. You should now be able to see all the drawings from the teacher.

# TODO

* Marker properties and erase feature
* Homepage to generate teacher view and student views
* Currently a bug where resizing window erases canvas locally
* Mostly no error handling implemented
* Need debug messages for client and server
* Need unit tests and integeration tests