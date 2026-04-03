from fastapi import FastAPI
import threading

from app.routes import status, prediction
from app.core.serial_reader import start_serial_listener

app = FastAPI()

app.include_router(status.router, prefix="/status")
app.include_router(prediction.router, prefix="/predict")


@app.on_event("startup")
def startup():
    thread = threading.Thread(target=start_serial_listener, daemon=True)
    thread.start()
