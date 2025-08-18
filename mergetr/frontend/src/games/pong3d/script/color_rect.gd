extends ColorRect

var time_passed = 0.0
var speed = 0.05

func _process(delta):
	time_passed += delta * speed
	material.set_shader_parameter("time", time_passed)
