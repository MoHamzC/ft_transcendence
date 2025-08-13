extends MeshInstance3D

func _process(delta):
	if Input.is_action_pressed("right"):
		rotation.y += 1.0 * delta
	if Input.is_action_pressed("left"):
		rotation.y -= 1.0 * delta
	if Input.is_action_pressed("up"):
		rotation.y += 1.0 * delta
	if Input.is_action_pressed("down"):
		rotation.y -= 1.0 * delta
