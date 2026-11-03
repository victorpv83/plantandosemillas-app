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
    const res = await fetch('/api/auth/me');
    return handleResponse(res);
  },

  async loginStudent(alias: string, code: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/student-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, code }),
    });
    return handleResponse(res);
  },

  async loginTeacher(username: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/teacher-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return handleResponse(res);
  },

  // Challenges (Student & Public)
  async getChallenges(): Promise<Challenge[]> {
    const res = await fetch('/api/challenges');
    return handleResponse(res);
  },

  async getChallenge(id: string): Promise<Challenge> {
    const res = await fetch(`/api/challenges/${id}`);
    return handleResponse(res);
  },

  async submitChallenge(id: string, userGrid: (string | null)[][]): Promise<SubmissionResponse> {
    const res = await fetch(`/api/challenges/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_grid: userGrid }),
    });
    return handleResponse(res);
  },

  async submitBlocklyChallenge(id: string, blocks: ProgramBlock[]): Promise<SubmissionResponse> {
    const res = await fetch(`/api/challenges/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    return handleResponse(res);
  },

  async getStudentProfile(): Promise<{ user: User; badges: any[]; completions: any[] }> {
    const res = await fetch('/api/student/profile');
    return handleResponse(res);
  },

  async getAllBadges(): Promise<Badge[]> {
    const res = await fetch('/api/badges');
    return handleResponse(res);
  },

  // Teacher Endpoints
  async getTeacherStats(): Promise<TeacherDashboardStats> {
    const res = await fetch('/api/teacher/stats');
    return handleResponse(res);
  },

  async getTeacherStudents(): Promise<StudentDetail[]> {
    const res = await fetch('/api/teacher/students');
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getTeacherChallenges(): Promise<Challenge[]> {
    const res = await fetch('/api/teacher/challenges');
    return handleResponse(res);
  },

  async createChallenge(challengeData: Partial<Challenge>): Promise<{ id: string; success: boolean }> {
    const res = await fetch('/api/teacher/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challengeData),
    });
    return handleResponse(res);
  },

  async updateChallenge(id: string, challengeData: Partial<Challenge>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teacher/challenges/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challengeData),
    });
    return handleResponse(res);
  },

  async deleteChallenge(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teacher/challenges/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getTeacherBadges(): Promise<Badge[]> {
    const res = await fetch('/api/teacher/badges');
    return handleResponse(res);
  },

  async createBadge(data: { code: string; name: string; description: string; icon: string; category: string }): Promise<{ success: boolean; id: string }> {
    const res = await fetch('/api/teacher/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteBadge(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teacher/badges/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getTeacherCompletions(): Promise<CompletionRecord[]> {
    const res = await fetch('/api/teacher/completions');
    return handleResponse(res);
  },
};
