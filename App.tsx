
import React, { useState, useEffect, useCallback } from 'react';
import { AppConfig, Technician, PublicProject, FormStatus, DiaryEntry, WeatherCondition, MaterialItem } from './types';
import * as nextcloudService from './services/nextcloudService';
import * as geminiService from './services/geminiService';
import { generateDiaryPdf } from './services/pdfService';
import { Button } from './components/Button';
import { Logo, getLogoAsBase64 } from './components/Logo';

// --- Icons ---
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

const UploadIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const CloudIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
);

// --- Constants ---
const STORAGE_KEY = 'glasfaser_app_config_v2';
const DRAFT_KEY = 'glasfaser_entry_draft_v1';
const CUSTOM_LOGO_KEY = 'glasfaser_logo_v1';
const APP_VERSION = 'v1.2.0';

export default function App() {
  // --- Global State ---
  const [config, setConfig] = useState<AppConfig>({ technicians: [], projects: [] });
  const [currentUser, setCurrentUser] = useState<Technician | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // LOGO STATE: Lazy initialization
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem(CUSTOM_LOGO_KEY);
  });
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSyncInput, setShowSyncInput] = useState(false); // For Login Screen
  const [status, setStatus] = useState<FormStatus>({ step: 'login' });
  const [uploadMessage, setUploadMessage] = useState("Daten werden hochgeladen...");
  const [draftRestored, setDraftRestored] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings Temp State
  const [newTechName, setNewTechName] = useState('');
  const [newTechCode, setNewTechCode] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('');
  const [newTechIsAdmin, setNewTechIsAdmin] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjLink, setNewProjLink] = useState('');
  
  // Sync Link Input (for Login Screen and Settings)
  const [tempSyncLink, setTempSyncLink] = useState('');

  // Material Input State
  const [matName, setMatName] = useState('');
  const [matAmount, setMatAmount] = useState('');

  // Form State
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
  
  // AI States
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [isGeneratingMissing, setIsGeneratingMissing] = useState(false);

  // --- Effects ---

  // Listen for storage changes (to sync logo across tabs/windows)
  useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
          if (e.key === CUSTOM_LOGO_KEY) {
              setCustomLogo(e.newValue);
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initialize Config and attempt Cloud Sync
  useEffect(() => {
    // Load Config
    const stored = localStorage.getItem(STORAGE_KEY);
    let loadedConfig: AppConfig = { technicians: [], projects: [] };
    
    if (stored) {
      try {
        loadedConfig = JSON.parse(stored);
      } catch (e) { console.error("Config parse error"); }
    }
    
    // Bootstrap Admins if missing
    let updated = false;
    const requiredAdmins = [
        { name: 'Administrator', code: 'Admin', pass: 'admin123' },
        { name: 'RH', code: 'rh', pass: 'rh123' }
    ];

    requiredAdmins.forEach(admin => {
        if (!loadedConfig.technicians.find(t => t.code.toLowerCase() === admin.code.toLowerCase())) {
            loadedConfig.technicians.push({
                id: Date.now().toString() + Math.random(),
                name: admin.name,
                code: admin.code,
                password: admin.pass,
                role: 'admin' as const
            });
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
    }
    setConfig(loadedConfig);
    if(loadedConfig.syncLink) {
        setTempSyncLink(loadedConfig.syncLink);
        // Trigger background sync if link exists
        performCloudSync(loadedConfig.syncLink, false);
    }

  }, []);

  // Effect: Auto-Save Draft
  useEffect(() => {
    if (status.step === 'form' && currentUser) {
        const { images, technician, ...draftData } = entry;
        const payload = JSON.stringify({
            ...draftData,
            projectIndex: selectedProjectIndex
        });
        localStorage.setItem(DRAFT_KEY, payload);
    }
  }, [entry, selectedProjectIndex, status.step, currentUser]);

  // Effect: Restore Draft
  useEffect(() => {
    if (status.step === 'form' && currentUser) {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                const { projectIndex, ...restEntry } = parsed;
                if (restEntry.date) {
                    setEntry(prev => ({
                        ...prev,
                        ...restEntry,
                        technician: currentUser.name,
                        images: [] 
                    }));
                    if (projectIndex >= 0) {
                        setSelectedProjectIndex(projectIndex);
                    }
                    setDraftRestored(true);
                    setTimeout(() => setDraftRestored(false), 3000);
                }
            } catch (e) {
                console.error("Failed to restore draft", e);
            }
        }
    }
  }, [status.step, currentUser]);

  // --- Helpers ---
  const extractToken = (url: string) => {
    const parts = url.split('/s/');
    if (parts.length === 2) {
      return parts[1].split('/')[0]; 
    }
    return '';
  };

  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    
    // If sync enabled, upload changes
    if (newConfig.syncLink) {
        uploadConfigToCloud(newConfig.syncLink, newConfig, customLogo);
    }
  };

  // --- CLOUD SYNC LOGIC ---

  const performCloudSync = async (link: string, showAlerts = true) => {
      setIsSyncing(true);
      const data = await nextcloudService.fetchAppConfig(link);
      setIsSyncing(false);

      if (data) {
          // Merge Data
          const newConfig: AppConfig = {
              ...config,
              technicians: data.technicians || config.technicians,
              projects: data.projects || config.projects,
              syncLink: link // Ensure link is saved
          };
          
          // Save Config
          setConfig(newConfig);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
          
          // Save Logo
          if (data.customLogo) {
              setCustomLogo(data.customLogo);
              localStorage.setItem(CUSTOM_LOGO_KEY, data.customLogo);
          } else if (data.customLogo === null) {
              // If explicit null, reset
              setCustomLogo(null);
              localStorage.removeItem(CUSTOM_LOGO_KEY);
          }

          if (showAlerts) alert("Konfiguration und Logo erfolgreich synchronisiert!");
          return true;
      } else {
          if (showAlerts) alert("Synchronisation fehlgeschlagen. Bitte Link prüfen.");
          return false;
      }
  };

  const uploadConfigToCloud = async (link: string, currentConfig: AppConfig, currentLogo: string | null) => {
      if (!link) return;
      // We do not show loading state for background uploads usually, but for explicit admin actions we might.
      await nextcloudService.saveAppConfig(link, {
          technicians: currentConfig.technicians,
          projects: currentConfig.projects,
          customLogo: currentLogo,
          updatedAt: new Date().toISOString()
      });
  };

  const handleManualConnect = async () => {
      if (!tempSyncLink) {
          alert("Bitte Link eingeben.");
          return;
      }
      const success = await performCloudSync(tempSyncLink, true);
      if (success) {
          setShowSyncInput(false);
      }
  };

  // --- Handlers: Settings & Logo ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (result) {
                setCustomLogo(result);
                localStorage.setItem(CUSTOM_LOGO_KEY, result);
                
                // Trigger Upload if sync enabled
                if (config.syncLink) {
                    uploadConfigToCloud(config.syncLink, config, result);
                }
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
      if (confirm("Möchten Sie das Logo auf den Standard (IT-KOM) zurücksetzen?")) {
          setCustomLogo(null);
          localStorage.removeItem(CUSTOM_LOGO_KEY);
           // Trigger Upload if sync enabled
           if (config.syncLink) {
            uploadConfigToCloud(config.syncLink, config, null);
        }
      }
  };

  const addTechnician = () => {
    if (newTechName && newTechCode && newTechPassword) {
      if (config.technicians.find(t => t.code.toLowerCase() === newTechCode.toLowerCase())) {
        alert("Kürzel existiert bereits!");
        return;
      }
      const newConfig = {
        ...config,
        technicians: [...config.technicians, { 
            id: Date.now().toString(), 
            name: newTechName, 
            code: newTechCode,
            password: newTechPassword,
            role: (newTechIsAdmin ? 'admin' : 'user') as Technician['role']
        }]
      };
      saveConfig(newConfig);
      setNewTechName('');
      setNewTechCode('');
      setNewTechPassword('');
      setNewTechIsAdmin(false);
    } else {
        alert("Bitte Name, Kürzel und Passwort ausfüllen.");
    }
  };

  const removeTechnician = (id: string, code: string) => {
    const protectedUsers = ['admin', 'rh'];
    if (protectedUsers.includes(code.toLowerCase())) {
        alert(`Der Benutzer '${code}' ist systemrelevant und kann nicht gelöscht werden.`);
        return;
    }
    
    const newConfig = {
      ...config,
      technicians: config.technicians.filter(t => t.id !== id)
    };
    saveConfig(newConfig);
  };

  const addProject = () => {
    if (newProjName && newProjLink) {
      const token = extractToken(newProjLink);
      if (!token) {
        alert("Konnte Token nicht aus dem Link extrahieren. Bitte prüfen Sie den Nextcloud Link.");
        return;
      }
      const newConfig = {
        ...config,
        projects: [...config.projects, { name: newProjName, link: newProjLink, token }]
      };
      saveConfig(newConfig);
      setNewProjName('');
      setNewProjLink('');
    }
  };

  const removeProject = (token: string) => {
    const newConfig = {
      ...config,
      projects: config.projects.filter(p => p.token !== token)
    };
    saveConfig(newConfig);
  };

  const handleSetSyncLink = () => {
     if(!tempSyncLink) return;
     const newConfig = { ...config, syncLink: tempSyncLink };
     saveConfig(newConfig);
     // Try to push current config to this new link to initialize it
     uploadConfigToCloud(tempSyncLink, newConfig, customLogo);
     alert("Sync-Link gespeichert. Konfiguration wird hochgeladen.");
  };

  // --- Handlers: Login ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const tech = config.technicians.find(t => t.code.toLowerCase() === loginCode.toLowerCase());
    
    if (tech) {
        if (tech.password && tech.password !== loginPassword) {
            alert("Falsches Passwort.");
            return;
        }
        setCurrentUser(tech);
        setEntry(prev => ({ ...prev, technician: tech.name }));
        setStatus({ step: 'form' });
        setLoginCode('');
        setLoginPassword('');
    } else {
      alert("Benutzer nicht gefunden.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStatus({ step: 'login' });
    setEntry(prev => ({ ...prev, technician: '', images: [], description: '', missingWork: '', materials: [], location: '' }));
    setShowSettings(false);
  };

  // --- Handlers: Form & AI ---
  const handleEnhanceText = async () => {
    if (!entry.description.trim()) return;
    setIsEnhancingText(true);
    const newText = await geminiService.enhanceDiaryEntry(entry.description, entry.activityType);
    setEntry(prev => ({ ...prev, description: newText }));
    setIsEnhancingText(false);
  };

  const handleAnalyzeImages = async () => {
    if (entry.images.length === 0) {
        alert("Bitte zuerst Fotos hochladen.");
        return;
    }
    setIsAnalyzingImages(true);
    try {
        const generatedText = await geminiService.analyzeImagesForReport(entry.images, entry.activityType);
        setEntry(prev => ({ 
            ...prev, 
            description: prev.description ? prev.description + "\n\n" + generatedText : generatedText 
        }));
    } catch (e) {
        alert("Fehler bei der Bildanalyse.");
    } finally {
        setIsAnalyzingImages(false);
    }
  };

  const handleGenerateMissing = async () => {
    if (!entry.description) {
        alert("Bitte füllen Sie erst aus, was erledigt wurde (oder nutzen Sie die Bildanalyse).");
        return;
    }
    setIsGeneratingMissing(true);
    try {
        const suggestions = await geminiService.suggestMissingWork(entry.description, entry.activityType);
        setEntry(prev => ({ ...prev, missingWork: suggestions }));
    } finally {
        setIsGeneratingMissing(false);
    }
  };

  const handleAddMaterial = () => {
    if (matName && matAmount) {
        setEntry(prev => ({
            ...prev,
            materials: [...prev.materials, { name: matName, amount: matAmount }]
        }));
        setMatName('');
        setMatAmount('');
    }
  };

  const removeMaterial = (index: number) => {
      setEntry(prev => ({
          ...prev,
          materials: prev.materials.filter((_, i) => i !== index)
      }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setEntry(prev => ({ ...prev, images: [...prev.images, ...newFiles] }));
    }
  };

  const removeImage = (index: number) => {
    setEntry(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProjectIndex === -1) {
      alert("Bitte ein Projekt auswählen.");
      return;
    }

    const project = config.projects[selectedProjectIndex];

    try {
      setStatus({ step: 'uploading' });
      setUploadMessage("Generiere PDF-Bericht...");
      
      const logoBase64 = await getLogoAsBase64(customLogo);
      const pdfBlob = await generateDiaryPdf(entry, project.name, logoBase64);
      
      setUploadMessage(`Lade hoch zu: ${project.name}...`);
      await nextcloudService.uploadDiaryEntry(project, entry, pdfBlob);
      
      localStorage.removeItem(DRAFT_KEY);
      
      setStatus({ step: 'success' });
    } catch (error: any) {
      setStatus({ step: 'form', message: `Upload fehlgeschlagen: ${error.message}` });
    }
  };

  const resetForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setEntry({
      date: new Date().toISOString().split('T')[0],
      location: '',
      weather: WeatherCondition.SUNNY,
      activityType: 'Tiefbau',
      description: '',
      missingWork: '',
      materials: [],
      technician: currentUser ? currentUser.name : '',
      images: []
    });
    setStatus({ step: 'form' });
  };

  const reuseData = () => {
      localStorage.removeItem(DRAFT_KEY);
      setEntry(prev => ({
          ...prev,
          description: '',
          missingWork: '',
          materials: [], 
          images: []
      }));
      setStatus({ step: 'form' });
  };

  // --- Views ---

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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-900 mb-2">Erfolgreich gespeichert!</h2>
          <p className="text-gray-600 mb-8">Der Bericht und die Fotos wurden erfolgreich in die Cloud übertragen.</p>
          
          <div className="space-y-3">
             <Button onClick={reuseData} variant="secondary" className="w-full">
                Gleicher Ort / Weiterer Eintrag
             </Button>
             <Button onClick={resetForm} className="w-full">
                Komplett Neuer Eintrag
             </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
      
      {draftRestored && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50 animate-bounce">
              Entwurf wiederhergestellt
          </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white shadow-md border-b border-brand-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center flex-1">
             <Logo className="h-12 md:h-16 w-auto object-contain" customLogo={customLogo} />
             <span className="ml-4 font-bold text-brand-900 hidden lg:block text-xl border-l-2 border-brand-200 pl-4">Bautagebuch</span>
        </div>
        <div className="flex items-center gap-2">
            {currentUser && (
                <div className="text-sm text-brand-700 font-medium hidden sm:block bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100">
                    {currentUser.name} {currentUser.role === 'admin' && '(Admin)'}
                </div>
            )}
            
            {currentUser?.role === 'admin' && (
                <button onClick={() => setShowSettings(true)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors" title="Einstellungen">
                   <SettingsIcon />
                </button>
            )}

            {currentUser && (
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors" title="Abmelden">
                    <LogoutIcon />
                </button>
            )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900 bg-opacity-70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div className="flex items-center">
                  <Logo className="h-8 mr-3 w-auto" customLogo={customLogo} />
                  <h3 className="text-xl font-bold text-brand-900">Admin-Verwaltung</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <CloseIcon />
              </button>
            </div>
            
            {/* Sync Section */}
            <div className="mb-8 border-b border-gray-100 pb-6 bg-blue-50 -mx-6 px-6 py-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center">
                    <span className="mr-2"><CloudIcon /></span>
                    Cloud Synchronisation
                </h4>
                <p className="text-xs text-blue-600 mb-3">
                    Ein Nextcloud-Link, um Logo und Benutzerliste zentral zu speichern und mit anderen Geräten zu teilen.
                </p>
                <div className="flex gap-2">
                    <input 
                        className="border border-blue-200 rounded-md p-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Öffentlicher Nextcloud Link..." 
                        value={tempSyncLink}
                        onChange={e => setTempSyncLink(e.target.value)}
                    />
                    <Button onClick={handleSetSyncLink} variant="primary" className="bg-blue-600 hover:bg-blue-700">
                        Speichern
                    </Button>
                </div>
                {config.syncLink && <p className="text-xs text-green-600 mt-2">✓ Synchronisation aktiv</p>}
            </div>

            {/* Logo Management Section */}
            <div className="mb-8 border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-600 mb-3">Firmenlogo</h4>
                <div className="bg-brand-50 p-4 rounded-lg border border-brand-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Aktuelles Logo:</p>
                            <div className="border bg-white p-2 rounded shadow-sm inline-block">
                                <Logo className="h-10 w-auto" customLogo={customLogo} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
                                <UploadIcon />
                                Bild Hochladen
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleLogoUpload}
                                />
                            </label>
                            <span className="text-[10px] text-gray-500 text-center">SVG, PNG, JPG, GIF</span>
                            {customLogo && (
                                <button 
                                    onClick={handleResetLogo}
                                    className="text-xs text-red-500 hover:text-red-700 underline text-right"
                                >
                                    Zurücksetzen
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Technicians Section */}
            <div className="mb-8 border-b border-gray-100 pb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-600 mb-3">Benutzer & Techniker</h4>
                <div className="space-y-2 mb-4 bg-brand-50 p-4 rounded-lg max-h-40 overflow-y-auto border border-brand-100">
                    {config.technicians.map(tech => {
                        const isProtected = ['admin', 'rh'].includes(tech.code.toLowerCase());
                        return (
                        <div key={tech.id} className="flex justify-between items-center border-b border-brand-100 last:border-0 py-2 text-sm">
                            <div>
                                <span className="font-bold mr-3 w-10 inline-block uppercase text-brand-800 bg-white px-1 rounded text-center border border-brand-100">{tech.code}</span>
                                <span className="text-gray-700">{tech.name}</span>
                                {tech.role === 'admin' && <span className="ml-2 text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded">Admin</span>}
                            </div>
                            <button 
                                onClick={() => removeTechnician(tech.id, tech.code)} 
                                disabled={isProtected}
                                className={`text-red-400 hover:text-red-600 transition-colors ${isProtected ? 'opacity-30 cursor-not-allowed' : ''}`}
                                title={isProtected ? "Dieser Benutzer kann nicht gelöscht werden" : "Löschen"}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    )})}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input 
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" 
                        placeholder="Name (z.B. Max)" 
                        value={newTechName} 
                        onChange={e => setNewTechName(e.target.value)}
                    />
                    <input 
                        className="border border-gray-300 rounded-md p-2 text-sm uppercase focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" 
                        placeholder="Kürzel (z.B. MM)" 
                        maxLength={4}
                        value={newTechCode} 
                        onChange={e => setNewTechCode(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input 
                        className="border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" 
                        placeholder="Passwort" 
                        type="text"
                        value={newTechPassword} 
                        onChange={e => setNewTechPassword(e.target.value)}
                    />
                     <div className="flex items-center space-x-2 border border-gray-300 rounded-md px-3 bg-white">
                        <input 
                            type="checkbox" 
                            id="isAdmin"
                            checked={newTechIsAdmin}
                            onChange={e => setNewTechIsAdmin(e.target.checked)}
                            className="text-brand-600 focus:ring-brand-500 rounded"
                        />
                        <label htmlFor="isAdmin" className="text-sm cursor-pointer select-none text-gray-700">Admin-Rechte?</label>
                    </div>
                </div>
                <Button onClick={addTechnician} className="w-full py-2 text-sm mt-2 shadow-sm">Benutzer hinzufügen</Button>
            </div>

            {/* Projects Section */}
            <div className="mb-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-600 mb-3">Projekte (Öffentliche Links)</h4>
                <div className="space-y-2 mb-4 bg-brand-50 p-4 rounded-lg border border-brand-100">
                    {config.projects.map(proj => (
                        <div key={proj.token} className="flex justify-between items-center border-b border-brand-100 last:border-0 py-2 text-sm">
                            <div className="overflow-hidden">
                                <div className="font-bold text-brand-900">{proj.name}</div>
                                <div className="text-xs text-gray-500 truncate font-mono">.../s/{proj.token}</div>
                            </div>
                            <button onClick={() => removeProject(proj.token)} className="text-red-400 hover:text-red-600 transition-colors">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    {config.projects.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">Keine Projekte angelegt.</p>}
                </div>
                <div className="space-y-3">
                    <input 
                        className="border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" 
                        placeholder="Projektname (z.B. BV München)" 
                        value={newProjName} 
                        onChange={e => setNewProjName(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input 
                            className="border border-gray-300 rounded-md p-2 text-sm flex-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" 
                            placeholder="Nextcloud Link (https://...)" 
                            value={newProjLink} 
                            onChange={e => setNewProjLink(e.target.value)}
                        />
                        <Button onClick={addProject} className="py-2 px-4 text-lg font-bold">+</Button>
                    </div>
                </div>
            </div>

            <div className="mt-6 border-t pt-4">
                 <Button variant="outline" className="w-full" onClick={() => setShowSettings(false)}>Schließen</Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Screen */}
      {!currentUser ? (
          <div className="max-w-md mx-auto mt-16 p-6 relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-brand-600 relative">
                  <div className="mb-8 flex justify-center">
                    <Logo className="h-24 w-auto object-contain" customLogo={customLogo} />
                  </div>
                  <h2 className="text-xl font-bold mt-4 text-brand-900">Anmeldung</h2>
                  <p className="text-brand-500 text-sm mb-6">Willkommen beim digitalen Bautagebuch</p>
                  
                  {/* Sync Connect UI on Login Screen */}
                  {showSyncInput ? (
                       <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                           <h3 className="text-sm font-bold text-blue-800 mb-2">Cloud Synchronisation</h3>
                           <input 
                                className="w-full border border-blue-200 rounded p-2 text-sm mb-2" 
                                placeholder="Nextcloud Link eingeben..."
                                value={tempSyncLink}
                                onChange={e => setTempSyncLink(e.target.value)}
                           />
                           <div className="flex gap-2">
                               <Button onClick={handleManualConnect} isLoading={isSyncing} className="w-full text-xs">Verbinden</Button>
                               <Button onClick={() => setShowSyncInput(false)} variant="secondary" className="w-full text-xs">Abbrechen</Button>
                           </div>
                       </div>
                  ) : (
                    <button 
                        onClick={() => setShowSyncInput(true)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-brand-600 transition-colors"
                        title="Mit Cloud-Konfiguration verbinden"
                    >
                        <CloudIcon />
                    </button>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                      <input 
                        type="text" 
                        value={loginCode}
                        onChange={e => setLoginCode(e.target.value)}
                        placeholder="Ihr Kürzel"
                        className="w-full text-center text-xl p-3 border border-gray-300 rounded-lg focus:border-brand-600 focus:ring-2 focus:ring-brand-200 outline-none uppercase tracking-widest placeholder-gray-400"
                        autoFocus
                      />
                      
                      <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            placeholder="Passwort"
                            className="w-full text-center text-xl p-3 border border-gray-300 rounded-lg focus:border-brand-600 focus:ring-2 focus:ring-brand-200 outline-none placeholder-gray-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600"
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>

                      <Button type="submit" className="w-full py-3 text-lg font-semibold shadow-md mt-4">Anmelden</Button>
                  </form>
                  
                  <div className="mt-10 text-xs text-gray-400 border-t pt-4">
                    IT-KOM Kommunikationstechnik GmbH <span className="block mt-1 text-gray-300">{APP_VERSION}</span>
                  </div>
              </div>
          </div>
      ) : (
        // Main Form
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
            
            {status.message && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-sm">
                <strong className="font-bold">Achtung: </strong>
                <span className="block sm:inline">{status.message}</span>
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
            
            {/* Header Section of Form */}
            <div className="border-b border-gray-100 pb-4 mb-4">
                <div className="mb-4">
                   <Logo className="h-16 w-auto object-left" customLogo={customLogo} />
                </div>
                <h2 className="text-2xl font-bold text-brand-900">Tagesbericht erfassen</h2>
                <p className="text-gray-500 text-sm">Bitte füllen Sie alle Felder gewissenhaft aus.</p>
            </div>

            {/* Project Selection */}
            <div>
                <label className="block text-sm font-bold text-brand-800 mb-1">Bauvorhaben / Projekt</label>
                <div className="relative">
                    <select
                        value={selectedProjectIndex}
                        onChange={(e) => setSelectedProjectIndex(Number(e.target.value))}
                        required
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-base p-3 border bg-gray-50 appearance-none"
                    >
                        <option value={-1} disabled>Bitte Projekt wählen...</option>
                        {config.projects.map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
                {config.projects.length === 0 && (
                    <p className="text-xs text-red-500 mt-2 flex items-center"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Keine Projekte verfügbar. Bitte Admin kontaktieren.</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <input
                    type="date"
                    required
                    value={entry.date}
                    onChange={e => setEntry({...entry, date: e.target.value})}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Techniker</label>
                <input
                    type="text"
                    disabled
                    value={entry.technician}
                    className="block w-full rounded-lg border-gray-300 bg-gray-100 text-gray-500 shadow-sm sm:text-sm p-3 border cursor-not-allowed font-medium"
                />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse der Baustelle</label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <input
                    type="text"
                    required
                    placeholder="Straße, Hausnummer, Ort"
                    value={entry.location}
                    onChange={e => setEntry({...entry, location: e.target.value})}
                    className="block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wetter</label>
                <select
                    value={entry.weather}
                    onChange={e => setEntry({...entry, weather: e.target.value as WeatherCondition})}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border bg-white"
                >
                    {Object.values(WeatherCondition).map(w => (
                    <option key={w} value={w}>{w}</option>
                    ))}
                </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tätigkeit</label>
                <select
                    value={entry.activityType}
                    onChange={e => setEntry({...entry, activityType: e.target.value as any})}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border bg-white"
                >
                    <option value="Tiefbau">Tiefbau (Graben/Verschließen)</option>
                    <option value="Einblasen">Kabel einblasen</option>
                    <option value="Spleißen">Spleißen (Muffe/APL)</option>
                    <option value="Hausanschluss">Hausanschluss Montage</option>
                    <option value="Sonstiges">Sonstiges</option>
                </select>
                </div>
            </div>

            {/* Image Upload moved UP to allow analysis */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Fotodokumentation (für KI-Analyse)</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {entry.images.map((file, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 border rounded-lg overflow-hidden shadow-sm group">
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    </div>
                ))}
                
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors bg-white group">
                    <div className="bg-brand-50 p-2 rounded-full mb-1 group-hover:bg-brand-100 transition-colors text-brand-500">
                        <CameraIcon />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 font-medium group-hover:text-brand-600">Foto hinzufügen</span>
                    <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    />
                </label>
                </div>
            </div>

            {/* DONE: Was wurde erledigt */}
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
                <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-brand-800">Was wurde erledigt (Arbeitsbericht)</label>
                    <div className="flex gap-2">
                        {/* New Button: Analyze Images */}
                        <button
                            type="button"
                            onClick={handleAnalyzeImages}
                            disabled={isAnalyzingImages || entry.images.length === 0}
                            className="text-xs flex items-center text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium px-3 py-1.5 rounded-full transition-all shadow-sm"
                            title="Erstellt Bericht basierend auf den hochgeladenen Fotos"
                        >
                            {isAnalyzingImages ? (
                                <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <PhotoSparklesIcon />
                            )}
                            {isAnalyzingImages ? 'Analysiere...' : 'Bericht aus Bildern'}
                        </button>

                        <button
                            type="button"
                            onClick={handleEnhanceText}
                            disabled={isEnhancingText || !entry.description}
                            className="text-xs flex items-center text-brand-600 bg-white border border-brand-200 hover:text-brand-800 hover:border-brand-300 disabled:opacity-50 font-medium px-3 py-1.5 rounded-full transition-all shadow-sm"
                        >
                            <SparklesIcon />
                            {isEnhancingText ? 'Optimiere...' : 'Text verbessern'}
                        </button>
                    </div>
                </div>
                <textarea
                rows={6}
                required
                placeholder="Beschreiben Sie die ausgeführten Arbeiten (oder nutzen Sie 'Bericht aus Bildern')..."
                value={entry.description}
                onChange={e => setEntry({...entry, description: e.target.value})}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border"
                />
            </div>

            {/* DONE: Was fehlt noch */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-orange-800">Was fehlt noch / Restarbeiten</label>
                    <button
                        type="button"
                        onClick={handleGenerateMissing}
                        disabled={isGeneratingMissing || !entry.description}
                        className="text-xs flex items-center text-orange-700 bg-white border border-orange-200 hover:bg-orange-50 disabled:opacity-50 font-medium px-3 py-1.5 rounded-full transition-all shadow-sm"
                    >
                        <SparklesIcon />
                        {isGeneratingMissing ? 'Denke nach...' : 'Vorschläge generieren'}
                    </button>
                </div>
                <textarea
                rows={3}
                placeholder="Was muss am nächsten Tag erledigt werden?"
                value={entry.missingWork}
                onChange={e => setEntry({...entry, missingWork: e.target.value})}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                />
            </div>

            {/* DONE: Materialliste */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-3">Materialliste</label>
                
                {entry.materials.length > 0 && (
                    <div className="bg-white rounded border border-gray-200 mb-4 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menge</th>
                                    <th className="px-3 py-2 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entry.materials.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500">{item.amount}</td>
                                        <td className="px-3 py-2 text-right">
                                            <button type="button" onClick={() => removeMaterial(idx)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label className="text-xs text-gray-500 block mb-1">Material Bezeichnung</label>
                        <input 
                            type="text" 
                            className="w-full border rounded p-2 text-sm" 
                            placeholder="z.B. LWL Kabel"
                            value={matName}
                            onChange={e => setMatName(e.target.value)}
                        />
                    </div>
                    <div className="w-24">
                        <label className="text-xs text-gray-500 block mb-1">Menge</label>
                        <input 
                            type="text" 
                            className="w-full border rounded p-2 text-sm" 
                            placeholder="z.B. 50m"
                            value={matAmount}
                            onChange={e => setMatAmount(e.target.value)}
                        />
                    </div>
                    <Button type="button" onClick={handleAddMaterial} className="h-10 px-3">
                        <PlusIcon />
                    </Button>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
                <Button 
                    type="submit" 
                    className="w-full py-4 text-lg font-bold shadow-lg transform active:scale-95 transition-transform" 
                    variant="primary"
                >
                    Bericht abschließen & Hochladen
                </Button>
            </div>

            </form>
        </div>
      )}
    </div>
  );
}
