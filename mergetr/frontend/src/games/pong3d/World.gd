extends Node3D

# Référence au noeud http request
@onready var http_request: HTTPRequest = $HTTPRequest

func _ready():
	# Connecter le signal pour recevoir la réponse
	if http_request:
		http_request.request_completed.connect(_on_http_request_completed)

func on_goal_scored():
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		# Envoyer le résultat AVANT de changer de scène
		var winner_name = ""
		var winner_id = ""

		if Global.score_left > Global.score_right:
			winner_name = "PlayerLeft"
			winner_id = "player_left_id"  # Vous devrez stocker les vrais IDs
		else:
			winner_name = "PlayerRight"
			winner_id = "player_right_id"  # Vous devrez stocker les vrais IDs

		send_match_result(winner_name, winner_id, Global.score_left, Global.score_right)

		# Attendre un peu puis changer de scène
		await get_tree().create_timer(6.1).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")

func send_match_result(winner_name: String, winner_id: String, score_p1: int, score_p2: int) -> void:
	# Utiliser le bon endpoint
	var url = "http://localhost:5001/api/match"

	# Format des données correspondant au backend
	var data := {
		"player1_id": "15e2236e-2536-4a52-84af-8691a66304a5",  # Remplacer par les vrais IDs
		"player2_id": "b096b086-1472-43d3-abba-a1c7e2b8466c", # Remplacer par les vrais IDs
		"winner_id": "15e2236e-2536-4a52-84af-8691a66304a5",
		"player1_score": 5,
		"player2_score": 3
	}

	print("Envoi des données au backend: ", data)

	# Conversion en string JSON
	var json_data := JSON.stringify(data)

	# Headers importants pour indiquer que c'est du JSON
	var headers := ["Content-Type: application/json"]

	# Envoi du POST
	var err = http_request.request(url, headers, HTTPClient.METHOD_POST, json_data)
	if err != OK:
		print("Erreur d'envoi: ", err)
	else:
		print("Requête envoyée avec succès")

# Callback quand le backend répond (nom de fonction corrigé)
func _on_http_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	print("Réponse du backend - Code: ", response_code)
	print("Corps de la réponse: ", body.get_string_from_utf8())

	if response_code == 200 or response_code == 201:
		print("Match result envoyé avec succès!")
	else:
		print("Erreur lors de l'envoi du résultat: ", response_code)
