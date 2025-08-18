extends RayCast3D

var ball = get_node("/root/scene/ball")
var ray = $RayCast3D
ray.global_position = ball.global_transform.origin
ray.target_position = ball.global_transform.origin + ball.linear_velocity.normalized() * 1000
ray.force_raycast_update()

if ray.is_colliding():
	print("La balle va toucher :", ray.get_collider(), "à", ray.get_collision_point())
