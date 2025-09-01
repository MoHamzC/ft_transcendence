extends CanvasLayer

func _ready():
	visible = (Global.tournament_id == "false")
