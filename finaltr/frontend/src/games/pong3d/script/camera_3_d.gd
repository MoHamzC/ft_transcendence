extends Camera3D

var move_timer = 0.0
var move_done = false

func _process(delta):
	if move_done:
		return

	if Global.score_left >= Global.max_score or Global.score_right >= Global.max_score:
		move_timer += delta
		if move_timer >= 6.1:
			position.x += 800
			move_done = true
