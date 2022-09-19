serverURL = "ws://localhost:8001/";

// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json", { rejectUnauthorized: false });
console.log("Connected to Websocket");

// create canvas element and append it to document body
var canvas = document.createElement('canvas');
canvas.setAttribute("id", "drawingCanvas");
document.body.appendChild(canvas);

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = 'absolute';

// get canvas 2D context and set him correct size
var ctx = canvas.getContext('2d');
resize();

// last known position
var pos = { x: 0, y: 0 };

window.addEventListener('resize', resize);
document.addEventListener('mousemove', draw);
document.addEventListener('mousedown', setPosition);
document.addEventListener('mouseenter', setPosition);
document.addEventListener('click', sendUpdate);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeHost)

pageNumber = 0;

updateMessageElement = document.getElementById("updateStatus");
studentLinkElement = document.getElementById("studentLink");
studentLinkAnchorElement = document.getElementById("studentLinkAnchor");

// new position from mouse event
function setPosition(e) {
    var rect = canvas.getBoundingClientRect(); pos.x = e.clientX - rect.left; pos.y = e.clientY - rect.top; 
}

// resize canvas
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

function draw(e) {
  // mouse left button must be pressed
  if (e.buttons !== 1) return;

  updateMessageElement.textContent="Content Not Sent";


  ctx.beginPath(); // begin

  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#c0392b';

  ctx.moveTo(pos.x, pos.y); // from
  setPosition(e);
  ctx.lineTo(pos.x, pos.y); // to

  ctx.stroke(); // draw it!
}

function initializeHost() {
    const event = { type: "initializeHost" };
    websocket.send(JSON.stringify(event))
}

function sendUpdate() {
    console.log("Sending canvas")
    var imageURL = canvas.toDataURL();
    var message = {
        type: "canvasUpdate",
        page: pageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message))
}

function processMessage({ data }) {
    const event = JSON.parse(data);
    console.log(event)
    switch(event.__type__){
        case "canvasUpdateSuccess":
            updateMessageElement.textContent="Content Sent";
            break;
        case "initializeHostSuccess":
            console.log("Successfully initialized host");

            link = "/student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;
    }
}
