const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback=[]) { try { return JSON.parse(localStorage.getItem("carepoint_"+key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem("carepoint_"+key, JSON.stringify(value)); }
};
let patients = store.get("patients");
let doctors = store.get("doctors");
let appointments = store.get("appointments");
let bills = store.get("bills");
let currentType = "";
let editingId = null;
let toastTimer;

function seedData(){
  if(!store.get("seeded", false)){
    patients = [
      {id:"P-1001",name:"Riya Sharma",age:28,gender:"Female",phone:"9876543210"},
      {id:"P-1002",name:"Aarav Verma",age:42,gender:"Male",phone:"9876501234"}
    ];
    doctors = [
      {id:"D-201",name:"Dr. Meera Kapoor",specialty:"Cardiology",phone:"9876511111"},
      {id:"D-202",name:"Dr. Rahul Singh",specialty:"General Medicine",phone:"9876522222"}
    ];
    appointments = [{id:"A-301",patientId:"P-1001",doctorId:"D-201",date:new Date().toISOString().slice(0,10),time:"10:30",status:"Scheduled"}];
    bills = [{id:"B-401",patientId:"P-1001",description:"Consultation",date:new Date().toISOString().slice(0,10),amount:500}];
    saveAll(); store.set("seeded",true);
  }
}
function saveAll(){store.set("patients",patients);store.set("doctors",doctors);store.set("appointments",appointments);store.set("bills",bills);}
function nextId(prefix, list){return prefix+"-"+(Date.now().toString().slice(-6));}
function escapeHTML(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN");}
function patientName(id){return patients.find(p=>p.id===id)?.name || "Unknown patient";}
function doctorName(id){return doctors.find(d=>d.id===id)?.name || "Unknown doctor";}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2400);}

$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  if($("username").value.trim()==="admin" && $("password").value==="admin123"){
    $("loginError").textContent=""; $("loginScreen").classList.add("hidden"); $("app").classList.remove("hidden");
    sessionStorage.setItem("carepoint_logged_in","yes"); renderAll();
  }else $("loginError").textContent="Incorrect username or password. Try the demo credentials below.";
});
$("logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("carepoint_logged_in");$("app").classList.add("hidden");$("loginScreen").classList.remove("hidden");});
if(sessionStorage.getItem("carepoint_logged_in")==="yes"){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");}

function navigate(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $(page+"Page").classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("pageTitle").textContent=page.charAt(0).toUpperCase()+page.slice(1);
  $("sidebar").classList.remove("open");
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("todayDate").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});

function renderAll(){renderDashboard();renderPatients();renderDoctors();renderAppointments();renderBills();}
function renderDashboard(){
  $("statPatients").textContent=patients.length;$("statDoctors").textContent=doctors.length;$("statAppointments").textContent=appointments.length;
  $("statBilling").textContent=money(bills.reduce((s,b)=>s+Number(b.amount),0));
  const rows=appointments.slice().sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,5);
  $("recentAppointments").innerHTML=rows.length?rows.map(a=>`<tr><td><b>${escapeHTML(patientName(a.patientId))}</b></td><td>${escapeHTML(doctorName(a.doctorId))}</td><td>${escapeHTML(a.date)}</td><td>${statusBadge(a.status)}</td></tr>`).join(""):`<tr><td colspan="4" class="empty">No appointments yet</td></tr>`;
}
function statusBadge(s){let cls=s==="Completed"?"done":s==="Cancelled"?"cancelled":"";return `<span class="badge ${cls}">${escapeHTML(s)}</span>`;}
function renderPatients(filter=""){
  const list=patients.filter(p=>(p.name+" "+p.id+" "+p.phone).toLowerCase().includes(filter.toLowerCase()));
  $("patientCount").textContent=`${list.length} patients`;
  $("patientsTable").innerHTML=list.length?list.map(p=>`<tr><td><b>${escapeHTML(p.id)}</b></td><td>${escapeHTML(p.name)}</td><td>${p.age}</td><td>${escapeHTML(p.gender)}</td><td>${escapeHTML(p.phone)}</td><td><button class="action-btn edit-btn" data-edit="patient" data-id="${p.id}">Edit</button><button class="action-btn delete-btn" data-delete="patient" data-id="${p.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No patients found</td></tr>`;
}
function renderDoctors(filter=""){
  const list=doctors.filter(d=>(d.name+" "+d.id+" "+d.specialty).toLowerCase().includes(filter.toLowerCase()));
  $("doctorCount").textContent=`${list.length} doctors`;
  $("doctorsTable").innerHTML=list.length?list.map(d=>`<tr><td><b>${escapeHTML(d.id)}</b></td><td>${escapeHTML(d.name)}</td><td>${escapeHTML(d.specialty)}</td><td>${escapeHTML(d.phone)}</td><td><button class="action-btn edit-btn" data-edit="doctor" data-id="${d.id}">Edit</button><button class="action-btn delete-btn" data-delete="doctor" data-id="${d.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="5" class="empty">No doctors found</td></tr>`;
}
function renderAppointments(filter=""){
  const list=appointments.filter(a=>(patientName(a.patientId)+" "+doctorName(a.doctorId)+" "+a.id).toLowerCase().includes(filter.toLowerCase()));
  $("appointmentCount").textContent=`${list.length} appointments`;
  $("appointmentsTable").innerHTML=list.length?list.map(a=>`<tr><td><b>${escapeHTML(a.id)}</b></td><td>${escapeHTML(patientName(a.patientId))}</td><td>${escapeHTML(doctorName(a.doctorId))}</td><td>${escapeHTML(a.date)}</td><td>${escapeHTML(a.time)}</td><td>${statusBadge(a.status)}</td><td><button class="action-btn edit-btn" data-edit="appointment" data-id="${a.id}">Edit</button><button class="action-btn delete-btn" data-delete="appointment" data-id="${a.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="7" class="empty">No appointments found</td></tr>`;
}
function renderBills(filter=""){
  const list=bills.filter(b=>(patientName(b.patientId)+" "+b.id+" "+b.description).toLowerCase().includes(filter.toLowerCase()));
  $("billCount").textContent=`${list.length} bills`;
  $("billingTable").innerHTML=list.length?list.map(b=>`<tr><td><b>${escapeHTML(b.id)}</b></td><td>${escapeHTML(patientName(b.patientId))}</td><td>${escapeHTML(b.description)}</td><td>${escapeHTML(b.date)}</td><td><b>${money(b.amount)}</b></td><td><button class="action-btn delete-btn" data-delete="bill" data-id="${b.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No bills found</td></tr>`;
}
$("patientSearch").addEventListener("input",e=>renderPatients(e.target.value));
$("doctorSearch").addEventListener("input",e=>renderDoctors(e.target.value));
$("appointmentSearch").addEventListener("input",e=>renderAppointments(e.target.value));
$("billSearch").addEventListener("input",e=>renderBills(e.target.value));

const dialog=$("recordDialog");
function field(name,label,type="text",opts={}){
  const id="f_"+name;let input="";
  if(type==="select")input=`<select id="${id}" ${opts.required===false?"":"required"}>${(opts.options||[]).map(o=>`<option value="${escapeHTML(o.value)}">${escapeHTML(o.label)}</option>`).join("")}</select>`;
  else input=`<input id="${id}" type="${type}" ${opts.required===false?"":"required"} ${opts.min!==undefined?`min="${opts.min}"`:""} ${opts.max!==undefined?`max="${opts.max}"`:""} placeholder="${opts.placeholder||""}" value="${opts.value||""}">`;
  return `<div class="field ${opts.full?"full-field":""}"><label for="${id}">${label}</label>${input}</div>`;
}
function optionsFrom(list,idField,labelField,placeholder){return [{value:"",label:placeholder},...list.map(x=>({value:x[idField],label:x[labelField]}))];}
function openForm(type,id=null){
  currentType=type;editingId=id;let item=null,fields="";
  if(id){const list=type==="patient"?patients:type==="doctor"?doctors:type==="appointment"?appointments:bills;item=list.find(x=>x.id===id);}
  $("formError").textContent="";
  if(type==="patient"){
    $("dialogTitle").textContent=id?"Edit patient":"Add patient";
    fields=field("name","Full name","text",{value:item?.name||"",placeholder:"Patient name"})+field("age","Age","number",{value:item?.age||"",min:0,max:120})+field("gender","Gender","select",{options:["Male","Female","Other"].map(x=>({value:x,label:x}))})+field("phone","Phone number","tel",{value:item?.phone||"",placeholder:"10-digit phone"});
    if(item) setTimeout(()=>$("f_gender").value=item.gender,0);
  }else if(type==="doctor"){
    $("dialogTitle").textContent=id?"Edit doctor":"Add doctor";
    fields=field("name","Doctor name","text",{value:item?.name||"",placeholder:"Dr. Full Name"})+field("specialty","Specialty","select",{options:["General Medicine","Cardiology","Neurology","Orthopedics","Pediatrics","Dermatology","Gynecology"].map(x=>({value:x,label:x}))})+field("phone","Phone number","tel",{value:item?.phone||"",placeholder:"10-digit phone"});
    if(item)setTimeout(()=>$("f_specialty").value=item.specialty,0);
  }else if(type==="appointment"){
    $("dialogTitle").textContent=id?"Edit appointment":"Book appointment";
    fields=field("patientId","Patient","select",{options:optionsFrom(patients,"id","name","Choose patient")})+field("doctorId","Doctor","select",{options:optionsFrom(doctors,"id","name","Choose doctor")})+field("date","Appointment date","date",{value:item?.date||new Date().toISOString().slice(0,10)})+field("time","Appointment time","time",{value:item?.time||"10:00"})+field("status","Status","select",{options:["Scheduled","Completed","Cancelled"].map(x=>({value:x,label:x}))});
    if(item)setTimeout(()=>{$("f_patientId").value=item.patientId;$("f_doctorId").value=item.doctorId;$("f_status").value=item.status;},0);
  }else{
    $("dialogTitle").textContent="Create bill";
    fields=field("patientId","Patient","select",{options:optionsFrom(patients,"id","name","Choose patient")})+field("description","Description","text",{value:"",placeholder:"e.g. Consultation"})+field("date","Bill date","date",{value:new Date().toISOString().slice(0,10)})+field("amount","Amount (₹)","number",{min:0,value:""});
  }
  $("dialogFields").innerHTML=fields;dialog.showModal();
}
$("closeDialog").addEventListener("click",()=>dialog.close());
$("cancelDialog").addEventListener("click",()=>dialog.close());
$("addPatientBtn").addEventListener("click",()=>openForm("patient"));
$("addDoctorBtn").addEventListener("click",()=>openForm("doctor"));
$("addAppointmentBtn").addEventListener("click",()=>openForm("appointment"));
$("addBillBtn").addEventListener("click",()=>openForm("bill"));

$("recordForm").addEventListener("submit",e=>{
  e.preventDefault();const val=n=>$("f_"+n)?.value?.trim()??"";
  let record={};
  if(currentType==="patient"){
    if(!/^\d{10}$/.test(val("phone"))){$("formError").textContent="Enter a valid 10-digit phone number.";return;}
    record={id:editingId||nextId("P",patients),name:val("name"),age:Number(val("age")),gender:val("gender"),phone:val("phone")};
    patients=editingId?patients.map(x=>x.id===editingId?record:x):[record,...patients];
  }else if(currentType==="doctor"){
    if(!/^\d{10}$/.test(val("phone"))){$("formError").textContent="Enter a valid 10-digit phone number.";return;}
    record={id:editingId||nextId("D",doctors),name:val("name"),specialty:val("specialty"),phone:val("phone")};
    doctors=editingId?doctors.map(x=>x.id===editingId?record:x):[record,...doctors];
  }else if(currentType==="appointment"){
    if(!patients.length||!doctors.length){$("formError").textContent="Add at least one patient and one doctor first.";return;}
    record={id:editingId||nextId("A",appointments),patientId:val("patientId"),doctorId:val("doctorId"),date:val("date"),time:val("time"),status:val("status")};
    appointments=editingId?appointments.map(x=>x.id===editingId?record:x):[record,...appointments];
  }else{
    if(!patients.length){$("formError").textContent="Add a patient before creating a bill.";return;}
    record={id:nextId("B",bills),patientId:val("patientId"),description:val("description"),date:val("date"),amount:Number(val("amount"))};
    bills=[record,...bills];
  }
  saveAll();renderAll();dialog.close();showToast(editingId?"Record updated successfully":"Record saved successfully");
});
document.addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit)openForm(edit.dataset.edit,edit.dataset.id);
  if(del){
    const {delete:unused}=del.dataset;const type=del.dataset.delete,id=del.dataset.id;
    if(!confirm("Are you sure you want to delete this record?"))return;
    if(type==="patient"){patients=patients.filter(x=>x.id!==id);appointments=appointments.filter(x=>x.patientId!==id);bills=bills.filter(x=>x.patientId!==id);}
    if(type==="doctor"){doctors=doctors.filter(x=>x.id!==id);appointments=appointments.filter(x=>x.doctorId!==id);}
    if(type==="appointment")appointments=appointments.filter(x=>x.id!==id);
    if(type==="bill")bills=bills.filter(x=>x.id!==id);
    saveAll();renderAll();showToast("Record deleted");
  }
});
seedData();renderAll();
