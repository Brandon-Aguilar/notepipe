FROM python:3.10.7
COPY /html /
COPY /scripts /scripts
EXPOSE 7000
CMD python -m http.server 7000