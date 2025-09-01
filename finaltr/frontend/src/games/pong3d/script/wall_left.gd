extends Area3D

@export var mur_type: String = "left"

func _on_body_entered(body):
	if body.name != "ball":
		return

	var score_node = get_tree().get_root().get_node("World/Score3D")

	if mur_type == "left":
		Global.score_right += 1
		to_reset()
		if score_node != null:
			score_node.update_scores()
		print("Collision balle → mur gauche")
	elif mur_type == "right":
		Global.score_left += 1
		to_reset()
		if score_node != null:
			score_node.update_scores()
		print("Collision balle → mur droit")

func to_reset():
	var ball = get_tree().get_root().get_node("World/ball")
	if ball:
		ball.reset_ball()
