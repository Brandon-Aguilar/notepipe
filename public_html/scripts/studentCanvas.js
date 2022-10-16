// Fetch url params, interested in key
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const studentKey = urlParams.get("key");
// add error handling for params

serverURL = getWebSocketServer();

function getWebSocketServer() {
    if (window.location.host === "notepipe.io") {
        return "wss://notepipe.herokuapp.com/";
    } else if (window.location.host === "localhost:8080") {
        return "ws://localhost:8001/";
    } if (window.location.host === "coral-app-55tcu.ondigitalocean.app" || window.location.host === "notepipe.net") {
        return "wss://seahorse-app-hvogi.ondigitalocean.app/notepipe-websocket2";
    }
    else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
}

// connect to web socket
// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json");
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

//Fetch HTML elements that need event listners
var TTSElement=document.getElementById("TTS");
const download = document.getElementById('download');

// Event listeners to trigger functions
window.addEventListener('resize', resize);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeStudent)
download.addEventListener('click', downloadbutton);
TTSElement.addEventListener('click', textToSpeech);

image.onload = function() {
    ctx.drawImage(image, 0, 0);
}

pageNumber = 0;

// Fetch HTML elements to be updated
var updateMessageElement = document.getElementById("updateStatus");
var studentLinkElement = document.getElementById("studentLink");
var studentLinkAnchorElement = document.getElementById("studentLinkAnchor");
var drawAnimationsCheckboxElement = document.getElementById("drawAnimationsCheckbox");

var drawAnimations = drawAnimationsCheckboxElement.checked;
drawAnimationsCheckboxElement.addEventListener("change", () => {
    drawAnimations = drawAnimationsCheckboxElement.checked;
    console.log(drawAnimations);
});


// resize canvas
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

// Initialize connection
function initializeStudent() {
    const event = { type: "initializeStudent",  studentKey: studentKey, image: image};
    websocket.send(JSON.stringify(event))
}

//same as teacher draw function
function draw(data) {
    ctx.beginPath();
    ctx.moveTo(data.lastPoint.x, data.lastPoint.y);
    ctx.lineTo(data.x, data.y);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.force;
    ctx.lineCap = 'round';
    ctx.stroke();    
}

//Download the current page
 function downloadbutton(e) {
    console.log(canvas.toDataURL());
    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = canvas.toDataURL();
    link.click();
    link.delete;
  };


//request text to speech
function textToSpeech(){
    const request = { type: "textToSpeech",  studentKey: studentKey};
    websocket.send(JSON.stringify(request))
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
            image.src = event.imageURL;
            link = "student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;
            break;
        case "canvasDrawUpdateBroadcast"://event.__type__= "canvasDrawUpdateBroadcast"
            console.log("Updating Draw Instructions");
            
            if(drawAnimations){
                currentDrawInstructions = currentDrawInstructions.concat(event.drawData);
                currentFrames.push(window.requestAnimationFrame(animateDraw));
            } else {
                event.drawData.forEach((element) => {//loop through each value
                    element = JSON.parse(element);
                    draw(element);//just output the stroke 
                });
            }
            
            break;
        case "clearpage":
            // cancel all the current animations and draw them instantly
            cancelAllAnimationFrames();
            currentDrawInstructions.splice(0, currentInstructionIndex);
            currentDrawInstructions.forEach((element) => {//loop through each value
                element = JSON.parse(element);
                draw(element);//just output the stroke 
            });
            //clear page fixed
            width = window.innerWidth
            height = window.innerHeight
            ctx.clearRect(0, 0, width, height)

    }   
}


currentDrawInstructions = [];
currentInstructionIndex = 0;
currentFrames = [];

function animateDraw() {
    if(currentDrawInstructions.length == 0){
        return;
    }
    if(currentInstructionIndex >= currentDrawInstructions.length){
        currentInstructionIndex = 0;
        currentDrawInstructions = [];
    } else {
        var element = JSON.parse(currentDrawInstructions[currentInstructionIndex]);
        draw(element);
        currentInstructionIndex += 1;
    }
    currentFrames.push(window.requestAnimationFrame(animateDraw));
}

function cancelAllAnimationFrames() {
    currentFrames.forEach((frameID) => {
        window.cancelAnimationFrame(frameID);
    });
}


