import json

# Templates for sending information to clients

class response: 
    def toJson(self):
        return json.dumps(self.__dict__)

class initializeHostSuccess(response):
    def __init__(self, hostKey=None, studentKey=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized host"
        self.hostKey = hostKey
        self.studentKey = studentKey

class initializeStudentSuccess(response):
    def __init__(self, studentKey=None) -> None:
        super().__init__()   
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized student"
        self.studentKey = studentKey

class canvasUpdateSuccess(response):
    def __init__(self) -> None:
        super().__init__()   
        self.__type__ = self.__class__.__name__
        self.message = "Successfully processed canvas update"

class canvasBroadcast(response):
    def __init__(self, imageURL=None, page=None) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.imageURL = imageURL
        self.page = page

class error(response):
    def __init__(self) -> None:
        super().__init__()
        self.__type__ = self.__class__.__name__
        self.message = "Unknown Error"
