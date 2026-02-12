
import React, { useState, useEffect } from 'react';
import { AppConfig, Technician, PublicProject, FormStatus, DiaryEntry, WeatherCondition, MaterialItem } from './types';
import * as nextcloudService from './services/nextcloudService';
import * as geminiService from './services/geminiService';
import { generateDiaryPdf } from './services/pdfService';
import { Button } from './components/Button';
import { Logo, getLogoAsBase64 } from './components/Logo';

// Icons
const CameraIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhotoSparklesIcon = () => (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 00-1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const InfoIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const LogoutIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const STORAGE_KEY = 'glasfaser_app_config_v2';
const DRAFT_KEY = 'glasfaser_entry_draft_v1';

export default function App() {
  const [config, setConfig] = useState<AppConfig>({ technicians: [], projects: [] });
  const [currentUser, setCurrentUser] = useState<Technician | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ step: 'login' });
  const [uploadMessage, setUploadMessage] = useState("Daten werden hochgeladen...");
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<Blob | null>(null);

  // Management States
  const [newProjName, setNewProjName] = useState('');
  const [newProjLink, setNewProjLink] = useState('');
  const [newTechName, setNewTechName] = useState('');
  const [newTechCode, setNewTechCode] = useState('');
  const [newTechPass, setNewTechPass] = useState('');
  const [newTechRole, setNewTechRole] = useState<'admin' | 'user'>('user');

  // Editing State for Technicians
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [editTechName, setEditTechName] = useState('');
  const [editTechCode, setEditTechCode] = useState('');
  const [editTechPass, setEditTechPass] = useState('');
  const [editTechRole, setEditTechRole] = useState<'admin' | 'user'>('user');

  // Form States
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(-1); 
  const [materialInput, setMaterialInput] = useState({ name: '', amount: '' });
  const [entry, setEntry] = useState<DiaryEntry>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    weather: WeatherCondition.SUNNY,
    activityType: 'Tiefbau',
    description: '',
    missingWork: '',
    materials: [],
    technician: '',
    images: []
  });
  
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);

  // Die Domain dieser Web-App
  const currentAppDomain = window.location.origin;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let loadedConfig: AppConfig = { technicians: [], projects: [] };
    if (stored) {
      try { loadedConfig = JSON.parse(stored); } catch (e) {}
    }
    
    // Standard-Benutzer sicherstellen
    const hasRH = loadedConfig.technicians.some(t => t.code.toUpperCase() === 'RH');
    const hasAdmin = loadedConfig.technicians.some(t => t.code.toUpperCase() === 'ADMIN');
    
    let updated = false;
    if (!hasRH) {
        loadedConfig.technicians.push({ 
            id: 'rh-init', 
            name: 'Projektleiter RH', 
            code: 'RH', 
            password: '1234', 
            role: 'admin' 
        });
        updated = true;
    }
    if (!hasAdmin) {
        loadedConfig.technicians.push({ 
            id: 'admin-init', 
            name: 'Administrator', 
            code: 'Admin', 
            password: 'admin', 
            role: 'admin' 
        });
        updated = true;
    }

    if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
    }
    setConfig(loadedConfig);
  }, []);

  useEffect(() => {
    if (status.step === 'form' && currentUser) {
        const { images, technician, ...draftData } = entry;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draftData, projectIndex: selectedProjectIndex }));
    }
  }, [entry, selectedProjectIndex, status.step, currentUser]);

  useEffect(() => {
    if (status.step === 'form' && currentUser) {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                const { projectIndex, ...restEntry } = parsed;
                if (restEntry.date) {
                    setEntry(prev => ({ ...prev, ...restEntry, technician: currentUser.name, images: [] }));
                    if (projectIndex >= 0) setSelectedProjectIndex(projectIndex);
                    setDraftRestored(true);
                    setTimeout(() => setDraftRestored(false), 3000);
                }
            } catch (e) {}
        }
    }
  }, [status.step, currentUser]);

  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const tech = config.technicians.find(t => t.code.toLowerCase() === loginCode.toLowerCase());
    if (tech) {
        if (tech.password && tech.password !== loginPassword) { alert("Falsches Passwort."); return; }
        setCurrentUser(tech);
        setEntry(prev => ({ ...prev, technician: tech.name }));
        setStatus({ step: 'form' });
    } else alert("Benutzer nicht gefunden.");
  };

  const handleLogout = () => { setCurrentUser(null); setStatus({ step: 'login' }); setShowSettings(false); };

  const startEditingTech = (tech: Technician) => {
    setEditingTechId(tech.id);
    setEditTechName(tech.name);
    setEditTechCode(tech.code);
    setEditTechPass(tech.password || '');
    setEditTechRole(tech.role);
  };

  const saveEditedTech = () => {
    if (!editTechName || !editTechCode) return alert("Name und Kürzel sind Pflichtfelder.");
    
    const updatedTechs = config.technicians.map(t => 
        t.id === editingTechId 
            ? { ...t, name: editTechName, code: editTechCode.toUpperCase(), password: editTechPass, role: editTechRole } 
            : t
    );
    
    saveConfig({ ...config, technicians: updatedTechs });
    setEditingTechId(null);
  };

  const addMaterial = () => {
    if (!materialInput.name || !materialInput.amount) return;
    setEntry(prev => ({
        ...prev,
        materials: [...prev.materials, { ...materialInput }]
    }));
    setMaterialInput({ name: '', amount: '' });
  };

  const removeMaterial = (index: number) => {
    setEntry(prev => ({
        ...prev,
        materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text: string) => {
      const fallback = () => {
          const el = document.createElement('textarea');
          el.value = text;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          alert("Code kopiert!");
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
              alert("Code kopiert!");
          }).catch((err) => {
              console.error("Clipboard write failed", err);
              fallback();
          });
      } else {
          fallback();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectIndex === -1) { alert("Bitte ein Projekt auswählen."); return; }
    const project = config.projects[selectedProjectIndex];
    try {
      setStatus({ step: 'uploading' });
      setUploadMessage("Generiere PDF-Bericht...");
      const logoBase64 = await getLogoAsBase64();
      const pdfBlob = await generateDiaryPdf(entry, project.name, logoBase64);
      setLastGeneratedPdf(pdfBlob); 
      
      setUploadMessage(`Lade hoch zu: ${project.name}...`);
      await nextcloudService.uploadDiaryEntry(project, entry, pdfBlob);
      localStorage.removeItem(DRAFT_KEY);
      setStatus({ step: 'success' });
    } catch (error: any) {
      console.error("Upload Error:", error);
      setStatus({ step: 'form', message: `Upload fehlgeschlagen: ${error.message}` });
    }
  };

  const resetForm = () => { 
    localStorage.removeItem(DRAFT_KEY); 
    setEntry({...entry, images: [], description: '', missingWork: '', materials: [], location: ''}); 
    setStatus({ step: 'form' }); 
    setLastGeneratedPdf(null); 
  };

  if (status.step === 'uploading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-brand-900">Bitte warten</h2>
        <p className="text-gray-500 mt-2">{uploadMessage}</p>
      </div>
    );
  }

  if (status.step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-brand-600">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 text-green-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-900 mb-2">Erfolgreich!</h2>
          <p className="text-gray-600 mb-8">Bericht wurde an die Nextcloud übertragen.</p>
          <div className="space-y-3">
             <Button onClick={resetForm} className="w-full">Neuer Eintrag</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
      {draftRestored && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50 animate-bounce">Entwurf wiederhergestellt</div>}

      <div className="sticky top-0 z-20 bg-white shadow-md border-b border-brand-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center flex-1">
             <Logo className="h-10 md:h-14 w-auto" />
             <span className="ml-4 font-bold text-brand-900 hidden lg:block text-xl border-l-2 border-brand-200 pl-4">Bautagebuch</span>
        </div>
        <div className="flex gap-2">
            {currentUser?.role === 'admin' && <button onClick={() => setShowSettings(true)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors"><SettingsIcon /></button>}
            {currentUser && <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 rounded-full transition-colors"><LogoutIcon /></button>}
        </div>
      </div>

      {!currentUser ? (
          <div className="max-w-md mx-auto mt-16 p-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-brand-600">
                  <Logo className="h-20 mx-auto mb-8" />
                  <h2 className="text-xl font-bold text-brand-900 mb-6">Techniker Anmeldung</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="Kürzel (z.B. RH)" className="w-full text-center text-xl p-3 border rounded-lg uppercase outline-none focus:ring-2 focus:ring-brand-200 transition-all" />
                      <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Passwort" className="w-full text-center text-xl p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-200 transition-all" />
                      <Button type="submit" className="w-full py-3 text-lg font-bold">Anmelden</Button>
                  </form>
                  <p className="mt-4 text-xs text-gray-400 italic">Login für Projektleitung verfügbar.</p>
              </div>
          </div>
      ) : (
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold text-brand-900">Tagesbericht</h2>
                    <p className="text-gray-500 text-sm">Techniker: {currentUser.name}</p>
                </div>

                <div className="grid gap-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-800 mb-1">Projekt</label>
                        <select value={selectedProjectIndex} onChange={(e) => setSelectedProjectIndex(Number(e.target.value))} required className="block w-full rounded-lg border-gray-300 p-3 border bg-gray-50 focus:ring-2 focus:ring-brand-200">
                            <option value={-1} disabled>Wählen...</option>
                            {config.projects.map((p, idx) => <option key={idx} value={idx}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                            <input type="date" required value={entry.date} onChange={e => setEntry({...entry, date: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
                            <input type="text" required placeholder="Ort, Straße" value={entry.location} onChange={e => setEntry({...entry, location: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wetter</label>
                            <select value={entry.weather} onChange={e => setEntry({...entry, weather: e.target.value as any})} className="block w-full rounded-lg border-gray-300 p-3 border">
                                {Object.values(WeatherCondition).map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tätigkeit</label>
                            <select value={entry.activityType} onChange={e => setEntry({...entry, activityType: e.target.value as any})} className="block w-full rounded-lg border-gray-300 p-3 border">
                                <option value="Tiefbau">Tiefbau</option>
                                <option value="Einblasen">Einblasen</option>
                                <option value="Spleißen">Spleißen</option>
                                <option value="Hausanschluss">Hausanschluss</option>
                                <option value="Sonstiges">Sonstiges</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-brand-800">Erledigte Arbeiten</label>
                        <button type="button" onClick={async () => {
                            if (entry.images.length === 0) return alert("Zuerst Fotos machen für die KI-Analyse.");
                            setIsAnalyzingImages(true);
                            try {
                                const text = await geminiService.analyzeImagesForReport(entry.images, entry.activityType);
                                setEntry(prev => ({ ...prev, description: prev.description ? prev.description + "\n" + text : text }));
                            } finally { setIsAnalyzingImages(false); }
                        }} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-full flex items-center shadow-sm hover:bg-brand-700 transition-colors">
                            {isAnalyzingImages ? "KI analysiert..." : <><PhotoSparklesIcon /> KI-Bericht</>}
                        </button>
                    </div>
                    <textarea rows={6} required placeholder="Arbeitsbeschreibung..." value={entry.description} onChange={e => setEntry({...entry, description: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-brand-200" />
                </div>

                {/* Materialliste Bereich */}
                <div className="border border-gray-200 p-4 rounded-xl bg-gray-50/50">
                    <label className="block text-sm font-bold text-brand-800 mb-3">Materialliste</label>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="Material (z.B. DN50)" value={materialInput.name} onChange={e => setMaterialInput({ ...materialInput, name: e.target.value })} className="flex-1 p-2 border rounded text-sm" />
                        <input type="text" placeholder="Menge" value={materialInput.amount} onChange={e => setMaterialInput({ ...materialInput, amount: e.target.value })} className="w-24 p-2 border rounded text-sm" />
                        <button type="button" onClick={addMaterial} className="p-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"><PlusIcon /></button>
                    </div>
                    <div className="space-y-2">
                        {entry.materials.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm shadow-sm border-gray-200">
                                <span><span className="font-bold text-brand-700">{m.amount}</span> - {m.name}</span>
                                <button type="button" onClick={() => removeMaterial(idx)} className="text-red-500 hover:text-red-700 transition-colors"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Fotos ({entry.images.length})</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {entry.images.map((f, i) => (
                            <div key={i} className="relative aspect-square border rounded overflow-hidden group border-gray-200 shadow-sm">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setEntry({...entry, images: entry.images.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                            </div>
                        ))}
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-brand-400 transition-all">
                            <CameraIcon />
                            <span className="text-[10px] text-gray-400 mt-1">Foto</span>
                            <input type="file" accept="image/*" capture="environment" multiple onChange={e => e.target.files && setEntry({...entry, images: [...entry.images, ...Array.from(e.target.files)]})} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <Button type="submit" className="w-full py-4 text-xl font-bold shadow-xl">Bericht Absenden</Button>
                </div>
            </form>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-2xl font-bold text-brand-900">System-Verwaltung</h3>
                    <button onClick={() => { setShowSettings(false); setEditingTechId(null); }} className="p-2 text-gray-500 hover:text-gray-800 transition-colors"><CloseIcon /></button>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Projekte Verwaltung */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <h4 className="text-sm font-bold uppercase tracking-wider text-brand-600">Projekte</h4>
                             <button onClick={() => setShowHelp(!showHelp)} className="text-brand-500 hover:text-brand-700 flex items-center gap-1 text-xs font-bold bg-brand-50 px-2 py-1 rounded-full transition-colors">
                                <InfoIcon /> Nextcloud Hilfe
                             </button>
                        </div>

                        {showHelp && (
                            <div className="mb-4 bg-blue-50 p-4 rounded-xl text-xs leading-relaxed text-blue-900 border border-blue-200 shadow-inner">
                                <p className="font-bold mb-2">Nextcloud Konfiguration (.htaccess)</p>
                                <p className="mb-2">Damit diese App (Absender) Daten in deiner Nextcloud (Empfänger) speichern darf, musst du die App-Domain freischalten.</p>
                                <p className="mb-2">Deine App-Domain lautet: <b className="text-brand-700 bg-white px-1 rounded select-all">{currentAppDomain}</b></p>
                                <p className="mb-2 italic">Pfad der Datei: <code className="bg-white/50 px-1">/deine_nextcloud/.htaccess</code></p>
                                <pre className="bg-white p-3 rounded-lg border text-[10px] mb-3 overflow-x-auto select-all shadow-sm">
{`<IfModule mod_headers.c>
  SetEnvIf Origin "${currentAppDomain}" APP_ORIGIN=$0
  Header set Access-Control-Allow-Origin %{APP_ORIGIN}e env=APP_ORIGIN
  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, MKCOL"
  Header set Access-Control-Allow-Headers "Authorization, Content-Type, Origin"
</IfModule>`}
                                </pre>
                                <Button onClick={() => copyToClipboard(`<IfModule mod_headers.c>\n  SetEnvIf Origin "${currentAppDomain}" APP_ORIGIN=$0\n  Header set Access-Control-Allow-Origin %{APP_ORIGIN}e env=APP_ORIGIN\n  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, MKCOL"\n  Header set Access-Control-Allow-Headers "Authorization, Content-Type, Origin"\n</IfModule>`)} variant="primary" className="w-full py-1 text-[10px]">Code für .htaccess kopieren</Button>
                            </div>
                        )}

                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1 border rounded-lg p-3 bg-gray-50 border-gray-200">
                            {config.projects.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Keine Projekte angelegt.</p>}
                            {config.projects.map(p => (
                                <div key={p.token} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 text-sm shadow-sm">
                                    <span className="font-medium truncate mr-2">{p.name}</span>
                                    <button onClick={() => saveConfig({...config, projects: config.projects.filter(pr => pr.token !== p.token)})} className="text-red-400 hover:text-red-600 transition-colors"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <input placeholder="Projektname (z.B. Ort)" value={newProjName} onChange={e => setNewProjName(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                            <input placeholder="Nextcloud Share-Link" value={newProjLink} onChange={e => setNewProjLink(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                            <Button onClick={() => {
                                const token = newProjLink.split('/s/')[1]?.split('/')[0];
                                if (!token || !newProjName) return alert("Pflichtfelder fehlen oder Link ungültig.");
                                saveConfig({...config, projects: [...config.projects, { name: newProjName, link: newProjLink, token }]});
                                setNewProjName(''); setNewProjLink('');
                            }} className="w-full">Projekt hinzufügen</Button>
                        </div>
                    </div>

                    {/* Techniker Verwaltung */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-brand-600">Techniker & Benutzer</h4>
                        <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-1 border rounded-lg p-3 bg-gray-50 border-gray-200">
                            {config.technicians.map(t => (
                                <div key={t.id} className={`flex flex-col p-3 bg-white rounded-lg border text-sm shadow-sm transition-all ${editingTechId === t.id ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/30' : 'border-gray-100'}`}>
                                    {editingTechId === t.id ? (
                                        <div className="space-y-2">
                                            <input value={editTechName} onChange={e => setEditTechName(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Name" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={editTechCode} onChange={e => setEditTechCode(e.target.value)} className="w-full p-1 border rounded text-xs uppercase" placeholder="Kürzel" />
                                                <input value={editTechPass} onChange={e => setEditTechPass(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Passwort" />
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <select value={editTechRole} onChange={e => setEditTechRole(e.target.value as any)} className="text-[10px] p-1 border rounded bg-white">
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingTechId(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon /></button>
                                                    <button onClick={saveEditedTech} className="p-1 text-green-500 hover:text-green-700 transition-colors"><CheckIcon /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div className="truncate mr-2">
                                                <span className="font-bold text-brand-700 mr-2">[{t.code}]</span> {t.name}
                                                {t.role === 'admin' && <span className="ml-2 text-[9px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                                                <p className="text-[10px] text-gray-400 mt-1">Passwort: {t.password || 'Keines'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => startEditingTech(t)} className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors"><EditIcon /></button>
                                                {t.id !== currentUser?.id && (
                                                    <button onClick={() => saveConfig({...config, technicians: config.technicians.filter(tech => tech.id !== t.id)})} className="p-1.5 text-red-300 hover:text-red-500 transition-colors"><TrashIcon /></button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {!editingTechId && (
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h5 className="text-xs font-bold text-gray-500 uppercase">Neuen Techniker anlegen</h5>
                                <input placeholder="Vollständiger Name" value={newTechName} onChange={e => setNewTechName(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Login-Kürzel" value={newTechCode} onChange={e => setNewTechCode(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                                    <input type="password" placeholder="Passwort" value={newTechPass} onChange={e => setNewTechPass(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-200 outline-none" />
                                </div>
                                <select value={newTechRole} onChange={e => setNewTechRole(e.target.value as any)} className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-brand-200 outline-none">
                                    <option value="user">Benutzer (Standard)</option>
                                    <option value="admin">Administrator (Voller Zugriff)</option>
                                </select>
                                <Button onClick={() => {
                                    if (!newTechName || !newTechCode) return alert("Name und Kürzel sind Pflichtfelder.");
                                    const id = Date.now().toString();
                                    saveConfig({...config, technicians: [...config.technicians, { id, name: newTechName, code: newTechCode.toUpperCase(), password: newTechPass, role: newTechRole }]});
                                    setNewTechName(''); setNewTechCode(''); setNewTechPass('');
                                }} variant="secondary" className="w-full">Hinzufügen</Button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="pt-8 mt-10 border-t flex justify-between items-center">
                    <p className="text-xs text-gray-400">IT-KOM Bautagebuch v1.1.5</p>
                    <Button variant="outline" onClick={() => { setShowSettings(false); setEditingTechId(null); }}>Schließen</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
