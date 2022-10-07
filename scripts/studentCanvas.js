// Fetch url params, interested in key
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const studentKey = urlParams.get("key");
// add error handling for params

serverURL = "ws://localhost:8001/";

// connect to web socket
// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json", { rejectUnauthorized: false });
console.log("Connected to Websocket");


// Copied canvas code
// create canvas element and append it to document body
var canvas = document.createElement('canvas');
canvas.setAttribute("id", "viewingCanvas");
document.body.appendChild(canvas);

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = 'absolute';


var ctx = canvas.getContext('2d');
var image = new Image();
resize();

// Event listeners to trigger functions
window.addEventListener('resize', resize);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeStudent)
image.onload = function() {
    ctx.drawImage(image, 0, 0);
}

pageNumber = 0;

// Fetch HTML elements to be updated
var updateMessageElement = document.getElementById("updateStatus");
var studentLinkElement = document.getElementById("studentLink");
var studentLinkAnchorElement = document.getElementById("studentLinkAnchor");


// resize canvas
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

// Initialize connection
function initializeStudent() {
    const event = { type: "initializeStudent",  studentKey: studentKey};
    websocket.send(JSON.stringify(event))
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

// Handle valid messages sent to client
function processMessage({ data }) {
    const event = JSON.parse(data);
    console.log(event)
    switch(event.__type__){
        //case "canvasBroadcast":
        //    updateMessageElement.textContent="Content Received";
        //    image.src = event.imageURL;
         //   break;
        case "initializeStudentSuccess":
            console.log("Successfully initialized Student");
            link = "/student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;
            break;
        case "canvasDrawUpdateBroadcast":
            console.log("Drawing data");
            event.drawData.forEach(element => {
                element = JSON.parse(element);
                draw(element);
            });
            break;
    }   
}
