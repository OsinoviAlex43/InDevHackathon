from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import lightOn
DEVICE_NAME = "ROOM_35"
TOKEN = "0jX7BvZ5450VqxVn"
app = FastAPI(title="Door and Light Control API")

class ControlParams(BaseModel):
    device_name: str | None = None
    token: str | None = None

@app.post("/open_door", summary="Открыть дверь")
def open_door_endpoint():
    try:
        device_name = DEVICE_NAME
        token = TOKEN
        result = lightOn.open_door(
            device_name or lightOn.DEFAULT_DEVICE_NAME,
            token or lightOn.DEFAULT_TOKEN
        )
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/close_door", summary="Закрыть дверь")
def close_door_endpoint():
    try:
        device_name = DEVICE_NAME
        token = TOKEN
        result = lightOn.close_door(
            device_name or lightOn.DEFAULT_DEVICE_NAME,
            token or lightOn.DEFAULT_TOKEN
        )
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/light_on", summary="Включить свет внутри")
def light_on_endpoint():
    try:
        device_name = DEVICE_NAME
        token = TOKEN
        result = lightOn.light_on(
            device_name or lightOn.DEFAULT_DEVICE_NAME,
            token or lightOn.DEFAULT_TOKEN
        )
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/light_off", summary="Выключить свет внутри")
def light_off_endpoint():
    try:
        device_name = DEVICE_NAME
        token = TOKEN
        result = lightOn.light_off(
            device_name or lightOn.DEFAULT_DEVICE_NAME,
            token or lightOn.DEFAULT_TOKEN
        )
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))