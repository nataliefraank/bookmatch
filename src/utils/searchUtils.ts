const URL = "https://openlibrary.org/search.json?title=";

export async function fetchTopBooks(searchTerm: string): Promise<Map<string, string>> {
    const resultMap = new Map<string, string>();
    
    try {
        const response = await fetch(`${URL}${searchTerm}`);
        const data = await response.json();
        const {docs} = data;
        const resultsLength = 5;
        const charMax = 40;

        if (docs) {
            docs.slice(0, resultsLength).forEach((book: { title: string; author_name: string[] }) => {
                let title: string;
                if (book.title.length > charMax) {
                    title = book.title.substring(0, charMax) + "...";
                }
                else {
                    title = book.title;
                }
                resultMap.set(
                    title,
                    book.author_name ? book.author_name[0] : "Unknown Author"
                );
            });
        }
    } catch (error) {
        console.error("Error fetching books:", error);
    }

    return resultMap;
}