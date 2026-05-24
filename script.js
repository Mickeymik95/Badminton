// ===== FIREBASE =====
firebase.initializeApp({
  apiKey: "AIzaSyBRLCSzb3QahfPhLQu9WLIvBO9jovYm2y8",
  databaseURL: "https://liga-badminton-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = firebase.database();

let pairs = [], games = [], isAdmin = false;
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

// ===== LOAD PAIRS =====
db.ref("pairs").on("value", snap => {
  let data = snap.val();
  if (data) {
    pairs = data.map(p => typeof p === 'string' ? { name: p, avatar: defaultAvatar } : p);
  } else {
    pairs = []; // Tiada apa-apa jika kosong / reset
  }
});

// ===== LOAD GAMES =====
db.ref("games").on("value", snap => {
  games = snap.exists() ? snap.val() : [];
  paparkanPerlawanan();
  kiraMarkah();
});

// ===== ROUND ROBIN =====
function buatPerlawananRoundRobin() {
  let t = [...pairs]; if (t.length < 2) return; 
  if (t.length % 2) t.push({ name: "BYE", avatar: "" });
  
  let r = t.length - 1, h = t.length / 2, a = t.slice(1), g = [];
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < h; j++) {
      let x = j ? a[j - 1] : t[0], y = a[a.length - j - 1];
      if (x.name !== "BYE" && y.name !== "BYE" && x.name !== y.name && !g.some(p => (p.a === x.name && p.b === y.name) || (p.a === y.name && p.b === x.name)))
        g.push({ a: x.name, b: y.name, sa: "", sb: "" });
    }
    a.unshift(a.pop());
  }
  db.ref("games").set(g);
}

// ===== KIRA MARKAH =====
function kiraMarkah() {
  let tb = document.querySelector("#markahTable tbody"); 
  tb.innerHTML = "";
  if (pairs.length === 0) return;

  let d = {}; 
  pairs.forEach(p => d[p.name] = { avatar: p.avatar || defaultAvatar, main: 0, menang: 0, kalah: 0, jumlah: 0 });
  
  games.forEach(g => {
    if (!g || g.sa === "" || g.sb === "") return;
    let sa = +g.sa, sb = +g.sb;
    if(!d[g.a] || !d[g.b]) return;
    
    d[g.a].main++; d[g.b].main++;
    d[g.a].jumlah += sa - sb; d[g.b].jumlah += sb - sa;
    sa > sb ? (d[g.a].menang++, d[g.b].kalah++) : (d[g.b].menang++, d[g.a].kalah++);
  });
  
  let s = Object.entries(d).sort((a, b) => b[1].menang - a[1].menang || b[1].jumlah - a[1].jumlah);
  
  s.forEach((e, i) => {
    let rankDisplay = i === 0 ? "🥇" : i === 1 ? "🥈" : i + 1;
    tb.innerHTML += `<tr class="${i == 0 ? "firstPlace" : i == 1 ? "secondPlace" : ""}">
      <td>${rankDisplay}</td>
      <td>
        <div class="table-team-flex">
          <img src="${e[1].avatar}" class="team-avatar">
          <span>${e[0]}</span>
        </div>
      </td>
      <td>${e[1].main}</td><td>${e[1].menang}</td><td>${e[1].kalah}</td><td>${e[1].jumlah}</td>
    </tr>`;
  });
}

