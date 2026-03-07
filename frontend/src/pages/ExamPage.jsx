import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

/* ─── helpers ─── */
const GRADE_COLOR = { "A+":"#10b981","A":"#10b981","B":"#4f46e5","C":"#f59e0b","D":"#f97316","F":"#ef4444" };
const EXAM_TYPES  = ["Midterm","Final","Monthly Test","Quiz","Other"];
const STATUSES    = ["draft","ongoing","completed","published"];

function gradeColor(g){ return GRADE_COLOR[g]||"#94a3b8"; }
function pctGrade(p){ return p>=90?"A+":p>=80?"A":p>=70?"B":p>=60?"C":p>=50?"D":"F"; }

function fmtDate(d){ return d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—"; }

/* ─── reusable modal ─── */
function Modal({ visible, onClose, title, size, children }){
  if(!visible) return null;
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`modal animate-scale ${size||""}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" style={{width:16}}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── status badge ─── */
function StatusBadge({ status }){
  const map={draft:"badge-gray",ongoing:"badge-blue",completed:"badge-yellow",published:"badge-green"};
  return <span className={`badge ${map[status]||"badge-gray"}`} style={{textTransform:"capitalize"}}>{status}</span>;
}

export default function ExamPage(){
  const user    = auth.getUser();
  const isAdmin = user?.role==="Admin";

  /* ── global data ── */
  const [years,    setYears]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("exams");   // exams | marks | results | sheet
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  /* ── exam modal state ── */
  const EXAM_BLANK = { name:"", type:"Midterm", academicYearId:"", term:"", startDate:"", endDate:"", description:"", status:"draft" };
  const [showExamModal, setShowExamModal] = useState(false);
  const [editExam,      setEditExam]      = useState(null);   // null = create
  const [examForm,      setExamForm]      = useState(EXAM_BLANK);
  const [examSaving,    setExamSaving]    = useState(false);

  /* ── exam-subject modal ── */
  const ES_BLANK = { examId:"", subjectId:"", classLevelId:"", totalMarks:100, passingMarks:40, examDate:"", durationMins:60 };
  const [showEsModal, setShowEsModal] = useState(false);
  const [esForm,      setEsForm]      = useState(ES_BLANK);
  const [esSaving,    setEsSaving]    = useState(false);
  const [examSubjects, setExamSubjects] = useState([]);
  const [esExamId,     setEsExamId]    = useState("");

  /* ── marks entry ── */
  const [mForm,         setMForm]         = useState({ academicYearId:"", examId:"", classLevelId:"", sectionId:"", subjectId:"" });
  const [enrollments,   setEnrollments]   = useState([]);
  const [marks,         setMarks]         = useState({});
  const [maxMarksInput, setMaxMarksInput] = useState(100);
  const [passMarksInput,setPassMarksInput]= useState(40);
  const [mLoadingStudents, setMLoadingStudents] = useState(false);
  const [mSaving,       setMSaving]       = useState(false);

  /* ── results / report card ── */
  const [rFilter,     setRFilter]   = useState({ academicYearId:"", examId:"", classLevelId:"", sectionId:"" });
  const [rcStudentId, setRcStudentId] = useState("");
  const [rcExamId,    setRcExamId]    = useState("");
  const [reportCard,  setReportCard]  = useState(null);
  const [rcLoading,   setRcLoading]   = useState(false);
  const [rStudents,   setRStudents]   = useState([]);

  /* ── class result sheet ── */
  const [shFilter,    setShFilter]  = useState({ examId:"", classLevelId:"", sectionId:"" });
  const [sheetData,   setSheetData] = useState([]);
  const [shLoading,   setShLoading] = useState(false);

  /* ── derived ── */
  const filteredSections = useMemo(()=>sections.filter(s=>(s.classLevelId?._id||s.classLevelId)===mForm.classLevelId),[sections,mForm.classLevelId]);
  const rcSections       = useMemo(()=>sections.filter(s=>(s.classLevelId?._id||s.classLevelId)===rFilter.classLevelId),[sections,rFilter.classLevelId]);
  const shSections       = useMemo(()=>sections.filter(s=>(s.classLevelId?._id||s.classLevelId)===shFilter.classLevelId),[sections,shFilter.classLevelId]);

  const mExams      = useMemo(()=>exams.filter(e=>!mForm.academicYearId||(e.academicYearId?._id||e.academicYearId)===mForm.academicYearId),[exams,mForm.academicYearId]);
  const rExams      = useMemo(()=>exams.filter(e=>!rFilter.academicYearId||(e.academicYearId?._id||e.academicYearId)===rFilter.academicYearId),[exams,rFilter.academicYearId]);
  const mFilteredSubs = useMemo(()=>{
    if(user?.role==="Teacher") return subjects;
    return subjects.filter(s=>!mForm.classLevelId||((s.classLevelId?._id||s.classLevelId)===mForm.classLevelId));
  },[subjects,mForm.classLevelId,user]);

  /* ──────── Init ──────── */
  async function loadInit(){
    try {
      const [yR,cR,sR,subR,eR] = await Promise.all([
        api.get("/api/academic-years"), api.get("/api/classes"),
        api.get("/api/sections"),       api.get("/api/subjects"),
        api.get("/api/exams"),
      ]);
      setYears(yR.data||[]); setClasses(cR.data||[]); setSections(sR.data||[]);
      setSubjects(subR.data||[]); setExams(eR.data||[]);
      const activeY=(yR.data||[]).find(y=>y.status==="active")||(yR.data||[])[0];
      if(activeY) setMForm(f=>({...f,academicYearId:activeY._id}));
    } catch{ setError("Failed to load initial data"); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ loadInit(); },[]);

  function showMsg(msg,isErr=false){ if(isErr)setError(msg); else setSuccess(msg); setTimeout(()=>{ setError(""); setSuccess(""); },4000); }

  /* ──────── EXAM CRUD ──────── */
  function openCreateExam(){
    const activeY=years.find(y=>y.status==="active")||years[0];
    setExamForm({...EXAM_BLANK, academicYearId:activeY?._id||""});
    setEditExam(null); setShowExamModal(true);
  }
  function openEditExam(exam){
    setExamForm({
      name:exam.name, type:exam.type||"Midterm",
      academicYearId:exam.academicYearId?._id||exam.academicYearId||"",
      term:exam.term||"", startDate:exam.startDate?exam.startDate.slice(0,10):"",
      endDate:exam.endDate?exam.endDate.slice(0,10):"",
      description:exam.description||"", status:exam.status||"draft"
    });
    setEditExam(exam); setShowExamModal(true);
  }
  async function saveExam(){
    if(!examForm.name||!examForm.academicYearId){ showMsg("Name & Academic Year required",true); return; }
    setExamSaving(true);
    try{
      if(editExam){ await api.put(`/api/exams/${editExam._id}`, examForm); }
      else         { await api.post("/api/exams", examForm); }
      const { data } = await api.get("/api/exams");
      setExams(data||[]); setShowExamModal(false);
      showMsg(editExam?"Exam updated!":"Exam created!");
    } catch(e){ showMsg(e?.response?.data?.message||"Save failed",true); }
    finally{ setExamSaving(false); }
  }
  async function deleteExam(exam){
    if(!window.confirm(`Delete "${exam.name}" and all its marks?`)) return;
    try{
      await api.delete(`/api/exams/${exam._id}`);
      setExams(e=>e.filter(x=>x._id!==exam._id));
      showMsg("Exam deleted.");
    } catch(e){ showMsg(e?.response?.data?.message||"Delete failed",true); }
  }
  async function publishExam(exam,pub){
    try{
      await api.patch(`/api/exams/${exam._id}/${pub?"publish":"unpublish"}`);
      const { data }=await api.get("/api/exams"); setExams(data||[]);
      showMsg(pub?"Result published – students can now view it.":"Result unpublished.");
    } catch(e){ showMsg(e?.response?.data?.message||"Failed",true); }
  }

  /* ──────── EXAM SUBJECTS ──────── */
  async function openEsModal(exam){
    setEsExamId(exam._id);
    setEsForm({...ES_BLANK, examId:exam._id, classLevelId:classes[0]?._id||""});
    const {data}=await api.get(`/api/exams/subjects/list?examId=${exam._id}`);
    setExamSubjects(data||[]);
    setShowEsModal(true);
  }
  async function saveEs(){
    if(!esForm.subjectId||!esForm.classLevelId){ showMsg("Subject & Class required",true); return; }
    setEsSaving(true);
    try{
      await api.post("/api/exams/subjects", esForm);
      const {data}=await api.get(`/api/exams/subjects/list?examId=${esExamId}`);
      setExamSubjects(data||[]);
      setEsForm(f=>({...f,subjectId:""}));
      showMsg("Subject assigned!");
    } catch(e){ showMsg(e?.response?.data?.message||"Failed",true); }
    finally{ setEsSaving(false); }
  }
  async function deleteEs(id){
    try{
      await api.delete(`/api/exams/subjects/${id}`);
      setExamSubjects(es=>es.filter(x=>x._id!==id));
    } catch(e){ showMsg(e?.response?.data?.message||"Failed",true); }
  }

  /* ──────── MARKS ENTRY ──────── */
  async function loadStudents(){
    if(!mForm.classLevelId||!mForm.sectionId){ showMsg("Select class and section",true); return; }
    setMLoadingStudents(true); setEnrollments([]); setMarks({});
    try{
      const {data}=await api.get(`/api/students?classLevelId=${mForm.classLevelId}&sectionId=${mForm.sectionId}&status=active&limit=1000`);
      const students=(data?.items||[]).map(s=>({_id:s._id,studentId:s}));
      setEnrollments(students);
      if(mForm.examId&&mForm.subjectId){
        const {data:rData}=await api.get(`/api/exams/results/list?examId=${mForm.examId}&subjectId=${mForm.subjectId}`);
        const m={};
        for(const r of (rData||[])){ m[String(r.studentId?._id||r.studentId)]=r.marksObtained; }
        setMarks(m);
        // pre-fill max/pass marks from exam subject config
        const {data:es}=await api.get(`/api/exams/subjects/list?examId=${mForm.examId}&classLevelId=${mForm.classLevelId}`);
        const esRow=es?.find(x=>(x.subjectId?._id||x.subjectId)===mForm.subjectId);
        if(esRow){ setMaxMarksInput(esRow.totalMarks); setPassMarksInput(esRow.passingMarks); }
      }
    } catch(e){ showMsg(e?.response?.data?.message||"Failed to load students",true); }
    finally{ setMLoadingStudents(false); }
  }
  async function saveMarks(){
    if(!mForm.examId||!mForm.subjectId){ showMsg("Select exam and subject",true); return; }
    setMSaving(true);
    try{
      const results=enrollments.map(e=>{
        const sid=String(e.studentId?._id||e.studentId);
        return { studentId:sid, examId:mForm.examId, subjectId:mForm.subjectId,
                 marksObtained:Number(marks[sid]||0), maxMarks:Number(maxMarksInput),
                 passingMarks:Number(passMarksInput), classLevelId:mForm.classLevelId, sectionId:mForm.sectionId||undefined };
      });
      await api.post("/api/exams/marks/bulk",{results});
      showMsg(`Marks saved for ${results.length} students!`);
    } catch(e){ showMsg(e?.response?.data?.message||"Save failed",true); }
    finally{ setMSaving(false); }
  }

  /* ──────── REPORT CARD ──────── */
  async function loadRcStudents(){
    if(!rFilter.classLevelId||!rFilter.sectionId) return;
    const {data}=await api.get(`/api/students?classLevelId=${rFilter.classLevelId}&sectionId=${rFilter.sectionId}&status=active&limit=1000`);
    setRStudents(data?.items||[]);
  }
  useEffect(()=>{ loadRcStudents(); },[rFilter.classLevelId,rFilter.sectionId]);

  async function loadReportCard(){
    if(!rcStudentId||!rcExamId){ showMsg("Select student and exam",true); return; }
    setRcLoading(true); setReportCard(null);
    try{
      const {data}=await api.get(`/api/exams/results/report-card/${rcStudentId}/${rcExamId}`);
      setReportCard(data);
    } catch(e){ showMsg(e?.response?.data?.message||"Failed",true); }
    finally{ setRcLoading(false); }
  }

  /* ──────── CLASS SHEET ──────── */
  async function loadClassSheet(){
    if(!shFilter.examId||!shFilter.classLevelId){ showMsg("Select exam and class",true); return; }
    setShLoading(true); setSheetData([]);
    try{
      let url=`/api/exams/results/class-sheet?examId=${shFilter.examId}&classLevelId=${shFilter.classLevelId}`;
      if(shFilter.sectionId) url+=`&sectionId=${shFilter.sectionId}`;
      const {data}=await api.get(url);
      setSheetData(data||[]);
    } catch(e){ showMsg(e?.response?.data?.message||"Failed",true); }
    finally{ setShLoading(false); }
  }

  /* ──────── Print ──────── */
  function printArea(id){ const w=window.open("","_blank"); const html=document.getElementById(id)?.innerHTML; if(!html) return; w.document.write(`<html><head><link rel="stylesheet" href="/src/index.css"><style>body{padding:24px;font-family:Inter,sans-serif}</style></head><body>${html}</body></html>`); w.document.close(); setTimeout(()=>w.print(),400); }

  if(loading) return <div style={{padding:48,textAlign:"center",color:"var(--text-muted)"}}>Loading…</div>;




  return (
    <div>
      <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1>Exam Management</h1>
          <p>Create exams, assign subjects, enter marks, and publish results.</p>
        </div>
        {isAdmin && tab==="exams" && <button className="btn btn-primary" onClick={openCreateExam}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:15}}><path d="M12 5v14M5 12h14"/></svg>New Exam</button>}
      </div>

      {error   && <div className="alert alert-error"   style={{marginBottom:14}}>{error}</div>}
      {success && <div className="alert alert-success" style={{marginBottom:14}}>{success}</div>}

      {/* ── Tabs ── */}
      <div className="tabs" style={{marginBottom:20}}>
        {[["exams","📋 Exams"],["marks","✏️ Mark Entry"],["results","📊 Report Card"],["sheet","📄 Class Sheet"]].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ══════════════ TAB 1: EXAMS LIST ══════════════ */}
      {tab==="exams" && (
        <div className="card animate-fade">
          <div className="card-header">
            <div className="card-title">All Exams <span className="badge badge-blue" style={{marginLeft:6}}>{exams.length}</span></div>
          </div>
          {exams.length===0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <h3>No exams yet</h3><p>Click "New Exam" to create the first exam.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Exam</th><th>Type</th><th>Academic Year</th><th>Term</th><th>Dates</th><th>Status</th>{isAdmin&&<th>Actions</th>}</tr></thead>
                <tbody>
                  {exams.map(exam=>(
                    <tr key={exam._id}>
                      <td style={{fontWeight:700}}>{exam.name}</td>
                      <td><span className="badge badge-purple">{exam.type}</span></td>
                      <td className="td-muted">{exam.academicYearId?.name||"—"}</td>
                      <td className="td-muted">{exam.term||"—"}</td>
                      <td className="td-muted" style={{whiteSpace:"nowrap"}}>{fmtDate(exam.startDate)} – {fmtDate(exam.endDate)}</td>
                      <td><StatusBadge status={exam.status}/></td>
                      {isAdmin && (
                        <td>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            <button className="btn btn-secondary btn-sm" onClick={()=>openEsModal(exam)}>Subjects</button>
                            <button className="btn btn-secondary btn-sm" onClick={()=>openEditExam(exam)}>Edit</button>
                            {exam.status!=="published"
                              ? <button className="btn btn-success btn-sm" onClick={()=>publishExam(exam,true)}>Publish</button>
                              : <button className="btn btn-warning btn-sm" onClick={()=>publishExam(exam,false)}>Unpublish</button>
                            }
                            <button className="btn btn-danger btn-sm" onClick={()=>deleteExam(exam)}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 2: MARKS ENTRY ══════════════ */}
      {tab==="marks" && (
        <>
          <div className="card animate-fade" style={{marginBottom:20}}>
            <div className="card-header"><div className="card-title">Filters</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-3" style={{gap:12}}>
                <div className="form-group"><label className="form-label">Academic Year</label>
                  <select className="form-select" value={mForm.academicYearId} onChange={e=>setMForm(f=>({...f,academicYearId:e.target.value,examId:""}))}>
                    <option value="">All years</option>
                    {years.map(y=><option key={y._id} value={y._id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Exam</label>
                  <select className="form-select" value={mForm.examId} onChange={e=>setMForm(f=>({...f,examId:e.target.value}))}>
                    <option value="">Select exam</option>
                    {mExams.map(e=><option key={e._id} value={e._id}>{e.name} ({e.type})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-select" value={mForm.classLevelId} onChange={e=>setMForm(f=>({...f,classLevelId:e.target.value,sectionId:"",subjectId:""}))}>
                    <option value="">Select class</option>
                    {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Section</label>
                  <select className="form-select" value={mForm.sectionId} onChange={e=>setMForm(f=>({...f,sectionId:e.target.value}))}>
                    <option value="">Select section</option>
                    {filteredSections.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Subject</label>
                  <select className="form-select" value={mForm.subjectId} onChange={e=>setMForm(f=>({...f,subjectId:e.target.value}))}>
                    <option value="">Select subject</option>
                    {mFilteredSubs.map(s=><option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Total / Passing Marks</label>
                  <div style={{display:"flex",gap:8}}>
                    <input className="form-input" type="number" min={1} value={maxMarksInput} onChange={e=>setMaxMarksInput(e.target.value)} placeholder="Total"/>
                    <input className="form-input" type="number" min={0} value={passMarksInput} onChange={e=>setPassMarksInput(e.target.value)} placeholder="Pass"/>
                  </div>
                </div>
              </div>
              <div style={{marginTop:14}}>
                <button className="btn btn-primary" onClick={loadStudents} disabled={mLoadingStudents}>{mLoadingStudents?"Loading…":"Load Students"}</button>
              </div>
            </div>
          </div>

          {enrollments.length>0 && (
            <div className="card animate-fade">
              <div className="card-header">
                <div className="card-title">Enter Marks — {enrollments.length} students</div>
                <button className="btn btn-primary" onClick={saveMarks} disabled={mSaving}>{mSaving?"Saving…":"Save All Marks"}</button>
              </div>
              <div className="card-body" style={{padding:0}}>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Student</th><th>EMIS No.</th><th>Marks / {maxMarksInput}</th><th>Grade</th><th>Status</th></tr></thead>
                    <tbody>
                      {enrollments.map((e,i)=>{
                        const sid=String(e.studentId?._id||e.studentId);
                        const m=marks[sid]??"";
                        const pct=maxMarksInput>0&&m!==""?(Number(m)/Number(maxMarksInput))*100:null;
                        const grade=pct===null?"":pctGrade(pct);
                        const pass=pct!==null&&Number(m)>=Number(passMarksInput);
                        return(
                          <tr key={e._id}>
                            <td className="td-muted">{i+1}</td>
                            <td style={{fontWeight:600}}>{e.studentId?.firstName} {e.studentId?.lastName}</td>
                            <td className="td-muted">{e.studentId?.emisNumber||"—"}</td>
                            <td style={{width:140}}>
                              <input className="form-input" type="number" min={0} max={maxMarksInput} value={m}
                                onChange={ev=>setMarks(mk=>({...mk,[sid]:ev.target.value}))} style={{width:90}}/>
                            </td>
                            <td><span style={{padding:"3px 10px",borderRadius:999,background:(GRADE_COLOR[grade]||"#ccc")+"20",color:gradeColor(grade),fontWeight:700,fontSize:".8rem"}}>{grade||"—"}</span></td>
                            <td>{pct!==null ? <span className={`badge ${pass?"badge-green":"badge-red"}`}>{pass?"Pass":"Fail"}</span> : <span className="badge badge-gray">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {enrollments.length===0&&!mLoadingStudents&&<div className="empty-state"><svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z" fill="currentColor"/></svg><h3>No students loaded</h3><p>Select class, section, and click "Load Students".</p></div>}
        </>
      )}

      {/* ══════════════ TAB 3: REPORT CARD ══════════════ */}
      {tab==="results" && (
        <div className="animate-fade">
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><div className="card-title">View Report Card</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-3" style={{gap:12,marginBottom:14}}>
                <div className="form-group"><label className="form-label">Academic Year</label>
                  <select className="form-select" value={rFilter.academicYearId} onChange={e=>setRFilter(f=>({...f,academicYearId:e.target.value,examId:""}))}>
                    <option value="">All</option>
                    {years.map(y=><option key={y._id} value={y._id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Exam</label>
                  <select className="form-select" value={rcExamId} onChange={e=>setRcExamId(e.target.value)}>
                    <option value="">Select exam</option>
                    {rExams.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-select" value={rFilter.classLevelId} onChange={e=>setRFilter(f=>({...f,classLevelId:e.target.value,sectionId:""}))}>
                    <option value="">Select class</option>
                    {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Section</label>
                  <select className="form-select" value={rFilter.sectionId} onChange={e=>setRFilter(f=>({...f,sectionId:e.target.value}))}>
                    <option value="">Select section</option>
                    {rcSections.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Student</label>
                  <select className="form-select" value={rcStudentId} onChange={e=>setRcStudentId(e.target.value)}>
                    <option value="">Select student</option>
                    {rStudents.map(s=><option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={loadReportCard} disabled={rcLoading}>{rcLoading?"Loading…":"View Report Card"}</button>
            </div>
          </div>

          {reportCard && (
            <div className="animate-fade">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Report Card</div>
                  <button className="btn btn-secondary btn-sm" onClick={()=>printArea("report-card-print")}>🖨️ Print</button>
                </div>
                <div className="card-body" id="report-card-print">
                  {/* header banner */}
                  <div style={{background:"linear-gradient(135deg,#312e81,#1e40af)",borderRadius:"var(--radius-lg)",padding:"20px 24px",marginBottom:20,color:"#fff"}}>
                    <div style={{fontSize:".72rem",opacity:.7,textTransform:"uppercase",letterSpacing:".08em"}}>Student Report Card</div>
                    <div style={{fontSize:"1.3rem",fontWeight:800,marginTop:4}}>{reportCard.student.firstName} {reportCard.student.lastName}</div>
                    <div style={{fontSize:".85rem",opacity:.8}}>{reportCard.exam?.name} · {reportCard.exam?.academicYear}</div>
                    <div style={{display:"flex",gap:24,marginTop:12,flexWrap:"wrap"}}>
                      <div><div style={{fontSize:"1.5rem",fontWeight:800}}>{reportCard.summary.percentage}%</div><div style={{fontSize:".72rem",opacity:.7}}>Percentage</div></div>
                      <div><div style={{fontSize:"1.5rem",fontWeight:800}}>{reportCard.summary.totalObtained}/{reportCard.summary.totalMax}</div><div style={{fontSize:".72rem",opacity:.7}}>Total Marks</div></div>
                      <div><div style={{fontSize:"1.5rem",fontWeight:800}}>{reportCard.summary.overallGrade}</div><div style={{fontSize:".72rem",opacity:.7}}>Grade</div></div>
                      <div><div style={{fontSize:"1.5rem",fontWeight:800,color:reportCard.summary.overallStatus==="Pass"?"#6ee7b7":"#fca5a5"}}>{reportCard.summary.overallStatus}</div><div style={{fontSize:".72rem",opacity:.7}}>Status</div></div>
                      {reportCard.summary.classRank&&<div><div style={{fontSize:"1.5rem",fontWeight:800}}>#{reportCard.summary.classRank}</div><div style={{fontSize:".72rem",opacity:.7}}>Class Rank</div></div>}
                    </div>
                  </div>
                  {/* info row */}
                  <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
                    <div style={{background:"var(--surface-2)",padding:"10px 16px",borderRadius:"var(--radius-sm)",fontSize:".8rem"}}><span style={{color:"var(--text-muted)"}}>Class: </span><strong>{reportCard.student.className}</strong></div>
                    <div style={{background:"var(--surface-2)",padding:"10px 16px",borderRadius:"var(--radius-sm)",fontSize:".8rem"}}><span style={{color:"var(--text-muted)"}}>Section: </span><strong>{reportCard.student.sectionName}</strong></div>
                    <div style={{background:"var(--surface-2)",padding:"10px 16px",borderRadius:"var(--radius-sm)",fontSize:".8rem"}}><span style={{color:"var(--text-muted)"}}>EMIS: </span><strong>{reportCard.student.emisNumber||"—"}</strong></div>
                    <div style={{background:"var(--surface-2)",padding:"10px 16px",borderRadius:"var(--radius-sm)",fontSize:".8rem"}}><span style={{color:"var(--text-muted)"}}>Term: </span><strong>{reportCard.exam?.term||"—"}</strong></div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Subject</th><th>Code</th><th>Marks</th><th>Total</th><th>Passing</th><th>%</th><th>Grade</th><th>Status</th><th>Rank</th><th>Remarks</th></tr></thead>
                      <tbody>
                        {reportCard.results.map(r=>{
                          const pct=r.maxMarks>0?((r.marksObtained/r.maxMarks)*100).toFixed(1):0;
                          return(
                            <tr key={r._id}>
                              <td style={{fontWeight:600}}>{r.subjectId?.name}</td>
                              <td><span className="badge badge-blue">{r.subjectId?.code}</span></td>
                              <td style={{fontWeight:700}}>{r.marksObtained}</td>
                              <td className="td-muted">{r.maxMarks}</td>
                              <td className="td-muted">{r.passingMarks}</td>
                              <td style={{fontWeight:600}}>{pct}%</td>
                              <td><span style={{padding:"3px 10px",borderRadius:999,background:gradeColor(r.grade)+"20",color:gradeColor(r.grade),fontWeight:700,fontSize:".8rem"}}>{r.grade}</span></td>
                              <td><span className={`badge ${r.passFail==="Pass"?"badge-green":"badge-red"}`}>{r.passFail}</span></td>
                              <td className="td-muted">{r.rank?`#${r.rank}`:"—"}</td>
                              <td className="td-muted">{r.remarks||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 4: CLASS RESULT SHEET ══════════════ */}
      {tab==="sheet" && (
        <div className="animate-fade">
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><div className="card-title">Class Result Sheet</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-3" style={{gap:12,marginBottom:14}}>
                <div className="form-group"><label className="form-label">Exam</label>
                  <select className="form-select" value={shFilter.examId} onChange={e=>setShFilter(f=>({...f,examId:e.target.value}))}>
                    <option value="">Select exam</option>
                    {exams.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-select" value={shFilter.classLevelId} onChange={e=>setShFilter(f=>({...f,classLevelId:e.target.value,sectionId:""}))}>
                    <option value="">Select class</option>
                    {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Section (optional)</label>
                  <select className="form-select" value={shFilter.sectionId} onChange={e=>setShFilter(f=>({...f,sectionId:e.target.value}))}>
                    <option value="">All sections</option>
                    {shSections.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-primary" onClick={loadClassSheet} disabled={shLoading}>{shLoading?"Loading…":"Load Sheet"}</button>
                {sheetData.length>0&&<button className="btn btn-secondary" onClick={()=>printArea("class-sheet-print")}>🖨️ Print Sheet</button>}
              </div>
            </div>
          </div>

          {sheetData.length>0 && (
            <div className="card animate-fade">
              <div className="card-header">
                <div className="card-title">Result Sheet <span className="badge badge-blue" style={{marginLeft:6}}>{sheetData.length} students</span></div>
              </div>
              <div id="class-sheet-print" className="card-body" style={{padding:0}}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th><th>Student</th><th>EMIS No.</th>
                        {sheetData[0]?.subjects.map(s=><th key={s.subjectId}>{s.subjectCode}</th>)}
                        <th>Total</th><th>Max</th><th>%</th><th>Grade</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetData.map(row=>(
                        <tr key={row.student?._id}>
                          <td style={{fontWeight:700,color:"var(--primary)"}}>#{row.classRank}</td>
                          <td style={{fontWeight:600}}>{row.student?.firstName} {row.student?.lastName}</td>
                          <td className="td-muted">{row.student?.emisNumber||"—"}</td>
                          {row.subjects.map(s=>(
                            <td key={s.subjectId} style={{textAlign:"center"}}>
                              <div style={{fontWeight:700}}>{s.marksObtained}</div>
                              <div style={{fontSize:".68rem",color:gradeColor(s.grade)}}>{s.grade}</div>
                            </td>
                          ))}
                          <td style={{fontWeight:700}}>{row.totalObtained}</td>
                          <td className="td-muted">{row.totalMax}</td>
                          <td style={{fontWeight:600}}>{row.percentage}%</td>
                          <td><span style={{padding:"3px 10px",borderRadius:999,background:gradeColor(row.overallGrade)+"20",color:gradeColor(row.overallGrade),fontWeight:700,fontSize:".8rem"}}>{row.overallGrade}</span></td>
                          <td><span className={`badge ${row.overallStatus==="Pass"?"badge-green":"badge-red"}`}>{row.overallStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {sheetData.length===0&&!shLoading&&<div className="empty-state"><svg viewBox="0 0 24 24" fill="none"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM9 17H7v-7h2v7Zm4 0h-2V7h2v10Zm4 0h-2v-4h2v4Z" fill="currentColor"/></svg><h3>No data</h3><p>Select an exam and class, then click "Load Sheet".</p></div>}
        </div>
      )}

      {/* ══════════════ EXAM MODAL ══════════════ */}
      <Modal visible={showExamModal} onClose={()=>setShowExamModal(false)} title={editExam?"Edit Exam":"Create New Exam"} size="modal-lg">
        <div className="modal-body">
          <div className="form-grid form-grid-2" style={{gap:14}}>
            <div className="form-group" style={{gridColumn:"1/-1"}}><label className="form-label">Exam Name *</label>
              <input className="form-input" value={examForm.name} onChange={e=>setExamForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Midterm Examination 2025"/>
            </div>
            <div className="form-group"><label className="form-label">Exam Type</label>
              <select className="form-select" value={examForm.type} onChange={e=>setExamForm(f=>({...f,type:e.target.value}))}>
                {EXAM_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Academic Year *</label>
              <select className="form-select" value={examForm.academicYearId} onChange={e=>setExamForm(f=>({...f,academicYearId:e.target.value}))}>
                <option value="">Select year</option>
                {years.map(y=><option key={y._id} value={y._id}>{y.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Term / Semester</label>
              <input className="form-input" value={examForm.term} onChange={e=>setExamForm(f=>({...f,term:e.target.value}))} placeholder="e.g. Term 1, Semester A"/>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={examForm.status} onChange={e=>setExamForm(f=>({...f,status:e.target.value}))}>
                {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={examForm.startDate} onChange={e=>setExamForm(f=>({...f,startDate:e.target.value}))}/>
            </div>
            <div className="form-group"><label className="form-label">End Date</label>
              <input className="form-input" type="date" value={examForm.endDate} onChange={e=>setExamForm(f=>({...f,endDate:e.target.value}))}/>
            </div>
            <div className="form-group" style={{gridColumn:"1/-1"}}><label className="form-label">Description (optional)</label>
              <textarea className="form-textarea" rows={3} value={examForm.description} onChange={e=>setExamForm(f=>({...f,description:e.target.value}))} placeholder="Any notes about this exam…"/>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowExamModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveExam} disabled={examSaving}>{examSaving?"Saving…":editExam?"Update Exam":"Create Exam"}</button>
        </div>
      </Modal>

      {/* ══════════════ EXAM SUBJECTS MODAL ══════════════ */}
      <Modal visible={showEsModal} onClose={()=>setShowEsModal(false)} title="Assign Subjects to Exam" size="modal-xl">
        <div className="modal-body">
          {/* add form */}
          <div style={{background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,marginBottom:20}}>
            <div style={{fontWeight:700,fontSize:".85rem",marginBottom:12}}>Add Subject Assignment</div>
            <div className="form-grid form-grid-3" style={{gap:12}}>
              <div className="form-group"><label className="form-label">Class *</label>
                <select className="form-select" value={esForm.classLevelId} onChange={e=>setEsForm(f=>({...f,classLevelId:e.target.value}))}>
                  <option value="">Select class</option>
                  {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Subject *</label>
                <select className="form-select" value={esForm.subjectId} onChange={e=>setEsForm(f=>({...f,subjectId:e.target.value}))}>
                  <option value="">Select subject</option>
                  {subjects.map(s=><option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Exam Date</label>
                <input className="form-input" type="date" value={esForm.examDate} onChange={e=>setEsForm(f=>({...f,examDate:e.target.value}))}/>
              </div>
              <div className="form-group"><label className="form-label">Total Marks</label>
                <input className="form-input" type="number" min={1} value={esForm.totalMarks} onChange={e=>setEsForm(f=>({...f,totalMarks:e.target.value}))}/>
              </div>
              <div className="form-group"><label className="form-label">Passing Marks</label>
                <input className="form-input" type="number" min={0} value={esForm.passingMarks} onChange={e=>setEsForm(f=>({...f,passingMarks:e.target.value}))}/>
              </div>
              <div className="form-group"><label className="form-label">Duration (mins)</label>
                <input className="form-input" type="number" min={1} value={esForm.durationMins} onChange={e=>setEsForm(f=>({...f,durationMins:e.target.value}))}/>
              </div>
            </div>
            <div style={{marginTop:12}}><button className="btn btn-primary btn-sm" onClick={saveEs} disabled={esSaving}>{esSaving?"Adding…":"Add Subject"}</button></div>
          </div>
          {/* assigned list */}
          {examSubjects.length>0 ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Class</th><th>Subject</th><th>Date</th><th>Total</th><th>Pass</th><th>Duration</th><th></th></tr></thead>
                <tbody>
                  {examSubjects.map(es=>(
                    <tr key={es._id}>
                      <td>{es.classLevelId?.name||"—"}</td>
                      <td style={{fontWeight:600}}>{es.subjectId?.name} <span className="badge badge-blue">{es.subjectId?.code}</span></td>
                      <td className="td-muted">{fmtDate(es.examDate)}</td>
                      <td>{es.totalMarks}</td>
                      <td>{es.passingMarks}</td>
                      <td className="td-muted">{es.durationMins?`${es.durationMins} min`:"—"}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={()=>deleteEs(es._id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="empty-state" style={{padding:32}}><p>No subjects assigned yet.</p></div>}
        </div>
        <div className="modal-footer"><button className="btn btn-primary" onClick={()=>setShowEsModal(false)}>Done</button></div>
      </Modal>
    </div>
  );
}
