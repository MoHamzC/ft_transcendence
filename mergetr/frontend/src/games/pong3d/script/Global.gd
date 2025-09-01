# Global.gd
extends Node

# --- score ---
var score_left: int = 0
var score_right: int = 0
var max_score: int = 1

# --- game ---
var game_start: bool = false
var right_ia: bool = true

# --- skin et id ---
var skin_PL_color: String = "red"
var skin_PL_id: String = ""
var skin_PR_color: String = "blue"
var skin_PR_id: String = ""

# --- tournoi context ---
var tournament_id: String = ""
var match_id: String = ""


func _ready():
	if Engine.has_singleton("JavaScriptBridge"):
		var js = JavaScriptBridge.get_interface("window")
		if js:
			var search = str(js.location.search)  # "?ia=true&PL_color=blue&PL_id=948929725..."
			# Activer l'IA si paramètre présent
			if search.find("ia=true") != -1:
				right_ia = true

			# Récupérer les paramètres PL_
			if search.find("PL_color=") != -1:
				var parts = search.split("PL_color=")
				if parts.size() > 1:
					skin_PL_color = parts[1].split("&")[0]
			if search.find("PL_id=") != -1:
				var parts = search.split("PL_id=")
				if parts.size() > 1:
					skin_PL_id = parts[1].split("&")[0]

			# Récupérer les paramètres PR_
			if search.find("PR_color=") != -1:
				var parts = search.split("PR_color=")
				if parts.size() > 1:
					skin_PR_color = parts[1].split("&")[0]
			if search.find("PR_id=") != -1:
				var parts = search.split("PR_id=")
				if parts.size() > 1:
					skin_PR_id = parts[1].split("&")[0]

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
