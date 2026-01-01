import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, query, deleteDoc, addDoc, setDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  Plus, Trash2, Volume2, CheckCircle, XCircle, 
  ChevronLeft, Bell, BookMarked, LogOut, Image as ImageIcon, Users, BookOpen, BarChart3, GraduationCap
} from 'lucide-react';

// --- Firebase Configuration ---
// 배포 시 본인의 실제 키값으로 교체하세요.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyAJwhyfqYLNpjq83a6TZvyz5zNJ0eJINaM",
      authDomain: "ive-english-voca.firebaseapp.com",
      projectId: "ive-english-voca",
      storageBucket: "ive-english-voca.firebasestorage.app",
      messagingSenderId: "985007470792",
      appId: "1:985007470792:web:e1f6ef62bfc558881acdfd"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ive-english-voca-main'; 

// --- Logo Component ---
// public 폴더의 '아이브 스티커칼라.png'를 불러옵니다.
const Logo = ({ size = 90 }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center">
      {!imgError ? (
        <img 
          src="/아이브 스티커칼라.png" 
          alt="Logo" 
          className="rounded-3xl border-2 border-orange-500 shadow-md"
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="bg-orange-500 rounded-[2rem] border-4 border-orange-600 flex items-center justify-center text-white shadow-xl" style={{ width: size, height: size }}>
          <GraduationCap size={size * 0.6} strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [studentName, setStudentName] = useState("");
  const [currentView, setCurrentView] = useState('landing');
  const [loginError, setLoginError] = useState("");
  const [adminInputPassword, setAdminInputPassword] = useState("");
  
  const [students, setStudents] = useState([]);
  const [wordbooks, setWordbooks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allResults, setAllResults] = useState([]);

  // Auth (RULE 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Fail:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsubscribe();
  }, []);

  // Data Sync (RULE 1 & 2)
  useEffect(() => {
    if (!user) return;
    const getRef = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);

    const unsubWB = onSnapshot(getRef('wordbooks'), (s) => setWordbooks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubST = onSnapshot(getRef('students'), (s) => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubNT = onSnapshot(getRef('notifications'), (s) => setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRS = onSnapshot(getRef('test_results'), (s) => setAllResults(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubWB(); unsubST(); unsubNT(); unsubRS(); };
  }, [user]);

  const handleStudentLogin = () => {
    setLoginError("");
    const trimmed = studentName.trim();
    if (!trimmed) { setLoginError("이름을 입력하세요."); return; }
    const exists = students.some(s => String(s.name) === trimmed);
    if (!exists) { setLoginError("등록되지 않은 학생입니다."); return; }
    setRole('student'); setCurrentView('student_main');
  };

  const handleAdminAuth = () => {
    if (adminInputPassword === "0504") { 
      setRole('admin'); setCurrentView('admin_main'); setAdminInputPassword("");
    } else { alert("비밀번호가 올바르지 않습니다."); }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-md w-full text-center border-4 border-orange-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-30"></div>
          <div className="mb-8 flex justify-center relative z-10"><Logo size={120} /></div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter uppercase leading-none">I'VE English</h1>
          <p className="text-orange-600 font-bold mb-14 tracking-[0.2em] text-sm uppercase">Vocabulary Master</p>
          
          <div className="space-y-6 relative z-10">
            <div className="relative">
              <input 
                type="text" 
                placeholder="학생 이름을 입력하세요"
                className="w-full p-6 bg-slate-50 border-4 border-orange-200 rounded-[2.5rem] outline-none focus:border-orange-500 font-black text-center text-xl transition-all shadow-inner"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              {loginError && <p className="text-red-500 text-xs mt-3 font-bold">{loginError}</p>}
            </div>
            <button 
              onClick={handleStudentLogin}
              className="w-full py-6 bg-orange-500 text-white rounded-[2.5rem] font-black text-xl hover:bg-orange-600 transition shadow-xl shadow-orange-200 transform active:scale-95 flex items-center justify-center gap-3 border-b-4 border-orange-700"
            >
              로그인하기 <ChevronLeft className="rotate-180" size={24}/>
            </button>

            <div className="pt-10 border-t-2 border-orange-100 mt-6">
              <div className="flex gap-2">
                <input 
                  type="password" 
                  placeholder="관리자 비번"
                  className="flex-1 p-4 bg-slate-50 border-2 border-orange-100 rounded-2xl outline-none focus:border-orange-400 text-xs font-bold text-center"
                  value={adminInputPassword}
                  onChange={(e) => setAdminInputPassword(e.target.value)}
                />
                <button 
                  onClick={handleAdminAuth}
                  className="px-6 bg-slate-800 text-white rounded-2xl font-black text-[10px] hover:bg-slate-700 transition uppercase tracking-widest"
                >
                  ADMIN
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-12 text-slate-400 text-xs font-bold tracking-widest uppercase">© 2026 I'VE ENGLISH ACADEMY</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b-4 border-orange-500 px-8 py-5 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4 font-black text-2xl">
          <Logo size={45} />
          <span className="tracking-tighter hidden sm:inline uppercase">I'VE English</span>
          <span className="text-[10px] bg-orange-500 text-white px-3 py-1 rounded-full uppercase tracking-widest ml-0 sm:ml-4 font-black shadow-sm border border-orange-600">
            {role === 'admin' ? 'ADMIN PANEL' : `${studentName} STUDENT`}
          </span>
        </div>
        <button 
          onClick={() => {setCurrentView('landing'); setRole(null);}}
          className="text-slate-500 font-black hover:text-red-500 transition text-sm flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-full border-2 border-orange-200 active:scale-95 shadow-sm"
        >
          <LogOut size={16}/> <span className="hidden sm:inline">로그아웃</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        {role === 'admin' ? (
          <AdminPanel 
            students={students} 
            wordbooks={wordbooks} 
            results={allResults}
            onAddStudent={(n) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: String(n), createdAt: new Date().toLocaleString() })}
            onDeleteStudent={(id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id))}
            onAddWordbook={(t, w) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wordbooks'), { title: String(t), words: w, author: 'Admin', createdAt: new Date().toISOString() })}
            onDeleteWordbook={(id) => window.confirm("정말 삭제하시겠습니까?") && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wordbooks', id))}
            onSendNoti={(m) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { message: String(m), date: new Date().toLocaleString() })}
          />
        ) : (
          <StudentPanel 
            wordbooks={wordbooks} 
            notifications={notifications}
            studentName={studentName}
            results={allResults.filter(r => String(r.studentName) === studentName)}
            onSaveResult={(r) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'test_results'), { ...r, studentName, timestamp: new Date().toISOString() })}
            onAddWordbook={(t, w) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wordbooks'), { title: String(t), words: w, author: studentName, createdAt: new Date().toISOString() })}
            speak={speak}
          />
        )}
      </main>
    </div>
  );
};

