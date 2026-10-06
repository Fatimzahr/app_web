import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // État initial
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  // Connexion — sauvegarde le token et l'utilisateur
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  // Déconnexion — efface tout
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  // Mettre à jour l'utilisateur
  setUser: (user) => set({ user }),
}));

export default useAuthStore;