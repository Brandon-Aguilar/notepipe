import json

# Templates for sending information to clients


class response:
    def toJson(self) -> str:
        return json.dumps(self.__dict__)


class initializeHostSuccess(response):
    def __init__(self, hostKey=None, studentKey=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized host"
        self.hostKey = hostKey
        self.studentKey = studentKey


class initializeStudentSuccess(response):
    def __init__(self, studentKey=None,  pageNumber=None, imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized student"
        self.studentKey = studentKey
        self.pageNumber = pageNumber
        self.imageURL= imageURL


class canvasUpdateSuccess(response):
    def __init__(self, pageNumber=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.pageNumber = pageNumber
        self.message = "Successfully processed canvas update"


class canvasBroadcast(response):
    def __init__(self, imageURL=None, pageNumber=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.imageURL = imageURL
        self.pageNumber = pageNumber

class canvasDrawUpdateBroadcast(response):
    def __init__(self, drawData=None, page=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.drawData = drawData
        self.page = page

class clearpage(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "New page started"

class resetbutton(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "clear the  page "
        
class error(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Unknown Error"

class textToSpeechRequest(response):
    def __init__(self, studentKey=None, imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Text to speech function requested"
        self.studentKey = studentKey
        self.imageURL= imageURL

class pageFetched(response):
    def __init__(self, studentKey=None, pageNumber= None, imageURL=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Page has been fetched"
        self.studentKey = studentKey
        self.pageNumber = pageNumber
        self.imageURL= imageURL

class userJoinUpdate(response):
    def __init__(self, userList):
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Userlist change"
        self.userList = userList
