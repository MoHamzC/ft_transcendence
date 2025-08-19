extends CharacterBody3D

@export var speed: float = 10.0

var previous_position: Vector3
var fixed_x: float
var fixed_y: float

var ball

func _ready():
	previous_position = global_position
	fixed_x = global_position.x
	fixed_y = global_position.y
	
	ball = get_node("/root/World/ball")

func ia_calcule():

	var ball_pos = ball.global_position
	var ball_dir = ball.linear_velocity.normalized()
	
	var traj = ball_pos + ball_dir * 1.0
	
	if ball_pos.x >= 0.0:
		ia_control(traj.z)

func ia_control(traj_z):
	var direction = Vector3.ZERO
	
	if global_position.z > traj_z:
		direction.z -= 1
	elif global_position.z < traj_z:
		direction.z += 1

	velocity = direction.normalized() * speed
	move_and_slide()

func _physics_process(_delta):
	if Global.right_ia == true:
		ia_calcule()
	else:
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

	# 🔒 Verrouille X et Y
	global_position.x = fixed_x
	global_position.y = fixed_y

	previous_position = global_position

func _on_Ball_body_entered(body):
	if body.name == "ball":
		print("Collision avec la balle!")
