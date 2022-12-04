// Fetch url params, interested in key
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const studentKey = urlParams.get("key");
// add error handling for params

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



// connect to web socket
// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json");
console.log("Connected to Websocket");

//for name change
var newName = '' // what client chooses new username to be

// Copied canvas code
// create canvas element and append it to document body
var canvas = document.getElementById('viewingCanvas')
var studentCanvas = document.getElementById('studentCanvas');
var highlightCanvas = document.getElementById('highlightCanvas');

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = 'absolute';

var ctx = canvas.getContext('2d');
var image = new Image();

var studentCtx = studentCanvas.getContext('2d');
var highlightCtx = highlightCanvas.getContext('2d');

var minCanvasHeight = 1080;
var minCanvasWidth = 2160;

studentCtx.canvas.width = Math.max(window.innerWidth, minCanvasWidth);
studentCtx.canvas.height = Math.max(window.innerHeight, minCanvasHeight);
highlightCtx.canvas.width = Math.max(window.innerWidth, minCanvasWidth);
highlightCtx.canvas.height = Math.max(window.innerHeight, minCanvasHeight);

resize();

highlightCanvas.addEventListener('pointermove', move, { capture: true, });

var sentImage = false;
var allowDraw = true;

// Release mouse capture when not touching screen
highlightCanvas.addEventListener('pointerup', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if (sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, { capture: true, });
highlightCanvas.addEventListener('pointercancel', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if (sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, { capture: true, });
highlightCanvas.addEventListener('pointerenter', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if (sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, { capture: true, });
// Disable panning, touch doesn't work if it is on
highlightCanvas.style.touchAction = 'none';
highlightCanvas.style.opacity = 0.5;

//Fetch HTML elements that need event listners
var ocr = document.getElementById("editNote");
const download = document.getElementById('download');
const updateName = document.getElementById('updateName');


// Event listeners to trigger functions
window.addEventListener('resize', resize);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', createStudentName)
download.addEventListener('click', downloadbutton);
ocr.addEventListener('click', showTextEditor);
updateName.addEventListener('click', editName);

//listen for input for edit name using input box in student.html
window.addEventListener('input', (e) =>{
    //console.log('new name: ', e.target.value);
    newName = e.target.value;
}) 

function sendStroke(e) {
    // Need to check if they have broadcast privilege before we allow them to send strokes
    sendStudentDrawUpdate();//will send strokes to clients
}

function sendStudentDrawUpdate() {
    //save updated canvas locally 
    if (pageNumber == viewingPageNumber) {//saving the most recent page
        var imageURL = canvas.toDataURL("image/png", 0.2);
        localImages[pageNumber] = imageURL
    }
    else {//editing a previously stored page
        var imageURL = canvas.toDataURL("image/png", 0.2);
        localImages[viewingPageNumber] = imageURL
    }

    websocket.send(JSON.stringify({//send array containing x,y corrdinate of strokes
        type: 'canvasStudentDrawUpdate',
        drawData: studentSendDrawInstructions,
        page: viewingPageNumber,
        requestER: eraserState
    }));
    studentSendDrawInstructions = [];//reset the array for next use
    console.log("Sent Batch Draw Update");
}

//default settings for marker
var lastPoint = undefined;
var force = 1;//marker thickness
var color = "red";//marker color
var studentSendDrawInstructions = [];
var markerWidth = 5;

var isPointerDown = false;
var eraserState = false;
var highlightDraw = false;

// Change width of the marker based on input from a HTML slider
function changeWidth(newWidth) {
    enableTouch();
    markerWidth = newWidth;
    //eraserState= false;
    ctx.globalCompositeOperation = 'source-over';
};

// shows the HTML slider located in slider-div
function showSlider() {
    var x = document.getElementById("slider-div");
    if (x.style.display === "block") {
        x.style.display = "none";
    } else {
        x.style.display = "block";
    }
};

//Stroke color selection based off HTML button choice
function changeColor(newColor) {
    enableTouch();
    highlightDraw = false;
    color = newColor;
    eraserState = false;
    ctx.globalCompositeOperation = 'source-over';
};

function startHighlight() {
    enableTouch();
    highlightDraw = true;
    eraserState = false;
}

// Eraser
function eraser() {
    enableTouch();
    eraserState = true;
    highlightDraw = false;
    // Erasing by using destination image to be on top of the drawn image in source image
    // ctx.globalCompositeOperation = "destination-out";
    console.log("Image erased: ", pageNumber)
};

function move(e) {
    e.preventDefault();
    // equation for determinng force, didn't research much, just used feel. Could use improvements.
    if (e.pointerType === "pen") {
        force = Math.log10(Math.pow(e.pressure * (Math.abs(e.tiltX || 90) / 90) * 0.2 + 0.15, 1.5)) + 1.2 || 1;
        force = Math.min(15 * Math.pow(force || 1, 4) * (markerWidth + 2), markerWidth);
    } else {
        force = markerWidth;
    }

    if ((e.buttons || isPointerDown) && allowDraw) {
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
            eraserState,
            highlightDraw
        }, studentCtx);


        

        drawData = JSON.stringify({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            color: color || 'green',
            force: force,
            eraserState,
            highlightDraw
        });

        studentSendDrawInstructions.push(drawData);//store drawData in drawInstructions
        if (studentSendDrawInstructions.length >= 100) {//when drawInstruction has 100 entries, send the array
            sendStudentDrawUpdate();
        } else {
            sentImage = false;
        }

        lastPoint = { x: e.offsetX, y: e.offsetY };//update lastPoint to be the stroke we just processed 
    } else {
        if (highlightDraw) {
            layerHighlightCanvas(studentCtx);
        }
        
        lastPoint = undefined;//mouse button has been released, this will trigger sendStroke so reset lastpoint
    }
}

function layerHighlightCanvas(ctx){
    ctx.globalAlpha = 0.5;
    //ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(highlightCanvas, 0, 0);
    ctx.globalAlpha = 1;
    //ctx.globalCompositeOperation = "source-over";
    highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
}


function showTextEditor(){
    ocr.disabled = true;

    // Create editor container
    var html = [
        "<button type='button' id='closeBtn' class='btn'>x</button>",
        "<div style='background-color: #ffffff;'>" ,
            "<div id='editor'></div>" ,
        "</div>" ,
        "<button type='button' id='saveAsPDF' class='btn'>download</button>" ,
        "<button type='button' id='speechify' class='btn'>play</button>" ,
        "<audio id='speech' controlsList='nodownload noplaybackrate'></audio>",
        "<button type='button' id='minimize' style='display: none;'>",
            "<span class='material-icons-outlined'>arrow_back_ios</span>",
        "</button>"
    ].join("");

    // Wrap and insert editor container to document 
    var editorWindow = document.createElement('div');
    editorWindow.setAttribute('id', 'textEditor');
    editorWindow.setAttribute('class', 'box');
    editorWindow.innerHTML = html;
    document.body.appendChild(editorWindow);

    // Set editor toolbar options
    toolbarOptions = [
        [{'header': [1, 2, 3, 4, 5, 6, false]}],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'formula'],
        [{ 'color': [] }, {'background': [] }],
        [{ 'align': [] }]
        ];

    // Instantiate editor
    quill = new Quill('#editor', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow'
    });

    // Invoke websocket request for OCR service
    imageToText();

    var downloadBtn = document.getElementById('saveAsPDF');
    var xBtn = document.getElementById('closeBtn');
    playBtn = document.getElementById('speechify');
    minimizeBtn = document.getElementById('minimize');

    // Event listener for 'X' button
    xBtn.addEventListener('click', function(){
        document.getElementById('textEditor').remove();
        ocr.disabled = false;
    });

    // Event listener for 'Download' button
    downloadBtn.addEventListener('click', function(){ 
        var contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = quill.root.innerHTML;
        $(contentWrapper).printThis();
    });

    // Event listener for 'Play' button
    playBtn.addEventListener('click', function(){
        textToSpeech(quill.getText()); // Invoke websocket request for TTS service
    });

    // Event listener for '<' button
    minimizeBtn.addEventListener('click', function(){
        if(!audio.paused && !audio.ended) { audio.pause(); }
        minimizeBtn.style.display="none";
        playBtn.style.display="";
        audio.controls = false;
    })
}

