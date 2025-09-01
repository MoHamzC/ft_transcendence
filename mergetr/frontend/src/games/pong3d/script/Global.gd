# Global.gd
extends Node

# --- score ---
var score_left: int = 0
var score_right: int = 0
var max_score: int = 1

# --- game ---
var game_start: bool = false
var right_ia: bool = true

# --- player left ---
var skin_PL_color: String = "red"
var skin_PL_id: String = ""
var skin_PL_name: String = "Player Left"

# --- player right ---
var skin_PR_color: String = "red"
var skin_PR_id: String = ""
var skin_PR_name: String = "Player Right"

# --- tournament ---
var tournament_id: String = "false"

# --- fonction pour décoder les paramètres URL ---
func decode_param(s: String) -> String:
	s = s.replace("%20", " ")
	s = s.replace("%23", "#")
	return s

# --- tournoi context ---
var tournament_id: String = ""
var match_id: String = ""


func _ready():
	var url = ""  # valeur par défaut
	if Engine.has_singleton("JavaScriptBridge"):
		var js = JavaScriptBridge.get_interface("window")
		if js:
			url = str(js.location.href)

	if url != "":
		var search_index = url.find("?")
		if search_index != -1:
			var search = url.substr(search_index + 1, url.length() - search_index - 1)
			var params = {}
			for pair in search.split("&"):
				var kv = pair.split("=")
				if kv.size() == 2:
					params[kv[0]] = decode_param(kv[1])

			# Activer l'IA
			right_ia = params.get("ia", "false") == "true"

			# Player Left
			skin_PL_color = params.get("playerColor", skin_PL_color)
			skin_PL_id    = params.get("playerId", skin_PL_id)
			skin_PL_name  = params.get("playerName", skin_PL_name)

			# Player Right
			skin_PR_color = params.get("opponentColor", skin_PR_color)
			skin_PR_id    = params.get("opponentId", skin_PR_id)
			skin_PR_name  = params.get("opponentName", skin_PR_name)

			# Tournament
			tournament_id = params.get("tournamentId", tournament_id)


	var file = FileAccess.open("res://gamecontrollerdb.txt", FileAccess.READ)
	if file:
		while not file.eof_reached():
			var line = file.get_line()
			if line.strip_edges() != "":
				Input.add_joy_mapping(line, true)
		print("✅ Base de données manettes chargée")
	else:
		print("⚠️ Impossible de charger gamecontrollerdb.txt")



			# Contexte tournoi
			if search.find("tournamentId=") != -1:
				var parts = search.split("tournamentId=")
				if parts.size() > 1:
					tournament_id = parts[1].split("&")[0]
					print("Tournament ID detected:", tournament_id)
			if search.find("matchId=") != -1:
				var parts = search.split("matchId=")
				if parts.size() > 1:
					match_id = parts[1].split("&")[0]
					print("Match ID detected:", match_id)

	# Debug
	print("Right IA activé :", right_ia)
	print("Player Left :", skin_PL_color, skin_PL_id)
	print("Player Right:", skin_PR_color, skin_PR_id)
	print("Tournament context:", tournament_id, match_id)
