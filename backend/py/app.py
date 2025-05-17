from fastapi import FastAPI, HTTPException
import lightOn  # Внутреннее API с функциями управления дверью и светом

app = FastAPI(title="Door and Light Control API")

@app.post("/open_door", summary="Открыть дверь")
def open_door():
    try:
        result = internal_api.open_door()
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/close_door", summary="Закрыть дверь")
def close_door():
    try:
        result = internal_api.close_door()
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/light_on", summary="Включить свет внутри")
def light_on():
    try:
        result = internal_api.light_on()
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/light_off", summary="Выключить свет внутри")
def light_off():
    try:
        result = internal_api.light_off()
        return {"status": "success", "detail": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))