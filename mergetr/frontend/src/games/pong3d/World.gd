extends Node3D

# Sons
@onready var explosion_song = $ExplosionSong
# HTTP
@onready var http_request: HTTPRequest = $HTTPRequest

func _ready():
	if http_request:
		http_request.request_completed.connect(Callable(self, "_on_http_request_completed"))

func on_goal_scored():
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		# Déterminer le gagnant et le perdant
		var winner_name = ""
		var winner_id = ""
		var looser_name = ""
		var looser_id = ""
		var score_winner = 0
		var score_looser = 0

		if Global.score_left > Global.score_right:
			winner_name = "PlayerLeft"
			winner_id = "player_left_id"  # à remplacer par le vrai ID
			looser_name = "PlayerRight"
			looser_id = "player_right_id"  # à remplacer par le vrai ID
			score_winner = Global.score_left
			score_looser = Global.score_right
		else:
			winner_name = "PlayerRight"
			winner_id = "player_right_id"  # à remplacer par le vrai ID
			looser_name = "PlayerLeft"
			looser_id = "player_left_id"  # à remplacer par le vrai ID
			score_winner = Global.score_right
			score_looser = Global.score_left

		# Envoyer le résultat au backend
		send_match_result(winner_name, winner_id, looser_name, looser_id, score_winner, score_looser)

		# Jouer le son et changer de scène
		await get_tree().create_timer(5.8).timeout
		explosion_song.play()
		await get_tree().create_timer(0.3).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")

func send_match_result(winner_name: String, winner_id: String, looser_name: String, looser_id: String, score_winner: int, score_looser: int) -> void:
	var url = "http://localhost:5001/api/match"
	var data := {
		"playerWinner": winner_name,
		"playerLooser": looser_name,
		"playerWinnerScore": score_winner,
		"playerLooserScore": score_looser,
		"winner_id": winner_id,
		"looser_id": looser_id
	}
	var json_data := JSON.stringify(data)
	print("JSON envoyé :", json_data)

	var headers := ["Content-Type: application/json"]
	var err = http_request.request(url, headers, HTTPClient.METHOD_POST, json_data)
	if err != OK:
		push_error("Erreur d'envoi HTTP : %s" % err)
	else:
		print("Requête HTTP envoyée !")

func _on_http_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	print("Réponse du backend - Code: ", response_code)
	print("Corps de la réponse: ", body.get_string_from_utf8())
	if response_code == 200 or response_code == 201:
		print("Match result envoyé avec succès!")
	else:
		print("Erreur lors de l'envoi du résultat: ", response_code)
