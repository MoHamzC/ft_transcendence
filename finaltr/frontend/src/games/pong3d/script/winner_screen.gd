extends Label3D

@onready var Win
var Winner

func _ready():
	if (Global.score_left >= Global.max_score):
		Winner = "Left Player"
	elif (Global.score_right >= Global.max_score):
		Winner = "Right Player"
	Win.text = str(Winner)
