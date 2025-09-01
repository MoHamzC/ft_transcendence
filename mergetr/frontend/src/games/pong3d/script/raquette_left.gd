extends CharacterBody3D

@export var speed: float = 20.0
@export var joypad_id: int = 0           # ID de la manette à utiliser (0 = première détectée)
@export var deadzone: float = 0.15       # Valeur minimale pour que le stick bouge
@export var invert_y: bool = false       # Mettre true si le stick est inversé

var previous_position: Vector3
var fixed_x: float
var fixed_y: float
var has_joypad: bool = false

func _ready():
	fixed_x = global_position.x
	fixed_y = global_position.y

	# récupère le Mesh et crée un matériau unique
	var mesh = $CollisionShape3D/MeshInstance3D
	if mesh == null:
		push_error("⚠️ Aucun Mesh trouvé pour la raquette")
		return

	var material = mesh.get_surface_override_material(0)
	if material == null:
		material = StandardMaterial3D.new()
	else:
		material = material.duplicate()
	mesh.set_surface_override_material(0, material)

	# applique couleur ou texture
	_apply_skin(material, Global.skin_PL_color)


func _physics_process(_delta):
	var direction = Vector3.ZERO

	# --- clavier ---
	if Input.is_action_pressed("w"):
		direction.z -= 1
	if Input.is_action_pressed("s"):
		direction.z += 1

	# --- manette ---
	if not has_joypad:
		var joypads = Input.get_connected_joypads()
		if joypads.size() > 0:
			joypad_id = joypads[0]
			has_joypad = true
			print("🎮 Manette détectée :", Input.get_joy_name(joypad_id))

	if has_joypad:
		var axis_value = Input.get_joy_axis(joypad_id, JOY_AXIS_LEFT_Y)
		if invert_y:
			axis_value = -axis_value
		if abs(axis_value) > deadzone:
			direction.z += axis_value
		# debug en temps réel
		print("Stick gauche Y :", axis_value)

	# --- déplacement ---
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
			"blue": material.albedo_color = Color.BLUE
			"red": material.albedo_color = Color.RED
			"green": material.albedo_color = Color.GREEN
			"yellow": material.albedo_color = Color.YELLOW
			"brown": material.albedo_color = Color.BROWN
			"black": material.albedo_color = Color.BLACK
			"white": material.albedo_color = Color.WHITE
			"pink": material.albedo_color = Color.PINK
			"orange": material.albedo_color = Color.ORANGE
			"purple": material.albedo_color = Color.PURPLE
			"gray": material.albedo_color = Color.DIM_GRAY
			_:
				material.albedo_color = Color.WHITE


# --- debug boutons et axes ---
func _input(event):
	if event is InputEventJoypadButton:
		print("Bouton :", event.button_index, "pressé sur manette :", event.device)
	elif event is InputEventJoypadMotion:
		print("Axe :", event.axis, "valeur :", event.axis_value, "sur manette :", event.device)
