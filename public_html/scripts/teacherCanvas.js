// Connect to websocket
serverURL = getWebSocketServer();

function getWebSocketServer() {
    if (window.location.host === "localhost:8080") {
        return "ws://localhost:8001/";
    } if (window.location.host === "coral-app-55tcu.ondigitalocean.app" || window.location.host === "notepipe.net" || window.location.host === "notepipe.io" || window.location.host === "notepi.pe") {
        return "wss://seahorse-app-hvogi.ondigitalocean.app/notepipe-websocket2";
    }
    else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
}

// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json");
console.log("Connected to Websocket");

// Copied canvas code
// create canvas element and append it to document body
var canvas = document.createElement('canvas');
canvas.setAttribute("id", "drawingCanvas");
document.body.appendChild(canvas);

//grabs the undo button and creates an event if it is clicked
const testButton = document.getElementById("undo");
testButton.addEventListener('click', undo);

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = 'absolute';

// get canvas 2D ctx and set him correct size
var ctx = canvas.getContext('2d');

// Make our in-memory canvas stack for undos
var canvasStack = [canvas];
// used to check whether this is the first undo since that would be equal to the current state
var undoHasBeenDone = false;


resize();

// last known position
var pos = { x: 0, y: 0 };

var sentImage = false;

//window.addEventListener('resize', resize);
var drawCanvas=document.getElementById("drawingCanvas");
drawCanvas.addEventListener('pointermove', move, {capture: true, });

// Release mouse capture when not touching screen
drawCanvas.addEventListener('pointerup', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if(sentImage == false) {
        sendStroke(e);
        sentImage = true;
        
    }
}, {capture: true, });
drawCanvas.addEventListener('pointercancel', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if(sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, {capture: true, });
drawCanvas.addEventListener('pointerenter', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if(sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, {capture: true, });
// Disable panning, touch doesn't work if it is on
canvas.style.touchAction = 'none';

// Listen for websocket messages and when initialization finished
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeHost)

var pageNumber = 0;
var viewingPageNumber=0; //will keep track of current page being displayed (next/prev function)


// get html elements
updateMessageElement = document.getElementById("updateStatus");
studentLinkElement = document.getElementById("studentLink");
studentLinkAnchorElement = document.getElementById("studentLinkAnchor");
currentPageNumberElement = document.getElementById('currentPageNumber');

//instructor image saved locally
const localImages=[];

//save button
var updateSaveoption=document.getElementById('Saveoption')
updateSaveoption.addEventListener('click', Saveoption)

function Saveoption(){
    //for now teacher cannot go to previous page and use save function
    if(pageNumber==viewingPageNumber){
        pageNumber++;
        viewingPageNumber++;
        console.log("Saving page number: ",pageNumber)
        var imageURL = canvas.toDataURL("image/png", 0.2);
        
        var message = {
            type: "Savecanvas",
            pageNumber: pageNumber,
            imageURL,
        }
        websocket.send(JSON.stringify(message));
        //clear the current page
        width = window.innerWidth;
        height = window.innerHeight;  
        ctx.clearRect(0, 0, width, height);
        

        /*save the newly created page so student's that 
        join late have current page and not previous page*/
        sendUpdate();
        imageURL = canvas.toDataURL("image/png", 0.2);//updating canvas image
        localImages[localImages.length]=imageURL//it is a new page so it should be at index length

        currentPageNumberElement.textContent="Current page is "+viewingPageNumber;
    }
    else{
        currentPageNumberElement.textContent="please be on page"+pageNumber+" to add a new page";
        console.log("please be on last page to add a new page")
    }

}

// resize canvas
function resize() {

    var inMemCanvas = document.createElement('canvas');
    var inMemCtx = inMemCanvas.getContext("2d"); 
    inMemCanvas.width = canvas.width;
    inMemCanvas.height = canvas.height;
  inMemCtx.drawImage(canvas, 0, 0);
  ctx.canvas.width = Math.max(window.innerWidth, ctx.canvas.width);
  ctx.canvas.height = Math.max(window.innerHeight, ctx.canvas.height);
  ctx.drawImage(inMemCanvas, 0, 0);
}

function undo(){
    if(canvasStack.length < 1)
        return; 

    if(!undoHasBeenDone){
        if(canvasStack.length == 1)
            return;
        lastCanvas = canvasStack.pop();
    }   
    
    var lastCanvas = canvasStack.pop();

   
    undoHasBeenDone = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(lastCanvas, 0,0);

    if(canvasStack.length == 0){
        undoHasBeenDone = false;
        var inMemCanvas = document.createElement('canvas');
        var inMemCtx = inMemCanvas.getContext('2d');
        inMemCanvas.width = canvas.width;
        inMemCanvas.height = canvas.height;
        inMemCtx.drawImage(canvas, 0, 0);
        canvasStack.push(inMemCanvas);    
    }
}

//default settings for marker
var lastPoint = undefined;
var force = 1;//marker thickness
var color = "red";//marker color
var drawInstructions = [];
var markerWidth = 5;

var isPointerDown = false;

function sendStroke(e){
    sendDrawUpdate();//will send strokes to clients
    sendUpdate();//store canvas image to redis 
}

function sendDrawUpdate(){
    //save updated canvas locally 
    if(pageNumber==viewingPageNumber){//saving the most recent page
        var imageURL = canvas.toDataURL("image/png", 0.2);
        localImages[pageNumber]=imageURL
    }
    else{//editing a previously stored page
        var imageURL = canvas.toDataURL("image/png", 0.2);
        localImages[viewingPageNumber]=imageURL
    }

    websocket.send(JSON.stringify({//send array containing x,y corrdinate of strokes
        type: 'canvasDrawUpdate',
        drawData: drawInstructions
    }));
    drawInstructions = [];//reset the array for next use
    console.log("Sent Batch Draw Update");
}
function createAndSaveCanvas(){
    var inMemCanvas = document.createElement('canvas');
    var inMemCtx = inMemCanvas.getContext('2d');
    inMemCanvas.width = canvas.width;
    inMemCanvas.height = canvas.height;
    inMemCtx.drawImage(canvas, 0, 0);
    canvasStack.push(inMemCanvas);
     if(canvasStack.length > 5)
        canvasStack.shift();
    undoHasBeenDone = false;
}

// Send canvas updates, triggered by click end
function sendUpdate() {
    createAndSaveCanvas();
    console.log("Sending canvas")
    var imageURL = canvas.toDataURL("image/png", 0.2);
    var message = {
        type: "canvasUpdate",
        pageNumber: pageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message))
}

