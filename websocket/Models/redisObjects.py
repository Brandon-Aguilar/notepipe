import json
import logging

log = logging.getLogger(__name__)

class redisObject:
    def toJson(self):
        return json.dumps(self.__dict__)


class hostPages(redisObject):
    """
    List of all pages for a host to store in redis. 
    (param) pages should be an array of imageURLs
    """
    def __init__(self, pages=list[str], studentKey=None) -> None:
        super().__init__()
        self.pages = pages
        self.studentKey = studentKey

    def updatePage(self, imageURL: str, pageNumber: int) -> None:  
        if pageNumber < 0:
            raise "Invalid Page Number"

        if pageNumber >= len(self.pages): 
            log.info("Added a new page")
            self.pages.append (imageURL)
        else:
            log.info("Updating page")
            self.pages[pageNumber] = imageURL

    def getLatestPage(self):
        return self.pages[len(self.pages) - 1]


def loadHostPagesFromJSON(data) -> hostPages:
    return json.loads(data, object_hook=lambda d: hostPages(**d))
