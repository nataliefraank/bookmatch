// services/matchService.ts

export const matchService = {

  async findMatch(title: string) {
    try {
      const response = await fetch(`/api/matches?title=${encodeURIComponent(title)}`);
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch match');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error finding match:', error);
      return null;
    }
  },

  async getMatches() {
    try {
      const response = await fetch('/api/matches');
      if (response.status === 401) {
        return [];
      }
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting matches:', error);
        return [];
    }
  },

  async createMatch(title: string, author: string) {
    const response = await fetch('/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, author }),
    });
    if (!response.ok) {
      throw new Error('Failed to create match');
    }
    return response.json();
  },

  async removeMatch(title: string) {
    const response = await fetch('/api/matches', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new Error('Failed to remove match');
    }
    return response.json();
  }
};