export async function fetchMatches(): Promise<Map<string, string>> {
    const resultMap = new Map<string, string>();
    
    try {
        const response = await fetch('/api/matches'); // Endpoint for getting all matches
        if (response.status === 401) {
            return resultMap;
        }
        if (!response.ok) {
            throw new Error('Failed to fetch matches');
        }
        
        const matches = await response.json();
        
        if (Array.isArray(matches)) {
            matches.forEach((match) => {
                if (match.title && match.author) {
                    resultMap.set(match.title, match.author);
                    console.log('Here is a match:', match.title, match.author);
                }
            });
        }

        console.log('Fetched matches:', resultMap); // Debug log
    } catch (error) {
        console.error("Error fetching matches:", error);
    }

    return resultMap;
}
