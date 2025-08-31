extends Node3D

func on_goal_scored():
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		await get_tree().create_timer(6.1).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")
		if Global.score_left > Global.score_right:
			send_match_result("PlayerLeft", "PlayerRight", Global.score_left, Global.score_right)
		else:
			send_match_result("PlayerRight", "PlayerLeft", Global.score_right, Global.score_left)

#envoyer le score au back

#reference au noeud http request
@onready var http_request: HTTPRequest = $HTTPRequest

func send_match_result(winner: String, looser: String, score_winner: int, score_looser: int) -> void:
	var url = "http://localhost:5001/api/match"  # ton endpoint backend

	var data := {
		"playerWinner": winner, #(le pseudo du perdant) 
		"playerLooser": looser, #(le pseudo du looser)
		"playerWinnerScore": score_winner,
		"playerLooserScore": score_looser
	}

	#convertion en string json
	var json_data := JSON.stringify(data)

	#header il est important pour indiquer que cest en json
	var headers := ["Content-Type: application/json"]
	
	#envoi du post
	var err = http_request.request(url, headers, HTTPClient.METHOD_POST, json_data)
	if err != OK:
		print("erreur d'envoie :", err)

# callback quand le backend répond
func _on_HTTPRequest_request_completed(result, response_code, headers, body):
	print("reponse du backend :", response_code, body.get_string_from_utf8())
