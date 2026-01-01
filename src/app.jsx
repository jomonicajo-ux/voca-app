import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, query, updateDoc, deleteDoc, addDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  Users, BookOpen, Plus, Trash2, Volume2, CheckCircle, XCircle, 
  ChevronLeft, Upload, Bell, History, BookMarked, LogOut, Edit3, Image as ImageIcon
} from 'lucide-react';

// --- Firebase Configuration ---
// Canvas 환경에서는 자동으로 연결되지만, 
// Vercel 등 실제 배포 시에는 Firebase 콘솔에서 받은 본인의 키값을 아래에 붙여넣어야 합니다.
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

// [MANDATORY RULE 1] appId 안전 처리 (경로 오류 방지)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'ive-english-voca';
const appId = rawAppId.replace(/\//g, '_'); 

// --- Logo Component (아이브 스티커 로고 사용) ---
const Logo = ({ size = 90 }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center">
      {!imgError ? (
        <img 
          src="아이브 스티커칼라.png" 
          alt="I'VE English Logo" 
          className="rounded-2xl shadow-sm"
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="bg-orange-100 rounded-3xl flex items-center justify-center text-orange-500" style={{ width: size, height: size }}>
          <ImageIcon size={size * 0.5} />
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

  // --- Auth Setup (RULE 3: Auth FIRST) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsubscribe();
  }, []);

  // --- Data Sync (RULE 1 & 2) ---
  useEffect(() => {
    if (!user) return;

    const baseCol = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);

    const unsubWordbooks = onSnapshot(baseCol('wordbooks'), 
      (snap) => setWordbooks(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Wordbook Sync Error:", err));

    const unsubStudents = onSnapshot(baseCol('students'), 
      (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Student Sync Error:", err));

    const unsubNotis = onSnapshot(baseCol('notifications'), 
      (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Noti Sync Error:", err));

    const unsubResults = onSnapshot(baseCol('test_results'), 
      (snap) => setAllResults(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Result Sync Error:", err));

    return () => { unsubWordbooks(); unsubStudents(); unsubNotis(); unsubResults(); };
  }, [user]);

  const handleStudentLogin = () => {
    setLoginError("");
    const trimmed = studentName.trim();
    if (!trimmed) { setLoginError("이름을 입력해주세요."); return; }
    const exists = students.some(s => String(s.name) === trimmed);
    if (!exists) { setLoginError("등록되지 않은 학생입니다. 관리자에게 문의하세요."); return; }
    setRole('student');
    setCurrentView('student_main');
  };

  const handleAdminAuth = () => {
    if (adminInputPassword === "1234") { 
      setRole('admin');
      setCurrentView('admin_main');
      setAdminInputPassword("");
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
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
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border-4 border-orange-100">
          <div className="mb-8 flex justify-center"><Logo size={110} /></div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter uppercase">I'VE English</h1>
          <p className="text-orange-500 font-bold mb-12">아이브영어 단어장</p>
          <div className="space-y-6">
            <div>
              <input 
                type="text" 
                placeholder="학생 이름을 입력하세요"
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-400 font-bold text-center text-xl transition-all"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              {loginError && <p className="text-red-500 text-xs mt-2 font-bold">{String(loginError)}</p>}
            </div>
            <button 
              onClick={handleStudentLogin}
              className="w-full py-5 bg-orange-500 text-white rounded-[2rem] font-black text-xl hover:bg-orange-600 transition shadow-xl transform active:scale-95"
            >
              학생 로그인
            </button>
            <div className="pt-8 border-t border-slate-100 flex gap-2">
              <input 
                type="password" 
                placeholder="관리자 비번" 
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold text-sm"
                value={adminInputPassword}
                onChange={(e) => setAdminInputPassword(e.target.value)}
              />
              <button onClick={handleAdminAuth} className="px-6 bg-slate-800 text-white rounded-xl font-bold text-xs">확인</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b-2 border-orange-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3 font-black text-2xl text-slate-800">
          <Logo size={40} />
          <span className="tracking-tighter uppercase">I'VE English</span>
          <span className="text-[10px] bg-orange-500 text-white px-3 py-1 rounded-full uppercase tracking-widest ml-2 font-bold">
            {role === 'admin' ? 'ADMIN' : String(studentName)}
          </span>
        </div>
        <button onClick={() => {setCurrentView('landing'); setRole(null); setAdminInputPassword("");}} className="text-slate-400 font-black hover:text-red-500 transition text-sm flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full">
          <LogOut size={16}/> 로그아웃
        </button>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {role === 'admin' ? (
          <AdminPanel 
            students={students} wordbooks={wordbooks} results={allResults}
            onAddStudent={(n) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name: String(n), createdAt: new Date().toLocaleString() })}
            onDeleteStudent={(id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id))}
            onAddWordbook={(t, w) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wordbooks'), { title: String(t), words: w, author: 'Admin', createdAt: new Date().toISOString() })}
            onDeleteWordbook={(id) => window.confirm("정말 삭제하시겠습니까?") && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wordbooks', id))}
            onSendNoti={(m) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { message: String(m), date: new Date().toLocaleString() })}
          />
        ) : (
          <StudentPanel 
            wordbooks={wordbooks} notifications={notifications} studentName={studentName}
            results={allResults.filter(r => String(r.studentName) === studentName)}
            onSaveResult={(r) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'test_results'), { ...r, studentName: String(studentName), timestamp: new Date().toISOString() })}
            onAddWordbook={(t, w) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wordbooks'), { title: String(t), words: w, author: String(studentName), createdAt: new Date().toISOString() })}
            speak={speak}
          />
        )}
      </main>
    </div>
  );
};

// --- Admin Panel ---
const AdminPanel = ({ students, wordbooks, results, onAddStudent, onDeleteStudent, onAddWordbook, onDeleteWordbook, onSendNoti }) => {
  const [tab, setTab] = useState('students');
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState("");

  const handleUpload = () => {
    if (!title || !csv) return;
    const words = csv.trim().split('\n').map(l => {
      const p = l.split(',');
      return p.length >= 2 ? { en: p[0].trim(), ko: p[1].trim() } : null;
    }).filter(v => v);
    if (!words.length) return alert("데이터 형식이 올바르지 않습니다.");
    onAddWordbook(title, words);
    setTitle(""); setCsv(""); alert("등록되었습니다!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 w-fit overflow-x-auto">
        {['students', 'wb_list', 'wb_add', 'progress', 'noti'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 rounded-xl text-sm font-black transition ${tab === t ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            {t === 'students' ? '학생 관리' : t === 'wb_list' ? '단어장 목록' : t === 'wb_add' ? '추가' : t === 'progress' ? '진도' : '공지'}
          </button>
        ))}
      </div>
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
        {tab === 'students' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-black text-slate-800">학생 명단</h3>
            <div className="flex gap-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="학생 이름" className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-400"/>
              <button onClick={() => {onAddStudent(name); setName("");}} className="px-8 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition shadow-lg">추가</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-orange-200 transition-all">
                  <div><p className="font-black text-lg text-slate-800">{String(s.name)}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Added: {String(s.createdAt)}</p></div>
                  <button onClick={() => onDeleteStudent(s.id)} className="text-slate-300 hover:text-red-500 transition p-2"><Trash2 size={22}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'wb_list' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wordbooks.map(wb => (
              <div key={wb.id} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] hover:border-orange-300 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-lg text-slate-800">{String(wb.title)}</h4>
                  <button onClick={() => onDeleteWordbook(wb.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{wb.words?.length || 0} WORDS</p>
                <p className="text-[10px] font-black text-orange-500 italic mt-2">By {String(wb.author)}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'wb_add' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-black text-slate-800 italic uppercase">New Wordbook</h3>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-400 font-black text-lg"/>
            <textarea value={csv} onChange={e => setCsv(e.target.value)} placeholder={"영어, 뜻 순서 (줄바꿈 구분)\napple, 사과\nbanana, 바나나"} rows={10} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-400 font-mono text-sm leading-relaxed"/>
            <button onClick={handleUpload} className="w-full py-5 bg-orange-500 text-white rounded-[2rem] font-black text-xl hover:bg-orange-600 transition shadow-xl">발행하기</button>
          </div>
        )}
        {tab === 'progress' && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {[...results].reverse().map(r => (
              <div key={r.id} className="p-5 bg-slate-50 rounded-3xl border-2 border-slate-50 hover:bg-white hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-orange-600 text-lg">{String(r.studentName)}</span>
                  <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">{new Date(r.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-sm font-black text-slate-800">{String(r.wordbookTitle)}</div>
                  <div className="text-xl font-black text-orange-500">{Number(r.score)} / {Number(r.total)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'noti' && (
          <div className="max-w-xl mx-auto space-y-6">
            <h3 className="text-2xl font-black text-slate-800">공지 발송</h3>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="학생들에게 보낼 메시지" rows={5} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-orange-400 font-bold"/>
            <button onClick={() => {if(!msg) return; onSendNoti(msg); setMsg(""); alert("발송 완료!");}} className="w-full py-4 bg-orange-500 text-white rounded-[2rem] font-black hover:bg-orange-600 transition shadow-lg">메시지 전송</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Student Panel ---
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
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        {notifications.length > 0 && (
          <div className="bg-orange-50 border-4 border-orange-200 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
            <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg"><Bell size={24}/></div>
            <p className="text-slate-800 font-black text-lg">{String(notifications[notifications.length-1].message)}</p>
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">학습 단어장</h3>
              <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-white text-orange-500 border-2 border-orange-500 rounded-2xl font-black text-sm hover:bg-orange-50 transition transform active:scale-95 flex items-center gap-1 shadow-sm">
                <Plus size={16}/> 내 단어장 만들기
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {wordbooks.map(wb => (
                <div key={wb.id} className="bg-white p-8 rounded-[3rem] shadow-sm border-2 border-slate-100 hover:border-orange-400 transition-all hover:shadow-xl group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-xl text-slate-800 group-hover:text-orange-500 transition-colors">{String(wb.title)}</h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-black ${wb.author === 'Admin' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {wb.author === 'Admin' ? 'ACADEMY' : 'MY'}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 mb-10 tracking-[0.2em] uppercase">{wb.words?.length || 0} WORDS</p>
                  <div className="flex gap-2">
                    <button onClick={() => startTest(wb, 'en-ko')} className="flex-1 py-4 bg-orange-50 text-orange-600 rounded-2xl text-[11px] font-black shadow-sm">뜻 시험</button>
                    <button onClick={() => startTest(wb, 'ko-en')} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-orange-100 hover:bg-orange-600 transition-colors">단어 시험</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-800 px-2">성적 현황</h3>
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar shadow-sm">
              {results.map((r, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-orange-200 transition-all">
                  <div className="text-sm font-black text-slate-800 mb-2 leading-tight">{String(r.wordbookTitle)}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400">{new Date(r.timestamp).toLocaleDateString()}</span>
                    <span className="text-xs font-black text-orange-600">{Number(r.score)} / {Number(r.total)}</span>
                  </div>
                </div>
              ))}
              {!results.length && <p className="text-center py-20 text-slate-300 font-bold italic">기록 없음</p>}
            </div>
            <button onClick={() => setView('wrong_notes')} className="w-full py-6 bg-red-50 text-red-500 rounded-[2.5rem] font-black flex items-center justify-center gap-3 hover:bg-red-100 transition border-2 border-red-100 shadow-lg shadow-red-50 transform active:scale-95">
              <BookMarked size={22}/> 집중 오답 노트
            </button>
          </div>
        </div>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-center">
            <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-3xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800">나만의 단어장 만들기</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-300 hover:text-red-500 transition"><XCircle size={32}/></button>
              </div>
              <div className="space-y-5">
                <input value={sTitle} onChange={e => setSTitle(e.target.value)} placeholder="단어장 제목" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-400 font-bold"/>
                <textarea value={sCsv} onChange={e => setSCsv(e.target.value)} placeholder="영어, 뜻 (줄바꿈 구분)" rows={8} className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-orange-400 font-mono text-sm"/>
                <button onClick={() => {
                  const words = sCsv.trim().split('\n').map(l => {
                    const p = l.split(',');
                    return p.length >= 2 ? { en: p[0].trim(), ko: p[1].trim() } : null;
                  }).filter(v => v);
                  if(!words.length) return alert("형식 오류");
                  onAddWordbook(sTitle, words);
                  setSTitle(""); setSCsv(""); setShowAdd(false); alert("단어장이 추가되었습니다!");
                }} className="w-full py-4 bg-orange-500 text-white rounded-[2rem] font-black text-xl hover:bg-orange-600 transition shadow-xl">저장하기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'test') {
    const word = selectedWB?.words[curIdx];
    if (!word) return <div className="text-center py-20 font-black">데이터 로드 실패</div>;
    const progress = ((curIdx + 1) / selectedWB.words.length) * 100;
    return (
      <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-500 font-sans">
        <div className="flex items-center justify-between mb-8 px-2">
          <button onClick={() => setView('dashboard')} className="text-slate-400 font-black flex items-center gap-2 hover:text-slate-800 transition"><ChevronLeft size={24}/> 그만하기</button>
          <div className="px-5 py-2 bg-orange-500 rounded-full text-white font-black text-xs shadow-md">{curIdx + 1} / {selectedWB.words.length}</div>
        </div>
        <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden mb-12 shadow-inner"><div className="bg-orange-500 h-full transition-all duration-700" style={{ width: `${progress}%` }}></div></div>
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl border-4 border-orange-50 text-center space-y-12">
          <div>
            <span className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-6">{mode === 'en-ko' ? '뜻을 입력하세요' : '영어 단어를 입력하세요'}</span>
            <h2 className="text-6xl font-black text-slate-800 leading-tight tracking-tight font-sans">{mode === 'en-ko' ? String(word.en) : String(word.ko)}</h2>
            {mode === 'en-ko' && (
              <button onClick={() => speak(String(word.en))} className="mt-8 p-5 bg-orange-50 rounded-full text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110 active:scale-90 shadow-xl shadow-orange-50"><Volume2 size={36}/></button>
            )}
          </div>
          <input autoFocus value={ans} onChange={e => setAns(e.target.value)} onKeyPress={e => e.key === 'Enter' && nextWord()} placeholder="답변 입력" className="w-full p-8 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] text-4xl text-center font-black focus:border-orange-400 outline-none transition-all shadow-inner font-sans"/>
          <button onClick={nextWord} disabled={!ans.trim()} className="w-full py-8 bg-orange-500 text-white rounded-[2.5rem] font-black text-2xl hover:bg-orange-600 transition shadow-2xl transform active:translate-y-2">확인</button>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="max-w-xl mx-auto py-10 animate-in zoom-in-95 duration-500 text-center font-sans">
        <div className="bg-white p-14 rounded-[4.5rem] shadow-2xl border-4 border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-orange-500"></div>
          <div className="inline-block p-8 bg-orange-100 rounded-full text-orange-500 mb-8 animate-bounce"><CheckCircle size={80} strokeWidth={3}/></div>
          <h2 className="text-5xl font-black text-slate-800 mb-10 tracking-tighter uppercase italic">Good Job!</h2>
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="p-8 bg-orange-50 rounded-[3rem] border-2 border-orange-100 shadow-inner text-center">
              <div className="text-6xl font-black text-orange-600">{Number(session.correct)}</div>
              <div className="text-[10px] font-black text-orange-400 uppercase mt-3 tracking-widest">Correct</div>
            </div>
            <div className="p-8 bg-red-50 rounded-[3rem] border-2 border-red-100 shadow-inner text-center">
              <div className="text-6xl font-black text-red-500">{Number(session.wrong.length)}</div>
              <div className="text-[10px] font-black text-red-400 uppercase mt-3 tracking-widest">Wrong</div>
            </div>
          </div>
          <button onClick={() => setView('dashboard')} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl hover:bg-slate-800 transition shadow-xl transform active:scale-95">대시보드 가기</button>
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
      <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 font-sans">
        <button onClick={() => setView('dashboard')} className="text-slate-400 font-black flex items-center gap-2 hover:text-slate-800 transition"><ChevronLeft size={24}/> 돌아가기</button>
        <div className="bg-white p-12 rounded-[4rem] shadow-sm border-2 border-slate-100">
          <h3 className="text-4xl font-black text-slate-800 mb-10 text-red-500 tracking-tight font-sans">집중 오답 노트</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
            {allWrongs.map((word, i) => (
              <div key={i} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex justify-between items-center group hover:border-orange-400 transition-all hover:bg-white hover:shadow-lg">
                <div><div className="font-black text-slate-800 text-xl mb-1 font-sans">{String(word.en)}</div><div className="font-bold text-slate-400 text-sm font-sans">{String(word.ko)}</div></div>
                <button onClick={() => speak(String(word.en))} className="p-4 bg-white text-slate-300 rounded-2xl hover:text-orange-500 transition-all transform active:scale-90 shadow-sm"><Volume2 size={24}/></button>
              </div>
            ))}
            {!allWrongs.length && <div className="col-span-full py-32 text-center text-slate-300 font-black text-xl font-sans">틀린 단어가 없습니다! ✨</div>}
          </div>
        </div>
      </div>
    );
  }
};

export default App;