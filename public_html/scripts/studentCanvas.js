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
var imageToText = document.getElementById("TTS");
const download = document.getElementById('download');

// Event listeners to trigger functions
//window.addEventListener('resize', resize);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeStudent)
download.addEventListener('click', downloadbutton);
imageToText.addEventListener('click', showTextEditor);

function showTextEditor(){
    imageToText.disabled = true;
    var html = [
        "<button type='button' id='closeBtn' class='btn'>X</button>",
        "<div style='background-color: #ffffff;'>" ,
            "<div id='toolbar'></div>" ,
            "<div id='editor'></div>" ,
        "</div>" ,
        "<button type='button' id='saveAs' class='btn'>save as</button>" ,
        "<button type='button' id='speechify' class='btn'>convert to speech</button>"
    ].join("");

    var editorWindow = document.createElement('div');
    editorWindow.setAttribute('id', 'textEditor');
    editorWindow.setAttribute('class', 'box');
    editorWindow.innerHTML = html;
    document.body.appendChild(editorWindow);

    // insert image to text output into div(id=editor)

    var toolbarOptions = [
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

    var quill = new Quill('#editor', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow'
    });

    const closeEditorBtn = document.getElementById('closeBtn');
    closeEditorBtn.addEventListener('click', closeEditor);
}

function closeEditor(){
    document.getElementById('textEditor').remove();
    imageToText.disabled = false;
}

image.onload = function() {
    ctx.drawImage(image, 0, 0);
}

//pages saved locally
const localImages=[];
pageNumber = 0;
viewingPageNumber=0;

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
    //update the current image (for page navigation)
    imageURL = canvas.toDataURL("image/png", 0.2);//updating canvas image
    localImages[pageNumber]=imageURL;
}



//request text to speech
function textToSpeech(){
    const request = { type: "textToSpeech",  studentKey: studentKey};
    websocket.send(JSON.stringify(request))
}

//implement previous and next page requests 
var image = new Image();
nextPageElement=document.getElementById('nextPage');
previousPageElement= document.getElementById('previousPage');
currentPageNumberElement = document.getElementById('currentPageNumber');

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

//Download the current page
function downloadbutton(e) {
    console.log(canvas.toDataURL());
    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = canvas.toDataURL();
    link.click();
    link.delete;
};

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
// Handle valid messages sent to client
function processMessage({ data }) {
    const event = JSON.parse(data);
    console.log(event)
    switch(event.__type__){
        case "initializeStudentSuccess":
            console.log("Successfully initialized Student");
            image.src = event.imageURL;
            image.onload = function() {//wait for image to load before trying to draw to canvas
                ctx.drawImage(image, 0, 0);
            }
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
            currentDrawInstructions = [];
            currentInstructionIndex = 0;
            //clear page fixed
            width = window.innerWidth
            height = window.innerHeight
            ctx.clearRect(0, 0, width, height)
            break;
        case "studentStorepageRequest":
            pageNumber=event.pageNumber;
            localImages[pageNumber]=event.imageURL;
            viewingPageNumber=pageNumber;
            currentPageNumberElement.textContent="Current page is "+pageNumber;
            break;
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
    currentFrames = [];
}


