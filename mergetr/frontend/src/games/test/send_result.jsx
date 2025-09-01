function sendMatchResult(winnerId, loserId, winnerScore, loserScore) {
    const url = "http://localhost:5001/api/match";

    const data = {
        playerWinner: winnerId,
        playerLoser: loserId,
        playerWinnerScore: winnerScore,
        playerLoserScore: loserScore,
    };

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
    .then((res) => {
        if (res.ok) {
            console.log("match result a bien etais envoyer");
        } else {
            console.error("erreur envoie du resultat, res.status");
        }
    })
    .catch((err) => console.error("erreur fetch:", err));
}

