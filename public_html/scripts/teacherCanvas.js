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

//for name change
var newName = '' // what client chooses new username to be
const updateName = document.getElementById('updateName');
updateName.addEventListener('click', editName);
//listen for input for edit name using input box in teacher.html

window.addEventListener('input', (e) =>{
    console.log('new name: ', e.target.value);
    newName = e.target.value;
}) 


// get html elements
updateMessageElement = document.getElementById("updateStatus");
studentLinkElement = document.getElementById("studentLink");
studentLinkAnchorElement = document.getElementById("studentLinkAnchor");
currentPageNumberElement = document.getElementById('currentPageNumber');

//instructor image saved locally
const localImages=[];

//save button
var updateSaveoption=document.getElementById('newpage')
updateSaveoption.addEventListener('click', newpage)

function newpage(){
    //for now teacher cannot go to previous page and use save function
    if(pageNumber==viewingPageNumber){
        pageNumber++;
        viewingPageNumber++;
        console.log("Adding new page number: ",pageNumber)
        var imageURL = canvas.toDataURL("image/png", 0.2);
        
        var message = {
            type: "Addnewpage",
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
        setCurrentPageText();
    }
    else{
        currentPageNumberElement.textContent="please be on page"+pageNumber+" to add a new page";
        console.log("please be on last page to add a new page")
    }

}

// resize canvas
function resize() {
    var copyCanvas = document.createElement('canvas');
    var copyCanvasCtx = copyCanvas.getContext("2d"); 
    // creates another canvas to store values to
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    // set the new canvas equal to the prevoius 
    copyCanvasCtx.drawImage(canvas, 0, 0);
    // if the page got smaller then we keep the orignal size and if the page got bigger with increase the canvas size
    ctx.canvas.width = Math.max(window.innerWidth, ctx.canvas.width);
    ctx.canvas.height = Math.max(window.innerHeight, ctx.canvas.height);
    // copy the canvas back by redrawing it
    ctx.drawImage(copyCanvas, 0, 0);
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
        var copyCanvas = document.createElement('canvas');
        var copyCanvasCtx = copyCanvas.getContext('2d');
        copyCanvas.width = canvas.width;
        copyCanvas.height = canvas.height;
        copyCanvasCtx.drawImage(canvas, 0, 0);
        canvasStack.push(copyCanvas);    
    }
}

var updatereset=document.getElementById('reset')
updatereset.addEventListener('click', reset)

function reset(){
    console.log("reset page : ",pageNumber)
    var imageURL = canvas.toDataURL("image/png", 0.2);
    
    var message = {
        type: "resetcanvas",
        pageNumber: pageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message));
    //clear the current page
    width = window.innerWidth;
    height = window.innerHeight;  
    ctx.clearRect(0, 0, width, height);
    imageURL = canvas.toDataURL("image/png", 0.2);//updating canvas image  

    sendUpdate();
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
var eraserState = false;

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
        drawData: drawInstructions,
        page: viewingPageNumber,
        requestER: eraserState
    }));
    drawInstructions = [];//reset the array for next use
    console.log("Sent Batch Draw Update");
}

function createAndSaveCanvas(){
    var copyCanvas = document.createElement('canvas');
    var copyCanvasCtx = copyCanvas.getContext('2d');
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    copyCanvasCtx.drawImage(canvas, 0, 0);
    canvasStack.push(copyCanvas);
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
        pageNumber: viewingPageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message))
}

