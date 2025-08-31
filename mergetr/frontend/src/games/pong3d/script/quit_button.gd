extends Button

func _ready():
	text = "Quitter"
	connect("pressed", Callable(self, "_on_pressed"))

func _on_pressed():
	# En HTML5, tu peux utiliser JavaScript pour quitter/rediriger
	JavaScriptBridge.eval("window.location.href = '/';")
