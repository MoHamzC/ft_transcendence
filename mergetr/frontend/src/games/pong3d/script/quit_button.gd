extends Button

func _ready():
	text = "Quitter"
	connect("pressed", Callable(self, "_on_pressed"))

func _on_pressed():
	# En HTML5, tu peux utiliser JavaScript pour quitter/rediriger
	if Global.tournament_id == "false":
		JavaScriptBridge.eval("window.location.href = '/';")
	else:
		get_tree().quit()
