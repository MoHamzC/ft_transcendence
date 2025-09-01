extends Node3D

var direction = Vector3.ZERO
@export var speed: float = 0

func _physics_process(delta):
		direction = Vector3(0, 0, 5).normalized()
		position += direction * speed * delta
		rotation.x -= 0.003
		rotation.y -= 0.003
