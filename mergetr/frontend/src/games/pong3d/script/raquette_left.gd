extends CharacterBody3D

@export var speed: float = 10.0

var previous_position: Vector3
var fixed_x: float
var fixed_y: float

func _ready():
	previous_position = global_position
	fixed_x = global_position.x
	fixed_y = global_position.y

func _physics_process(_delta):
	var direction = Vector3.ZERO

	if Input.is_action_pressed("w"):
		direction.z -= 1
	if Input.is_action_pressed("s"):
		direction.z += 1
	if Input.is_action_pressed("a"):
		direction.z -= 1
	if Input.is_action_pressed("d"):
		direction.z += 1
	velocity = direction.normalized() * speed
	move_and_slide()

	# 🔒 Verrouille les positions X et Y
	global_position.x = fixed_x
	global_position.y = fixed_y

	previous_position = global_position
