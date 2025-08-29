extends CharacterBody3D

@export var speed: float = 20.0

var previous_position: Vector3
var fixed_x: float
var fixed_y: float

func _ready():
	fixed_x = global_position.x
	fixed_y = global_position.y

	# récupère le Mesh et crée un matériau unique
	var mesh = $CollisionShape3D/MeshInstance3D
	if mesh == null:
		push_error("⚠️ Aucun Mesh trouvé pour la raquette gauche")
		return

	var material = mesh.get_surface_override_material(0)
	if material == null:
		material = StandardMaterial3D.new()
	else:
		material = material.duplicate()
	mesh.set_surface_override_material(0, material)

	# applique couleur ou texture
	_apply_skin(material, Global.skin_PL)

func _physics_process(_delta):
	var direction = Vector3.ZERO

	if Input.is_action_pressed("w"):
		direction.z -= 1
	if Input.is_action_pressed("s"):
		direction.z += 1

	velocity = direction.normalized() * speed
	move_and_slide()

	# verrouille X et Y
	global_position.x = fixed_x
	global_position.y = fixed_y
	previous_position = global_position

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