//Stroke color selection based off HTML button choice
function changeColor(newColor) {
    color = newColor;
    eraserState= false;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Eraser
function eraser(){
    eraserState = true;
    // Erasing by using destination image to be on top of the drawn image in source image
    ctx.globalCompositeOperation = "destination-out";
    console.log("Image erased: ", pageNumber)
};

function draw(data) {
    ctx.globalCompositeOperation = data.eraserState ? "destination-out" : "source-over"
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
    if(e.pointerType === "pen"){
        force = Math.log10(Math.pow(e.pressure * (Math.abs(e.tiltX || 90) / 90) * 0.2 + 0.15, 1.5)) + 1.2 || 1;
        force = Math.min(15 * Math.pow(force || 1, 4) * (markerWidth + 2), markerWidth);
    } else {
        force = markerWidth;
    }
    
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
            color: color || 'green',
            eraserState
        });

        drawData = JSON.stringify({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            color: color || 'green',
            force: force,
            eraserState
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

const zipfolder = document.getElementById('zipFolder');
zipfolder.addEventListener('click', zipFolderbutton);

//Download a zip folder
function zipFolderbutton(e) {
    var zip = new JSZip();
    index = 0;   
    function Buffer(url, callback) {
        var ctx = new XMLHttpRequest();
        ctx.open("GET", url);
        ctx.responseType = "arraybuffer";
        ctx.onload = function() {
            if (ctx.status == 200) {
                callback(ctx.response, url)
            }

        };
        ctx.send();
    }

    (function load() {
        if (index < localImages.length) {
            Buffer(localImages[index++], function(buffer, url) {
                zip.file(index+"page.png", buffer); 
                load(); 
            })
        }
        else {                         
            zip.generateAsync({type:"blob"}).then(function(content) {
                saveAs(content, "LectureNote.zip");// save as LectureNote
            });  
        }
    })();
}   

const download = document.getElementById('download');
download.addEventListener('click', downloadbutton);


function downloadbutton(e) {
    console.log(canvas.toDataURL());
    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = canvas.toDataURL();
    link.click();
    link.delete;
};     

//implement previous and next page requests 
var image = new Image();
nextPageElement=document.getElementById('nextPage');
previousPageElement= document.getElementById('previousPage');

nextPageElement.addEventListener('click', function (){
    navigateToPage(viewingPageNumber+1)});
previousPageElement.addEventListener('click', function (){
    navigateToPage(viewingPageNumber-1)});

function navigateToPage(pageWanted){
    if(pageWanted>=0 && pageWanted<=pageNumber){
        console.log("1) The page wanted is "+ pageWanted+ " current page is "+ viewingPageNumber+" page number is "+pageNumber);
        //clear the current page
        width = window.innerWidth;
        height = window.innerHeight;  
        ctx.clearRect(0, 0, width, height);


        image.src=localImages[pageWanted]
        image.onload = function() {//wait for image to load before trying to draw to canvas
            ctx.drawImage(image, 0, 0);
        }
        viewingPageNumber = pageWanted;
        setCurrentPageText();

        console.log("2) The page wanted is "+ pageWanted+ " current page is "+ viewingPageNumber+" page number is "+pageNumber);
    }
        
}

var absoluteJoinLink = "";
localUserList={}
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

            absoluteJoinLink = window.location.host + "/canvas/" + link;
            generateQRCode(absoluteJoinLink);
            break;
            case "updateUserList":
                //empty list
                if(Object.keys(localUserList).length===0){
                    addName("Users", event.id, event.name)
                    lastId=event.id
                }
                //check we are updating student name
                else if(event.id in localUserList){
                    changeName(event.id, event.name)
                }
                //must be a new student 
                else{
                    addName(lastId, event.id, event.name)
                    lastId=event.id
                }
                localUserList[event.id]=event.name
                break;
            case "removeUserFromList":
                console.log("student left: "+localUserList[event.id])
                //if lastId is removed and a new student joins, their name won't populate
                delete localUserList[event.id];
                if(lastId==event.id){
                    var total= Object.keys(localUserList).length;
                    lastId= Object.keys(localUserList)[total-1]
                }
                removeName(event.id) 
                break;
    }
}
function addName(previousId, id, name) {
    var full= "<h4 id='"+id+"'> "+name
    document.getElementById(previousId).insertAdjacentHTML("afterend",full);
}
function changeName(id, name){
    const full= document.getElementById(id)
    full.innerHTML = name;
}
function removeName(name){
    const element = document.getElementById(name);
    element.remove()
}

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        markerWidth += 1;
    }
    else if (e.keyCode == '40') {
        // down arrow
        markerWidth -= 1;
    }

}

function generateQRCode(codeContent) {
    const qrcode = new QRCode(document.getElementById('qrcode'), {
        text: codeContent,
        width: 128,
        height: 128,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
    });
}

function copyJoinKey() {
    // TO DO get join key text
    navigator.clipboard.writeText(absoluteJoinLink);

    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copied";
}

function copyKeyOutFunc() {
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copy key to clipboard";
}

function setCurrentPageText() {
    currentPageNumberElement.textContent = (viewingPageNumber + 1).toString() + "/" + (pageNumber + 1).toString();
}
//edit name
function editName(){
    console.log('editName button was clicked and function called');
    const request = {type: "updateName", newName: newName}; 
    websocket.send(JSON.stringify(request))
 } 

 //show/hide textbox to input name
 function showEditName(){
    document.getElementById('nameTextBox').className="show";
    document.getElementById('updateName').className="show";
 }
function hideEditName(){
    document.getElementById('nameTextBox').className="hide";
    document.getElementById('updateName').className="hide";
}

/*
uploadFile TODO:
    - Add support for ppt/pptx, probably jpg/jpeg and pdf too
        - Currently only works for png files
    - Make the button look better maybe (in public_html/canvas/teacher.html)
        - It's a default html `Choose File` button right now
    - Maybe mess with formatting
        - Currently draws the image on the top left corner
*/
function uploadFile() {
    var file = document.getElementById("upload").files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
           ctx.drawImage(img, 10, 10);
        };
     }
} 