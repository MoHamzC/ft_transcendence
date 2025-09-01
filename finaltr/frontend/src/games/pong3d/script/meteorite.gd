extends Node3D

var direction = Vector3.ZERO
@export var speed: float = 60.0

func _physics_process(delta):
	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		direction = Vector3(5, 4, 16).normalized()
		position += direction * speed * delta
		rotation.x += 0.003
		rotation.y += 0.003
