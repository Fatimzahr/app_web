import axios from 'axios';

// URL de base de l'API Django
const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur — ajoute automatiquement le JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur — gère l'expiration du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si 401 (token expiré) → essayer de rafraîchir le token
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
        localStorage.setItem('access_token', res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch {
        // Refresh échoué → déconnexion
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== FONCTIONS API =====

// Auth
export const inscription = (data) => api.post('/users/inscription/', data);
export const connexion   = (data) => api.post('/auth/login/', data);
export const deconnexion = (data) => api.post('/users/deconnexion/', data);

// Questions
export const getQuestions      = (params) => api.get('/questions/', { params });
export const getQuestion       = (id)     => api.get(`/questions/${id}/`);
export const creerQuestion     = (data)   => api.post('/questions/', data);
export const modifierQuestion  = (id, data) => api.put(`/questions/${id}/`, data);
export const supprimerQuestion = (id)     => api.delete(`/questions/${id}/`);
export const accepterReponse   = (id, data) => api.post(`/questions/${id}/accepter-reponse/`, data);
export const voter             = (data)   => api.post('/questions/voter/', data);
export const getTags           = ()       => api.get('/questions/tags/');

// Réponses
export const getReponses    = (questionId) => api.get('/answers/', { params: { question: questionId } });
export const creerReponse   = (data)       => api.post('/answers/', data);
export const modifierReponse = (id, data)  => api.put(`/answers/${id}/`, data);
export const supprimerReponse = (id)       => api.delete(`/answers/${id}/`);

// Commentaires
export const getCommentaires = (params) => api.get('/answers/commentaires/', { params });
export const creerCommentaire = (data)  => api.post('/answers/commentaires/', data);

// Profil
export const getProfil       = ()     => api.get('/users/profil/');
export const modifierProfil  = (data) => api.put('/users/profil/', data);
export const getProfilPublic = (id)   => api.get(`/users/${id}/`);

// Notifications
export const getNotifications    = ()   => api.get('/notifications/');
export const marquerLue          = (id) => api.post(`/notifications/${id}/lue/`);
export const marquerToutesLues   = ()   => api.post('/notifications/toutes-lues/');

// Modération
export const signalerContenu     = (data) => api.post('/moderation/signalements/creer/', data);
export const getSignalements     = ()     => api.get('/moderation/signalements/');
export const traiterSignalement  = (id, data) => api.post(`/moderation/signalements/${id}/traiter/`, data);
export const getBadges           = ()     => api.get('/moderation/badges/');
export const getMesBadges        = ()     => api.get('/moderation/mes-badges/');

// Gestion utilisateurs (modérateur/admin)
export const getUtilisateurs      = ()         => api.get('/users/');
export const modifierRole         = (id, data) => api.patch(`/users/${id}/role/`, data);
export const suspendreUtilisateur = (id)       => api.patch(`/users/${id}/suspendre/`);

// Fermer une question
export const fermerQuestion = (id) => api.patch(`/questions/${id}/fermer/`);

// Commentaires
export const getCommentairesReponse = (reponseId) =>
  api.get('/answers/commentaires/', { params: { reponse: reponseId } });

export default api;
// Similar & suggest
export const getSimilarQuestions = (id)     => api.get(`/questions/${id}/similar/`);
export const suggestQuestions    = (q)      => api.get('/questions/suggest/', { params: { q } });

// User mention search
export const searchUsers = (q) => api.get('/users/search/', { params: { q } });
