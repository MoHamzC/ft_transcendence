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

	if Input.is_action_pressed("left"):
		direction.z -= 1
	if Input.is_action_pressed("right"):
		direction.z += 1
	if Input.is_action_pressed("up"):
		direction.z -= 1
	if Input.is_action_pressed("down"):
		direction.z += 1
	velocity = direction.normalized() * speed
	move_and_slide()

	# 🔒 Verrouille les positions X et Y
	global_position.x = fixed_x
	global_position.y = fixed_y

	previous_position = global_position


func _on_Ball_body_entered(body):
	if body.name == "ball":
		print("Collision avec la ball!")