// ===== PAPARKAN PERLAWANAN =====
function paparkanPerlawanan() {
  let g = document.getElementById("gameList");
  g.innerHTML = "";
  
  if (games.length === 0) {
    g.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Tiada perlawanan. Sila login & tambah pasukan.</td></tr>`;
    return;
  }
  
  games.forEach((x, i) => {
    if (!x) return;
    let saClass = x.sa === "" ? "zero" : (+x.sa > +x.sb ? "positive" : (+x.sa < +x.sb ? "negative" : "zero"));
    let sbClass = x.sb === "" ? "zero" : (+x.sb > +x.sa ? "positive" : (+x.sb < +x.sa ? "negative" : "zero"));
    
    let diffA = "", diffB = "";
    
    if (x.sa !== "" && x.sb !== "") {
      let scoreA = +x.sa; let scoreB = +x.sb;
      let diff = scoreA - scoreB;
      
      if (diff > 0) {
        diffA = `<span class="score-diff pos">(+${diff})</span>`;
        diffB = `<span class="score-diff neg">(-${diff})</span>`;
      } else if (diff < 0) {
        let absDiff = Math.abs(diff);
        diffA = `<span class="score-diff neg">(-${absDiff})</span>`;
        diffB = `<span class="score-diff pos">(+${absDiff})</span>`;
      } else {
        diffA = `<span class="score-diff zero">(0)</span>`;
        diffB = `<span class="score-diff zero">(0)</span>`;
      }
    }
    
    let pairA = pairs.find(p => p.name === x.a) || { avatar: defaultAvatar };
    let pairB = pairs.find(p => p.name === x.b) || { avatar: defaultAvatar };
    
    g.innerHTML += `<tr>
      <td>${i + 1}</td>
      <td style="text-align:right;">
        <span class="team-container row-reverse">
          <img src="${pairA.avatar}" class="team-avatar">
          <span class="team-name">${x.a}</span> ${diffA}
        </span>
      </td>
      <td style="display:flex; justify-content:center; align-items:center; gap:3px;">
        <input ${!isAdmin ? "disabled" : ""} class="${saClass}" value="${x.sa}" onchange="update(${i},'sa',this.value)">
        <span style="font-weight:bold; font-size:10px;">🆚</span>
        <input ${!isAdmin ? "disabled" : ""} class="${sbClass}" value="${x.sb}" onchange="update(${i},'sb',this.value)">
      </td>
      <td style="text-align:left;">
        <span class="team-container">
          <img src="${pairB.avatar}" class="team-avatar">
          <span class="team-name">${x.b}</span> ${diffB}
        </span>
      </td>
    </tr>`;
  });
}

function update(i, f, v) { if (isAdmin) { games[i][f] = v; db.ref("games").set(games); kiraMarkah(); paparkanPerlawanan(); } }

function showAdminModal() {
  passwordModal.style.display = "flex";
  adminPwInput.value = "";
  adminPwInput.focus();
  window.history.pushState({ modalOpen: true }, null, window.location.href);
}

function checkPassword() {
  if (adminPwInput.value === "260895") {
    passwordModal.style.display = "none";
    isAdmin = true;
    infoText.innerText = "Admin aktif";
    addBtn.style.display = delBtn.style.display = resetBtn.style.display = "inline-block";
    paparkanPerlawanan();
  } else {
    alert("❌ Password salah!");
    adminPwInput.value = "";
    adminPwInput.focus();
  }
}

function tambahPair() {
  let name = prompt("Masukkan Nama Pasukan:");
  if (!name) return;
  let avatar = prompt("Masukkan Link URL Avatar Pasukan (Kosongkan jika tiada):");
  if (!avatar || avatar.trim() === "") avatar = defaultAvatar;
  
  pairs.push({ name: name, avatar: avatar });
  db.ref("pairs").set(pairs);
  buatPerlawananRoundRobin();
}

function buangPair() {
  let n = prompt("Nama Pasukan untuk buang:");
  if (!n) return;
  let idx = pairs.findIndex(p => p.name.trim().toLowerCase() === n.trim().toLowerCase());
  if (idx > -1) {
    pairs.splice(idx, 1);
    db.ref("pairs").set(pairs);
    if(pairs.length < 2) db.ref("games").remove(); else buatPerlawananRoundRobin();
  } else {
    alert("❌ Pasukan tidak dijumpai!");
  }
}

function resetData() { 
  if (confirm("Adakah anda pasti untuk RESET SEMUA DATA? (Pasukan & Skor dipadam)")) {
    db.ref("pairs").remove();
    db.ref("games").remove();
    pairs = []; games = [];
    paparkanPerlawanan(); kiraMarkah();
  } 
}

window.addEventListener("popstate", function (event) {
  if (passwordModal.style.display === "flex") {
    passwordModal.style.display = "none";
    infoText.innerText = "";
    adminPwInput.value = "";
  }
});

const nav = document.getElementById("mainNav");
const banner = document.getElementById("banner");
window.addEventListener("scroll", () => {
  if (window.scrollY > banner.offsetHeight) nav.classList.add("sticky");
  else nav.classList.remove("sticky");
  banner.style.backgroundPositionY = window.scrollY * 0.5 + "px";
});