const AdminPanel = ({ students, wordbooks, results, onAddStudent, onDeleteStudent, onAddWordbook, onDeleteWordbook, onSendNoti }) => {
  const [tab, setTab] = useState('students');
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState("");

  const menu = [
    { id: 'students', label: '학생 명단', icon: <Users size={18}/> },
    { id: 'wb_list', label: '단어장 관리', icon: <BookOpen size={18}/> },
    { id: 'wb_add', label: '단어 추가', icon: <Plus size={18}/> },
    { id: 'progress', label: '진도 현황', icon: <BarChart3 size={18}/> },
    { id: 'noti', label: '공지 사항', icon: <Bell size={18}/> }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex bg-white rounded-[2rem] p-2 shadow-xl border-2 border-orange-500 w-full overflow-x-auto gap-2 scrollbar-hide">
        {menu.map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`flex-1 min-w-[120px] px-6 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === t.id ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:bg-orange-50'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[4rem] shadow-sm border-4 border-orange-400 min-h-[600px]">
        {tab === 'students' && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter uppercase">Student Registry</h3>
            <div className="flex gap-4 mb-12">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="학생 성함을 입력하세요" className="flex-1 p-6 bg-slate-50 border-4 border-orange-100 rounded-3xl font-black outline-none focus:border-orange-500 text-xl shadow-inner"/>
              <button onClick={() => {if(name) {onAddStudent(name); setName("");}}} className="px-10 bg-orange-500 text-white rounded-3xl font-black hover:bg-orange-600 transition shadow-xl active:scale-95 border-b-4 border-orange-700">등록</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-4 border-orange-100 hover:border-orange-500 transition-all hover:bg-white hover:shadow-lg">
                  <div>
                    <span className="font-black text-2xl text-slate-800 tracking-tight">{String(s.name)}</span>
                    <span className="text-[10px] text-slate-400 block font-bold mt-1 tracking-widest uppercase">Member Since: {String(s.createdAt)}</span>
                  </div>
                  <button onClick={() => onDeleteStudent(s.id)} className="text-slate-400 hover:text-red-500 transition p-3 bg-white rounded-2xl border-2 border-orange-100 shadow-sm"><Trash2 size={24}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'wb_list' && (
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter uppercase">Wordbook Library</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {wordbooks.map(wb => (
                <div key={wb.id} className="p-10 bg-slate-50 border-4 border-orange-100 rounded-[3.5rem] hover:border-orange-500 transition-all group relative hover:bg-white hover:shadow-2xl">
                  <div className="flex justify-between items-start mb-8">
                    <h4 className="font-black text-2xl text-slate-800 leading-tight tracking-tight">{String(wb.title)}</h4>
                    <button onClick={() => onDeleteWordbook(wb.id)} className="text-slate-400 hover:text-red-500 transition bg-white p-2 rounded-xl border-2 border-orange-50 shadow-sm"><Trash2 size={18}/></button>
                  </div>
                  <p className="text-[12px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4">{wb.words?.length || 0} VOCABULARIES</p>
                  <p className="text-[12px] font-black text-orange-600 uppercase">By {String(wb.author)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'wb_add' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Publish New Book</h3>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="단어장 제목" className="w-full p-6 bg-slate-50 border-4 border-orange-100 rounded-3xl outline-none focus:border-orange-500 font-black text-xl shadow-inner"/>
            <textarea value={csv} onChange={e => setCsv(e.target.value)} placeholder={"apple, 사과\nbanana, 바나나"} rows={10} className="w-full p-6 bg-slate-50 border-4 border-orange-100 rounded-[2.5rem] outline-none focus:border-orange-500 font-mono text-sm leading-relaxed shadow-inner"/>
            <button onClick={() => {
              const words = csv.trim().split('\n').map(l => { const p = l.split(','); return p.length >= 2 ? { en: p[0].trim(), ko: p[1].trim() } : null; }).filter(v => v);
              if(!title || !words.length) return alert("내용을 입력해주세요.");
              onAddWordbook(title, words); setTitle(""); setCsv(""); alert("등록 완료!");
            }} className="w-full py-7 bg-orange-500 text-white rounded-[2.5rem] font-black text-2xl hover:bg-orange-600 transition shadow-2xl shadow-orange-100 transform active:scale-95 border-b-4 border-orange-700">발행하기</button>
          </div>
        )}

        {tab === 'progress' && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter uppercase">Live Scoreboard</h3>
            <div className="space-y-6">
              {[...results].reverse().map(r => (
                <div key={r.id} className="p-8 bg-slate-50 rounded-[3rem] border-4 border-orange-100 hover:border-orange-500 hover:bg-white hover:shadow-2xl transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-black text-orange-600 text-2xl tracking-tighter">{String(r.studentName)}</span>
                    <span className="text-[10px] font-black text-slate-400 bg-white px-5 py-3 rounded-full border-2 border-orange-100 uppercase tracking-widest">{new Date(r.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-t-2 border-orange-50 pt-6">
                    <div className="text-xl font-black text-slate-800 tracking-tight">{String(r.wordbookTitle)}</div>
                    <div className="text-4xl font-black text-orange-500 font-sans">{Number(r.score)} <span className="text-slate-300 text-lg">/ {Number(r.total)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'noti' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter text-center">Announcement</h3>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="학생들에게 보낼 공지" rows={6} className="w-full p-8 bg-slate-50 border-4 border-orange-100 rounded-[3rem] outline-none focus:border-orange-500 font-black text-xl shadow-inner"/>
            <button onClick={() => {if(msg) {onSendNoti(msg); setMsg(""); alert("발송 완료");}}} className="w-full py-6 bg-orange-500 text-white rounded-[2.5rem] font-black text-xl hover:bg-orange-600 transition shadow-xl active:scale-95 border-b-4 border-orange-700">공지 발송</button>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentPanel = ({ wordbooks, notifications, studentName, results, onSaveResult, onAddWordbook, speak }) => {
  const [view, setView] = useState('dashboard');
  const [selectedWB, setSelectedWB] = useState(null);
  const [mode, setMode] = useState('en-ko');
  const [curIdx, setCurIdx] = useState(0);
  const [ans, setAns] = useState("");
  const [session, setSession] = useState({ correct: 0, wrong: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [sTitle, setSTitle] = useState("");
  const [sCsv, setSCsv] = useState("");

  const startTest = (wb, m) => {
    if (!wb.words?.length) return alert("단어가 없습니다.");
    setSelectedWB(wb); setMode(m); setCurIdx(0); setAns(""); setSession({ correct: 0, wrong: [] }); setView('test');
  };

  const nextWord = () => {
    if (!selectedWB?.words[curIdx]) return;
    const word = selectedWB.words[curIdx];
    const isCorrect = mode === 'en-ko' ? ans.trim() === word.ko.trim() : ans.trim().toLowerCase() === word.en.trim().toLowerCase();
    const newCorrect = isCorrect ? session.correct + 1 : session.correct;
    const newWrong = isCorrect ? session.wrong : [...session.wrong, word];
    if (curIdx + 1 < selectedWB.words.length) {
      setCurIdx(curIdx + 1); setAns(""); setSession({ correct: newCorrect, wrong: newWrong });
    } else {
      onSaveResult({ wordbookTitle: String(selectedWB.title), score: newCorrect, total: selectedWB.words.length, wrongWords: newWrong });
      setSession({ correct: newCorrect, wrong: newWrong }); setView('result');
    }
  };

  if (view === 'dashboard') {
    return (
      <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
        {notifications.length > 0 && (
          <div className="bg-orange-500 border-8 border-orange-600 p-8 rounded-[3.5rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
            <div className="bg-white p-4 rounded-3xl text-orange-500 shadow-xl border-4 border-orange-200"><Bell size={32} strokeWidth={2.5}/></div>
            <div>
               <span className="text-[10px] font-black text-orange-100 uppercase tracking-widest block mb-1">New Message</span>
               <p className="text-white font-black text-2xl tracking-tight leading-tight">{String(notifications[notifications.length-1].message)}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Curriculum</h3>
              <button onClick={() => setShowAdd(true)} className="px-8 py-4 bg-white text-orange-600 border-4 border-orange-500 rounded-3xl font-black text-sm hover:bg-orange-50 transition transform active:scale-95 flex items-center gap-2 shadow-sm">
                <Plus size={20}/> 나만의 단어장
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              {wordbooks.map(wb => (
                <div key={wb.id} className="bg-white p-10 rounded-[4rem] shadow-sm border-4 border-orange-100 hover:border-orange-500 transition-all hover:shadow-2xl group flex flex-col justify-between min-h-[350px]">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="font-black text-3xl text-slate-800 group-hover:text-orange-600 transition-colors leading-tight tracking-tighter">{String(wb.title)}</h4>
                      <span className={`text-[10px] px-4 py-2 rounded-full border-2 font-black tracking-widest uppercase shadow-sm ${wb.author === 'Admin' ? 'bg-indigo-50 text-indigo-500 border-indigo-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                        {wb.author === 'Admin' ? 'OFFICIAL' : 'SELF'}
                      </span>
                    </div>
                    <p className="text-[12px] font-black text-slate-400 mb-10 tracking-[0.3em] uppercase">{wb.words?.length || 0} TOTAL WORDS</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => startTest(wb, 'en-ko')} className="flex-1 py-5 bg-slate-50 text-slate-800 rounded-3xl text-sm font-black shadow-sm hover:bg-slate-100 transition border-2 border-orange-100">의미 테스트</button>
                    <button onClick={() => startTest(wb, 'ko-en')} className="flex-1 py-5 bg-orange-500 text-white rounded-3xl text-sm font-black shadow-xl shadow-orange-100 hover:bg-orange-600 transition active:scale-95 border-b-4 border-orange-700">단어 테스트</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-10">
            <h3 className="text-3xl font-black text-slate-800 px-4 tracking-tighter uppercase">My Records</h3>
            <div className="bg-white rounded-[4rem] border-4 border-orange-400 p-10 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar shadow-sm text-center">
              {results.map((r, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-3xl border-2 border-orange-50 hover:border-orange-400 transition-all text-left">
                  <div className="text-lg font-black text-slate-800 mb-4 leading-tight tracking-tight">{String(r.wordbookTitle)}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{new Date(r.timestamp).toLocaleDateString()}</span>
                    <span className="text-2xl font-black text-orange-600 font-sans">{Number(r.score)} <span className="text-slate-300 text-xs">/ {Number(r.total)}</span></span>
                  </div>
                </div>
              ))}
              {!results.length && <p className="py-20 text-slate-300 font-black uppercase tracking-widest">No data</p>}
            </div>
            <button onClick={() => setView('wrong_notes')} className="w-full py-10 bg-red-50 text-red-500 rounded-[3.5rem] font-black text-2xl flex items-center justify-center gap-5 hover:bg-red-100 transition border-4 border-red-500 shadow-2xl shadow-red-50 transform active:scale-95">
              <BookMarked size={36}/> <span className="tracking-tighter uppercase">Review Zone</span>
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg flex items-center justify-center z-[100] p-4 text-center">
            <div className="bg-white rounded-[5rem] w-full max-w-xl p-14 shadow-3xl animate-in zoom-in-95 duration-200 relative overflow-hidden border-8 border-orange-500">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase text-left">Custom Voca</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-300 hover:text-red-500 transition"><XCircle size={48}/></button>
              </div>
              <div className="space-y-8">
                <input value={sTitle} onChange={e => setSTitle(e.target.value)} placeholder="단어장 제목" className="w-full p-6 bg-slate-50 border-4 border-orange-100 rounded-[2.5rem] outline-none focus:border-orange-400 font-black text-xl shadow-inner"/>
                <textarea value={sCsv} onChange={e => setSCsv(e.target.value)} placeholder="영어, 뜻" rows={6} className="w-full p-6 bg-slate-50 border-4 border-orange-100 rounded-[2.5rem] outline-none focus:border-orange-400 font-mono text-sm shadow-inner"/>
                <button onClick={() => {
                  const words = sCsv.trim().split('\n').map(l => { const p = l.split(','); return p.length >= 2 ? { en: p[0].trim(), ko: p[1].trim() } : null; }).filter(v => v);
                  if(!sTitle || !words.length) return alert("입력 오류");
                  onAddWordbook(sTitle, words); setSTitle(""); setSCsv(""); setShowAdd(false); alert("저장되었습니다!");
                }} className="w-full py-8 bg-orange-500 text-white rounded-[3rem] font-black text-2xl hover:bg-orange-600 transition shadow-2xl active:scale-95 border-b-4 border-orange-700">SAVE WORD BOOK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'test') {
    const word = selectedWB?.words[curIdx];
    if (!word) return <div className="text-center py-40 font-black text-3xl">LOADING...</div>;
    const progress = ((curIdx + 1) / selectedWB.words.length) * 100;
    return (
      <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500 font-sans">
        <div className="flex items-center justify-between mb-12 px-6">
          <button onClick={() => setView('dashboard')} className="text-slate-400 font-black flex items-center gap-3 hover:text-slate-800 transition text-xl tracking-tighter uppercase">Exit</button>
          <div className="px-10 py-3 bg-orange-500 rounded-full text-white font-black text-lg shadow-xl shadow-orange-200 border-4 border-orange-600">{curIdx + 1} <span className="text-orange-200 text-sm">/</span> {selectedWB.words.length}</div>
        </div>
        <div className="w-full bg-slate-200 h-6 rounded-full overflow-hidden mb-20 shadow-inner p-1 border-2 border-orange-100"><div className="bg-orange-500 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div></div>
        <div className="bg-white p-24 rounded-[6rem] shadow-2xl border-8 border-orange-500 text-center space-y-20 relative">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-orange-400 uppercase tracking-[0.5em]">VOCABULARY TEST</div>
          <div>
            <h2 className="text-8xl font-black text-slate-800 leading-tight tracking-tighter uppercase">{mode === 'en-ko' ? String(word.en) : String(word.ko)}</h2>
            {mode === 'en-ko' && (
              <button onClick={() => speak(String(word.en))} className="mt-12 p-10 bg-orange-50 rounded-full text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110 active:scale-90 shadow-3xl shadow-orange-100 border-4 border-orange-200"><Volume2 size={64}/></button>
            )}
          </div>
          <div className="space-y-6">
             <input autoFocus value={ans} onChange={e => setAns(e.target.value)} onKeyPress={e => e.key === 'Enter' && nextWord()} placeholder="정답을 입력하세요" className="w-full p-12 bg-slate-50 border-4 border-orange-200 rounded-[4rem] text-5xl text-center font-black focus:border-orange-500 outline-none transition-all shadow-inner"/>
             <button onClick={nextWord} disabled={!ans.trim()} className="w-full py-12 bg-orange-500 text-white rounded-[4rem] font-black text-3xl hover:bg-orange-600 transition shadow-2xl shadow-orange-200 transform active:translate-y-4 border-b-8 border-orange-700">SUBMIT ANSWER</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-in zoom-in-95 duration-500 text-center font-sans">
        <div className="bg-white p-20 rounded-[6rem] shadow-3xl border-8 border-orange-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-6 bg-orange-500 shadow-lg shadow-orange-200"></div>
          <div className="inline-block p-12 bg-orange-100 rounded-full text-orange-500 mb-12 animate-bounce shadow-3xl shadow-orange-50 border-4 border-orange-300"><CheckCircle size={120} strokeWidth={3}/></div>
          <h2 className="text-7xl font-black text-slate-800 mb-16 tracking-tighter uppercase">Well Done!</h2>
          <div className="grid grid-cols-2 gap-10 mb-20">
            <div className="p-12 bg-orange-50 rounded-[5rem] border-4 border-orange-200 shadow-inner text-center">
              <div className="text-8xl font-black text-orange-600 font-sans tracking-tighter leading-none">{Number(session.correct)}</div>
              <div className="text-[14px] font-black text-orange-400 uppercase mt-6 tracking-[0.3em]">Perfect</div>
            </div>
            <div className="p-12 bg-red-50 rounded-[5rem] border-4 border-red-200 shadow-inner text-center">
              <div className="text-8xl font-black text-red-500 font-sans tracking-tighter leading-none">{Number(session.wrong.length)}</div>
              <div className="text-[14px] font-black text-red-400 uppercase mt-6 tracking-[0.3em]">Missed</div>
            </div>
          </div>
          <button onClick={() => setView('dashboard')} className="w-full py-10 bg-slate-900 text-white rounded-[4rem] font-black text-3xl hover:bg-slate-800 transition shadow-3xl transform active:scale-95 uppercase">Return Home</button>
        </div>
      </div>
    );
  }

  if (view === 'wrong_notes') {
    const allWrongs = results.reduce((acc, curr) => {
      curr.wrongWords?.forEach(w => { if (!acc.find(item => item.en === w.en)) acc.push(w); });
      return acc;
    }, []);
    return (
      <div className="space-y-12 animate-in slide-in-from-left-4 duration-500 font-sans max-w-6xl mx-auto">
        <button onClick={() => setView('dashboard')} className="text-slate-400 font-black flex items-center gap-4 hover:text-slate-800 transition text-2xl tracking-tighter uppercase"><ChevronLeft size={48}/> Go Back</button>
        <div className="bg-white p-20 rounded-[6rem] shadow-sm border-8 border-orange-500 relative">
          <div className="absolute top-10 right-10 opacity-10"><BookMarked size={120}/></div>
          <h3 className="text-6xl font-black text-slate-800 mb-20 text-red-500 tracking-tighter uppercase">Intensive Note</h3>
          <div className="grid sm:grid-cols-2 gap-8">
            {allWrongs.map((word, i) => (
              <div key={i} className="p-10 bg-slate-50 border-4 border-orange-100 rounded-[4rem] flex justify-between items-center group hover:border-orange-500 transition-all hover:bg-white hover:shadow-2xl">
                <div>
                  <div className="font-black text-slate-800 text-4xl mb-2 tracking-tighter leading-none uppercase">{String(word.en)}</div>
                  <div className="font-bold text-slate-400 text-xl tracking-tight">{String(word.ko)}</div>
                </div>
                <button onClick={() => speak(String(word.en))} className="p-6 bg-white text-orange-500 rounded-[2rem] border-4 border-orange-100 hover:border-orange-500 transition-all transform active:scale-90 shadow-lg"><Volume2 size={40}/></button>
              </div>
            ))}
            {!allWrongs.length && <div className="col-span-full py-60 text-center text-slate-200 font-black text-4xl uppercase tracking-[0.5em]">No errors found</div>}
          </div>
        </div>
      </div>
    );
  }
};

export default App;