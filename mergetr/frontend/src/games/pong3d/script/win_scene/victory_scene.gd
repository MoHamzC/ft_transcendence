extends Node3D

func _ready():
	if Global.tournament_id != "false":
		await get_tree().create_timer(4.0).timeout
		_on_timeout()


func _on_timeout():
	get_tree().quit()

	#get_tree().change_scene_to_file("res://scenes/Menu.tscn")
