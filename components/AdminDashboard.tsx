
import React, { useState, useEffect } from 'react';
import { registerUser, getAllUsers, updateUser, deleteUser, resetUserPassword } from '../services/mockAuthService';
import { User, UserRole } from '../types';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'psychologists' | 'patients'>('psychologists');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Create State
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Edit/Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    
    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editSurnames, setEditSurnames] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPhotoUrl, setEditPhotoUrl] = useState('');
    const [editNewPassword, setEditNewPassword] = useState('');

    const refreshUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            showMessage("Error al cargar usuarios", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUsers();
    }, []);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleCreatePsychologist = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerUser(newName, newEmail, newPassword, 'psychologist');
            showMessage('Psicólogo dado de alta correctamente', 'success');
            await refreshUsers();
            setNewName('');
            setNewEmail('');
            setNewPassword('');
        } catch (error: any) {
            showMessage(error.message, 'error');
        }
    };

    const handleEditClick = (user: User, resetPass: boolean = false) => {
        setEditingUser(user);
        setIsPasswordReset(resetPass);
        setEditName(user.name);
        setEditSurnames(user.surnames || '');
        setEditEmail(user.email);
        setEditPhone(user.phone || '');
        setEditPhotoUrl(user.photoUrl || '');
        setEditNewPassword('');
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            await updateUser(editingUser.id, {
                name: editName,
                surnames: editSurnames,
                email: editEmail,
                phone: editPhone,
                photoUrl: editPhotoUrl
            });
            showMessage('Usuario actualizado correctamente', 'success');
            setEditingUser(null);
            await refreshUsers();
        } catch (error: any) {
            showMessage(error.message, 'error');
        }
    };

    const handleResetPassword = async () => {
        if (!editingUser || !editNewPassword) return;
        try {
            await resetUserPassword(editingUser.id, editNewPassword);
            showMessage('Contraseña restablecida correctamente', 'success');
            setEditingUser(null);
            await refreshUsers();
        } catch (error: any) {
            showMessage(error.message, 'error');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.')) {
            try {
                await deleteUser(userId);
                showMessage('Usuario eliminado', 'success');
                await refreshUsers();
            } catch (error: any) {
                showMessage(error.message, 'error');
            }
        }
    };

    const filteredUsers = Array.isArray(users) ? users.filter(u => 
        activeTab === 'psychologists' ? u.role === 'psychologist' : u.role === 'patient'
    ) : [];

    return (
        <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto pb-24">
            <h1 className="text-3xl font-bold text-white mb-8">Administración Global</h1>

            {message && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slide-up ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {message.text}
                </div>
            )}

            {/* Quick Create Psychologist (Only visible on Psych tab) */}
            {activeTab === 'psychologists' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
                    <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                        <span className="bg-brand-500 rounded-lg p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </span>
                        Nuevo Psicólogo
                    </h2>
                    <form onSubmit={handleCreatePsychologist} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <input 
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500"
                                placeholder="Nombre"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <input 
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500"
                                placeholder="Email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                type="email"
                                required
                            />
                        </div>
                        <div>
                            <input 
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500"
                                placeholder="Contraseña"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                type="password"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
                            Dar de Alta
                        </button>
                    </form>
                </div>
            )}

            {/* User Management List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="flex border-b border-slate-800">
                    <button 
                        onClick={() => setActiveTab('psychologists')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'psychologists' ? 'bg-slate-800 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Psicólogos
                    </button>
                    <button 
                        onClick={() => setActiveTab('patients')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'patients' ? 'bg-slate-800 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Pacientes
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>
                    ) : (
                        <table className="w-full text-left text-slate-300">
                            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Contacto</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">No hay usuarios en esta categoría.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.photoUrl ? (
                                                        <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center font-bold text-lg">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-white">{user.name} {user.surnames}</p>
                                                        <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm">{user.email}</p>
                                                <p className="text-sm text-slate-500">{user.phone || 'Sin teléfono'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditClick(user)} className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors" title="Editar Perfil">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleEditClick(user, true)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors" title="Restablecer Contraseña">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title="Eliminar Usuario">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setEditingUser(null)}>
                    <div className="bg-slate-900 w-full max-w-lg rounded-3xl p-8 border border-slate-800 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {isPasswordReset ? 'Restablecer Contraseña' : 'Editar Usuario'}
                            </h2>
                            <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {isPasswordReset ? (
                            <div className="space-y-4">
                                <p className="text-slate-400 text-sm">Estás cambiando la contraseña para <strong>{editingUser.email}</strong>.</p>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nueva Contraseña</label>
                                    <input 
                                        type="text"
                                        value={editNewPassword}
                                        onChange={e => setEditNewPassword(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                                        placeholder="Escribe la nueva contraseña"
                                    />
                                </div>
                                <button 
                                    onClick={handleResetPassword}
                                    disabled={!editNewPassword}
                                    className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors mt-4 disabled:opacity-50"
                                >
                                    Confirmar Cambio
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nombre</label>
                                        <input 
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Apellidos</label>
                                        <input 
                                            value={editSurnames}
                                            onChange={e => setEditSurnames(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                                    <input 
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Teléfono</label>
                                    <input 
                                        value={editPhone}
                                        onChange={e => setEditPhone(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL Foto Perfil</label>
                                    <input 
                                        value={editPhotoUrl}
                                        onChange={e => setEditPhotoUrl(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <button 
                                    onClick={handleUpdateUser}
                                    className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors mt-4"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