//Stroke color selection based off HTML button choice
function changeColor(newColor) {
    color = newColor;
  };

function draw(data) {
    ctx.beginPath();
    ctx.moveTo(data.lastPoint.x, data.lastPoint.y);//the x,y corrdinate of the last point
    ctx.lineTo(data.x, data.y);//add a straight line from last point to current point
    ctx.strokeStyle = data.color;//original default stroke color 
    ctx.lineWidth = data.force;//stroke width
    ctx.lineCap = 'round';
    ctx.stroke();//outlines the current or given path with the current stroke style
}

function move(e) {
    e.preventDefault();
    // equation for determinng force, didn't research much, just used feel. Could use improvements.
    force = Math.log10(Math.pow(e.pressure * (Math.abs(e.tiltX || 90) / 90), 1.5)) + 1.2 || 1;
    force = Math.pow(force || 1, 4) * markerWidth;
    if (e.buttons || isPointerDown) {
        if (typeof lastPoint == 'undefined') {
            lastPoint = { x: e.offsetX, y: e.offsetY };//this is the inital stroke, we are storing it's x,y coordinate
            return;
        }

        draw({
            lastPoint,//the x,y coordinate of the last stroke
            x: e.offsetX,//x-coordinate of the mouse pointer relative to the document
            y: e.offsetY,//y-coordinate of the mouse pointer relative to the document
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

        drawInstructions.push(drawData);//store drawData in drawInstructions
        if(drawInstructions.length >= 100){//when drawInstruction has 100 entries, send the array
            sendDrawUpdate();
        } else {
            sentImage = false;
        }

        lastPoint = { x: e.offsetX, y: e.offsetY };//update lastPoint to be the stroke we just processed 
    } else {
        lastPoint = undefined;//mouse button has been released, this will trigger sendStroke so reset lastpoint
    }
}

// Initialize connection to host
function initializeHost() {
    const event = { type: "initializeHost" };
    websocket.send(JSON.stringify(event))
}


//implement previous and next page requests 
var image = new Image();
nextPageElement=document.getElementById('nextPage');
previousPageElement= document.getElementById('previousPage');

nextPageElement.addEventListener('click', function (){
    nextOrPrevious(viewingPageNumber+1)});
previousPageElement.addEventListener('click', function (){
    nextOrPrevious(viewingPageNumber-1)});

function nextOrPrevious(pageWanted){
    if(pageWanted>=0 && pageWanted<=pageNumber){
        console.log("1) The page wanted is "+ pageWanted+ " current page is "+ viewingPageNumber+" page number is "+pageNumber);
        //clear the current page
        width = window.innerWidth;
        height = window.innerHeight;  
        ctx.clearRect(0, 0, width, height);
        
        if(pageWanted<viewingPageNumber ){//requested previous page
            image.src=localImages[pageWanted]
            image.onload = function() {//wait for image to load before trying to draw to canvas
                ctx.drawImage(image, 0, 0);
            }
            viewingPageNumber-=1
            currentPageNumberElement.textContent="Current page is "+viewingPageNumber;
        }
        if(pageWanted>viewingPageNumber){//requested next page
            image.src=localImages[pageWanted]
            image.onload = function() {//wait for image to load before trying to draw to canvas
                ctx.drawImage(image, 0, 0);
            }
            viewingPageNumber+=1
            currentPageNumberElement.textContent="Current page is "+viewingPageNumber;
        }
        console.log("2) The page wanted is "+ pageWanted+ " current page is "+ viewingPageNumber+" page number is "+pageNumber);
    }

    else{
        currentPageNumberElement.textContent="The page requested "+pageWanted+" does not exist "
        console.log("the page requested ("+pageWanted+") is out of bound")
    }
        
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

            link = "student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;
            break;
    }
}