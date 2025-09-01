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
		send_match_result(winner_name, winner_id, loser_name, loser_id, score_winner, score_loser)

		# Jouer le son et changer de scène
		await get_tree().create_timer(5.8).timeout
		explosion_song.play()
		await get_tree().create_timer(0.3).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")

func send_match_result(winner_name: String, winner_id: String, loser_name: String, loser_id: String, score_winner: int, score_loser: int) -> void:
	# Vérification des IDs
	if winner_id == "" or loser_id == "":
		push_error("IDs de joueurs vides ! Winner: " + winner_id + ", Loser: " + loser_id)
		return

	var is_tournament: bool = Global.tournament_id != "" and Global.match_id != ""
	var url = "https://localhost:8443/api/match"
	var data := {
		"playerWinner": winner_id,
		"playerLoser": loser_id,
		"playerWinnerScore": score_winner,
		"playerLoserScore": score_loser,
	}
	if is_tournament:
		# Utiliser la route unifiée backend /api/match-tournoi
		url = "https://localhost:8443/api/match-tournoi"
		# Pour l'API tournoi il faut les participant IDs (déjà fournis via PL_id / PR_id) + tournament/match ids
		data = {
			"tournamentId": Global.tournament_id,
			"matchId": Global.match_id,
			"playerWinner": winner_id,
			"playerLoser": loser_id,
			"playerWinnerScore": score_winner,
			"playerLoserScore": score_loser,
		}
	var json_data := JSON.stringify(data)
	print("=== MATCH RESULT DEBUG ===")
	print("Is tournament:", is_tournament)
	print("Tournament ID:", Global.tournament_id)
	print("Match ID:", Global.match_id)
	print("Winner ID:", winner_id)
	print("Loser ID:", loser_id)
	print("URL:", url)
	print("JSON envoyé :", json_data)

	var headers := ["Content-Type: application/json"]
	var err = http_request.request(url, headers, HTTPClient.METHOD_POST, json_data)
	if err != OK:
		push_error("Erreur d'envoi HTTP : %s" % err)
	else:
		print("Requête HTTP envoyée avec succès!")

func _on_http_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	print("=== HTTP RESPONSE DEBUG ===")
	print("Result:", result)
	print("Response code:", response_code)
	var body_str = body.get_string_from_utf8()
	print("Response body:", body_str)
	if response_code == 200 or response_code == 201:
		print("Match result envoyé avec succès!")
		# Déclenche une entrée localStorage pour notifier l'onglet tournoi (si bridge présent)
		if Engine.has_singleton("JavaScriptBridge") and Global.tournament_id != "":
			var js = JavaScriptBridge.get_interface("window")
			if js:
				var key = "tournamentUpdate:" + Global.tournament_id
				# Valeur aléatoire pour garantir un event
				js.localStorage.setItem(key, str(Time.get_ticks_msec()))
				print("Storage event triggered for tournament:", Global.tournament_id)
	else:
		print("Erreur lors de l'envoi du résultat: ", response_code)
		if body_str:
			var json = JSON.parse_string(body_str)
			if json and json.has("error"):
				print("Server error:", json.error)
			elif json and json.has("message"):
				print("Server message:", json.message)