image.onload = function() {
    ctx.drawImage(image, 0, 0);
}

//pages saved locally
var localImages=[];
var studentLocalImages=[];
pageNumber = 0;
viewingPageNumber=0;

// Fetch HTML elements to be updated
var updateMessageElement = document.getElementById("updateStatus");
var studentLinkElement = document.getElementById("studentLink");
var studentLinkAnchorElement = document.getElementById("studentLinkAnchor");
var drawAnimationsCheckboxElement = document.getElementById("drawAnimationsCheckbox");
var currentPageNumberElement = document.getElementById('currentPageNumber');

var drawAnimations = drawAnimationsCheckboxElement.checked;
drawAnimationsCheckboxElement.addEventListener("change", () => {
    drawAnimations = drawAnimationsCheckboxElement.checked;
    console.log(drawAnimations);
});

// resize canvas
function resize() {
  var inMemCanvas = document.createElement('canvas');
  var inMemCtx = inMemCanvas.getContext("2d"); 
  // creates another canvas to store values to
  inMemCanvas.width = canvas.width;
  inMemCanvas.height = canvas.height;
  // set the new canvas equal to the prevoius 
  inMemCtx.drawImage(canvas, 0, 0);
  // if the page got smaller then we keep the orignal size and if the page got bigger with increase the canvas size
  ctx.canvas.width = Math.max(window.innerWidth, ctx.canvas.width);
  ctx.canvas.height = Math.max(window.innerHeight, ctx.canvas.height);
  // copy the canvas back by redrawing it
  ctx.drawImage(inMemCanvas, 0, 0);
}

