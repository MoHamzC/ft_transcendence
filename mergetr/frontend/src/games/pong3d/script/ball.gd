extends RigidBody3D

@export var initial_speed: float = 5.0
@export var acceleration: float = 2
@export var max_speed: float = 100.0

func _ready():
	contact_monitor = true
	max_contacts_reported = 1
	connect("body_entered", Callable(self, "_on_Ball_body_entered"))

	var initial_direction = Vector3(randf_range(-1, 1), 0, randf_range(-1, 1)).normalized()
	linear_velocity = initial_direction * initial_speed

func _integrate_forces(state):
	if custom_integrator:
		return

	linear_velocity.y = 0

	if linear_velocity.length() < max_speed:
		linear_velocity = linear_velocity.normalized() * (linear_velocity.length() + acceleration * state.get_step())

	if abs(linear_velocity.x) < 10:
		linear_velocity.x = 10 * sign(linear_velocity.x if linear_velocity.x != 0 else 1)

	linear_velocity = linear_velocity.normalized() * linear_velocity.length()

func reset_ball():
	custom_integrator = true
	linear_velocity = Vector3.ZERO

	var new_transform = global_transform
	new_transform.origin = Vector3(0, 0, 8.5)
	global_transform = new_transform

	await get_tree().create_timer(3.0).timeout

	custom_integrator = false

	var initial_direction = Vector3(randf_range(-1, 1), 0, randf_range(-1, 1)).normalized()
	linear_velocity = initial_direction * initial_speed
