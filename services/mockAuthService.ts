
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { User, UserRole } from '../types';
import { USERS_STORAGE_KEY, CURRENT_USER_KEY } from '../constants';

// --- LOCAL STORAGE HELPERS (Fallback) ---
const getLocalUsers = (): User[] => {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

const saveLocalUsers = (users: User[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Map database profile to App User type
const mapProfileToUser = (profile: any): User => ({
    id: profile.id,
    email: profile.email || '',
    name: profile.name || '',
    surnames: profile.surnames || '',
    role: profile.role as UserRole,
    phone: profile.phone,
    photoUrl: profile.photo_url,
    assignedPsychologistId: profile.assigned_psychologist_id,
    assignedPsychologistEmail: profile.assigned_psychologist_email
});

export const registerUser = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole = 'patient', 
    assignedPsychologistId?: string,
    surnames?: string,
    phone?: string
): Promise<User> => {
  
  if (!IS_SUPABASE_CONFIGURED) {
      // Local Mode
      const users = getLocalUsers();
      if (users.find(u => u.email === email)) throw new Error("El usuario ya existe (Local).");
      
      const newUser: User = {
          id: crypto.randomUUID(),
          email,
          name,
          surnames,
          role,
          phone,
          password, // Storing password locally for demo purposes only
          assignedPsychologistId,
          photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(surnames || '')}&background=EF8762&color=fff`
      };
      
      users.push(newUser);
      saveLocalUsers(users);
      return newUser;
  }

  // Supabase Mode
  const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
  });

  const { data: authData, error: authError } = await tempClient.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("No se pudo crear el usuario");

  // Force Admin role if email matches default admin email
  const finalRole = email === 'admin@naret.app' ? 'admin' : role;

  const newProfile = {
    id: authData.user.id,
    email,
    name,
    surnames,
    role: finalRole,
    phone,
    assigned_psychologist_id: assignedPsychologistId,
    photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}+${encodeURIComponent(surnames || '')}&background=EF8762&color=fff`
  };

  const { error: profileError } = await tempClient
    .from('profiles')
    .insert([newProfile]);

  if (profileError) {
      console.error("Error creating profile:", profileError);
      throw new Error("Error al crear el perfil de usuario: " + profileError.message);
  }

  return mapProfileToUser(newProfile);
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  if (!IS_SUPABASE_CONFIGURED) {
      // Local Mode
      const users = getLocalUsers();
      
      // Seed Admin if empty
      if (users.length === 0 && email === 'admin@naret.app' && password === 'admin123') {
          const admin: User = { 
              id: 'admin-1', 
              email, 
              name: 'Admin', 
              role: 'admin', 
              password,
              photoUrl: 'https://ui-avatars.com/api/?name=Admin&background=EF8762&color=fff' 
            };
          users.push(admin);
          saveLocalUsers(users);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(admin));
          return admin;
      }

      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error("Credenciales inválidas (Local).");
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
  }

  // Supabase Mode
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Error de inicio de sesión");

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) throw new Error("No se pudo cargar el perfil del usuario");

  // AUTO-FIX: If logging in as admin email but role is wrong, fix it.
  if (email === 'admin@naret.app' && profile.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
      profile.role = 'admin';
  }

  return mapProfileToUser(profile);
};

export const logoutUser = async () => {
  if (IS_SUPABASE_CONFIGURED) {
      await supabase.auth.signOut();
  }
  localStorage.removeItem(CURRENT_USER_KEY); 
};

export const getCurrentSession = async (): Promise<User | null> => {
  if (!IS_SUPABASE_CONFIGURED) {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  // AUTO-FIX: If session exists for admin email but role is wrong, fix it.
  if (session.user.email === 'admin@naret.app' && profile.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
      profile.role = 'admin';
  }

  return mapProfileToUser(profile);
};

// --- Management Functions ---

export const getMyPatients = async (psychologistId: string): Promise<User[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        return getLocalUsers().filter(u => u.role === 'patient' && u.assignedPsychologistId === psychologistId);
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_psychologist_id', psychologistId)
        .eq('role', 'patient');
    
    if (error) {
        console.error(error);
        return [];
    }
    return data.map(mapProfileToUser);
};

export const getAllUsers = async (): Promise<User[]> => {
    if (!IS_SUPABASE_CONFIGURED) {
        return getLocalUsers();
    }

    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    return data.map(mapProfileToUser);
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const users = getLocalUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...updates };
            saveLocalUsers(users);
        }
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            name: updates.name,
            surnames: updates.surnames,
            phone: updates.phone,
            photo_url: updates.photoUrl,
        })
        .eq('id', userId);

    if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const users = getLocalUsers();
        saveLocalUsers(users.filter(u => u.id !== userId));
        return;
    }

    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
};

export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    if (!IS_SUPABASE_CONFIGURED) {
        const users = getLocalUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx].password = newPassword;
            saveLocalUsers(users);
        }
        return;
    }
    alert("Para reiniciar contraseñas de otros usuarios se requiere una función de servidor segura (Supabase Edge Function). Esta funcionalidad está deshabilitada en el modo solo cliente.");
};
