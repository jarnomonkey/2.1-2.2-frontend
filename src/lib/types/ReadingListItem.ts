import type { Book } from "./book";

export type ReadingListItem = {
        bookId: string;
        addedAt: string;
        book: Book | null;
    };
