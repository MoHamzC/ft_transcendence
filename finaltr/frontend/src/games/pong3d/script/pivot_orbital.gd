extends Node3D

@export var orbit_speed = 0.5  # vitesse de rotation en radians/seconde

func _process(delta):
	rotate_y(orbit_speed * delta)
