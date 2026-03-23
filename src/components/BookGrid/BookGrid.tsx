import BookCard from "@/components/BookCard/BookCard";
import "./BookGrid.css";

interface BookGridProps {
    books: Map<string, string>;
    isLoading: boolean;
}

const BookGrid = ({ books, isLoading }: BookGridProps) => {
    if (isLoading) {
         return <div>Loading...</div>;
    }
    
    return (
        <div className="book-grid">
            {Array.from(books).map(([title, author]) => (
                <BookCard 
                    key={title}  // React needs a unique key for list items
                    Title={title}
                    Author={author}
                />
            ))}
        </div>
    );
};

export default BookGrid;