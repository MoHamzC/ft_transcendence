extends Label3D

func _ready():
	update_scores()

func update_scores():
	var winner = ""
	if Global.score_left >= Global.max_score:
		winner = Global.skin_PL_name
	elif Global.score_right >= Global.max_score:
		winner = Global.skin_PR_name
	text = winner
