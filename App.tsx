
import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, Technician, PublicProject, FormStatus, DiaryEntry, WeatherCondition, MaterialItem } from './types';
import * as geminiService from './services/geminiService';
import { generateDiaryPdf } from './services/pdfService';
import { Button } from './components/Button';
import { Logo, getLogoAsBase64 } from './components/Logo';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  setDoc,
  doc
} from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { createClient } from 'webdav';

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

const MagicWandIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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

const MATERIAL_OPTIONS = [
  "(10060209) GWV Basismodul",
  "(10060212) nicht erledigt - Abbruch GWV",
  "(10060202) Gf-TA Connect Only",
  "(10060210) nicht erledigt ? Connect Auftrag",
  "(10060217) nicht erledigt ? Connect BULK",
  "(10075642) Montage Gf-GV",
  "(10075530) Metall-Rohr-/-Kabelkanalnetzbau",
  "(10075520) Kunststoff-Rohr-/Kabelkanalnetzbau",
  "(10075542) Gf-Kabel einziehen/einblasen u. verlegen",
  "(10075572) Zusätzliche Gf-Spleiße herstellen",
  "(10075739) Brandschottung herstellen 5cm x 5cm",
  "(10060182) OneBox Setzen",
  "(10072459) FTTH - Stundensatz FTTH",
  "(10072239) Zusatzaufwand",
  "(10075741) Entstörung NE3 bei FTTx-Anschlüssen",
  "(10075744) Teilerledigung Auskundung",
  "(10060220) Herstellen Connect FTTH mit NE4",
  "(10060221) Herstellen BULK Connect FTTH mit NE4",
  "(10060222) nicht erledigt - Connect BULK",
  "(10060223) Problembehebung FTTH-Anschluss",
  "(10060226) VOA FTTH - Small",
  "(10060227) VOA FTTH - Standard",
  "(10060228) VOA FTTH - Large",
  "(10060229) Montage Gf-SP (klassisch)",
  "(10060230) Montage Gf-SP (vorkonf.)",
  "(10060231) Kleiner Decken-/Wanddurchbruch",
  "(10060232) Mini-GWV Basismodul",
  "(10060233) Montage Metallhaube",
  "(10072109) NE 5 - Small",
  "(10072119) NE 5 - Medium",
  "(10072129) NE 5 - Large",
  "(10072139) NE 5 - Extra Large",
  "(10072149) NE 5 - Installation S",
  "(10072159) NE 5 - Installation M"
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  const [newTechNextcloudUser, setNewTechNextcloudUser] = useState('');
  const [newTechNextcloudPass, setNewTechNextcloudPass] = useState('');
  const [newTechRole, setNewTechRole] = useState<'admin' | 'user'>('user');

  // Editing State for Technicians
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [editTechName, setEditTechName] = useState('');
  const [editTechCode, setEditTechCode] = useState('');
  const [editTechPass, setEditTechPass] = useState('');
  const [editTechNextcloudUser, setEditTechNextcloudUser] = useState('');
  const [editTechNextcloudPass, setEditTechNextcloudPass] = useState('');
  const [editTechRole, setEditTechRole] = useState<'admin' | 'user'>('user');

  // Form States
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(-1); 
  const [materialInput, setMaterialInput] = useState({ name: '', amount: '1' });
  const [entry, setEntry] = useState<DiaryEntry>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    weather: WeatherCondition.SUNNY,
    activityType: 'Tiefbau',
    description: '',
    missingWork: '',
    materials: [],
    technician: '',
    images: [],
    nextcloudPath: ''
  });
  
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const [isGeneratingMissing, setIsGeneratingMissing] = useState(false);
  const [isGeneratingPdfOnly, setIsGeneratingPdfOnly] = useState(false);
  const [nextcloudCreds, setNextcloudCreds] = useState<{ user: string, pass: string, webdavUrl: string } | null>(null);
  
  // Folder Browsing States
  const [isBrowsingFolders, setIsBrowsingFolders] = useState(false);
  const [browseFolders, setBrowseFolders] = useState<{name: string, path: string}[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [currentBrowsePath, setCurrentBrowsePath] = useState<string | null>(null);
  const [browseCallback, setBrowseCallback] = useState<((path: string) => void) | null>(null);
  
  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Material Analysis States
  const [analysisStartDate, setAnalysisStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [analysisEndDate, setAnalysisEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ name: string; amount: number }[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'general'>('general');

  // Load configuration on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && !currentUser) {
        try {
          // Try to restore user from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const tech: Technician = {
              id: user.uid,
              name: userData.name || 'Benutzer',
              code: userData.email?.split('@')[0]?.toUpperCase() || 'USER',
              role: userData.role || 'user'
            };
            setCurrentUser(tech);
            setEntry(prev => ({ ...prev, technician: tech.name, technicianUid: user.uid }));
            setStatus({ step: 'form' });
          }
        } catch (e) {
          console.error("Auth restoration failed:", e);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let loadedConfig: AppConfig = { technicians: [], projects: [] };
    if (stored) {
      try { loadedConfig = JSON.parse(stored); } catch (e) { console.error("Config parse failed", e); }
    }
    
    // Ensure admin account with code 'ADMIN' exists
    const adminIndex = loadedConfig.technicians.findIndex(t => t.code.toUpperCase() === 'ADMIN');
    if (adminIndex === -1) {
        loadedConfig.technicians.push({ 
            id: 'admin-init', 
            name: 'Administrator', 
            code: 'ADMIN', 
            password: 'admin123', 
            role: 'admin' 
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
    } else {
        // If it exists, ensure the password is 'admin123' if it's the initial admin or if it was empty
        const admin = loadedConfig.technicians[adminIndex];
        if (!admin.password || admin.id === 'admin-init' || admin.id === 'admin-fallback') {
            admin.password = 'admin123';
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedConfig));
        }
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

  // Restore Draft on Login
  useEffect(() => {
    if (currentUser && status.step === 'form') {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const { projectIndex, ...entryData } = parsed;
          
          // Only restore if the entry is currently empty (to avoid overwriting fresh data)
          if (!entry.location && !entry.description && entry.materials.length === 0) {
            setEntry(prev => ({ ...prev, ...entryData, technician: currentUser.name }));
            if (projectIndex !== undefined) setSelectedProjectIndex(projectIndex);
            alert("Entwurf wurde wiederhergestellt.");
          }
        } catch (e) { console.error("Draft restore failed", e); }
      }
    }
  }, [currentUser, status.step]);

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

  // Listen for Nextcloud OAuth success (REMOVED)
  
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedCode = loginCode.trim();
    const normalizedPassword = loginPassword.trim();

    if (!normalizedCode || !normalizedPassword) {
        setStatus({ step: 'error', error: "Bitte Benutzername und Passwort eingeben." });
        return;
    }

    // 0. Master Admin Override (Local fallback for initial setup)
    if (normalizedCode === 'ADMIN' && normalizedPassword === 'admin123') {
        const adminTech: Technician = {
            id: 'admin-master',
            name: 'Administrator',
            code: 'ADMIN',
            password: 'admin123',
            role: 'admin'
        };
        await performFirebaseLogin(adminTech);
        return;
    }

    // 1. Check for stored technician (App Login)
    const storedTech = config.technicians.find(t => 
        t.code.toUpperCase() === normalizedCode.toUpperCase() || 
        t.nextcloudUser?.toLowerCase() === normalizedCode.toLowerCase() ||
        t.name.toLowerCase() === normalizedCode.toLowerCase()
    );

    if (storedTech) {
        // If technician has a password set, verify it
        if (storedTech.password && storedTech.password !== normalizedPassword) {
            setStatus({ step: 'error', error: "Falsches Login-Passwort für diesen Techniker." });
            return;
        }

        // If verified (or no password set), try to connect to Nextcloud
        setStatus({ step: 'uploading' });
        setUploadMessage(`Verbinde für ${storedTech.name}...`);

        // Use stored Nextcloud credentials if available, otherwise use entered password
        const ncUser = storedTech.nextcloudUser || storedTech.name;
        const ncPass = storedTech.nextcloudPass || normalizedPassword;

        try {
            const webdavUrl = await discoverWebdavUrl(ncUser, ncPass);
            setNextcloudCreds({ user: ncUser, pass: ncPass, webdavUrl });
            await performFirebaseLogin(storedTech);
            return;
        } catch (err: any) {
            if (storedTech.role === 'admin') {
                console.warn("Nextcloud connection failed for admin, allowing local login", err);
                await performFirebaseLogin(storedTech);
                alert("Hinweis: Nextcloud-Verbindung fehlgeschlagen. Sie wurden lokal angemeldet, um die Einstellungen zu prüfen.");
                return;
            }
            handleLoginError(err);
            return;
        }
    }

    // 2. Fallback: Discovery Login (for new users or direct Nextcloud login)
    setStatus({ step: 'uploading' });
    setUploadMessage("Verbinde mit Nextcloud...");
    
    try {
        const webdavUrl = await discoverWebdavUrl(normalizedCode, normalizedPassword);
        setNextcloudCreds({ user: normalizedCode, pass: normalizedPassword, webdavUrl });
        
        // Create a temporary technician object
        const tech: Technician = {
            id: normalizedCode,
            name: normalizedCode,
            code: normalizedCode.toUpperCase().substring(0, 3).replace(/[^A-Z]/g, 'X'),
            role: 'user',
            nextcloudUser: normalizedCode,
            nextcloudPass: normalizedPassword
        };
        
        await performFirebaseLogin(tech);
    } catch (err: any) {
        handleLoginError(err);
    }
  };

  const handleLoginError = (err: any) => {
    console.error("Login failed:", err);
    let errorMsg = "Anmeldung fehlgeschlagen.";
    let debugInfo = "";
    
    if (err.message?.includes('DEBUG_INFO_START')) {
        const parts = err.message.split('DEBUG_INFO_START');
        errorMsg = parts[0].trim();
        debugInfo = parts[1].split('DEBUG_INFO_END')[0].trim();
    } else {
        errorMsg = err.message || "Anmeldung fehlgeschlagen.";
    }

    if (errorMsg.includes('401')) {
        errorMsg = "Fehler 401: Benutzername oder App-Passwort falsch. Bitte prüfen Sie Ihre Eingaben in Nextcloud (Einstellungen -> Sicherheit).";
    } else if (errorMsg.includes('404')) {
        errorMsg = "Fehler 404: WebDAV-Pfad nicht gefunden. Bitte prüfen Sie die Server-URL in den Einstellungen.";
    }

    setStatus({ 
      step: 'error', 
      error: errorMsg,
      details: debugInfo ? `Versuchte Pfade:\n${debugInfo}` : undefined
    });
  };

  const discoverWebdavUrl = async (user: string, pass: string): Promise<string> => {
    // 1. Use the configured base URL
    const rawUrl = (config.nextcloudUrl || 'https://nextcloud.it-kom.de').trim();
    let baseUrl = rawUrl;
    if (rawUrl.includes('/remote.php')) baseUrl = rawUrl.split('/remote.php')[0];
    else if (rawUrl.includes('/index.php')) baseUrl = rawUrl.split('/index.php')[0];
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // 2. If a manual template exists, use it as a pattern
    if (config.manualWebdavUrl) {
        const hasFilesPart = config.manualWebdavUrl.includes('/files/');
        const basePath = hasFilesPart ? config.manualWebdavUrl.split('/files/')[0] + '/files/' : config.manualWebdavUrl;
        
        // Try variations based on the manual template
        const manualVariations = [
            `${basePath}${encodeURIComponent(user)}/`,
            `${basePath}${encodeURIComponent(user.toLowerCase())}/`,
            `${basePath}${encodeURIComponent(user.replace(/\s+/g, ''))}/`,
            config.manualWebdavUrl // Also try the exact saved URL
        ];

        for (const testUrl of manualVariations) {
            try {
                const exists = await nextcloudProxy.exists(testUrl, { user, pass });
                if (exists) return testUrl;
            } catch (e: any) {}
        }
    }

    // 3. Fallback to standard Nextcloud paths
    const baseUrlVariations = [baseUrl, baseUrl.includes('/nextcloud') ? baseUrl : `${baseUrl}/nextcloud`].filter(Boolean);
    const userInputs = [
        user, 
        user.toLowerCase(), 
        user.replace(/\s+/g, ''), 
        user.split('@')[0],
        user.replace(/\s+/g, '.').toLowerCase()
    ].filter(Boolean) as string[];
    const uniqueUsers = Array.from(new Set(userInputs));
    const basePaths = [
        '/remote.php/dav/files/', 
        '/remote.php/webdav/', 
        '/index.php/remote.php/dav/files/', 
        '/remote.php/dav/',
        '/dav/files/',
        '/public.php/webdav/',
        '/index.php/remote.php/dav/files/'
    ];
    
    let triedUrls: string[] = [];
    let isAuthError = false;

    // 1. If baseUrl is already a full WebDAV URL, try it first
    if (baseUrl.includes('/remote.php/')) {
        triedUrls.push(baseUrl);
        triedUrls.push(baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
    }

    for (const base of baseUrlVariations) {
        for (const basePath of basePaths) {
            for (const u of uniqueUsers) {
                const testUrl = `${base}${basePath}${encodeURIComponent(u)}/`;
                if (!triedUrls.includes(testUrl)) {
                    triedUrls.push(testUrl);
                }
            }
        }
    }

    for (const testUrl of triedUrls) {
        try {
            const exists = await nextcloudProxy.exists(testUrl, { user, pass });
            if (exists) return testUrl;
        } catch (e: any) {
            if (e.message === "AUTH_FAILED") isAuthError = true;
        }
    }
    
    if (isAuthError) throw new Error(`401: Authentifizierung fehlgeschlagen. Bitte prüfen Sie Ihr App-Passwort.\nDEBUG_INFO_START\n${triedUrls.join('\n')}\nDEBUG_INFO_END`);
    const debugInfo = `DEBUG_INFO_START\n${triedUrls.join('\n')}\nDEBUG_INFO_END`;
    throw new Error(`404: WebDAV-Pfad konnte nicht automatisch ermittelt werden.\n\n${debugInfo}`);
  };

  const performFirebaseLogin = async (tech: Technician) => {
    try {
        // Sign in anonymously to Firebase to get a valid session for Firestore
        const result = await signInAnonymously(auth);
        const user = result.user;
        
        // Create/Update User Document in Firestore using the anonymous UID
        try {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: `${tech.code.toLowerCase()}@internal.app`,
                role: tech.role,
                name: tech.name,
                lastLogin: serverTimestamp()
            }, { merge: true });
        } catch (e: any) {
            console.error("Failed to sync user to Firestore", e);
            // If this fails, we might have a permission issue or network issue
        }

        setCurrentUser(tech);
        setEntry(prev => ({ ...prev, technician: tech.name, technicianUid: user.uid }));
        setStatus({ step: 'form' });
        
    } catch (error) {
        console.error("Firebase Login failed", error);
        // Fallback: allow local login even if Firebase fails, but warn the user
        setCurrentUser(tech);
        setEntry(prev => ({ ...prev, technician: tech.name }));
        setStatus({ step: 'form' });
        alert("Hinweis: Verbindung zur Datenbank fehlgeschlagen. Speichern ist nur lokal möglich.");
    }
  };

  // Helper for Nextcloud Proxy
  const nextcloudProxy = {
    async exists(url: string, creds: { user: string, pass: string }) {
      try {
        const propfindBody = `<?xml version="1.0" encoding="UTF-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/></d:prop></d:propfind>`;
        const response = await fetch('/api/nextcloud/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            method: 'PROPFIND',
            username: creds.user,
            password: creds.pass,
            headers: { 'Depth': '0', 'Content-Type': 'application/xml' },
            data: propfindBody
          })
        });
        
        if (response.status === 401) throw new Error("AUTH_FAILED");
        
        // If PROPFIND is not allowed, try GET
        if (response.status === 405) {
          const getResponse = await fetch('/api/nextcloud/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, method: 'GET', username: creds.user, password: creds.pass })
          });
          return getResponse.status === 200 || getResponse.status === 401;
        }
        
        return response.status === 207 || response.status === 200;
      } catch (e: any) {
        if (e.message === "AUTH_FAILED") throw e;
        return false;
      }
    },
    async createDirectory(url: string, creds: { user: string, pass: string }) {
      const response = await fetch('/api/nextcloud/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: 'MKCOL',
          username: creds.user,
          password: creds.pass
        })
      });
      if (!response.ok && response.status !== 405) { // 405 means already exists
        throw new Error(`Fehler beim Erstellen des Ordners: ${response.status}`);
      }
    },
    async putFileContents(url: string, data: Blob, creds: { user: string, pass: string }) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(data);
      });
      const base64 = await base64Promise;

      const response = await fetch('/api/nextcloud/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: 'PUT',
          username: creds.user,
          password: creds.pass,
          data: base64,
          headers: { 'Content-Type': 'application/pdf' }
        })
      });
      if (!response.ok) {
        throw new Error(`Fehler beim Upload: ${response.status}`);
      }
    },
    async listFolders(url: string, creds: { user: string, pass: string }) {
      const propfindBody = `<?xml version="1.0" encoding="UTF-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:resourcetype/></d:prop></d:propfind>`;
      const response = await fetch('/api/nextcloud/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: 'PROPFIND',
          username: creds.user,
          password: creds.pass,
          headers: { 'Depth': '1', 'Content-Type': 'application/xml' },
          data: propfindBody
        })
      });
      if (!response.ok) throw new Error(`Fehler beim Laden der Ordner: ${response.status}`);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Handle different possible namespaces (d: or just response)
      const getElements = (parent: Element | Document, name: string) => {
        let el = parent.getElementsByTagName(`d:${name}`);
        if (el.length === 0) el = parent.getElementsByTagName(name);
        return el;
      };

      const responses = getElements(xmlDoc, "response");
      const folders: { name: string, path: string }[] = [];
      
      // The first response is usually the directory itself
      for (let i = 0; i < responses.length; i++) {
        const href = getElements(responses[i], "href")[0]?.textContent || "";
        const propstat = getElements(responses[i], "propstat")[0];
        const prop = getElements(propstat, "prop")[0];
        const resourcetype = getElements(prop, "resourcetype")[0];
        const isCollection = getElements(resourcetype, "collection").length > 0;
        
        if (isCollection) {
          const decodedHref = decodeURIComponent(href);
          const parts = decodedHref.split('/').filter(p => p);
          const name = parts[parts.length - 1] || "/";
          
          // We want to keep the path relative to the domain if it's a full path
          // Nextcloud usually returns /remote.php/dav/files/user/folder/
          folders.push({ name, path: decodedHref });
        }
      }
      return folders;
    }
  };

  const handleLogout = async () => { 
    await signOut(auth);
    setCurrentUser(null); 
    setStatus({ step: 'login' }); 
    setShowSettings(false); 
    setLoginCode(''); 
    setLoginPassword(''); 
  };

  const downloadBlob = (blob: Blob, filename: string) => {
      try {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          
          // Delay revocation to ensure browser has started the download
          setTimeout(() => {
              window.URL.revokeObjectURL(url);
              if (document.body.contains(a)) {
                  document.body.removeChild(a);
              }
          }, 100);
      } catch (err) {
          console.error("Download failed:", err);
          alert("Download fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
  };

  const handleManualPdfDownload = async () => {
      setIsGeneratingPdfOnly(true);
      try {
          const project = config.projects[selectedProjectIndex] || { name: 'Entwurf' };
          const logoBase64 = await getLogoAsBase64(config.logo);
          const pdfBlob = await generateDiaryPdf(entry, project.name, logoBase64);
          
          // Sanitize filename
          const safeLocation = entry.location ? entry.location.replace(/[^a-zA-Z0-9]/g, '_') : 'Unbekannt';
          const filename = `Bautagebuch_${entry.date}_${safeLocation}.pdf`;
          
          downloadBlob(pdfBlob, filename);
      } catch (err) {
          console.error("Manual PDF Download Error:", err);
          alert("PDF-Generierung fehlgeschlagen.");
      } finally {
          setIsGeneratingPdfOnly(false);
      }
  };

  const handleBrowseFolders = async (path?: string) => {
    if (!nextcloudCreds) return;
    setBrowseLoading(true);
    setIsBrowsingFolders(true);
    try {
      // If path is provided, use it, otherwise use the base webdavUrl
      let url = nextcloudCreds.webdavUrl;
      if (path) {
        const urlObj = new URL(nextcloudCreds.webdavUrl);
        url = `${urlObj.origin}${path}`;
      }
      
      const folders = await nextcloudProxy.listFolders(url, { user: nextcloudCreds.user, pass: nextcloudCreds.pass });
      setBrowseFolders(folders);
      setCurrentBrowsePath(path || new URL(nextcloudCreds.webdavUrl).pathname);
    } catch (err) {
      alert("Fehler beim Laden der Ordner: " + err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleFormBrowseFolders = async () => {
    if (!nextcloudCreds) return alert("Bitte zuerst anmelden.");
    setBrowseCallback(() => (selectedPath: string) => {
      setEntry(prev => ({ ...prev, nextcloudPath: selectedPath }));
    });
    
    // Start with current path or root
    const basePath = new URL(nextcloudCreds.webdavUrl).pathname;
    let startPath = entry.nextcloudPath || '/';
    if (!startPath.startsWith('/')) startPath = '/' + startPath;
    
    const fullPath = `${basePath.replace(/\/$/, '')}${startPath}`;
    handleBrowseFolders(fullPath);
  };

  const startEditingTech = (tech: Technician) => {
    setEditingTechId(tech.id);
    setEditTechName(tech.name);
    setEditTechCode(tech.code);
    setEditTechPass(tech.password || '');
    setEditTechNextcloudUser(tech.nextcloudUser || '');
    setEditTechNextcloudPass(tech.nextcloudPass || '');
    setEditTechRole(tech.role);
  };

  const saveEditedTech = () => {
    if (!editTechName || !editTechCode) return alert("Name und Kürzel sind Pflichtfelder.");
    const updatedTechs = config.technicians.map(t => 
        t.id === editingTechId 
            ? { ...t, name: editTechName, code: editTechCode.toUpperCase(), password: editTechPass, nextcloudUser: editTechNextcloudUser, nextcloudPass: editTechNextcloudPass, role: editTechRole } 
            : t
    );
    saveConfig({ ...config, technicians: updatedTechs });
    setEditingTechId(null);
  };

  const handleAnalyzeImages = async () => {
    if (entry.images.length === 0) return alert("Zuerst Fotos machen.");
    setIsAnalyzingImages(true);
    try {
        const text = await geminiService.analyzeImagesForReport(entry.images, entry.activityType);
        setEntry(prev => ({ ...prev, description: prev.description ? prev.description + "\n" + text : text }));
    } catch (err) {
        alert("Fehler bei der Bildanalyse.");
    } finally { setIsAnalyzingImages(false); }
  };

  const handleEnhanceText = async () => {
    if (!entry.description) return alert("Zuerst Text eingeben.");
    setIsEnhancingText(true);
    try {
        const enhanced = await geminiService.enhanceDiaryEntry(entry.description, entry.activityType);
        setEntry(prev => ({ ...prev, description: enhanced }));
    } catch (err) {
        alert("Fehler bei der Textverbesserung.");
    } finally { setIsEnhancingText(false); }
  };

  const handleGenerateMissing = async () => {
    if (!entry.description) return alert("Zuerst Tätigkeitsbericht ausfüllen.");
    setIsGeneratingMissing(true);
    try {
        const suggestions = await geminiService.suggestMissingWork(entry.description, entry.activityType);
        setEntry(prev => ({ ...prev, missingWork: suggestions }));
    } catch (err) {
        alert("Fehler bei den Vorschlägen.");
    } finally { setIsGeneratingMissing(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => saveConfig({ ...config, logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEntry(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectIndex === -1) { alert("Bitte ein Projekt auswählen."); return; }
    if (!entry.location.trim()) { alert("Bitte den Einsatzort angeben."); return; }
    const project = config.projects[selectedProjectIndex];
    setUploadError(null);
    try {
      setStatus({ step: 'uploading' });
      
      // 1. Save to Firestore (Central Database)
      setUploadMessage("Speichere in Datenbank...");
      
      if (!auth.currentUser) {
        throw new Error("Nicht bei Google angemeldet. Bitte loggen Sie sich erneut ein.");
      }

      try {
        const firestoreEntry = {
          ...entry,
          technicianUid: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          images: [] 
        };
        await addDoc(collection(db, 'diaryEntries'), firestoreEntry);
      } catch (e: any) {
        handleFirestoreError(e, OperationType.CREATE, 'diaryEntries');
      }

      // 2. Generate PDF
      setUploadMessage("Generiere PDF...");
      let pdfBlob;
      try {
        const logoBase64 = await getLogoAsBase64(config.logo);
        pdfBlob = await generateDiaryPdf(entry, project.name, logoBase64);
        setLastGeneratedPdf(pdfBlob); 
        
        // Automatically trigger download of the generated PDF
        const safeLocation = entry.location ? entry.location.replace(/[^a-zA-Z0-9]/g, '_') : 'Unbekannt';
        const filename = `Bautagebuch_${entry.date}_${safeLocation}.pdf`;
        downloadBlob(pdfBlob, filename);
      } catch (e: any) {
        throw new Error(`Fehler bei der PDF-Erstellung: ${e.message}`);
      }
      
      localStorage.removeItem(DRAFT_KEY);
      
      // 3. Upload to Nextcloud (if credentials available)
      if (nextcloudCreds && pdfBlob) {
        setUploadMessage("Lade in Nextcloud hoch...");
        try {
          const project = config.projects[selectedProjectIndex];
          // Use entry specific path if set, otherwise fallback to config/project defaults
          const folderPath = (entry.nextcloudPath || config.defaultUploadFolder || project.nextcloudPath || '/Bautagebuch').replace(/\/$/, '');
          
          // Ensure folder exists (recursive)
          const folders = folderPath.split('/').filter(f => f);
          let currentPath = '';
          for (const folder of folders) {
            currentPath += `/${folder}`;
            const fullUrl = `${nextcloudCreds.webdavUrl.replace(/\/$/, '')}${currentPath}`;
            if (!(await nextcloudProxy.exists(fullUrl, nextcloudCreds))) {
              await nextcloudProxy.createDirectory(fullUrl, nextcloudCreds);
            }
          }

          const safeLocation = entry.location ? entry.location.replace(/[^a-zA-Z0-9]/g, '_') : 'Unbekannt';
          const filename = `Bautagebuch_${entry.date}_${safeLocation}.pdf`;
          const uploadUrl = `${nextcloudCreds.webdavUrl.replace(/\/$/, '')}${folderPath}/${filename}`;
          
          await nextcloudProxy.putFileContents(uploadUrl, pdfBlob, nextcloudCreds);
          setUploadMessage(prev => prev + " (Erfolgreich)");
        } catch (ncError: any) {
          console.error("Nextcloud Upload failed:", ncError);
          // Don't fail the whole process if only NC upload fails, but inform user
          setUploadMessage(prev => prev + " (Fehlgeschlagen: " + (ncError.message || "WebDAV Fehler") + ")");
        }
      }

      setStatus({ step: 'success' });
      
      // Refresh material analysis if admin
      if (currentUser?.role === 'admin') {
        handleAnalyzeMaterials();
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      let displayError = error.message || "Netzwerkfehler";
      
      // If it's a JSON error from Firestore, try to parse it
      if (displayError.startsWith('{') && displayError.endsWith('}')) {
        try {
          const parsed = JSON.parse(displayError);
          if (parsed.error && parsed.error.includes('insufficient permissions')) {
            displayError = "Berechtigungsfehler in der Datenbank. Bitte prüfen Sie, ob Sie als Administrator angemeldet sind oder ob der Einsatzort korrekt ausgefüllt ist.";
          } else {
            displayError = parsed.error || displayError;
          }
        } catch (e) { /* ignore */ }
      }
      
      setUploadError(displayError);
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
      technician: currentUser?.name || '',
      images: []
    }); 
    setSelectedProjectIndex(-1);
    setStatus({ step: 'form' }); 
    setLastGeneratedPdf(null); 
    setUploadError(null);
  };

  const handleReuseData = () => {
    // Keep location, weather, activityType, projectIndex
    // Reset images, description, missingWork, materials
    setEntry(prev => ({
      ...prev,
      images: [],
      description: '',
      missingWork: '',
      materials: [],
      date: new Date().toISOString().split('T')[0]
    }));
    setStatus({ step: 'form' });
    setLastGeneratedPdf(null);
    setUploadError(null);
  };

  useEffect(() => {
    if (isAuthReady && currentUser?.role === 'admin') {
      handleAnalyzeMaterials();
    }
  }, [isAuthReady, currentUser]);

  const handleAnalyzeMaterials = async () => {
    setIsAnalyzing(true);
    try {
        const q = query(
            collection(db, 'diaryEntries'),
            where('date', '>=', analysisStartDate),
            where('date', '<=', analysisEndDate),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        const materialMap: { [key: string]: number } = {};
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.materials && Array.isArray(data.materials)) {
                data.materials.forEach((m: any) => {
                    const amount = parseInt(m.amount) || 0;
                    materialMap[m.name] = (materialMap[m.name] || 0) + amount;
                });
            }
        });

        const results = Object.entries(materialMap).map(([name, amount]) => ({ name, amount }));
        setAnalysisResults(results);
    } catch (err) {
        console.error("Analysis failed", err);
        alert("Fehler bei der Material-Auswertung.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const exportMaterialCsv = () => {
    if (analysisResults.length === 0) return;
    
    const headers = ['Materialbezeichnung', 'Gesamtmenge', 'Einheit'];
    const rows = analysisResults.map(r => [r.name, r.amount, 'ST']);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Materialbedarf_${analysisStartDate}_bis_${analysisEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMaterialPdf = () => {
    if (analysisResults.length === 0) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(27, 62, 120); // Brand Blue
    doc.text('Material-Bedarfsliste', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Zeitraum: ${analysisStartDate} bis ${analysisEndDate}`, 14, 30);
    doc.text(`Erstellt am: ${new Date().toLocaleString()}`, 14, 35);

    // Table
    (doc as any).autoTable({
        startY: 45,
        head: [['Materialbezeichnung', 'Gesamtmenge', 'Einheit']],
        body: analysisResults.map(r => [r.name, r.amount, 'ST']),
        headStyles: { fillColor: [27, 62, 120] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 45 }
    });

    doc.save(`Materialbedarf_${analysisStartDate}_bis_${analysisEndDate}.pdf`);
  };

  if (!isAuthReady) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-600"></div>
        </div>
    );
  }

  if (status.step === 'uploading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {uploadError ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 text-red-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Speichern fehlgeschlagen</h2>
                <div className="bg-red-50 p-4 rounded-xl mb-6 text-left border border-red-100">
                    <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Fehlermeldung:</p>
                    <p className="text-sm text-red-700 font-bold leading-relaxed">{uploadError}</p>
                </div>
                <p className="text-xs text-gray-500 mb-6 italic">Tipp: Prüfen Sie Ihre Internetverbindung und ob Sie angemeldet sind.</p>
                <div className="space-y-3">
                    <Button onClick={() => lastGeneratedPdf && downloadBlob(lastGeneratedPdf, `Bautagebuch_Backup_${entry.date}.pdf`)} className="w-full py-3 flex items-center justify-center bg-brand-primary">
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
          <p className="text-gray-600 mb-8">Der Bericht wurde gespeichert und das PDF erstellt. Die Materialliste wurde in die Auswertung übernommen.</p>
          <div className="space-y-3">
             <Button onClick={() => lastGeneratedPdf && downloadBlob(lastGeneratedPdf, `Bautagebuch_${entry.date}.pdf`)} variant="outline" className="w-full">
                 <DownloadIcon /> PDF erneut herunterladen
             </Button>
             <Button onClick={handleReuseData} variant="secondary" className="w-full">Daten für neuen Bericht übernehmen</Button>
             <Button onClick={resetForm} className="w-full">Komplett neuer Bericht</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative font-sans selection:bg-brand-primary/10">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-white/20 px-4 py-3 flex items-center justify-between shadow-soft">
        <div className="flex items-center flex-1 overflow-hidden">
             <Logo className="h-10 md:h-12 w-auto shrink-0" src={config.logo} />
             <div className="ml-4 pl-4 border-l border-slate-200 hidden sm:flex flex-col">
                <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">Bautagebuch</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">IT-KOM Management</span>
             </div>
        </div>
        <div className="flex gap-3 shrink-0 items-center">
            {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setShowSettings(true)} 
                  className="p-2.5 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all duration-200"
                  title="Einstellungen"
                >
                    <SettingsIcon />
                </button>
            )}
            {currentUser && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{currentUser.role}</span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                  title="Abmelden"
                >
                  <LogoutIcon />
                </button>
              </div>
            )}
        </div>
      </div>

      {!currentUser ? (
          <div className="max-w-md mx-auto mt-16 p-6 animate-fade-in">
              <Logo className="h-24 mx-auto mb-10" src={config.logo} />
              <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-slate-100">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Anmelden</h2>
                    <p className="text-sm text-slate-400 font-medium mt-2">Willkommen zurück im Bautagebuch</p>
                    {config.nextcloudUrl && (
                        <div className="mt-4 flex items-center justify-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 w-fit mx-auto">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Server Bereit</span>
                        </div>
                    )}
                  </div>
                  <form onSubmit={handleLogin} className="space-y-6">
                      {status.step === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                            <p className="text-xs text-red-600 font-bold leading-relaxed">{status.error}</p>
                            {status.details && (
                                <div className="mt-3 pt-3 border-t border-red-100">
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        className="w-full text-[10px] py-2 h-auto border-red-200 text-red-700 hover:bg-red-100" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(status.details);
                                            alert("Debug-Info in Zwischenablage kopiert!");
                                        }}
                                    >
                                        Debug-Info kopieren
                                    </Button>
                                    <p className="text-[9px] text-red-400 mt-2 text-center">Senden Sie diese Info an den Support.</p>
                                </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => setStatus({ step: 'login' })}
                                className="w-full text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2 hover:text-red-600 transition-colors"
                            >
                                Schließen
                            </button>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Techniker auswählen oder eingeben</label>
                        
                        {config.technicians.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {config.technicians.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setLoginCode(t.nextcloudUser || t.name)}
                                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                                  loginCode === (t.nextcloudUser || t.name) 
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary/50'
                                }`}
                              >
                                {t.name}
                              </button>
                            ))}
                          </div>
                        )}

                        <input 
                          type="text" 
                          value={loginCode} 
                          onChange={e => setLoginCode(e.target.value)} 
                          placeholder="Benutzername" 
                          className="w-full text-center text-xl font-medium p-5 border border-slate-200 rounded-2xl outline-none input-focus bg-slate-50/50" 
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">App-Passwort</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={loginPassword} 
                            onChange={e => setLoginPassword(e.target.value)} 
                            placeholder="•••• •••• •••• ••••" 
                            className="w-full text-center text-xl p-5 border border-slate-200 rounded-2xl outline-none input-focus bg-slate-50/50 pr-14" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-primary transition-colors"
                            title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                          >
                            {showPassword ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full py-5 text-lg font-black rounded-2xl shadow-xl shadow-brand-primary/20 bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.98] transition-all">
                        ANMELDEN & STARTEN
                      </Button>

                      <div className="mt-6 p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">1</div>
                          <p className="text-[11px] text-blue-800 leading-relaxed">
                            Klicken Sie in Nextcloud unten links auf das <span className="font-bold">Zahnrad (Einstellungen)</span> &rarr; <span className="font-bold">Sicherheit</span>.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">2</div>
                          <p className="text-[11px] text-blue-800 leading-relaxed">
                            Geben Sie ganz unten bei "App-Name" <span className="font-bold">Bautagebuch</span> ein und klicken Sie auf <span className="font-bold">Neues App-Passwort erstellen</span>.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">3</div>
                          <p className="text-[11px] text-blue-800 leading-relaxed">
                            Kopieren Sie das Passwort (z.B. <span className="italic">abcd-efgh-ijkl-mnop</span>) und fügen Sie es oben ein. <span className="font-bold">Wichtig:</span> Das normale Login-Passwort funktioniert hier nicht!
                          </p>
                        </div>
                        <div className="pt-2 border-t border-blue-100">
                          <a 
                            href={`${(config.nextcloudUrl || 'https://nextcloud.it-kom.de').replace(/\/index\.php\/?$/, '')}/index.php/settings/user/security`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-center text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline"
                          >
                            Direkt zu den Sicherheitseinstellungen &rarr;
                          </a>
                        </div>
                      </div>
                  </form>
              </div>
          </div>
      ) : (
        <div className="max-w-3xl mx-auto p-4 md:p-10 animate-fade-in">
            {currentUser.role === 'admin' && (
                <div className="mb-10 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Material-Auswertung</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Zusammenfassung aller Materialien im Zeitraum</p>
                            </div>
                            <div className="flex gap-2">
                                {analysisResults.length > 0 && (
                                    <>
                                        <Button onClick={exportMaterialCsv} variant="outline" className="text-[10px] px-4 py-2">
                                            <DownloadIcon /> CSV
                                        </Button>
                                        <Button onClick={exportMaterialPdf} variant="outline" className="text-[10px] px-4 py-2">
                                            <DownloadIcon /> PDF
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 items-end mb-8">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Von</label>
                                <input 
                                    type="date" 
                                    value={analysisStartDate} 
                                    onChange={e => setAnalysisStartDate(e.target.value)}
                                    className="w-full p-4 border rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/10 bg-slate-50/50" 
                                />
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bis</label>
                                <input 
                                    type="date" 
                                    value={analysisEndDate} 
                                    onChange={e => setAnalysisEndDate(e.target.value)}
                                    className="w-full p-4 border rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/10 bg-slate-50/50" 
                                />
                            </div>
                            <Button onClick={handleAnalyzeMaterials} disabled={isAnalyzing} className="w-full md:w-auto px-8 py-4">
                                {isAnalyzing ? 'Analysiere...' : 'Auswerten'}
                            </Button>
                        </div>

                        {analysisResults.length > 0 ? (
                            <div className="bg-slate-50 border rounded-3xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100/50 border-b">
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Menge</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysisResults.map((r, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-white transition-colors">
                                                <td className="p-4 font-bold text-slate-700 text-sm">{r.name}</td>
                                                <td className="p-4 text-right font-black text-brand-primary">
                                                    <span className="bg-brand-primary/5 px-3 py-1 rounded-lg border border-brand-primary/10 text-xs">{r.amount} ST</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : !isAnalyzing && (
                            <div className="text-center py-10 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Klicken Sie auf "Auswerten", um die Analyse für den gewählten Zeitraum zu starten</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Header Card */}
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-soft border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Tagesbericht</h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">Erfassen Sie Ihre heutigen Tätigkeiten</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleManualPdfDownload} 
                      disabled={isGeneratingPdfOnly} 
                      className="w-full md:w-auto px-8 py-4 bg-slate-50 hover:bg-brand-primary/5 text-brand-primary rounded-2xl border border-slate-200 text-sm font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm"
                    >
                        {isGeneratingPdfOnly ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generiere...
                          </span>
                        ) : <><DownloadIcon /> Vorschau / PDF</>}
                    </button>
                </div>

                <div className="grid gap-8">
                    {/* Project Selection */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Projekt auswählen</label>
                        <div className="relative">
                          <select 
                            value={selectedProjectIndex} 
                            onChange={(e) => {
                                const idx = Number(e.target.value);
                                setSelectedProjectIndex(idx);
                                if (idx !== -1) {
                                  const project = config.projects[idx];
                                  setEntry(prev => ({ ...prev, nextcloudPath: project.nextcloudPath || config.defaultUploadFolder || '/Bautagebuch' }));
                                }
                            }} 
                            required 
                            className="block w-full appearance-none rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all font-bold text-slate-700"
                          >
                              <option value={-1} disabled>Bitte wählen...</option>
                              {config.projects.map((p, idx) => <option key={idx} value={idx}>{p.name}</option>)}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                    </div>

                    {/* Nextcloud Folder Selection */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Nextcloud Zielordner</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    placeholder="/Bautagebuch/Projektname" 
                                    value={entry.nextcloudPath} 
                                    onChange={e => setEntry({...entry, nextcloudPath: e.target.value})} 
                                    className="block w-full rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all font-bold text-slate-700" 
                                />
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleFormBrowseFolders}
                                className="px-6 py-5 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                            >
                                Durchsuchen
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">Geben Sie den Pfad an oder nutzen Sie "Durchsuchen".</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Datum</label>
                            <input 
                              type="date" 
                              required 
                              value={entry.date} 
                              onChange={e => setEntry({...entry, date: e.target.value})} 
                              className="block w-full rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all font-mono font-bold text-slate-700" 
                            />
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Einsatzort</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="z.B. Berlin" 
                              value={entry.location} 
                              onChange={e => setEntry({...entry, location: e.target.value})} 
                              className="block w-full rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all font-bold text-slate-700" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Wetter</label>
                            <div className="relative">
                              <select 
                                value={entry.weather} 
                                onChange={e => setEntry({...entry, weather: e.target.value as any})} 
                                className="block w-full appearance-none rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all font-bold text-slate-700"
                              >
                                  {Object.values(WeatherCondition).map(w => <option key={w} value={w}>{w}</option>)}
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Tätigkeit</label>
                            <div className="relative">
                              <select 
                                value={entry.activityType} 
                                onChange={e => setEntry({...entry, activityType: e.target.value as any})} 
                                className="block w-full appearance-none rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all font-bold text-slate-700"
                              >
                                  <option value="Tiefbau">Tiefbau</option>
                                  <option value="Einblasen">Einblasen</option>
                                  <option value="Spleißen">Spleißen</option>
                                  <option value="Hausanschluss">Hausanschluss</option>
                                  <option value="Sonstiges">Sonstiges</option>
                              </select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Report Section */}
                <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tätigkeitsbericht</label>
                        <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={handleAnalyzeImages} 
                              className="text-[10px] bg-brand-primary text-white px-4 py-2 rounded-full flex items-center font-black shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all active:scale-95"
                            >
                                {isAnalyzingImages ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    KI analysiert...
                                  </span>
                                ) : <><PhotoSparklesIcon /> KI-Analyse</>}
                            </button>
                            <button 
                              type="button" 
                              onClick={handleEnhanceText} 
                              className="text-[10px] bg-slate-800 text-white px-4 py-2 rounded-full flex items-center font-black shadow-lg shadow-slate-800/20 hover:bg-slate-900 transition-all active:scale-95"
                            >
                                {isEnhancingText ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    KI verbessert...
                                  </span>
                                ) : <><MagicWandIcon /> Verbessern</>}
                            </button>
                        </div>
                    </div>
                    <textarea 
                      rows={6} 
                      required 
                      placeholder="Beschreiben Sie die heute durchgeführten Arbeiten..." 
                      value={entry.description} 
                      onChange={e => setEntry({...entry, description: e.target.value})} 
                      className="block w-full rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all text-slate-700 min-h-[180px] leading-relaxed" 
                    />
                </div>

                {/* Missing Work Section */}
                <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Restarbeiten / Fehlende Leistungen</label>
                        <button 
                          type="button" 
                          onClick={handleGenerateMissing} 
                          className="text-[10px] bg-slate-100 text-slate-600 px-4 py-2 rounded-full flex items-center font-black border border-slate-200 hover:bg-slate-200 transition-all active:scale-95"
                        >
                            {isGeneratingMissing ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-3 w-3 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                KI schlägt vor...
                              </span>
                            ) : <><InfoIcon /> KI-Vorschläge</>}
                        </button>
                    </div>
                    <textarea 
                      rows={3} 
                      placeholder="Welche Arbeiten müssen noch erledigt werden?" 
                      value={entry.missingWork} 
                      onChange={e => setEntry({...entry, missingWork: e.target.value})} 
                      className="block w-full rounded-2xl border-slate-200 p-5 border bg-slate-50/50 input-focus outline-none transition-all text-slate-700 min-h-[100px] leading-relaxed" 
                    />
                </div>

                {/* Material List Section */}
                <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 ml-1">Materialliste</label>
                    <div className="flex flex-col sm:flex-row gap-3 mb-8 items-stretch sm:items-center">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                list="material-options"
                                placeholder="Material suchen..." 
                                value={materialInput.name} 
                                onChange={e => setMaterialInput({ ...materialInput, name: e.target.value })} 
                                className="w-full p-4 border border-slate-200 rounded-2xl text-sm input-focus outline-none bg-slate-50/50 transition-all font-medium" 
                            />
                            <datalist id="material-options">
                                {MATERIAL_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                        </div>
                        <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden w-full sm:w-32 focus-within:ring-4 focus-within:ring-brand-primary/10 focus-within:border-brand-primary transition-all">
                            <input 
                                type="text" 
                                placeholder="0" 
                                value={materialInput.amount} 
                                onChange={e => setMaterialInput({ ...materialInput, amount: e.target.value })} 
                                onFocus={e => e.target.select()}
                                className="w-full p-4 text-sm border-none focus:ring-0 outline-none bg-transparent text-center font-bold text-slate-700" 
                            />
                            <span className="pr-4 text-[10px] font-black text-slate-400 select-none">ST</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (!materialInput.name || !materialInput.amount) return;
                            setEntry(prev => ({ ...prev, materials: [...prev.materials, { name: materialInput.name, amount: `${materialInput.amount} ST` }] }));
                            setMaterialInput({ name: '', amount: '1' });
                          }} 
                          className="p-4 bg-brand-primary text-white rounded-2xl hover:bg-brand-primary/90 transition-all active:scale-95 shadow-lg shadow-brand-primary/20 flex items-center justify-center"
                        >
                            <PlusIcon />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {entry.materials.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Kein Material hinzugefügt</p>
                          </div>
                        )}
                        {entry.materials.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 text-sm group hover:border-brand-primary/30 hover:shadow-soft transition-all animate-fade-in">
                                <div className="flex items-center gap-4">
                                  <span className="bg-brand-primary/5 text-brand-primary font-black px-4 py-1.5 rounded-xl text-[11px] border border-brand-primary/10">{m.amount}</span>
                                  <span className="font-bold text-slate-700">{m.name}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setEntry(prev => ({ ...prev, materials: prev.materials.filter((_, i) => i !== idx) }))} 
                                  className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Photo Documentation Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fotodokumentation</label>
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{entry.images.length} BILDER</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {entry.images.map((f, i) => (
                            <div key={i} className="relative aspect-square border border-slate-100 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    type="button" 
                                    onClick={() => setEntry({...entry, images: entry.images.filter((_, idx) => idx !== i)})} 
                                    className="bg-red-500 text-white p-2 rounded-xl hover:scale-110 transition-transform"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                            </div>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all group">
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-100 transition-all">
                              <CameraIcon />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest group-hover:text-brand-600">Foto hinzufügen</span>
                            <input type="file" multiple accept="image/*" capture="environment" onChange={handleImageAdd} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Submit Section */}
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-xl font-black rounded-3xl shadow-xl shadow-brand-primary/30 active:scale-[0.98] transition-transform"
                  >
                      BERICHT ABSCHLIESSEN
                  </Button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-6">
                    IT-KOM Bautagebuch System v1.2.6
                  </p>
                </div>
            </form>
        </div>
      )}

      {showSettings && currentUser?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div className="flex items-center gap-6">
                        <h3 className="text-2xl font-bold text-brand-900">Administration</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setShowSettings(false); setEditingTechId(null); setShowHelp(false); }} className="p-2 text-gray-500 hover:text-gray-800"><CloseIcon /></button>
                    </div>
                </div>
                
                <div className="mt-6">
                        <div className="grid lg:grid-cols-3 gap-8">
                    {/* Firmenlogo & Backup */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-brand-primary">Logo & Design</h4>
                            <div className="bg-gray-50 p-6 rounded-xl border text-center">
                                <div className="flex justify-center mb-6 bg-white p-4 rounded-lg border border-dashed items-center min-h-[120px]">
                                    <Logo className="h-20 w-auto" src={config.logo} />
                                </div>
                                <label className="block w-full py-2 px-4 bg-brand-primary text-white rounded-lg cursor-pointer hover:bg-brand-primary/90 text-sm font-bold mb-2">
                                    Neues Logo hochladen
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                {config.logo && (
                                    <button onClick={() => saveConfig({ ...config, logo: undefined })} className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Logo zurücksetzen</button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-xs font-bold uppercase text-brand-600">Nextcloud Integration</h4>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                                <p className="text-[11px] text-blue-700 leading-relaxed">Geben Sie die Basis-URL Ihrer Nextcloud-Instanz an.</p>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Nextcloud Server-Adresse (Basis)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="url" 
                                            placeholder="https://nextcloud.it-kom.de" 
                                            value={config.nextcloudUrl || ''} 
                                            onChange={e => saveConfig({ ...config, nextcloudUrl: e.target.value })} 
                                            className="flex-1 p-3 text-xs border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
                                        />
                                        <button 
                                            onClick={() => {
                                                const fullUrl = prompt("Kopieren Sie die WebDAV-Adresse aus Nextcloud (unten links bei Dateien -> Einstellungen) hier hinein:");
                                                if (!fullUrl) return;
                                                
                                                try {
                                                    const url = new URL(fullUrl);
                                                    const baseUrl = `${url.protocol}//${url.host}`;
                                                    saveConfig({ ...config, nextcloudUrl: baseUrl, manualWebdavUrl: fullUrl });
                                                    
                                                    // Extract username from /files/USERNAME/
                                                    const match = fullUrl.match(/\/files\/([^/]+)\/?/);
                                                    if (match && match[1]) {
                                                        const extractedUser = decodeURIComponent(match[1]);
                                                        alert(`Erfolg! \nServer: ${baseUrl}\nBenutzername erkannt: ${extractedUser}\n\nBitte geben Sie jetzt noch Ihr App-Passwort beim Login ein.`);
                                                    } else {
                                                        alert(`Server erkannt: ${baseUrl}\nDer Benutzername konnte nicht automatisch aus dem Pfad gelesen werden, aber der Pfad wurde gespeichert.`);
                                                    }
                                                } catch (e) {
                                                    alert("Ungültige URL. Bitte kopieren Sie die komplette Adresse.");
                                                }
                                            }}
                                            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-200 transition-colors"
                                            title="URL aus Nextcloud kopieren"
                                        >
                                            URL-Assistent
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-blue-400 ml-1">Die Basis-URL Ihres Nextcloud-Servers.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Manueller WebDAV-Pfad (für Experten)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Wird automatisch vom Assistenten ausgefüllt" 
                                            value={config.manualWebdavUrl || ''} 
                                            onChange={e => saveConfig({ ...config, manualWebdavUrl: e.target.value })} 
                                            className="flex-1 p-3 text-xs border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
                                        />
                                        <button 
                                            onClick={async () => {
                                                if (!config.nextcloudUrl) return alert("Bitte URL eingeben");
                                                const user = prompt("Benutzername für Test:");
                                                const pass = prompt("App-Passwort für Test:");
                                                if (!user || !pass) return;
                                                
                                                try {
                                                    setStatus({ step: 'uploading' });
                                                    setUploadMessage('Teste Verbindung...');
                                                    
                                                    const cleanUrl = config.nextcloudUrl.trim().replace(/\/$/, '');
                                                    let variations: string[] = [];
                                                    
                                                    // 1. If it's already a full WebDAV URL, try it first
                                                    if (config.manualWebdavUrl) {
                                                        variations.push(config.manualWebdavUrl);
                                                        if (!config.manualWebdavUrl.endsWith('/')) variations.push(config.manualWebdavUrl + '/');
                                                    }
                                                    
                                                    // 2. Add standard variations
                                                    const bases = [cleanUrl, `${cleanUrl}/nextcloud`].filter(u => u);
                                                    const paths = [
                                                        '/remote.php/dav/files/', 
                                                        '/remote.php/webdav/', 
                                                        '/index.php/remote.php/dav/files/',
                                                        '/remote.php/dav/',
                                                        '/dav/files/'
                                                    ];
                                                    const users = [
                                                        user, 
                                                        user.toLowerCase(), 
                                                        user.replace(/\s+/g, ''),
                                                        user.split('@')[0],
                                                        user.replace(/\s+/g, '.').toLowerCase(),
                                                        ''
                                                    ].filter((u): u is string => u !== null);
                                                    
                                                    for (const b of bases) {
                                                        for (const p of paths) {
                                                            for (const u of users) {
                                                                variations.push(`${b}${p}${encodeURIComponent(u)}/`);
                                                            }
                                                        }
                                                    }
                                                    
                                                    variations = Array.from(new Set(variations));
                                                    
                                                    let log = "Verbindungs-Test Protokoll:\n";
                                                    let found = false;
                                                    const propfindBody = `<?xml version="1.0" encoding="UTF-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/></d:prop></d:propfind>`;
                                                    
                                                    // 0. Check Server Status first
                                                    const statusUrls = [
                                                        `${cleanUrl}/status.php`,
                                                        `${cleanUrl}/index.php/status.php`,
                                                        `${cleanUrl}/nextcloud/status.php`,
                                                        `${cleanUrl}/nextcloud/index.php/status.php`
                                                    ];
                                                    
                                                    for (const sUrl of statusUrls) {
                                                        try {
                                                            await new Promise(r => setTimeout(r, 200));
                                                            log += `Prüfe Server-Status: ${sUrl} ... `;
                                                            const sRes = await fetch('/api/nextcloud/proxy', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ url: sUrl, method: 'GET' })
                                                            });
                                                            const sText = await sRes.text();
                                                            const allowHeader = sRes.headers.get('allow');
                                                            const ncVersion = sRes.headers.get('x-nextcloud-version');
                                                            log += `Status: ${sRes.status} (${sText.substring(0, 20).trim()}) ${allowHeader ? `[Allow: ${allowHeader}]` : ''} ${ncVersion ? `[NC: ${ncVersion}]` : ''} ${sRes.headers.get('server') ? `[Server: ${sRes.headers.get('server')}]` : ''}\n`;
                                                            if (sRes.status === 200 && (sText.includes('version') || ncVersion)) {
                                                                log += "ERFOLG: Nextcloud-Server unter dieser URL bestätigt!\n";
                                                                break;
                                                            }
                                                        } catch (e) {
                                                            log += `Fehler beim Status-Check: ${e}\n`;
                                                        }
                                                    }

                                                    for (const url of variations) {
                                                        log += `Prüfe: ${url} ... `;
                                                        try {
                                                            // Try OPTIONS first
                                                            const optRes = await fetch('/api/nextcloud/proxy', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ url, method: 'OPTIONS', username: user, password: pass })
                                                            });
                                                            const optText = await optRes.text();
                                                            log += `(OPTIONS: ${optRes.status}) `;

                                                            let res = await fetch('/api/nextcloud/proxy', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ 
                                                                    url, 
                                                                    method: 'PROPFIND', 
                                                                    username: user, 
                                                                    password: pass, 
                                                                    headers: { 'Depth': '0', 'Content-Type': 'application/xml' },
                                                                    data: propfindBody
                                                                })
                                                            });
                                                            
                                                            if (res.status === 405) {
                                                                log += `(PROPFIND 405 -> Versuche GET) `;
                                                                res = await fetch('/api/nextcloud/proxy', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ url, method: 'GET', username: user, password: pass })
                                                                });
                                                            }
                                                            
                                                            const resText = await res.text();
                                                            const allowHeader = res.headers.get('allow');
                                                            log += `Status: ${res.status} (${resText.substring(0, 20).trim()}) ${allowHeader ? `[Allow: ${allowHeader}]` : ''} ${res.headers.get('server') ? `[Server: ${res.headers.get('server')}]` : ''}\n`;
                                                            
                                                            if (res.status === 207 || res.status === 401 || (res.status === 200 && (url.includes('remote.php') || resText.includes('Nextcloud')))) {
                                                                found = true;
                                                                if (res.status === 401) {
                                                                    alert(`Pfad gefunden, aber Authentifizierung fehlgeschlagen (401).\nBitte prüfen Sie Ihr Passwort.\nPfad: ${url}`);
                                                                } else {
                                                                    alert(`ERFOLG! Verbindung hergestellt.\nPfad: ${url}`);
                                                                }
                                                                saveConfig({ ...config, manualWebdavUrl: url });
                                                                break;
                                                            }
                                                        } catch (e) {
                                                            log += `Fehler: ${e}\n`;
                                                        }
                                                        if (found) break;
                                                    }
                                                    
                                                    if (!found) {
                                                        console.log(log);
                                                        const copy = confirm("Verbindung fehlgeschlagen. Möchten Sie das detaillierte Fehler-Protokoll kopieren?");
                                                        if (copy) {
                                                            navigator.clipboard.writeText(log);
                                                            alert("Protokoll kopiert!");
                                                        }
                                                    }
                                                } catch (err) {
                                                    alert("Fehler: " + err);
                                                } finally {
                                                    setStatus({ step: 'login' });
                                                }
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                        >
                                            Testen
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-blue-400 ml-1">Hier wird der exakte WebDAV-Pfad gespeichert, den der Assistent ermittelt hat.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">WebDAV Benutzername (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="z.B. u12345678 (siehe Mobil & Desktop)" 
                                        value={config.webdavUsername || ''} 
                                        onChange={e => saveConfig({ ...config, webdavUsername: e.target.value })} 
                                        className="w-full p-3 text-xs border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
                                    />
                                    <p className="text-[9px] text-blue-400 ml-1">Die Basis-URL Ihres Nextcloud-Servers (wird für alle Benutzer verwendet).</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Zielordner für Uploads</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            readOnly
                                            placeholder="/Bautagebuch" 
                                            value={config.defaultUploadFolder || '/Bautagebuch'} 
                                            className="flex-1 p-3 text-xs border border-blue-200 rounded-xl outline-none bg-gray-50" 
                                        />
                                        <button 
                                            onClick={() => {
                                                if (!nextcloudCreds) {
                                                    alert("Bitte zuerst die Verbindung testen oder sich einloggen.");
                                                    return;
                                                }
                                                handleBrowseFolders();
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                        >
                                            Durchsuchen
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-blue-400 ml-1">Wählen Sie den Ordner in Ihrer Nextcloud aus, in dem die Berichte gespeichert werden sollen.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Manueller WebDAV-Pfad (Optional)</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://.../remote.php/dav/files/user/" 
                                        value={config.manualWebdavUrl || ''} 
                                        onChange={e => saveConfig({ ...config, manualWebdavUrl: e.target.value })} 
                                        className="w-full p-3 text-xs border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
                                    />
                                    <p className="text-[9px] text-blue-400 ml-1">Nur nötig, wenn der automatische Login fehlschlägt. Kopieren Sie den Link aus den Nextcloud-Einstellungen (unten links bei Dateien).</p>
                                </div>
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

                    {/* Einsatzgebiete */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-brand-primary">Einsatzgebiete / Projekte</h4>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                            {config.projects.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Keine Einsatzgebiete angelegt.</p>}
                            {config.projects.map(p => (
                                <div key={p.token} className="flex flex-col p-2 bg-white rounded border text-sm shadow-sm gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <span className="font-medium truncate">{p.name}</span>
                                            <p className="text-[10px] text-slate-400">Pfad: {p.nextcloudPath || '/Bautagebuch'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    if (!nextcloudCreds) return alert("Bitte zuerst einloggen oder Verbindung testen.");
                                                    setBrowseCallback(() => (selectedPath: string) => {
                                                        const updatedProjects = config.projects.map(pr => 
                                                            pr.token === p.token ? { ...pr, nextcloudPath: selectedPath } : pr
                                                        );
                                                        saveConfig({ ...config, projects: updatedProjects });
                                                    });
                                                    handleBrowseFolders();
                                                }}
                                                className="text-blue-500 p-1 hover:bg-blue-50 rounded"
                                                title="Ordner auswählen"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                            </button>
                                            <button onClick={() => { if(confirm("Einsatzgebiet löschen?")) saveConfig({...config, projects: config.projects.filter(pr => pr.token !== p.token)}) }} className="text-red-400 p-1"><TrashIcon /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 bg-white p-3 rounded-lg border shadow-sm">
                            <input placeholder="Name des Einsatzgebiets" value={newProjName} onChange={e => setNewProjName(e.target.value)} className="w-full p-2 border rounded text-sm" />
                            <div className="flex gap-2">
                                <input placeholder="Nextcloud Pfad (z.B. /Projekte/Berlin)" value={newProjLink} onChange={e => setNewProjLink(e.target.value)} className="flex-1 p-2 border rounded text-sm" />
                                <button 
                                    onClick={() => {
                                        if (!nextcloudCreds) return alert("Bitte zuerst einloggen oder Verbindung testen.");
                                        setBrowseCallback(() => (selectedPath: string) => {
                                            setNewProjLink(selectedPath);
                                        });
                                        handleBrowseFolders();
                                    }}
                                    className="bg-blue-100 text-blue-600 px-3 rounded-lg text-[10px] font-bold uppercase"
                                >
                                    Wählen
                                </button>
                            </div>
                            <Button onClick={() => {
                                if (!newProjName) return alert("Bitte Namen eingeben.");
                                const token = Math.random().toString(36).substr(2, 9);
                                saveConfig({...config, projects: [...config.projects, { name: newProjName, link: '', token, nextcloudPath: newProjLink || '/Bautagebuch' }]});
                                setNewProjName('');
                                setNewProjLink('');
                            }} className="w-full">Hinzufügen</Button>
                        </div>
                    </div>

                    {/* Technikerverwaltung */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase text-brand-primary">Techniker & Passwörter</h4>
                        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                            {config.technicians.map(t => (
                                <div key={t.id} className={`flex flex-col p-2 bg-white rounded border text-sm shadow-sm ${editingTechId === t.id ? 'border-brand-500 bg-brand-50' : 'border-gray-100'}`}>
                                    {editingTechId === t.id ? (
                                        <div className="space-y-2">
                                            <input value={editTechName} onChange={e => setEditTechName(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Name" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={editTechCode} onChange={e => setEditTechCode(e.target.value)} className="w-full p-1 border rounded text-xs uppercase" placeholder="Kürzel" />
                                                <input value={editTechPass} onChange={e => setEditTechPass(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Login-Passwort" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={editTechNextcloudUser} onChange={e => setEditTechNextcloudUser(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Nextcloud Benutzername" />
                                                <input value={editTechNextcloudPass} onChange={e => setEditTechNextcloudPass(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Nextcloud App-Passwort" />
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
                                                <p className="text-[9px] text-gray-400">Rolle: {t.role} | NC-User: {t.nextcloudUser || 'Wie Name'}</p>
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
                                <input placeholder="Login-Passwort" value={newTechPass} onChange={e => setNewTechPass(e.target.value)} className="w-full p-2 border rounded text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input placeholder="Nextcloud Benutzername (Optional)" value={newTechNextcloudUser} onChange={e => setNewTechNextcloudUser(e.target.value)} className="w-full p-2 border rounded text-xs shadow-inner" />
                                <input placeholder="Nextcloud App-Passwort (Optional)" value={newTechNextcloudPass} onChange={e => setNewTechNextcloudPass(e.target.value)} className="w-full p-2 border rounded text-xs shadow-inner" />
                            </div>
                            <select value={newTechRole} onChange={e => setNewTechRole(e.target.value as any)} className="w-full p-2 border rounded text-xs bg-white mb-2 shadow-inner">
                                <option value="user">Techniker (User)</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <Button onClick={() => {
                                if (!newTechName || !newTechCode) return alert("Felder füllen.");
                                saveConfig({...config, technicians: [...config.technicians, { 
                                    id: Date.now().toString(), 
                                    name: newTechName, 
                                    code: newTechCode.toUpperCase(), 
                                    password: newTechPass, 
                                    nextcloudUser: newTechNextcloudUser || newTechName,
                                    nextcloudPass: newTechNextcloudPass,
                                    role: newTechRole 
                                }]});
                                setNewTechName(''); setNewTechCode(''); setNewTechPass(''); setNewTechNextcloudUser(''); setNewTechNextcloudPass('');
                            }} variant="secondary" className="w-full py-1 text-xs">Techniker hinzufügen</Button>
                        </div>
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

      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 animate-scale-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Hilfe zur Verbindung</h3>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <CloseIcon />
              </button>
            </div>
            
            <div className="space-y-8">
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                  <h4 className="font-bold text-slate-800">App-Passwort erstellen</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed ml-11">
                  Loggen Sie sich im Browser in Ihre Nextcloud ein. Gehen Sie zu <span className="font-bold">Einstellungen &rarr; Sicherheit</span>. 
                  Ganz unten bei "Geräte & Sitzungen" geben Sie "Bautagebuch" ein und klicken auf "Neues App-Passwort erstellen". 
                  Kopieren Sie das Passwort (z.B. <code className="bg-slate-100 px-1 rounded">abcd-efgh-ijkl-mnop</code>).
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                  <h4 className="font-bold text-slate-800">WebDAV-Link finden (Wichtig für IONOS)</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed ml-11">
                  Gehen Sie in Nextcloud zu <span className="font-bold">Einstellungen &rarr; Mobil & Desktop</span>. 
                  Kopieren Sie dort ganz unten den <span className="font-bold">WebDAV-Link</span>. 
                  Fügen Sie diesen Link in der App unter <span className="italic">Einstellungen &rarr; Nextcloud Server URL</span> ein.
                  <code className="text-[10px] bg-slate-100 p-1 block mt-2 rounded break-all">https://nc-123.nextcloud-ionos.com/remote.php/dav/files/user/</code>
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                  <h4 className="font-bold text-slate-800">In der App eintragen</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed ml-11">
                  Melden Sie sich als Administrator an (Code: <span className="font-bold">ADMIN</span>, Passwort: <span className="font-bold">admin123</span>). 
                  Gehen Sie in die Einstellungen und fügen Sie den kopierten Link bei <span className="font-bold">"Manueller WebDAV-Pfad"</span> ein.
                </p>
              </section>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <h5 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                  <InfoIcon /> Wichtiger Hinweis für IONOS
                </h5>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Bei IONOS-Nextcloud ist der Benutzername oft identisch mit Ihrem Namen in der Cloud (z.B. "Ronja Holdorf"). 
                  Achten Sie darauf, dass der manuelle Pfad exakt so endet, wie er in Nextcloud angezeigt wird.
                </p>
              </div>
            </div>

            <Button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 rounded-2xl font-bold">Verstanden</Button>
          </div>
        </div>
      )}

      {isBrowsingFolders && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ordner auswählen</h3>
                    <button onClick={() => setIsBrowsingFolders(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><CloseIcon /></button>
                </div>
                
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0"></div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest truncate">Pfad: {currentBrowsePath || '/'}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {browseLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-primary mb-4"></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lade Ordner...</p>
                        </div>
                    ) : (
                        <>
                            {currentBrowsePath && (
                                <button 
                                    onClick={() => {
                                        const parts = currentBrowsePath.split('/').filter(p => p);
                                        parts.pop();
                                        const basePath = new URL(nextcloudCreds?.webdavUrl || '').pathname;
                                        const newPath = '/' + parts.join('/') + '/';
                                        if (newPath.length < basePath.length) {
                                            handleBrowseFolders(); // Reset to base
                                        } else {
                                            handleBrowseFolders(newPath);
                                        }
                                    }}
                                    disabled={currentBrowsePath === new URL(nextcloudCreds?.webdavUrl || '').pathname}
                                    className="w-full p-4 flex items-center gap-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-dashed border-slate-200 transition-all group disabled:opacity-30"
                                >
                                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zurück</span>
                                </button>
                            )}
                            {browseFolders.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keine Unterordner gefunden</p>
                                </div>
                            ) : (
                                browseFolders.map(f => (
                                    <button 
                                        key={f.path}
                                        onClick={() => handleBrowseFolders(f.path)}
                                        className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{f.name}</span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsBrowsingFolders(false)}
                        className="flex-1 py-4 rounded-2xl font-bold"
                    >
                        Abbrechen
                    </Button>
                    <Button 
                        onClick={() => {
                            const basePath = new URL(nextcloudCreds?.webdavUrl || '').pathname;
                            let relativePath = currentBrowsePath || '/';
                            if (relativePath.startsWith(basePath)) {
                                relativePath = relativePath.substring(basePath.length);
                            }
                            if (!relativePath.startsWith('/')) relativePath = '/' + relativePath;
                            if (relativePath.length > 1 && relativePath.endsWith('/')) relativePath = relativePath.slice(0, -1);
                            
                            if (browseCallback) {
                                browseCallback(relativePath);
                                setBrowseCallback(null);
                            } else {
                                saveConfig({ ...config, defaultUploadFolder: relativePath });
                            }
                            setIsBrowsingFolders(false);
                        }}
                        disabled={!currentBrowsePath}
                        className="flex-1 py-4 rounded-2xl font-bold shadow-lg shadow-brand-primary/20"
                    >
                        Auswählen
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
