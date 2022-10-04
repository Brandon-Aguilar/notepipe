// Connect to websocket
serverURL = "ws://localhost:8001/";

// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json", { rejectUnauthorized: false });
console.log("Connected to Websocket");

// Copied canvas code
// create canvas element and append it to document body
var canvas = document.createElement('canvas');
canvas.setAttribute("id", "drawingCanvas");
document.body.appendChild(canvas);

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = 'absolute';

// get canvas 2D ctx and set him correct size
var ctx = canvas.getContext('2d');
resize();

// last known position
var pos = { x: 0, y: 0 };

window.addEventListener('resize', resize);
document.addEventListener('mousemove', move);
document.addEventListener('click', attemptUpdate);

// Listen for websocket messages and when initialization finished
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeHost)

pageNumber = 0;

// get html elements
updateMessageElement = document.getElementById("updateStatus");
studentLinkElement = document.getElementById("studentLink");
studentLinkAnchorElement = document.getElementById("studentLinkAnchor");


// resize canvas
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

var lastPoint = undefined;
var force = 1;
var color = "red";
var drawInstructions = [];

function attemptUpdate(){
        websocket.send(JSON.stringify({
            type: 'canvasDrawUpdate',
            drawData: drawInstructions
        }));
        drawInstructions = [];
        console.log("Sent Batch Update");
}


function draw(data) {
    ctx.beginPath();
    ctx.moveTo(data.lastPoint.x, data.lastPoint.y);
    ctx.lineTo(data.x, data.y);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = Math.pow(data.force || 1, 4) * 2;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function move(e) {
    if (e.buttons) {
        if (typeof lastPoint == 'undefined') {
            lastPoint = { x: e.offsetX, y: e.offsetY };
            return;
        }
        if (Math.abs(e.offsetX - lastPoint.x) < 1 || Math.abs(e.offsetY - lastPoint.y) < 1){
            return;
        }

        draw({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            force: force,
            color: color || 'green'
        });

        drawData = JSON.stringify({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            color: color || 'green',
            force: force
        });

        drawInstructions.push(drawData);
        //attemptUpdate();

        lastPoint = { x: e.offsetX, y: e.offsetY };
    } else {
        lastPoint = undefined;
    }
}

// Initialize connection to host
function initializeHost() {
    const event = { type: "initializeHost" };
    websocket.send(JSON.stringify(event))
}

// Send canvas updates, triggered by click end
function sendUpdate() {
    console.log("Sending canvas")
    var imageURL = canvas.toDataURL("image/png", 0.2);
    var message = {
        type: "canvasUpdate",
        page: pageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message))
}

// Handle messages sent to client
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
            break;
    }
}
