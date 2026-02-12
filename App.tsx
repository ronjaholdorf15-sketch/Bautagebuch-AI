
import React, { useState, useEffect, useRef } from 'react';
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

const DownloadIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
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

const BackupIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

const InfoIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<Blob | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

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
  const [isGeneratingPdfOnly, setIsGeneratingPdfOnly] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let loadedConfig: AppConfig = { technicians: [], projects: [] };
    if (stored) {
      try { loadedConfig = JSON.parse(stored); } catch (e) { console.error("Config parse failed", e); }
    }
    
    // Ensure at least one admin exists if config is truly empty
    if (loadedConfig.technicians.length === 0) {
        loadedConfig.technicians.push({ 
            id: 'admin-init', 
            name: 'Administrator', 
            code: 'ADMIN', 
            password: 'admin', 
            role: 'admin' 
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
    }
    setConfig(loadedConfig);
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (status.step === 'form' && currentUser) {
        const { images, technician, ...draftData } = entry;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draftData, projectIndex: selectedProjectIndex }));
    }
  }, [entry, selectedProjectIndex, status.step, currentUser]);

  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `it_kom_bautagebuch_config_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target?.result as string);
            if (imported.technicians && Array.from(imported.technicians).length > 0) {
                if (confirm("Möchten Sie die aktuelle Konfiguration wirklich mit diesem Backup überschreiben?")) {
                    saveConfig(imported);
                    alert("Konfiguration erfolgreich importiert.");
                    window.location.reload(); 
                }
            } else {
                alert("Ungültige Backup-Datei.");
            }
        } catch (err) {
            alert("Fehler beim Lesen der Backup-Datei.");
        }
    };
    reader.readAsText(file);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const tech = config.technicians.find(t => t.code.toUpperCase() === loginCode.toUpperCase());
    if (tech) {
        if (tech.password && tech.password !== loginPassword) { alert("Falsches Passwort."); return; }
        setCurrentUser(tech);
        setEntry(prev => ({ ...prev, technician: tech.name }));
        setStatus({ step: 'form' });
    } else alert("Benutzer nicht gefunden.");
  };

  const handleLogout = () => { setCurrentUser(null); setStatus({ step: 'login' }); setShowSettings(false); setLoginCode(''); setLoginPassword(''); };

  const downloadBlob = (blob: Blob, filename: string) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  };

  const handleManualPdfDownload = async () => {
      setIsGeneratingPdfOnly(true);
      try {
          const project = config.projects[selectedProjectIndex] || { name: 'Entwurf' };
          const logoBase64 = await getLogoAsBase64(config.logo);
          const pdfBlob = await generateDiaryPdf(entry, project.name, logoBase64);
          const filename = `Bautagebuch_${entry.date}_${entry.location.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          downloadBlob(pdfBlob, filename);
      } catch (err) {
          alert("PDF-Generierung fehlgeschlagen.");
      } finally {
          setIsGeneratingPdfOnly(false);
      }
  };

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => saveConfig({ ...config, logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectIndex === -1) { alert("Bitte ein Projekt auswählen."); return; }
    const project = config.projects[selectedProjectIndex];
    setUploadError(null);
    try {
      setStatus({ step: 'uploading' });
      setUploadMessage("Generiere PDF...");
      const logoBase64 = await getLogoAsBase64(config.logo);
      const pdfBlob = await generateDiaryPdf(entry, project.name, logoBase64);
      setLastGeneratedPdf(pdfBlob); 
      
      setUploadMessage(`Sende zu Nextcloud (${project.name})...`);
      await nextcloudService.uploadDiaryEntry(project, entry, pdfBlob);
      localStorage.removeItem(DRAFT_KEY);
      setStatus({ step: 'success' });
    } catch (error: any) {
      console.error("Upload Error:", error);
      setUploadError(error.message || "Netzwerkfehler");
    }
  };

  const resetForm = () => { 
    localStorage.removeItem(DRAFT_KEY); 
    setEntry({...entry, images: [], description: '', missingWork: '', materials: [], location: ''}); 
    setStatus({ step: 'form' }); 
    setLastGeneratedPdf(null); 
    setUploadError(null);
  };

  if (status.step === 'uploading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {uploadError ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 text-red-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Upload fehlgeschlagen</h2>
                <p className="text-sm text-gray-500 mb-6">Der Bericht konnte nicht hochgeladen werden (z.B. keine Berechtigung oder kein Internet).</p>
                <div className="space-y-3">
                    <Button onClick={() => lastGeneratedPdf && downloadBlob(lastGeneratedPdf, `Bautagebuch_Backup_${entry.date}.pdf`)} className="w-full py-3 flex items-center justify-center bg-brand-600">
                        <DownloadIcon /> PDF manuell sichern
                    </Button>
                    <button onClick={() => setStatus({ step: 'form' })} className="text-sm text-brand-600 font-bold">Zurück zum Formular</button>
                </div>
            </div>
        ) : (
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">{uploadMessage}</p>
            </div>
        )}
      </div>
    );
  }

  if (status.step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-green-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 text-green-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-900 mb-2">Erfolgreich!</h2>
          <p className="text-gray-600 mb-8">Der Bericht wurde übertragen.</p>
          <div className="space-y-3">
             <Button onClick={() => lastGeneratedPdf && downloadBlob(lastGeneratedPdf, `Bautagebuch_${entry.date}.pdf`)} variant="outline" className="w-full">
                 <DownloadIcon /> Als PDF lokal kopieren
             </Button>
             <Button onClick={resetForm} className="w-full">Neuer Eintrag</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center flex-1 overflow-hidden">
             <Logo className="h-10 md:h-12 w-auto shrink-0" src={config.logo} />
             <span className="ml-4 font-bold text-brand-900 hidden sm:block text-lg border-l pl-4 truncate">Bautagebuch</span>
        </div>
        <div className="flex gap-2 shrink-0">
            {currentUser?.role === 'admin' && (
                <button onClick={() => setShowSettings(true)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full">
                    <SettingsIcon />
                </button>
            )}
            {currentUser && <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 rounded-full"><LogoutIcon /></button>}
        </div>
      </div>

      {!currentUser ? (
          <div className="max-w-md mx-auto mt-16 p-6">
              <Logo className="h-24 mx-auto mb-10" src={config.logo} />
              <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-brand-600">
                  <h2 className="text-xl font-bold text-center text-brand-900 mb-6 uppercase">Login</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="Techniker Kürzel" className="w-full text-center text-xl p-3 border rounded-lg uppercase outline-none focus:ring-2 focus:ring-brand-100" />
                      <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Passwort" className="w-full text-center text-xl p-3 border rounded-lg outline-none focus:ring-2 focus:ring-brand-100" />
                      <Button type="submit" className="w-full py-4 text-lg font-bold">Anmelden</Button>
                  </form>
              </div>
          </div>
      ) : (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border">
                <div className="border-b pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-900">Tagesbericht</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-500 text-sm">{currentUser.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${currentUser.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                                {currentUser.role}
                            </span>
                        </div>
                    </div>
                    <button type="button" onClick={handleManualPdfDownload} disabled={isGeneratingPdfOnly} className="text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 text-xs font-bold flex items-center">
                        {isGeneratingPdfOnly ? "Lädt..." : <><DownloadIcon /> Vorschau / PDF</>}
                    </button>
                </div>

                <div className="grid gap-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-800 mb-1">Projekt auswählen</label>
                        <select value={selectedProjectIndex} onChange={(e) => setSelectedProjectIndex(Number(e.target.value))} required className="block w-full rounded-lg border-gray-300 p-3 border bg-gray-50 focus:ring-2 focus:ring-brand-100">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Standort / Straße</label>
                            <input type="text" required placeholder="Ort, Straße..." value={entry.location} onChange={e => setEntry({...entry, location: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border" />
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
                        <label className="block text-sm font-bold text-brand-800">Tätigkeitsbericht</label>
                        <button type="button" onClick={async () => {
                            if (entry.images.length === 0) return alert("Zuerst Fotos machen.");
                            setIsAnalyzingImages(true);
                            try {
                                const text = await geminiService.analyzeImagesForReport(entry.images, entry.activityType);
                                setEntry(prev => ({ ...prev, description: prev.description ? prev.description + "\n" + text : text }));
                            } finally { setIsAnalyzingImages(false); }
                        }} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-full flex items-center shadow-sm hover:bg-brand-700">
                            {isAnalyzingImages ? "KI analysiert..." : <><PhotoSparklesIcon /> KI-Unterstützung</>}
                        </button>
                    </div>
                    <textarea rows={6} required placeholder="Was wurde heute erledigt?" value={entry.description} onChange={e => setEntry({...entry, description: e.target.value})} className="block w-full rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-brand-100" />
                </div>

                <div className="border p-4 rounded-xl bg-gray-50/50">
                    <label className="block text-sm font-bold text-brand-800 mb-3">Materialliste</label>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="Material" value={materialInput.name} onChange={e => setMaterialInput({ ...materialInput, name: e.target.value })} className="flex-1 p-2 border rounded-lg text-sm" />
                        <input type="text" placeholder="Menge" value={materialInput.amount} onChange={e => setMaterialInput({ ...materialInput, amount: e.target.value })} className="w-24 p-2 border rounded-lg text-sm" />
                        <button type="button" onClick={() => {
                            if (!materialInput.name || !materialInput.amount) return;
                            setEntry(prev => ({ ...prev, materials: [...prev.materials, { ...materialInput }] }));
                            setMaterialInput({ name: '', amount: '' });
                        }} className="p-2 bg-brand-600 text-white rounded-lg"><PlusIcon /></button>
                    </div>
                    <div className="space-y-2">
                        {entry.materials.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border text-sm shadow-sm">
                                <span><span className="font-bold text-brand-700">{m.amount}</span> - {m.name}</span>
                                <button type="button" onClick={() => setEntry(prev => ({ ...prev, materials: prev.materials.filter((_, i) => i !== idx) }))} className="text-red-500"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Fotodokumentation ({entry.images.length})</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {entry.images.map((f, i) => (
                            <div key={i} className="relative aspect-square border rounded-lg overflow-hidden group shadow-sm">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setEntry({...entry, images: entry.images.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100"><TrashIcon /></button>
                            </div>
                        ))}
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                            <CameraIcon />
                            <span className="text-[10px] text-gray-400 mt-1">Foto</span>
                            <input type="file" accept="image/*" capture="environment" multiple onChange={e => e.target.files && setEntry({...entry, images: [...entry.images, ...Array.from(e.target.files)]})} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <Button type="submit" className="w-full py-4 text-xl font-bold shadow-lg">Bericht Absenden</Button>
                </div>
            </form>
        </div>
      )}

      {showSettings && currentUser?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-2xl font-bold text-brand-900">Administration</h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowHelp(!showHelp)} 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showHelp ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-brand-50 text-brand-700 border border-brand-100'}`}
                        >
                            <InfoIcon /> {showHelp ? 'Hilfe schließen' : 'Nextcloud Setup Hilfe'}
                        </button>
                        <button onClick={() => { setShowSettings(false); setEditingTechId(null); setShowHelp(false); }} className="p-2 text-gray-500 hover:text-gray-800"><CloseIcon /></button>
                    </div>
                </div>
                
                {showHelp && (
                    <div className="mb-8 p-6 bg-orange-50 rounded-2xl border border-orange-100 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <InfoIcon />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-orange-900 mb-2">Nextcloud CORS Konfiguration</h4>
                                <p className="text-sm text-orange-800 mb-4 leading-relaxed">
                                    Damit die App Berichte in deine Nextcloud hochladen kann, musst du Cross-Origin Resource Sharing (CORS) erlauben. 
                                    Füge den folgenden Code am Ende der <strong>.htaccess</strong> Datei im Hauptverzeichnis deiner Nextcloud-Installation hinzu:
                                </p>
                                <div className="relative group">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto border-4 border-gray-800 shadow-inner">
{`# CORS FÜR BAUTAGEBUCH APP
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, MKCOL, PROPFIND"
    Header always set Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With, Range"
    Header always set Access-Control-Expose-Headers "Content-Location, Location"

    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>`}
                                    </pre>
                                    <button 
                                        onClick={() => {
                                            const code = `# CORS FÜR BAUTAGEBUCH APP\n<IfModule mod_headers.c>\n    Header always set Access-Control-Allow-Origin "*"\n    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, MKCOL, PROPFIND"\n    Header always set Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With, Range"\n    Header always set Access-Control-Expose-Headers "Content-Location, Location"\n\n    RewriteEngine On\n    RewriteCond %{REQUEST_METHOD} OPTIONS\n    RewriteRule ^(.*)$ $1 [R=200,L]\n</IfModule>`;
                                            navigator.clipboard.writeText(code);
                                            alert("Code wurde in die Zwischenablage kopiert.");
                                        }}
                                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded border border-white/20"
                                    >
                                        Code kopieren
                                    </button>
                                </div>
                                <p className="mt-4 text-[12px] text-orange-700 italic">
                                    Hinweis: Die Änderung greift sofort. Falls du Fehlermeldungen beim Upload erhältst, prüfe ob das <strong>"Bearbeiten erlauben"</strong> Häkchen beim Nextcloud-Share gesetzt ist.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Firmenlogo & Backup */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-brand-600">Logo & Design</h4>
                            <div className="bg-gray-50 p-6 rounded-xl border text-center">
                                <div className="flex justify-center mb-6 bg-white p-4 rounded-lg border border-dashed items-center min-h-[120px]">
                                    <Logo className="h-20 w-auto" src={config.logo} />
                                </div>
                                <label className="block w-full py-2 px-4 bg-brand-600 text-white rounded-lg cursor-pointer hover:bg-brand-700 text-sm font-bold mb-2">
                                    Neues Logo hochladen
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                {config.logo && (
                                    <button onClick={() => saveConfig({ ...config, logo: undefined })} className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Logo zurücksetzen</button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-xs font-bold uppercase text-brand-600">Backup & Sicherheit</h4>
                            <div className="bg-slate-100 p-4 rounded-xl border space-y-3">
                                <p className="text-[11px] text-gray-500 leading-relaxed">Sichern Sie Ihre Konfiguration regelmäßig, um Datenverlust bei Browser-Wechsel zu vermeiden.</p>
                                <Button onClick={handleExportConfig} variant="outline" className="w-full text-xs py-2">
                                    <BackupIcon /> Konfiguration exportieren
                                </Button>
                                <label className="block w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-md cursor-pointer hover:bg-gray-50 text-center text-xs font-medium">
                                    Backup importieren
                                    <input type="file" ref={importFileRef} accept=".json" onChange={handleImportConfig} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Projekte */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-brand-600">Projekte (Nextcloud)</h4>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                            {config.projects.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Keine Projekte angelegt.</p>}
                            {config.projects.map(p => (
                                <div key={p.token} className="flex justify-between items-center p-2 bg-white rounded border text-sm shadow-sm">
                                    <span className="font-medium truncate">{p.name}</span>
                                    <button onClick={() => { if(confirm("Projekt löschen?")) saveConfig({...config, projects: config.projects.filter(pr => pr.token !== p.token)}) }} className="text-red-400"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 bg-white p-3 rounded-lg border shadow-sm">
                            <input placeholder="Ortsname" value={newProjName} onChange={e => setNewProjName(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            <input placeholder="Share-Link" value={newProjLink} onChange={e => setNewProjLink(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            <Button onClick={() => {
                                const token = newProjLink.split('/s/')[1]?.split('/')[0];
                                if (!token || !newProjName) return alert("Ungültige Daten.");
                                saveConfig({...config, projects: [...config.projects, { name: newProjName, link: newProjLink, token }]});
                                setNewProjName(''); setNewProjLink('');
                            }} className="w-full">Projekt hinzufügen</Button>
                        </div>
                    </div>

                    {/* Technikerverwaltung */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-brand-600">Techniker & Passwörter</h4>
                        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                            {config.technicians.map(t => (
                                <div key={t.id} className={`flex flex-col p-2 bg-white rounded border text-sm shadow-sm ${editingTechId === t.id ? 'border-brand-500 bg-brand-50' : 'border-gray-100'}`}>
                                    {editingTechId === t.id ? (
                                        <div className="space-y-2">
                                            <input value={editTechName} onChange={e => setEditTechName(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Name" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={editTechCode} onChange={e => setEditTechCode(e.target.value)} className="w-full p-1 border rounded text-xs uppercase" placeholder="Kürzel" />
                                                <input value={editTechPass} onChange={e => setEditTechPass(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Passwort" />
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <select value={editTechRole} onChange={e => setEditTechRole(e.target.value as any)} className="text-[10px] p-1 border rounded">
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingTechId(null)} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
                                                    <button onClick={saveEditedTech} className="text-green-500 hover:text-green-700"><CheckIcon /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div className="truncate">
                                                <span className="font-bold text-brand-700">[{t.code}]</span> {t.name}
                                                <p className="text-[9px] text-gray-400">Rolle: {t.role} | PW: {t.password}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => startEditingTech(t)} className="p-1 text-brand-400 hover:text-brand-600"><EditIcon /></button>
                                                {t.id !== currentUser?.id && (
                                                    <button onClick={() => { if(confirm("Nutzer löschen?")) saveConfig({...config, technicians: config.technicians.filter(tech => tech.id !== t.id)}) }} className="p-1 text-red-300 hover:text-red-500"><TrashIcon /></button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg border">
                            <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Techniker neu anlegen</h5>
                            <input placeholder="Name" value={newTechName} onChange={e => setNewTechName(e.target.value)} className="w-full p-2 border rounded text-xs mb-2 shadow-inner" />
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input placeholder="Kürzel" value={newTechCode} onChange={e => setNewTechCode(e.target.value)} className="w-full p-2 border rounded text-xs uppercase" />
                                <input placeholder="Passwort" value={newTechPass} onChange={e => setNewTechPass(e.target.value)} className="w-full p-2 border rounded text-xs" />
                            </div>
                            <select value={newTechRole} onChange={e => setNewTechRole(e.target.value as any)} className="w-full p-2 border rounded text-xs bg-white mb-2 shadow-inner">
                                <option value="user">Techniker (User)</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <Button onClick={() => {
                                if (!newTechName || !newTechCode) return alert("Felder füllen.");
                                saveConfig({...config, technicians: [...config.technicians, { id: Date.now().toString(), name: newTechName, code: newTechCode.toUpperCase(), password: newTechPass, role: newTechRole }]});
                                setNewTechName(''); setNewTechCode(''); setNewTechPass('');
                            }} variant="secondary" className="w-full py-1 text-xs">Techniker hinzufügen</Button>
                        </div>
                    </div>
                </div>
                
                <div className="pt-6 mt-8 border-t flex justify-between items-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verwaltungskonsole v1.2.6</p>
                    <Button variant="outline" onClick={() => { setShowSettings(false); setEditingTechId(null); setShowHelp(false); }}>Schließen</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
