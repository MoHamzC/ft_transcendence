extends RigidBody3D

@export var initial_speed: float = 5.0
@export var acceleration: float = 2.0
@export var max_speed: float = 100.0

func _ready():
	contact_monitor = true
	max_contacts_reported = 1
	connect("body_entered", Callable(self, "_on_Ball_body_entered"))

func _integrate_forces(state):
	if Global.game_start == false:
		linear_velocity = Vector3.ZERO
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

	if (Global.score_left >= Global.max_score or Global.score_right >= Global.max_score):
		visible = false
		position += Vector3(0,0,800)
		get_parent().on_goal_scored()
		return

	custom_integrator = false
