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
# État des portes (clé = "x,y", valeur = True/False pour ouverte/fermée)
doors: dict[str, bool] = {}

# État des cachettes (clé = "x,y", valeur = True/False pour caché/pas caché)
hiding_spots: dict[str, bool] = {}

app.mount("/client", StaticFiles(directory="./client"), name="client")

@app.get("/")
async def get_index():
    return FileResponse("client/index.html")

# Fonction qui diffuse périodiquement l'état du jeu
async def broadcast_state():
    while True:
        if clients:
            payload = {
                "type": "state",
                "positions": positions,
                "doors": doors,
                "hiding_spots": hiding_spots
            }
            for ws in list(clients):
                try:
                    await ws.send_json(payload)
                except:
                    pass
        await asyncio.sleep(0.01)  # 10ms pour une fréquence de 100Hz

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
                    
                    # Initialiser la position
                    positions[player_id] = {"x": 100, "y": 100}
                    
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
                
                # Vérifier si l'ID demandé est valide et n'est pas déjà en cours d'utilisation
                already_active = False
                for active_ws, active_id in player_ids.items():
                    if active_id == requested_id and active_ws != ws:
                        already_active = True
                        break
                
                if already_active:
                    await ws.send_json({
                        "type": "reconnect_response",
                        "success": False,
                        "message": "Session déjà active dans une autre fenêtre"
                    })
                else:
                    # Si l'ID existait déjà mais session expirée
                    if requested_id in player_names:
                        # Réactiver l'utilisateur
                        player_id = requested_id
                        player_ids[ws] = player_id
                        # La position pourrait avoir été nettoyée, réinitialiser si nécessaire
                        if player_id not in positions:
                            positions[player_id] = {"x": 100, "y": 100}
                    else:
                        # Nouveau joueur avec un ID spécifique (cas rare mais possible)
                        player_id = requested_id
                        player_ids[ws] = player_id
                        player_names[player_id] = username
                        positions[player_id] = {"x": 100, "y": 100}
                    
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
            elif msg.get("type") == "logout" and ws in player_ids:
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
            
            # Traiter les messages pour les portes
            elif msg.get("type") == "toggleDoor" and ws in player_ids:
                door_key = f"{msg['x']},{msg['y']}"
                doors[door_key] = not doors.get(door_key, False)
                print(f"Porte {door_key} est maintenant {doors[door_key]}")
            # Pour hide
            elif msg.get("type") == "toggleHidingSpot" and ws in player_ids:
                hide_key = f"{msg['x']},{msg['y']}"
                hiding_spots[hide_key] = not hiding_spots.get(hide_key, False)
                print(f"Cachette {hide_key} est maintenant {'occupée' if hiding_spots[hide_key] else 'libre'}")

    except Exception as e:
        print(f"Erreur: {e}")
    finally:
        clients.remove(ws)
        if ws in player_ids:
            player_id = player_ids[ws]
            player_ids.pop(ws, None)
            
            # Supprimer le joueur de la liste des noms mais garder sa position
            # pendant une courte période pour permettre la reconnexion
            if player_id in player_names:
                player_names.pop(player_id, None)
                # Ici, on pourrait démarrer un timer pour supprimer la position après un délai
                
            print(f"Joueur déconnecté (connexion fermée): (ID: {player_id})")
            
            # Diffuser la liste mise à jour des joueurs
            await broadcast_player_list()

if __name__ == "__main__":
    uvicorn.run("py1:app", host="0.0.0.0", port=8000, reload=True)