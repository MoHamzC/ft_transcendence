extends Node3D

func on_goal_scored():
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		await get_tree().create_timer(7.5).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")
		if Global.score_left > Global.score_right:
			send_match_result("PlayerLeft", Global.score_left, Global.score_right)
		else:
			send_match_result("PlayerRight", Global.score_left, Global.score_right)

#envoyer le score au back

#reference au noeud http request
@onready var http_request: HTTPRequest = $HTTPRequest

func send_match_result(winner: String, score_p1: int, score_p2: int) -> void:
	var url = "http://localhost:5001/api/match"  # ton endpoint backend

	var data := {
		"winner": winner,
		"player_left": score_p1,
		"player_right": score_p2
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
