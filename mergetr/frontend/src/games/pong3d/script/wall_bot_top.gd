extends Node3D

@export var mur_type: String = "left"

func _ready():
	$Area3D.mur_type = mur_type
