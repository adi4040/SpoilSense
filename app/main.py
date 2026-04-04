import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.serial_reader import get_stop_event, start_serial_listener
from app.routes import prediction, reset, status

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):
    stop_event = get_stop_event()
    stop_event.clear()

    thread = threading.Thread(
        target=start_serial_listener,
        daemon=True,
        name="serial-reader",
    )
    thread.start()
    logger.info("Serial reader thread started (id=%d)", thread.ident)

    yield

    logger.info("Signalling serial reader thread to stop...")
    stop_event.set()
    thread.join(timeout=5)
    logger.info("Serial reader thread stopped")


app = FastAPI(
    title="SpoilSense API",
    description="IoT banana spoilage detection",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(status.router,     prefix="/status",  tags=["Status"])
app.include_router(prediction.router, prefix="/predict", tags=["Prediction"])
app.include_router(reset.router,      prefix="/reset",   tags=["Control"])


@app.get("/healthz", tags=["Health"])
def healthz() -> dict:
    return {"status": "ok"}
