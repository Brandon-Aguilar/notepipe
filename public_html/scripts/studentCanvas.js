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
var ocr = document.getElementById("editNote");
const download = document.getElementById('download');
const updateName = document.getElementById('updateName');


// Event listeners to trigger functions
//window.addEventListener('resize', resize);
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeStudent)
download.addEventListener('click', downloadbutton);
ocr.addEventListener('click', showTextEditor);
updateName.addEventListener('click', editName);

//listen for input for edit name using input box in student.html
window.addEventListener('input', (e) =>{
    //console.log('new name: ', e.target.value);
    newName = e.target.value;
}) 

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
const localImages=[];
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

// Initialize connection
function initializeStudent() {
    const event = { type: "initializeStudent",  studentKey: studentKey, image: image};
    websocket.send(JSON.stringify(event))
}

//same as teacher draw function
function draw(data) {
    ctx.globalCompositeOperation = data.eraserState ? "destination-out" : "source-over"
    ctx.strokeStyle = data.color;//original default stroke color 
    ctx.lineWidth = data.force;//stroke width
    ctx.lineCap = 'round';
    if (data.highlightDraw) {ctx.globalCompositeOperation = "overlay"; ctx.strokeStyle = "#FF0"; ctx.globalAlpha = 0.8; ctx.lineWidth = 40;}

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
    for(let i = 0; i <= pageNumber; i++){
        if(localImages[i]==undefined || pageNumber){
            console.log("Image not stored locally, fetch from redis", i)
            const request = { type: "fetchImage", pageNumber:i, studentKey: studentKey};
            websocket.send(JSON.stringify(request))
        }
       else{
            arrayBuffr();
       }
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


function createStudentName(){
    let name =  Math.random().toString(16).slice(2); 
    console.log('default name is:', name)
    const newStudentName = {type: "updateName", newName: name}
    websocket.send(JSON.stringify(newStudentName))
}

showUserListElement = document.getElementById("showUserList");

var timer
showUserListElement.addEventListener('change', () => {
    if(showUserListElement.checked){
        console.log("user list has been requested ")
        getUserlist()
        timer= setInterval(getUserlist, 4000);
    }
    else{
        clearInterval(timer)
        clearUserList()
    }
});

previousId= "Users"

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
            createStudentName();
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
                        draw(element);//just output the stroke 
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
            width = window.innerWidth
            height = window.innerHeight
            
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
            width = window.innerWidth;
            height = window.innerHeight;  
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
            if(localImages.length-1 == event.pageNumber){
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
            var userListHtmlId = "Users";
            var newUserListDiv = document.createElement("div");
            var tmpContent = "";
            var currentUserListDiv = document.getElementById(userListHtmlId);
            for (const [key, value] of Object.entries(newObj)) {
                //the key here is UUID and value is [object, object]
                // console.log("key is: "+ key+" and value is : " + value.name+ "and prev id is: "+previousId);
                tmpContent+= "<h4 id='"+value.id+"'> "+value.name+"</h4>"
                //document.getElementById(previousId).insertAdjacentHTML("afterend",full);
                //previousId= value.id
                //THIS IS FOR DEBUGGING
                // for(const [key1, value1] of Object.entries(value)){
                //     //keys are id, name, canBroadcast, isTeacher
                //     console.log("key1 is: "+key1+" and value1 is: "+value1);
                // }    
            }
            newUserListDiv.setHTML(tmpContent);
            currentUserListDiv.replaceWith(newUserListDiv);
            newUserListDiv.id = userListHtmlId;
            break
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
    previousId="Users"
}

//implement previous and next page requests 
var image = new Image();
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
        
        localImages[viewingPageNumber]= canvas.toDataURL("image/png", 0.2);
        //check if page wanted has been stord locally (in case where student joins late it might not be)
        if(localImages[pageWanted]!=undefined){
            //clear the current page
            width = window.innerWidth;
            height = window.innerHeight;  
            ctx.clearRect(0, 0, width, height);
            
            //load requested page
            image.src=localImages[pageWanted]
            image.onload = function() {//wait for image to load before trying to draw to canvas
                ctx.drawImage(image, 0, 0);

                if (drawInstructions[pageWanted].length != 0) {
                    console.log("draw instructions need to execute");
                    drawInstructions[pageWanted].forEach((currInstructions) => {
                        currInstructions.forEach((stroke) => {
                            draw(stroke);
                        });
                    });

                    drawInstructions[pageWanted] = [];
                }
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