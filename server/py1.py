import asyncio, json, uuid                            # 🔆
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI()

clients: set[WebSocket]          = set()
positions: dict[str, dict]       = {}
player_ids: dict[WebSocket, str] = {}
player_names: dict[str, str]     = {}
doors: dict[str, bool]           = {}
hiding_spots: dict[str, bool] = {}
# --- NEW: état des lampes ---------------------------------------------- 🔆
lights: dict[str, bool]          = {}   # id → True (allumée) / False (éteinte)
# ------------------------------------------------------------------------

app.mount("/client", StaticFiles(directory="./client"), name="client")

@app.get("/")
async def get_index():
    return FileResponse("client/index.html")

async def broadcast_state():
    while True:
        if clients:
            payload = {
                "type":      "state",
                "positions": positions,
                "doors":     doors,
                "lights":    lights,          # 🔆
                "hiding_spots": hiding_spots
            }
            for ws in list(clients):
                try:
                    await ws.send_json(payload)
                except:
                    pass
        await asyncio.sleep(0.01)

async def broadcast_player_list():
    if clients:
        payload = { "type": "player_list", "players": player_names }
        for ws in list(clients):
            try: await ws.send_json(payload)
            except: pass

@app.on_event("startup")
async def startup():
    asyncio.create_task(broadcast_state())

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    player_id = None
    try:
        while True:
            msg = await ws.receive_json()

            # --------------------- login ---------------------------------
            if msg.get("type") == "login":
                username = msg.get("username")
                if username:
                    player_id = str(uuid.uuid4())
                    player_ids[ws] = player_id
                    player_names[player_id] = username
                    positions[player_id] = {"x": 100, "y": 100}
                    lights[player_id] = True                  # 🔆 lampe allumée par défaut
                    await ws.send_json({
                        "type": "login_response",
                        "success": True,
                        "player_id": player_id,
                        "username": username
                    })
                    print(f"{username} connecté (ID {player_id})")
                    await broadcast_player_list()
                else:
                    await ws.send_json({"type": "login_response","success": False,"message": "Nom d'utilisateur requis"})

            # ------------------ reconnexion ------------------------------
            elif msg.get("type") == "reconnect":
                requested_id = msg.get("player_id")
                username     = msg.get("username")
                # (même logique qu’avant, on ajoute juste lights)
                already_active = any(active_id == requested_id and active_ws!=ws
                                     for active_ws,active_id in player_ids.items())
                if already_active:
                    await ws.send_json({"type":"reconnect_response","success":False,"message":"Session déjà active"})
                else:
                    player_id = requested_id
                    player_ids[ws] = player_id
                    player_names.setdefault(player_id, username)
                    positions.setdefault(player_id, {"x":100,"y":100})
                    lights.setdefault(player_id, True)        # 🔆
                    await ws.send_json({"type":"reconnect_response","success":True,
                                        "player_id":player_id,"username":username})
                    print(f"{username} reconnecté (ID {player_id})")
                    await broadcast_player_list()

            # ------------------ déconnexion volontaire -------------------
            elif msg.get("type") == "logout" and ws in player_ids:
                logout_id = player_ids.pop(ws)
                player_names.pop(logout_id, None)
                positions.pop(logout_id,  None)
                lights.pop(logout_id,     None)              # 🔆
                print(f"{logout_id} déconnecté (logout)")
                await broadcast_player_list()

            # ------------------ mouvement --------------------------------
            elif msg.get("type") == "position" and ws in player_ids:
                pid = player_ids[ws]
                positions[pid] = {"x":msg["x"],"y":msg["y"]}

            # ------------------ portes -----------------------------------
            elif msg.get("type") == "toggleDoor" and ws in player_ids:
                key = f'{msg["x"]},{msg["y"]}'
                doors[key] = not doors.get(key, False)
                print(f"Porte {key} -> {doors[key]}")
            # Pour hide
            elif msg.get("type") == "toggleHidingSpot" and ws in player_ids:
                hide_key = f"{msg['x']},{msg['y']}"
                hiding_spots[hide_key] = not hiding_spots.get(hide_key, False)
                print(f"Cachette {hide_key} est maintenant {'occupée' if hiding_spots[hide_key] else 'libre'}")

            # ------------------ NOUVEAU : lampe -------------------------- 🔆
            elif msg.get("type") == "toggleLight" and ws in player_ids:
                pid = player_ids[ws]
                lights[pid] = not lights.get(pid, True)
                print(f"Lampe joueur {pid} -> {lights[pid]}")
    except Exception as e:
        print("WS error:", e)
    finally:
        clients.discard(ws)
        if ws in player_ids:
            pid = player_ids.pop(ws)
            player_names.pop(pid, None)
            positions.pop(pid,  None)
            lights.pop(pid,     None)        # 🔆
            await broadcast_player_list()

if __name__ == "__main__":
    uvicorn.run("py1:app", host="0.0.0.0", port=8000, reload=True)
