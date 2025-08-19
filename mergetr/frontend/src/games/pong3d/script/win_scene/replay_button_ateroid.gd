extends Area3D

func _input_event(_camera, event, click_position, click_normal, shape_idx):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		Global.score_left = 0
		Global.score_right = 0
		Global.max_score = 1
		Global.game_start = false
		get_tree().change_scene_to_file("res://scene/world.tscn")
