// Petit script pour piloter la maquette
const $ = id => document.getElementById(id)
const log = (m) => { const p = $('log'); p.textContent = (new Date()).toISOString() + ' ' + m + '\n' + p.textContent }

function authHeaders() {
  const token = $('token').value.trim()
  return token ? { 'Authorization': 'Bearer ' + token } : {}
}

async function fetchJson(url, opts = {}){
  try{
    const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {})
    const res = await fetch(url, Object.assign({}, opts, { headers }))
    const text = await res.text()
    try { return { status: res.status, body: JSON.parse(text) } } catch(e) { return { status: res.status, body: text } }
  } catch(err){ log('Fetch error: ' + err.message); return { status: 0, body: err.message } }
}

async function loadLeaderboard(){
  const base = $('baseUrl').value.trim()
  if(!base) return alert('Set base URL')
  log('Loading leaderboard from ' + base + '/api/user/leaderboard')
  const r = await fetchJson(base + '/api/user/leaderboard', { headers: authHeaders() })
  if(r.status === 200){
    const el = r.body
    const container = $('leaderboard')
    if(!Array.isArray(el)) container.innerText = JSON.stringify(el, null, 2)
    else {
      container.innerHTML = '<ol>' + el.map(u => `<li><b>${u.username || u.email || u.id}</b> — wins: ${u.wins} games: ${u.games} rate: ${u.win_rate ?? ''}</li>`).join('') + '</ol>'
    }
    log('Leaderboard loaded ('+r.status+')')
  } else {
    log('Leaderboard failed ('+r.status+') ' + JSON.stringify(r.body))
    $('leaderboard').innerText = 'Error: ' + JSON.stringify(r.body)
  }
}

async function loadFriends(){
  const base = $('baseUrl').value.trim()
  log('Loading friends from ' + base + '/api/user/friends')
  const r = await fetchJson(base + '/api/user/friends', { headers: authHeaders() })
  if(r.status === 200){
    const rows = r.body
    const container = $('friends')
    if(!Array.isArray(rows)) container.innerText = JSON.stringify(rows, null, 2)
    else {
      container.innerHTML = '<ul>' + rows.map(u => `<li>${u.username || u.email || u.id} — status:${u.status}</li>`).join('') + '</ul>'
    }
    log('Friends loaded ('+r.status+')')
  } else {
    log('Friends failed ('+r.status+') ' + JSON.stringify(r.body))
    $('friends').innerText = 'Error: ' + JSON.stringify(r.body)
  }
}

async function sendRequest(){
  const base = $('baseUrl').value.trim()
  const addresseeId = $('addresseeId').value.trim()
  if(!addresseeId) return alert('addresseeId required')
  log('Sending friend request to ' + addresseeId)
  const r = await fetchJson(base + '/api/user/friends', { method: 'POST', body: JSON.stringify({ addresseeId }), headers: authHeaders() })
  $('friendResult').innerText = JSON.stringify(r, null, 2)
  log('SendRequest done ('+r.status+')')
}

async function acceptRequest(){
  const base = $('baseUrl').value.trim()
  const requesterId = $('requesterId').value.trim()
  if(!requesterId) return alert('requesterId required')
  log('Accepting friend request from ' + requesterId)
  const r = await fetchJson(base + '/api/user/friends/accept', { method: 'POST', body: JSON.stringify({ requesterId }), headers: authHeaders() })
  $('friendResult').innerText = JSON.stringify(r, null, 2)
  log('AcceptRequest done ('+r.status+')')
}

$('loadLeaderboard').addEventListener('click', loadLeaderboard)
$('loadFriends').addEventListener('click', loadFriends)
$('sendRequest').addEventListener('click', sendRequest)
$('acceptRequest').addEventListener('click', acceptRequest)

log('Maquette loaded')
