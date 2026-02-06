// ===== FIREBASE =====
firebase.initializeApp({
apiKey:"AIzaSyBRLCSzb3QahfPhLQu9WLIvBO9jovYm2y8",
databaseURL:"https://liga-badminton-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db=firebase.database();

// ===== DATA & ADMIN =====
let pairs=[],games=[],isAdmin=false;

// ===== LOAD PAIRS =====
db.ref("pairs").on("value",snap=>{
  pairs=[...new Set(snap.val()||["Pasukan 1","Pasukan 2","Pasukan 3","Pasukan 4"])];
});

// ===== LOAD GAMES =====
db.ref("games").on("value",snap=>{
  if(snap.exists()){games=snap.val();}else{buatPerlawananRoundRobin(); return;}
  paparkanPerlawanan();
  kiraMarkah();
});

// ===== ROUND ROBIN =====
function buatPerlawananRoundRobin(){
  let t=[...pairs]; if(t.length<2)return; if(t.length%2)t.push("BYE");
  let r=t.length-1,h=t.length/2,a=t.slice(1),g=[];
  for(let i=0;i<r;i++){
    for(let j=0;j<h;j++){
      let x=j?a[j-1]:t[0],y=a[a.length-j-1];
      if(x!=="BYE"&&y!=="BYE"&&x!==y&&!g.some(p=> (p.a===x&&p.b===y)||(p.a===y&&p.b===x) ))
        g.push({a:x,b:y,sa:"",sb:""});
    }
    a.unshift(a.pop());
  }
  db.ref("games").set(g);
}

// ===== KIRA MARKAH =====
function kiraMarkah(){
  let d={}; pairs.forEach(p=>d[p]={main:0,menang:0,kalah:0,jumlah:0});
  games.forEach(g=>{
    if(g.sa===""||g.sb==="")return;
    let sa=+g.sa,sb=+g.sb;
    d[g.a].main++;d[g.b].main++;
    d[g.a].jumlah+=sa-sb; d[g.b].jumlah+=sb-sa;
    sa>sb?(d[g.a].menang++,d[g.b].kalah++):(d[g.b].menang++,d[g.a].kalah++);
  });
  let s=Object.entries(d).sort((a,b)=>b[1].menang-a[1].menang||b[1].jumlah-a[1].jumlah);
  let tb=document.querySelector("#markahTable tbody"); tb.innerHTML="";
  s.forEach((e,i)=>{
    let rankDisplay=i===0?"🥇":i===1?"🥈":i+1;
    tb.innerHTML+=`<tr class="${i==0?"firstPlace":i==1?"secondPlace":""}">
    <td>${rankDisplay}</td><td>${e[0]}</td><td>${e[1].main}</td><td>${e[1].menang}</td><td>${e[1].kalah}</td><td>${e[1].jumlah}</td>
    </tr>`;
  });
}

// ===== PAPARKAN PERLAWANAN =====
function paparkanPerlawanan(){
  let g=document.getElementById("gameList");
  g.innerHTML="";
  games.forEach((x,i)=>{
    let saClass=x.sa===""?"zero":(+x.sa>+x.sb?"positive":(+x.sa<+x.sb?"negative":"zero"));
    let sbClass=x.sb===""?"zero":(+x.sb>+x.sa?"positive":(+x.sb<+x.sa?"negative":"zero"));
    g.innerHTML+=`<tr>
      <td>${i+1}</td>
      <td>${x.a}</td>
      <td style="display:flex; justify-content:center; align-items:center; gap:6px;">
        <input ${!isAdmin?"disabled":""} class="${saClass}" value="${x.sa}" onchange="update(${i},'sa',this.value)">
        <span style="font-weight:bold;">🆚</span>
        <input ${!isAdmin?"disabled":""} class="${sbClass}" value="${x.sb}" onchange="update(${i},'sb',this.value)">
      </td>
      <td>${x.b}</td>
    </tr>`;
  });
}

// ===== UPDATE SCORE =====
function update(i,f,v){if(isAdmin){games[i][f]=v; db.ref("games").set(games); kiraMarkah(); paparkanPerlawanan();}}

// ===== ADMIN MODAL =====
function showAdminModal(){
  passwordModal.style.display="flex";
  adminPwInput.value="";
  adminPwInput.focus();
  window.history.pushState({modalOpen:true}, null, window.location.href);
}
function checkPassword(){
  if(adminPwInput.value==="260895"){
    passwordModal.style.display="none";
    isAdmin=true;
    infoText.innerText="Admin aktif";
    addBtn.style.display=delBtn.style.display=resetBtn.style.display="inline-block";
    paparkanPerlawanan();
  } else {
    alert("❌ Password salah!");
    adminPwInput.value="";
    adminPwInput.focus();
  }
}

// ===== TAMBAH / BUANG / RESET =====
function tambahPair(){let n=prompt("Nama pasukan");if(n){pairs.push(n); db.ref("pairs").set(pairs); db.ref("games").remove();}}
function buangPair(){let n=prompt("Nama Pasukan untuk buang:");if(!n)return; let idx=pairs.findIndex(p=>p.trim().toLowerCase()===n.trim().toLowerCase()); if(idx>-1){pairs.splice(idx,1); db.ref("pairs").set(pairs); db.ref("games").remove();}else{alert("❌ Pasukan tidak dijumpai!");}}
function resetData(){if(confirm("Reset semua perlawanan?"))db.ref("games").remove();}

// ===== POPSTATE MODAL =====
window.addEventListener("popstate",function(event){
  if(passwordModal.style.display==="flex"){
    passwordModal.style.display="none";
    infoText.innerText="";
    adminPwInput.value="";
  }
});

// ===== NAV STICKY & BANNER PARALLAX =====
const nav=document.getElementById("mainNav");
const banner=document.getElementById("banner");
window.addEventListener("scroll",()=>{
  if(window.scrollY>banner.offsetHeight) nav.classList.add("sticky");
  else nav.classList.remove("sticky");
  banner.style.backgroundPositionY=window.scrollY*0.5+"px";
});
