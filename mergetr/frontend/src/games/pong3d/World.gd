extends Node3D

@onready var explosion_song = $ExplosionSong
@onready var http_request: HTTPRequest = $HTTPRequest

func _ready():
	# Option 1 : Callable
	http_request.connect("request_completed", Callable(self, "_on_HTTPRequest_request_completed"))
	
	# Option 2 : raccourci Godot 4
	# http_request.request_completed.connect(self._on_HTTPRequest_request_completed)

func on_goal_scored():
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		await get_tree().create_timer(5.8).timeout
		explosion_song.play()
		await get_tree().create_timer(0.3).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")
		if Global.score_left > Global.score_right:
			send_match_result("PlayerLeft", "PlayerRight", Global.score_left, Global.score_right)
		else:
			send_match_result("PlayerRight", "PlayerLeft", Global.score_right, Global.score_left)

func send_match_result(winner: String, looser: String, score_winner: int, score_looser: int) -> void:
	var url = "http://localhost:5001/api/match"
	var data := {
		"playerWinner": winner,
		"playerLooser": looser,
		"playerWinnerScore": score_winner,
		"playerLooserScore": score_looser
	}
	var json_data = JSON.stringify(data)
	print("JSON envoyé :", json_data)
	var headers = ["Content-Type: application/json"]
	var err = http_request.request(url, headers, HTTPClient.METHOD_POST, json_data)
	if err != OK:
		push_error("Erreur d'envoi HTTP : %s" % err)
	else:
		print("Requête HTTP envoyée !")

func _on_HTTPRequest_request_completed(result, response_code, headers, body):
	print("Result:", result, "Code:", response_code, "Body:", body.get_string_from_utf8())
