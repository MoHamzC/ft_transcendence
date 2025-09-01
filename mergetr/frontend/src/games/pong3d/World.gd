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
		var loser_name = ""
		var loser_id = ""
		var score_winner = 0
		var score_loser = 0

		if Global.score_left > Global.score_right:
			winner_name = "PlayerLeft"
			winner_id = Global.skin_PL_id  # à remplacer par le vrai ID
			loser_name = "PlayerRight"
			loser_id = Global.skin_PR_id  # à remplacer par le vrai ID
			score_winner = Global.score_left
			score_loser = Global.score_right
		else:
			winner_name = "PlayerRight"
			winner_id = Global.skin_PR_id # à remplacer par le vrai ID
			loser_name = "PlayerLeft"
			loser_id = Global.skin_PL_id  # à remplacer par le vrai ID
			score_winner = Global.score_right
			score_loser = Global.score_left

		# Envoyer le résultat au backend
		send_match_result(winner_id, loser_id, score_winner, score_loser)

		# Jouer le son et changer de scène
		await get_tree().create_timer(5.8).timeout
		explosion_song.play()
		await get_tree().create_timer(0.3).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")

func send_match_result(winner_id: String, loser_id: String, score_winner: int, score_loser: int) -> void:
	var url = "http://localhost:5001/api/match"
	var data := {
		"playerWinner": winner_id,
		"playerLoser": loser_id,
		"playerWinnerScore": score_winner,
		"playerLoserScore": score_loser,
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
