extends Label3D

func _ready():
	update_scores()

func update_scores():
	var winner = ""
	if Global.score_left >= Global.max_score:
		winner = "Player Left\n WIN"
	elif Global.score_right >= Global.max_score:
		winner = "Player Right\n WIN"
	text = winner
