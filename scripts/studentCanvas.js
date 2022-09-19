const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const studentKey = urlParams.get("key");
// add error handling for params

serverURL = "ws://localhost:8001/";

// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json", { rejectUnauthorized: false });
console.log("Connected to Websocket");

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


window.addEventListener('resize', resize);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeStudent)
image.onload = function() {
    ctx.drawImage(image, 0, 0);
}

pageNumber = 0;

updateMessageElement = document.getElementById("updateStatus");
studentLinkElement = document.getElementById("studentLink");
studentLinkAnchorElement = document.getElementById("studentLinkAnchor");


// resize canvas
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}


function initializeStudent() {
    const event = { type: "initializeStudent",  studentKey: studentKey};
    websocket.send(JSON.stringify(event))
}


function processMessage({ data }) {
    const event = JSON.parse(data);
    console.log(event)
    switch(event.__type__){
        case "canvasBroadcast":
            updateMessageElement.textContent="Content Received";
            image.src = event.imageURL;
            break;
        case "initializeStudentSuccess":
            console.log("Successfully initialized Student");
            link = "/student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;
    }
}
