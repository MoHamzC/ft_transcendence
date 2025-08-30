extends Camera3D

@export var move_speed = 50.0
@export var rotate_speed = 60.0
@export var smooth_factor = 5.0
@export var start_target_x: float = 0.997
@export var start_move_speed: float = 2.0  # vitesse du déplacement auto

var target_position: Vector3
var target_rotation: Vector3
var current_velocity: Vector3 = Vector3.ZERO

var moving_to_start: bool = true  # au lancement on fait le move auto

func _ready():
	target_position = global_transform.origin
	target_rotation = rotation

func _physics_process(delta):
	if moving_to_start:
		# On interpole la position actuelle vers x = 0.997
		var new_pos = target_position
		new_pos.x = lerp(new_pos.x, start_target_x, start_move_speed * delta)
		target_position = new_pos
		global_transform.origin = target_position

		# Quand on est assez proche on arrête le mode auto
		if abs(target_position.x - start_target_x) < 0.01:
			target_position.x = start_target_x
			global_transform.origin = target_position
			moving_to_start = false
		return  # on bloque le contrôle tant que le move auto est actif

	global_transform.origin = target_position