function createStudentName(){
    let name =  Math.random().toString(16).slice(2); 
    console.log('default name is:', name)
    initializeStudent(name)
}

// Initialize connection
function initializeStudent(name) {
    const event = { type: "initializeStudent",  studentKey: studentKey, image: image, name: name};
    websocket.send(JSON.stringify(event))
}

//same as teacher draw function
function draw(data, ctx) {
    if(data.highlightDraw){
        ctx = highlightCtx;
    }
    ctx.globalCompositeOperation = data.eraserState ? "destination-out" : "source-over"
    ctx.strokeStyle = data.color;//original default stroke color 
    ctx.lineWidth = data.force;//stroke width
    ctx.lineCap = 'round';
    if(data.highlightDraw){
        ctx.globalCompositeOperation = "multiply"; ctx.strokeStyle = "#FF0"; ctx.globalAlpha = 1; ctx.lineWidth = 40;
    }

    ctx.beginPath();
    ctx.moveTo(data.lastPoint.x, data.lastPoint.y);//the x,y corrdinate of the last point
    ctx.lineTo(data.x, data.y);//add a straight line from last point to current point

    ctx.stroke();//outlines the current or given path with the current stroke style
    ctx.globalCompositeOperation = "source-over";
}

// request OCR service
function imageToText(){
    const request = { type: "imageToText",  studentKey: studentKey, pageNumber: viewingPageNumber};
    websocket.send(JSON.stringify(request))
}

// request TTS service
function textToSpeech(targetText){
    const request = { type: "textToSpeech",  studentKey: studentKey, inputText: targetText};
    websocket.send(JSON.stringify(request))
}

//Download the current page
async function downloadbutton(e) {
    console.log(canvas.toDataURL());
    //merge two canvas contentes to one
   // ctx.drawImage(document.getElementById('studentCanvas'),0,0);
   zipImages[viewingPageNumber] = await mergeImages([localImages[viewingPageNumber], studentLocalImages[viewingPageNumber]]);
    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = zipImages[viewingPageNumber];
    link.click();
    link.delete;
};

const zipfolder = document.getElementById('zipFolder');
zipfolder.addEventListener('click', zipFolderbutton);

var zipImages = [];

async function mergeStudentAndLocal(i) {
    zipImages[i] = await mergeImages([localImages[i], studentLocalImages[i]]);
}

//Download a zip folder
async function zipFolderbutton(e) {  
    for(let i = 0; i <= pageNumber; i++){
        
       // studentLocalImages[i] = studentCanvas.toDataURL("image/png");
        console.log("Image not stored locally, fetch from redis", i)
        const request = { type: "fetchImage", pageNumber:i, studentKey: studentKey};
        websocket.send(JSON.stringify(request))
    }

}
    
