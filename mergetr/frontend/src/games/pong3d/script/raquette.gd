extends CharacterBody3D

@export var speed: float = 20.0
@export var update_interval: float = 1
@export var z_min: float = -3.70 
@export var z_max: float = 18.40
@export var prediction_tolerance: float = 0.5

var fixed_x: float
var fixed_y: float
var traj_z: float = 0.0
var ball: RigidBody3D
var timer: float = 0.0

func _ready():
	fixed_x = global_position.x
	fixed_y = global_position.y
	ball = get_node("/root/World/ball")

	var mesh = $CollisionShape3D/MeshInstance3D
	if mesh == null:
		push_error("⚠️ Aucun Mesh trouvé pour la raquette droite")
		return

	var material = mesh.get_surface_override_material(0)
	if material == null:
		material = StandardMaterial3D.new()
	else:
		material = material.duplicate()
	mesh.set_surface_override_material(0, material)

	# applique couleur ou texture
	_apply_skin(material, Global.skin_PR)

func ia_calcule():
	var pos = ball.global_position
	var vel = ball.linear_velocity
	var distance_ball_x = global_position.x - pos.x

	if vel.x == 0:
		traj_z = pos.z
		return

	var time_ball_to_raquette_x = distance_ball_x / vel.x
	var future_z = pos.z
	var velz = vel.z
	var time_wall_z: float = 0.0
	
	while time_ball_to_raquette_x > 0:
		if velz > 0:
			time_wall_z = (z_max - future_z) / velz
		elif velz < 0:
			time_wall_z = (z_min - future_z) / velz
		else:
			break

		if time_wall_z >= time_ball_to_raquette_x:
			future_z += velz * time_ball_to_raquette_x
			break
		else:
			future_z += velz * time_wall_z
			velz = -velz
			time_ball_to_raquette_x -= time_wall_z

	traj_z = future_z

func ia_control():
	var direction = Vector3.ZERO
	
	if global_position.z < traj_z - prediction_tolerance:
		direction.z = 1
	elif global_position.z > traj_z + prediction_tolerance:
		direction.z = -1
	else:
		direction.z = 0

	velocity = direction.normalized() * speed
	move_and_slide()

func _physics_process(delta):
	timer -= delta
	if timer <= 0.0:
		ia_calcule()
		timer = update_interval

	if Global.right_ia:
		ia_control()
	else:
		var direction = Vector3.ZERO
		if Input.is_action_pressed("up"):
			direction.z -= 1
		if Input.is_action_pressed("down"):
			direction.z += 1
		velocity = direction.normalized() * speed
		move_and_slide()

	global_position.x = fixed_x
	global_position.y = fixed_y

func _apply_skin(material: StandardMaterial3D, skin: String):
	if skin.ends_with(".png") or skin.ends_with(".jpg"):
		var path = "res://asset/" + skin
		if ResourceLoader.exists(path):
			material.albedo_texture = load(path)
		else:
			material.albedo_color = Color.WHITE
	else:
		match skin:
			"red": material.albedo_color = Color.RED
			"blue": material.albedo_color = Color.BLUE
			"green": material.albedo_color = Color.GREEN
			_:
				material.albedo_color = Color.WHITE
