import {
  User,
  Challenge,
  SubmissionResponse,
  TeacherDashboardStats,
  CompletionRecord,
  StudentDetail,
  Badge,
  ProgramBlock,
} from '../types';

function getAuthHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('steam_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Error en la petición al servidor.' }));
    throw new Error(errorData.error || errorData.message || 'Error en el servidor.');
  }
  return res.json();
}

export const api = {
  // Auth
  async checkSession(): Promise<{ user: User | null }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async loginStudent(alias: string, code: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/student-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, code }),
    });
    const data = await handleResponse<{ user: User; token: string }>(res);
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('steam_token', data.token);
    }
    return data;
  },

  async loginTeacher(username: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/teacher-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<{ user: User; token: string }>(res);
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('steam_token', data.token);
    }
    return data;
  },

  async logout(): Promise<{ success: boolean }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('steam_token');
    }
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  // Challenges (Student & Public)
  async getChallenges(): Promise<Challenge[]> {
    const res = await fetch('/api/challenges', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async getChallenge(id: string): Promise<Challenge> {
    const res = await fetch(`/api/challenges/${id}`, {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async submitChallenge(id: string, userGrid: (string | null)[][]): Promise<SubmissionResponse> {
    const res = await fetch(`/api/challenges/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ user_grid: userGrid }),
    });
    return handleResponse(res);
  },

  async submitBlocklyChallenge(id: string, blocks: ProgramBlock[]): Promise<SubmissionResponse> {
    const res = await fetch(`/api/challenges/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ blocks }),
    });
    return handleResponse(res);
  },

  async getStudentProfile(): Promise<{ user: User; badges: any[]; completions: any[] }> {
    const res = await fetch('/api/student/profile', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async getAllBadges(): Promise<Badge[]> {
    const res = await fetch('/api/badges', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  // Teacher Endpoints
  async getTeacherStats(): Promise<TeacherDashboardStats> {
    const res = await fetch('/api/teacher/stats', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async getTeacherStudents(): Promise<StudentDetail[]> {
    const res = await fetch('/api/teacher/students', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async createStudent(alias: string, displayName?: string, code?: string): Promise<{
    id: string;
    alias: string;
    display_name: string;
    personal_code: string;
  }> {
    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ alias, display_name: displayName, code }),
    });
    return handleResponse(res);
  },

  async updateStudent(
    id: string,
    data: { display_name?: string; is_active?: boolean; new_code?: string }
  ): Promise<{ success: boolean; new_personal_code?: string; message: string }> {
    const res = await fetch(`/api/teacher/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getTeacherChallenges(): Promise<Challenge[]> {
    const res = await fetch('/api/teacher/challenges', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async createChallenge(challengeData: Partial<Challenge>): Promise<{ id: string; success: boolean }> {
    const res = await fetch('/api/teacher/challenges', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(challengeData),
    });
    return handleResponse(res);
  },

  async updateChallenge(id: string, challengeData: Partial<Challenge>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teacher/challenges/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify(challengeData),
    });
    return handleResponse(res);
  },

  async deleteChallenge(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teacher/challenges/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async getTeacherBadges(): Promise<Badge[]> {
    const res = await fetch('/api/teacher/badges', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async createBadge(data: { code: string; name: string; description: string; icon: string; category: string }): Promise<{ success: boolean; id: string }> {
    const res = await fetch('/api/teacher/badges', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteBadge(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teacher/badges/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },

  async getTeacherCompletions(): Promise<CompletionRecord[]> {
    const res = await fetch('/api/teacher/completions', {
      headers: getAuthHeaders(false),
    });
    return handleResponse(res);
  },
};
