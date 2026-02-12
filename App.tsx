
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

const SparklesIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

const LogoutIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const DownloadIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const STORAGE_KEY = 'glasfaser_app_config_v2';
const DRAFT_KEY = 'glasfaser_entry_draft_v1';
const APP_VERSION = 'v1.2.3';

export default function App() {
  const [config, setConfig] = useState<AppConfig>({ technicians: [], projects: [] });
  const [currentUser, setCurrentUser] = useState<Technician | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ step: 'login' });
  const [uploadMessage, setUploadMessage] = useState("Daten werden hochgeladen...");
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<Blob | null>(null);

  const [newTechName, setNewTechName] = useState('');
  const [newTechCode, setNewTechCode] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('');
  const [newTechIsAdmin, setNewTechIsAdmin] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjLink, setNewProjLink] = useState('');
  const [matName, setMatName] = useState('');
  const [matAmount, setMatAmount] = useState('');

  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(-1); 
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
  
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [isGeneratingMissing, setIsGeneratingMissing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let loadedConfig: AppConfig = { technicians: [], projects: [] };
    if (stored) {
      try { loadedConfig = JSON.parse(stored); } catch (e) {}
    }
    let updated = false;
    const requiredAdmins = [{ name: 'Administrator', code: 'Admin', pass: 'admin123' }, { name: 'RH', code: 'rh', pass: 'rh123' }];
    requiredAdmins.forEach(admin => {
        if (!loadedConfig.technicians.find(t => t.code.toLowerCase() === admin.code.toLowerCase())) {
            loadedConfig.technicians.push({ id: Date.now().toString() + Math.random(), name: admin.name, code: admin.code, password: admin.pass, role: 'admin' });
            updated = true;
        }
    });
    if (updated) localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
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

  const handleManualDownload = () => {
      if (!lastGeneratedPdf) return;
      const url = URL.createObjectURL(lastGeneratedPdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bautagebuch_${entry.date}_${entry.technician.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      setLastGeneratedPdf(pdfBlob); // Save for fallback
      
      setUploadMessage(`Lade hoch zu: ${project.name}...`);
      await nextcloudService.uploadDiaryEntry(project, entry, pdfBlob);
      localStorage.removeItem(DRAFT_KEY);
      setStatus({ step: 'success' });
    } catch (error: any) {
      console.error("Upload Error:", error);
      const isFetchError = error.message.includes("Failed to fetch") || error.message.includes("NetworkError");
      const msg = isFetchError 
        ? "Verbindung zur Cloud fehlgeschlagen (CORS oder Netzwerk). Sie können das PDF jetzt manuell speichern." 
        : `Upload fehlgeschlagen: ${error.message}`;
      
      setStatus({ step: 'form', message: msg });
    }
  };

  const resetForm = () => { localStorage.removeItem(DRAFT_KEY); setEntry({...entry, images: [], description: '', missingWork: '', materials: [], location: ''}); setStatus({ step: 'form' }); setLastGeneratedPdf(null); };

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
          <h2 className="text-2xl font-bold text-brand-900 mb-2">Erfolgreich gespeichert!</h2>
          <p className="text-gray-600 mb-8">Bericht und Fotos wurden übertragen.</p>
          <div className="space-y-3">
             <Button onClick={() => setStatus({step: 'form'})} variant="secondary" className="w-full">Weiterer Eintrag</Button>
             <Button onClick={resetForm} className="w-full">Neuer Tag</Button>
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
            {currentUser?.role === 'admin' && <button onClick={() => setShowSettings(true)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full"><SettingsIcon /></button>}
            {currentUser && <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 rounded-full"><LogoutIcon /></button>}
        </div>
      </div>

      {!currentUser ? (
          <div className="max-w-md mx-auto mt-16 p-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-brand-600">
                  <Logo className="h-20 mx-auto mb-8" />
                  <h2 className="text-xl font-bold text-brand-900 mb-6">Techniker Anmeldung</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="Kürzel" className="w-full text-center text-xl p-3 border rounded-lg uppercase outline-none focus:ring-2 focus:ring-brand-200" />
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Passwort" className="w-full text-center text-xl p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-200" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                      </div>
                      <Button type="submit" className="w-full py-3 text-lg font-bold">Anmelden</Button>
                  </form>
              </div>
          </div>
      ) : (
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
            {status.message && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded shadow-md flex flex-col gap-3">
                <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{status.message}</span>
                </div>
                {lastGeneratedPdf && (
                    <Button onClick={handleManualDownload} variant="primary" className="w-full bg-red-600 hover:bg-red-700">
                        <DownloadIcon /> PDF manuell herunterladen & sichern
                    </Button>
                )}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="border-b pb-4 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-900">Neuer Tagesbericht</h2>
                        <p className="text-gray-500 text-sm">Techniker: {currentUser.name}</p>
                    </div>
                    <Logo className="h-10 opacity-30" />
                </div>

                <div className="grid gap-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-800 mb-1">Projekt auswählen</label>
                        <select value={selectedProjectIndex} onChange={(e) => setSelectedProjectIndex(Number(e.target.value))} required className="block w-full rounded-lg border-gray-300 p-3 border bg-gray-50">
                            <option value={-1} disabled>Bitte wählen...</option>
                            {config.projects.map((p, idx) => <option key={idx} value={idx}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                            <input type="date" required value={entry.date} onChange={e => setEntry({...entry, date: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse / Standort</label>
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
                        <div className="flex gap-2">
                            <button type="button" onClick={async () => {
                                if (entry.images.length === 0) return alert("Fotos fehlen.");
                                setIsAnalyzingImages(true);
                                try {
                                    const text = await geminiService.analyzeImagesForReport(entry.images, entry.activityType);
                                    setEntry(prev => ({ ...prev, description: prev.description ? prev.description + "\n" + text : text }));
                                } finally { setIsAnalyzingImages(false); }
                            }} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-full flex items-center shadow-sm">
                                {isAnalyzingImages ? "Analysiere..." : <><PhotoSparklesIcon /> KI-Bericht</>}
                            </button>
                            <button type="button" onClick={async () => {
                                if (!entry.description) return;
                                setIsEnhancingText(true);
                                try {
                                    const text = await geminiService.enhanceDiaryEntry(entry.description, entry.activityType);
                                    setEntry(prev => ({ ...prev, description: text }));
                                } finally { setIsEnhancingText(false); }
                            }} className="text-xs bg-white text-brand-600 border border-brand-200 px-3 py-1.5 rounded-full shadow-sm">
                                {isEnhancingText ? "Optimiere..." : <><SparklesIcon /> Text fixen</>}
                            </button>
                        </div>
                    </div>
                    <textarea rows={6} required placeholder="Beschreiben Sie kurz die Arbeiten..." value={entry.description} onChange={e => setEntry({...entry, description: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Fotos ({entry.images.length})</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {entry.images.map((f, i) => (
                            <div key={i} className="relative aspect-square border rounded overflow-hidden group">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setEntry({...entry, images: entry.images.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"><TrashIcon /></button>
                            </div>
                        ))}
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                            <CameraIcon />
                            <input type="file" accept="image/*" capture="environment" multiple onChange={e => e.target.files && setEntry({...entry, images: [...entry.images, ...Array.from(e.target.files)]})} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <Button type="submit" className="w-full py-4 text-xl font-bold shadow-xl">Bericht speichern & senden</Button>
                </div>
            </form>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-brand-900">Verwaltung</h3>
                    <button onClick={() => setShowSettings(false)}><CloseIcon /></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-bold uppercase text-brand-600 mb-2">Projekte</h4>
                        <div className="space-y-2 mb-3">
                            {config.projects.map(p => (
                                <div key={p.token} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                    <span className="text-sm font-medium">{p.name}</span>
                                    <button onClick={() => saveConfig({...config, projects: config.projects.filter(pr => pr.token !== p.token)})} className="text-red-400"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <input placeholder="Projektname" value={newProjName} onChange={e => setNewProjName(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            <input placeholder="Nextcloud Share Link" value={newProjLink} onChange={e => setNewProjLink(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            <Button onClick={() => {
                                const token = newProjLink.split('/s/')[1]?.split('/')[0];
                                if (!token) return alert("Link ungültig");
                                saveConfig({...config, projects: [...config.projects, { name: newProjName, link: newProjLink, token }]});
                                setNewProjName(''); setNewProjLink('');
                            }} className="w-full py-2">Projekt hinzufügen</Button>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <Button variant="outline" className="w-full" onClick={() => setShowSettings(false)}>Schließen</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
