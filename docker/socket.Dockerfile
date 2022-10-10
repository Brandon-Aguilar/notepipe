
FROM python:3.10.7
COPY /websocket /
COPY requirements.txt /
RUN pip install --upgrade pip && \
    pip install -r requirements.txt
EXPOSE 8001
ENV PYTHONUNBUFFERED definitely
ENV REDIS_URL redis-container
ENV HOST http://localhost:8080
CMD python3 WebSocketServer.py