import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn




app = FastAPI()

# → liste des connexions actives
clients: set[WebSocket] = set()
# → mapping id de joueur → { x, y }
positions: dict[str, dict] = {}

# Sert tout ce qui est dans ./static sous /static
app.mount("/client", StaticFiles(directory="./client"), name="client")

@app.get("/")
async def get_index():
    return FileResponse("client/index.html")

# Tâche périodique qui envoie toutes les positions à chaque client
async def broadcast_positions():
    while True:
        if positions:
            payload = {"type": "positions", "positions": positions}
            for ws in list(clients):
                try:
                    await ws.send_json(payload)
                except:
                    pass
        await asyncio.sleep(0.01)  # toutes les 50 ms

# Démarre la boucle de diffusion dès que l'app est prête
@app.on_event("startup")
async def startup():
    asyncio.create_task(broadcast_positions())

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        while True:
            msg = await ws.receive_json()
            # on ne gère que les messages de position
            if msg.get("type") == "position":
                positions[msg["id"]] = {"x": msg["x"], "y": msg["y"]}
    except:
        pass
    finally:
        clients.remove(ws)
        # nettoie la position du joueur déconnecté
        positions.pop(msg.get("id"), None)

if __name__ == "__main__":
    uvicorn.run("py1:app", host="0.0.0.0", port=8000, reload=True)
