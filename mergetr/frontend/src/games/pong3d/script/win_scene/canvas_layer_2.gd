extends CanvasLayer

@onready var label: Label = $Label

var countdown: float = 3.0
var end_delay: float = 2.0
var finished: bool = false

func _ready():
	label.text = "Retour au tournoi dans : %d" % int(countdown)

func _process(delta: float):
	if not finished:
		countdown -= delta
		if countdown > 0:
			label.text = "Retour au tournoi dans : %d" % int(ceil(countdown))
		else:
			finished = true
			countdown = end_delay
			label.text = "Retour au tournoi !"
	else:
		countdown -= delta
		if countdown <= 0:
			# construit l'URL avec le tournament_id
			var url = "http://localhost:5173/tournament/" + str(Global.tournament_id)
			JavaScriptBridge.eval("window.location.href = '%s';" % url)
