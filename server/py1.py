import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI()

clients: set[WebSocket] = set()
positions: dict[str, dict] = {}

# Nouvel état des portes
doors: dict[str, bool] = {}  # clé = "x,y", valeur = True/False (ouverte/fermée)

app.mount("/client", StaticFiles(directory="./client"), name="client")

@app.get("/")
async def get_index():
    return FileResponse("client/index.html")

async def broadcast_state():
    while True:
        payload = {"type": "state", "positions": positions, "doors": doors}
        for ws in list(clients):
            try:
                await ws.send_json(payload)
            except:
                pass
        await asyncio.sleep(0.01)

@app.on_event("startup")
async def startup():
    asyncio.create_task(broadcast_state())

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        while True:
            msg = await ws.receive_json()

            if msg.get("type") == "position":
                positions[msg["id"]] = {"x": msg["x"], "y": msg["y"]}

            elif msg.get("type") == "toggleDoor":
                door_key = f"{msg['x']},{msg['y']}"
                doors[door_key] = not doors.get(door_key, False)

    except:
        pass
    finally:
        clients.remove(ws)
        positions.pop(msg.get("id"), None)

if __name__ == "__main__":
    uvicorn.run("py1:app", host="0.0.0.0", port=8000, reload=True)
