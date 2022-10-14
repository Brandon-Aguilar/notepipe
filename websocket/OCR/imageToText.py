import os, io
from google.cloud import vision_v1
from binascii import a2b_base64

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"./ServiceAccountToken.json"

# Instantiate the OCR client
client = vision_v1.ImageAnnotatorClient()

def readImage(uri):
    """ Triggers an api call through the OCR client
    Args:
        uri (file): The image to be scanned (base64 encoded)
    Returns:
        text_list (list); a list of words/characters recognized & metadata
    """
    text_list = []
    
    # separate encoded data of the uri from header info
    header, encoded = uri.split(",", 1)
    content = a2b_base64(encoded)

    # make the api call and recieve response
    image = vision_v1.Image(content=content)
    response = client.text_detection(image=image)

    # scan response & pair each text with it's location info
    for text in response.text_annotations[1:]:
        startX = text.bounding_poly.vertices[0].x
        startY = text.bounding_poly.vertices[0].y

        start_vertex = (startX, startY) # left-bottom vertex of text boundary
        text_list.append([text.description, start_vertex])

    formatted_text = formatText(text_list)
    print(outputText(formatted_text))


def formatText(unformatted_text):
    """ Format the raw OCR output
    Args:
        unformatted_text (list): a jumbled list of texts recognized by the OCR
    Returns:
        hori_sorted (list); an ordered list of lines of texts
    """
    # sort list based on vertical location of each text
    vert_sorted = sorted(unformatted_text, key = lambda x:x[1][1])
    lines_grouped = groupLines(vert_sorted) # group texts on the same line
    hori_sorted = []

    # sort each line based on horizontal location of each text
    for line in lines_grouped:
        hori_sorted.append(sorted(line, key = lambda x:x[1][0]))

    return hori_sorted


def groupLines(unwrapped_text):
    """ Wrap long string of text
    Args:
        unwrapped_text (list): unwrapped string of list of text
    Returns:
        wrapped_text (list); wrapped block of list of text
    """
    LINE_TOLERANCE = 15
    wrapped_text = [[unwrapped_text[0]]]
    prev_text_pos_y = unwrapped_text[0][1][1]
    curr_line = 0

    for text in unwrapped_text[1:]:
        # measure the diff in pos of current & previous text
        if text[1][1]-prev_text_pos_y <= LINE_TOLERANCE:
            # if diff is below tolerance level, add 'text' to curr_line
            wrapped_text[curr_line].append(text)
        else: 
            curr_line += 1
            wrapped_text.append([]) # create a new line
            wrapped_text[curr_line].append(text) # add 'text' to new line
        prev_text_pos_y = text[1][1]

    return wrapped_text

def isPunctuation(string):
    """ Checks if string is a punctuation
    Returns:
        (boolean); True if string is a punctuation; else False 
    """
    lst = [',','!','.','(',')','?','"','\'',':',';','-','[',']']
    return True if string in lst else False

def outputText(formatted_text):
    """ Returns final formatted text
    Returns:
        final_text (string); a formatted string of text 
    """
    final_text = "\n"
    for line in formatted_text:
        for text in line:
            # avoid spacing before a punctuation
            if not isPunctuation(text[0]): 
                final_text += " "
            final_text += text[0]
        final_text += "\n"
    return final_text

readImage(img)