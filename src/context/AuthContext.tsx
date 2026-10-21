import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, query, where } from 'firebase/firestore';
import { auth, db, isConfiguredAdmin } from '../firebase/config';
import { UserProfile, PlatformSettings, Language, Theme, NotificationItem } from '../types';
import { generateUserId } from '../utils/idGenerator';
import { ensureInitialDatabaseSeeded } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  settings: PlatformSettings | null;
  unreadCount: number;
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot') => void;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('pb_lang') as Language) || 'en';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('pb_theme') as Theme) || 'dark';
  });
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pb_lang', lang);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    localStorage.setItem('pb_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Seed default data & listen to platform settings
  useEffect(() => {
    ensureInitialDatabaseSeeded();

    const unsubSettings = onSnapshot(doc(db, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as PlatformSettings);
      }
    }, (err) => {
      console.warn('Settings listener note:', err);
    });

    return () => unsubSettings();
  }, []);

  // Sync user profile when user changes
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubNotifs: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Listen to live user profile
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Check if user is configured admin but role not set
            if (isConfiguredAdmin(user.email) && data.role !== 'admin') {
              try {
                await setDoc(userRef, { role: 'admin' }, { merge: true });
                await setDoc(doc(db, 'admins', user.uid), { email: user.email, activatedAt: new Date().toISOString() });
              } catch (e) {
                console.warn('Admin sync note:', e);
              }
            }
            setUserProfile(data);
          } else {
            // Document does not exist yet (e.g. first login via Google or external)
            const role = isConfiguredAdmin(user.email) ? 'admin' : 'user';
            const initialProfile: UserProfile = {
              uid: user.uid,
              userId: generateUserId(),
              email: user.email || '',
              displayName: user.displayName || 'Member',
              role,
              balance: 0,
              totalDeposited: 0,
              totalPurchased: 0,
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userRef, initialProfile);
              if (role === 'admin') {
                await setDoc(doc(db, 'admins', user.uid), { email: user.email, activatedAt: new Date().toISOString() });
              }
              setUserProfile(initialProfile);
            } catch (err) {
              console.error('Error creating user profile:', err);
            }
          }
          setLoading(false);
        }, (err) => {
          console.warn('Profile listener note:', err);
          setLoading(false);
        });

        // Listen to unread notifications
        try {
          const notifQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('isRead', '==', false)
          );
          unsubNotifs = onSnapshot(notifQuery, (snap) => {
            setUnreadCount(snap.size);
          }, (err) => {
            console.warn('Notifications count note:', err);
          });
        } catch (e) {
          console.warn('Notifications query note:', e);
        }

      } else {
        setUserProfile(null);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  const isAdmin = Boolean(
    isConfiguredAdmin(currentUser?.email) || userProfile?.role === 'admin'
  );

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    
    // Send verification email
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Verification email send notice:', e);
    }

    const role = isConfiguredAdmin(email) ? 'admin' : 'user';
    const profile: UserProfile = {
      uid: cred.user.uid,
      userId: generateUserId(),
      email: email.toLowerCase().trim(),
      displayName: name.trim() || 'Member',
      role,
      balance: 0,
      totalDeposited: 0,
      totalPurchased: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), profile);
    if (role === 'admin') {
      await setDoc(doc(db, 'admins', cred.user.uid), { email, activatedAt: new Date().toISOString() });
    }
    setUserProfile(profile);
    closeAuthModal();
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    closeAuthModal();
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        language,
        setLanguage,
        theme,
        toggleTheme,
        settings,
        unreadCount,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        logout,
        resetPassword,
        resendVerification,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
