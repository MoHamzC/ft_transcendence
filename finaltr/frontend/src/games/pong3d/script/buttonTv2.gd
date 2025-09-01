extends MeshInstance3D

func _process(delta):
	if Input.is_action_pressed("d"):
		rotation.y += 1.0 * delta
	if Input.is_action_pressed("a"):
		rotation.y -= 1.0 * delta
	if Input.is_action_pressed("w"):
		rotation.y += 1.0 * delta
	if Input.is_action_pressed("s"):
		rotation.y -= 1.0 * delta
