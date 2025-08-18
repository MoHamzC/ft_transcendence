extends Node3D

func on_goal_scored():
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		await get_tree().create_timer(7.5).timeout
		get_tree().change_scene_to_file("res://scene/victory_scene.tscn")
