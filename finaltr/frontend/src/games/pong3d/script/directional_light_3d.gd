extends DirectionalLight3D

@export var rotation_speed_y = 0
@export var rotation_speed_x = 0.04
@export var rotation_speed_z = 0

func _process(delta):
	rotate_y(rotation_speed_y * delta)
	rotate_x(rotation_speed_x * delta)
	rotate_y(rotation_speed_z * delta)
