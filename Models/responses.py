import json

class response: 
    def toJson(self):
        return json.dumps(self.__dict__)

class initializeHostSuccess(response):
    def __init__(self):   
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized host"
        self.hostKey = None
        self.studentKey = None

class initializeStudentSuccess(response):
    def __init__(self):   
        self.__type__ = self.__class__.__name__
        self.message = "Successfully initialized student"
        self.studentKey = None

class canvasUpdateSuccess(response):
    def __init__(self):   
        self.__type__ = self.__class__.__name__
        self.message = "Successfully processed canvas update"

class canvasBroadcast(response):
    def __init__(self):
        self.__type__ = self.__class__.__name__
        self.imageURL = None
        self.page = None

class error(response):
    def __init__(self):
        self.__type__ = self.__class__.__name__
        self.message = "Unknown Error"
