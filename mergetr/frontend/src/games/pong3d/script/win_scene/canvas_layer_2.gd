extends CanvasLayer

@onready var label: Label = $Label
@onready var http_request: HTTPRequest = $HTTPRequest

var countdown: float = 3.0
var end_delay: float = 2.0
var finished: bool = false
var redirected: bool = false

func _ready():
	if Global.tournament_id == "false":
		visible = false
		return
	label.text = "Retour au tournoi dans : %d" % int(countdown)

func _process(delta: float):
	if Global.tournament_id == "false":
		return
	else:
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
			if countdown <= 0 and not redirected:
				redirected = true
				var url = "http://localhost:8443/tournament/" + str(Global.tournament_id) + "/play"
				print("Redirection via JS vers : ", url)
				
				if Engine.has_singleton("JavaScriptBridge"):
					var js = JavaScriptBridge.get_interface("window")
					if js:
						js.location.href = url
				else:
					print("JavaScriptBridge non disponible, fermeture du jeu")
					get_tree().quit()
