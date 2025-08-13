extends Node3D

var balle_reference : Node3D

func _process(delta):
	if balle_reference:
		global_position = balle_reference.global_position
		# Ne pas copier la rotation pour éviter la rotation des particules
