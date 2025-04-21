import asyncio
import json
import uuid  # Pour générer des IDs uniques
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI()

# Liste des connexions actives
clients: set[WebSocket] = set()
# Mapping id de joueur → { x, y }
positions: dict[str, dict] = {}
# Mapping WebSocket → id de joueur
player_ids = {}
# Mapping id de joueur → nom d'utilisateur
player_names = {}

app.mount("/client", StaticFiles(directory="./client"), name="client")

@app.get("/")
async def get_index():
    return FileResponse("client/index.html")

# Fonction pour diffuser la liste des joueurs à tous les clients
async def broadcast_player_list():
    if clients:
        payload = {
            "type": "player_list",
            "players": player_names
        }
        for ws in list(clients):
            try:
                await ws.send_json(payload)
            except:
                pass

async def broadcast_positions():
    while True:
        if positions:
            payload = {"type": "positions", "positions": positions}
            for ws in list(clients):
                try:
                    await ws.send_json(payload)
                except:
                    pass
        await asyncio.sleep(0.01)  # toutes les 10 ms

@app.on_event("startup")
async def startup():
    asyncio.create_task(broadcast_positions())

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    player_id = None
    
    try:
        while True:
            msg = await ws.receive_json()
            
            # Traiter la demande de connexion
            if msg.get("type") == "login":
                username = msg.get("username")
                if username:
                    # Générer un ID unique pour ce joueur
                    player_id = str(uuid.uuid4())
                    player_ids[ws] = player_id
                    player_names[player_id] = username
                    
                    # Envoyer confirmation avec l'ID généré
                    await ws.send_json({
                        "type": "login_response",
                        "success": True,
                        "player_id": player_id,
                        "username": username
                    })
                    
                    print(f"Joueur connecté: {username} (ID: {player_id})")
                    
                    # Diffuser la liste mise à jour des joueurs
                    await broadcast_player_list()
                else:
                    await ws.send_json({
                        "type": "login_response",
                        "success": False,
                        "message": "Nom d'utilisateur requis"
                    })
            
            # Traiter la demande de reconnexion
            elif msg.get("type") == "reconnect":
                requested_id = msg.get("player_id")
                username = msg.get("username")
                
                # Vérifier si l'ID existe déjà dans la liste des joueurs
                if requested_id in player_names:
                    # Cas où le joueur est déjà connecté (session doublon)
                    await ws.send_json({
                        "type": "reconnect_response",
                        "success": False,
                        "message": "Vous êtes déjà connecté dans une autre fenêtre"
                    })
                else:
                    # Enregistrer la reconnexion
                    player_id = requested_id
                    player_ids[ws] = player_id
                    player_names[player_id] = username
                    
                    # Envoyer confirmation
                    await ws.send_json({
                        "type": "reconnect_response",
                        "success": True,
                        "player_id": player_id,
                        "username": username
                    })
                    
                    print(f"Joueur reconnecté: {username} (ID: {player_id})")
                    
                    # Diffuser la liste mise à jour des joueurs
                    await broadcast_player_list()
            
            # Traiter la demande de déconnexion
            elif msg.get("type") == "logout":
                requested_id = msg.get("player_id")
                
                # Vérifier si l'ID correspond à celui associé à cette connexion
                if ws in player_ids and player_ids[ws] == requested_id:
                    logout_player_id = player_ids[ws]
                    player_username = player_names.get(logout_player_id, "Unknown")
                    
                    # Nettoyer les données du joueur
                    player_ids.pop(ws, None)
                    player_names.pop(logout_player_id, None)
                    positions.pop(logout_player_id, None)
                    
                    print(f"Joueur déconnecté volontairement: {player_username} (ID: {logout_player_id})")
                    
                    # Diffuser la liste mise à jour des joueurs
                    await broadcast_player_list()
            
            # Traiter les messages de position (seulement si identifié)
            elif msg.get("type") == "position" and ws in player_ids:
                player_id = player_ids[ws]
                positions[player_id] = {"x": msg["x"], "y": msg["y"]}
                
    except Exception as e:
        print(f"Erreur: {e}")
    finally:
        clients.remove(ws)
        if ws in player_ids:
            player_id = player_ids[ws]
            player_ids.pop(ws, None)
            
            # Supprimer le joueur de la liste des noms
            if player_id in player_names:
                player_names.pop(player_id, None)
                
            positions.pop(player_id, None)
            print(f"Joueur déconnecté (connexion fermée): (ID: {player_id})")
            
            # Diffuser la liste mise à jour des joueurs
            await broadcast_player_list()

if __name__ == "__main__":
    uvicorn.run("py1:app", host="0.0.0.0", port=8000, reload=True)