function arrayBuffr(){ 
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
        if (index <= pageNumber) {
            Buffer(zipImages[index++], function(buffer, url) {
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

showUserListElement = document.getElementById("showUserList");

var showUserListBool=false;
showUserListElement.addEventListener('change', () => {
    if(showUserListElement.checked){

        getUserlist()
        showUserListBool=true
    }
    else{

        clearUserList()
        showUserListBool=false
    }
});

var localUserListID=[]
var localUserListName=[]
var processHighlight = false;
var absoluteJoinLink = "";

// Handle valid messages sent to client
function processMessage({ data }) {
    const event = JSON.parse(data); 
    console.log(event)
    switch(event.__type__){
        case "initializeStudentSuccess":
            console.log("Successfully initialized Student");
            image.src = event.imageURL;
            image.onload = function() {//wait for image to load before trying to draw to canvas
                canvas.height = Math.max(window.innerWidth, image.width);
                canvas.width = Math.max(window.innerHeight, image.height);       
                studentCtx.canvas.width = Math.max(window.innerWidth, image.width);
                studentCtx.canvas.height = Math.max(window.innerHeight, image.height);
                highlightCtx.canvas.width = Math.max(window.innerWidth, image.width);
                highlightCtx.canvas.height = Math.max(window.innerHeight, image.height);
                ctx.drawImage(image, 0, 0);
                localImages[event.pageNumber] = event.imageURL;
                viewingPageNumber=event.pageNumber;
                setCurrentPageText();
                console.log("initialized on page "+viewingPageNumber);
            }
            link = "student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;
            pageNumber = event.pageNumber;
            
            // initialize page drawInstructions
            drawInstructions = Array.from({length: pageNumber+1}, () => new Array());
            studentLocalImages = Array.from({ length: pageNumber + 1 }, () => "");
            createStudentName();

            absoluteJoinLink = "https://" + window.location.host + "/canvas/" + link;
            break;
        case "canvasDrawUpdateBroadcast"://event.__type__= "canvasDrawUpdateBroadcast"
            console.log("Updating Draw Instructions");
            if(event.page == viewingPageNumber){
                if(drawAnimations){
                    currentDrawInstructions = currentDrawInstructions.concat(event.drawData);
                    currentFrames.push(window.requestAnimationFrame(animateDraw));
                } else {
                    event.drawData.forEach((element) => {//loop through each value
                        element = JSON.parse(element);
                        draw(element, ctx);//just output the stroke 
                    });
                }
            } else {
                parsedInstructions = []
                event.drawData.forEach((element) => {//loop through each value
                    element = JSON.parse(element);
                    parsedInstructions.push(element);
                });
                
                drawInstructions[event.page].push(parsedInstructions);
            }        
            break;
        case "clearpage":
            // cancel all the current animations and draw them instantly
            finishAnimations();

            //clear page fixed
            width = canvas.width;
            height = canvas.height;
            ctx.clearRect(0, 0, width, height)
            break;
        case "newPageCreated":
            // When we add page following, this should be an if
            // if following...viewingPageNumber = event.pageNumber
            //var imageURL = canvas.toDataURL("image/png", 0.2);
            //localImages[event.pageNumber]= imageURL;
        
            pageNumber += 1;
            drawInstructions.push([]);
            setCurrentPageText();
            break;

        case "NewpagesInserted":    
            pageNumber += 1;  
            width = canvas.width;
            height = canvas.height;
            
            if(event.insertIndex <= viewingPageNumber){
                localImages[viewingPageNumber] = canvas.toDataURL("image/png", 0.2);
                ctx.clearRect(0, 0, width, height);

                drawInstructions.splice(event.insertIndex, 0, []);
                localImages.splice(event.insertIndex, 0, "");
                // When we add follow teacher, then don't navigate if following
                navigateToPage(viewingPageNumber + 1);
            } else {
                drawInstructions.splice(event.insertIndex, 0, []);
                localImages.splice(event.insertIndex, 0, "");
            }
            setCurrentPageText();
            break;
        case "pageFetched":
            //clear the current page
            width = canvas.width;
            height = canvas.height;  
            ctx.clearRect(0, 0, width, height);

            //load requested page
            image.src=event.imageURL
            image.onload = function() {//wait for image to load before trying to draw to canvas
                ctx.drawImage(image, 0, 0);
            }

            //update the page number currently being viewed 
            viewingPageNumber=event.pageNumber;
            setCurrentPageText();
            break;
        case "imageFetched":
            localImages[event.pageNumber] = event.imageURL
            if(studentLocalImages[event.pageNumber] == ""){
                zipImages[event.pageNumber] = localImages[event.pageNumber];
            } else { 
                mergeStudentAndLocal(event.pageNumber); 
            }
            if(pageNumber == event.pageNumber){
                arrayBuffr();
            }
            break;
        case "imageToTextRequest":
            quill.setText(event.convertedText);
            break;
        case "textToSpeechRequest":
            console.log("audio file recieved")
            audio = document.getElementById('speech');
            audio.src = "data:audio/mpeg;base64," + event.convertedAudio;
            audio.load();
            playBtn.style.display="none";
            minimizeBtn.style.display="";
            audio.controls = true;
            audio.play();
            break;
       case "fullUserList":
            newObj = JSON.parse(event.names);
            var tmpContent = "";
            for (const [key, value] of Object.entries(newObj)) {
                tmpContent= "<h4 id='"+value.id+"'> "+value.name+"</h4>"  
                // if(value.canBroadcast)
                //     tmpContent += " <button id='"+value.id+"' class='activeButton'> Broadcasting</button>"
                if(localUserListID.length == 0)
                    document.getElementById("Users").insertAdjacentHTML("afterend", tmpContent);
                else{
                    document.getElementById(localUserListID[localUserListID.length-1]).insertAdjacentHTML("afterend", tmpContent);
                }
                //store into local arrays
                localUserListID.push(value.id)
                localUserListName.push(value.name)
            }
            break
            case "removeUserFromList":
                if(showUserListBool){
                    document.getElementById(event.id).remove()
                    document.getElementById(event.id).remove()//delete the button

                    //update local arrays
                    found = localUserListID.findIndex(element => element == event.id);
                    localUserListID.splice(found,1)
                    localUserListName.splice(found, 1)
                }
                break
            case "updateUserName":
                if(showUserListBool){
                    //delete current user name from user list html
                    document.getElementById(event.id).remove()//delete the button
    
                    //delete from user name from local arrays
                    found = localUserListID.findIndex(element => element == event.id);
                    localUserListID.splice(found,1)
                    localUserListName.splice(found, 1)
    
                    //add updated name to local arrays 
                    localUserListName.push(event.name)//add name to list
                    localUserListName.sort()//sort the list
                    found = localUserListName.findIndex(element => element == event.name);//find index of new name
                    localUserListID.splice(found, 0, event.id)//insert user id in proper index
    
                    //check if user had broadcasting privilage 
                    tmpContent= "<h4 id='"+event.id+"'> "+event.name+"</h4>" 
    
                    //insert alphabetical location
                    if(found == 0){//insert at the beginning of the list
                        document.getElementById("Users").insertAdjacentHTML("afterend",tmpContent);
                    }
                    else{//insert anywhere else 
                        document.getElementById(localUserListID[found-1]).insertAdjacentHTML("afterend",tmpContent);
                    }
                }
                break;
            case "newUserJoined":
                if(showUserListBool){
                    localUserListName.push(event.name)//add name to list
                    localUserListName.sort()//sort the list
                    found = localUserListName.findIndex(element => element == event.name);//find index of new user
                    localUserListID.splice(found, 0, event.id)//insert user id in proper index
    
                    //create the name and button that needs to be added
                    tmpContent= "<h4 id='"+event.id+"'> "+event.name+"</h4>" 
    
                    if(found == 0){//insert at the beginning of the list
                        document.getElementById("Users").insertAdjacentHTML("afterend",tmpContent);
                    }
                    else{//insert anywhere else 
                        document.getElementById(localUserListID[found-1]).insertAdjacentHTML("afterend",tmpContent);
                    }
                }
                break
            case "endHighlightStroke":
                processHighlight = true;
                break;
            // case "updateUserPermissions":
            //     if(!event.canBroadcast){
            //         document.getElementById(event.id).getElementsByClassName("activeButton").getremove()//delete the button
            //     }
            //     else{
            //         tmpContent = " <button id='"+event.id+"' class='activeButton'> Broadcasting</button>"  
            //         document.getElementById(event.id).insertAdjacentHTML("afterend", tmpContent);
            //     }
            //     break;
            }   
}

function getUserlist(){
    clearUserList()
    const event = { type: "retrieveUserList"};
    websocket.send(JSON.stringify(event))
}

function clearUserList(){
    const container = document.getElementById("userList");
    container.innerHTML="";
    var full= '<div id="Users"></div>'
    container.insertAdjacentHTML("beforeend", full)
    localUserListID=[]
    localUserListName=[]
}

//implement previous and next page requests 
var image = new Image();
var studentImage = new Image();
nextPageElement=document.getElementById('nextPage');
previousPageElement= document.getElementById('previousPage');

nextPageElement.addEventListener('click', function (){
    navigateToPage(viewingPageNumber+1)});
previousPageElement.addEventListener('click', function (){
    navigateToPage(viewingPageNumber-1)});


var drawInstructions=[[]]

// This was nextOrPrevious, changing name to navigateToPage since we need this for future direct page navs and it more clearly represents what it is doing
function navigateToPage(pageWanted){
    //acceptable range for pages to load
    if(pageWanted>=0 && pageWanted<=pageNumber){
        //before loading previous/next page, store the current page in local array
        finishAnimations();
        studentLocalImages[viewingPageNumber] = studentCanvas.toDataURL("image/png");
        localImages[viewingPageNumber]= canvas.toDataURL("image/png", 0.2);
        //check if page wanted has been stord locally (in case where student joins late it might not be)
        if(localImages[pageWanted]!=undefined){
            //clear the current page
            width = canvas.width;
            height = canvas.height;  
            ctx.clearRect(0, 0, width, height);
            studentCtx.clearRect(0, 0, width, height);
            
            //load requested page
            image.src=localImages[pageWanted]
            image.onload = function() {//wait for image to load before trying to draw to canvas
                ctx.drawImage(image, 0, 0);

                if (drawInstructions[pageWanted].length != 0) {
                    console.log("draw instructions need to execute");
                    drawInstructions[pageWanted].forEach((currInstructions) => {
                        currInstructions.forEach((stroke) => {
                            draw(stroke, ctx);
                        });
                    });

                    drawInstructions[pageWanted] = [];
                }
            }

            studentImage.src = studentLocalImages[pageWanted];
            studentImage.onload = () => {
                studentCtx.drawImage(studentImage, 0, 0);
            }

            //update the page number currently being viewed 
            viewingPageNumber=pageWanted;
            setCurrentPageText();
        }
        //page is not stored locally so retrieve from redis 
        else {
            console.log("Page not stored locally, fetch from redis")
            const request = { type: "fetchPage", pageNumber:pageWanted, studentKey: studentKey};
            websocket.send(JSON.stringify(request))
        }
        console.log("1) The page wanted is "+ pageWanted+ " current page is "+ viewingPageNumber+" page number is "+localImages.length);
    } else {
        //currentPageNumberElement.textContent="The page requested "+pageWanted+" does not exist "
        // Probably dont need to show this in prod
        console.log("the page requested ("+pageWanted+") is out of bound")
    }
   
}

var currentDrawInstructions = [];
var currentInstructionIndex = 0;
var currentFrames = [];

function animateDraw() {
    if(currentDrawInstructions.length == 0){
        if(processHighlight){
            layerHighlightCanvas(ctx);
            processHighlight = false;
        }
        return;
    }
    if(currentInstructionIndex >= currentDrawInstructions.length){
        currentInstructionIndex = 0;
        currentDrawInstructions = [];
    } else {
        var element = JSON.parse(currentDrawInstructions[currentInstructionIndex]);
        draw(element, ctx);
        currentInstructionIndex += 1;
    }
    currentFrames.push(window.requestAnimationFrame(animateDraw));
}

function cancelAllAnimationFrames() {
    currentFrames.forEach((frameID) => {
        window.cancelAnimationFrame(frameID);
    });
    currentFrames = [];
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

// QR Code generation
function generateQRCode(codeContent) {
    const qrcode = new QRCode(document.getElementById('qrcode'), {
        text: codeContent,
        width: 350,
        height: 350,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
    });
}

// QR Overlay
function openQR(){
    document.getElementById("qr-code-overlay").style.display = "flex";
}
function closeQR(){
    document.getElementById("qr-code-overlay").style.display = "none";
}

// Join Key
function copyJoinKey() {
    // TO DO get join key text
    navigator.clipboard.writeText(absoluteJoinLink);

    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copied";
}

function finishAnimations() {
    cancelAllAnimationFrames();
    currentDrawInstructions.splice(0, currentInstructionIndex);
    currentDrawInstructions.forEach((element) => {//loop through each value
        element = JSON.parse(element);
        draw(element, ctx);//just output the stroke 
    });
    currentDrawInstructions = [];
    currentInstructionIndex = 0;
}

function disableTouch() {
    if(highlightCanvas.style.touchAction == "none"){
        highlightCanvas.style.touchAction = "manipulation";
        allowDraw = false;
    } else{
        highlightCanvas.style.touchAction = "none";
        allowDraw = true;
    }
}

function enableTouch() {
    highlightCanvas.style.touchAction = "none";
    allowDraw = true;
}