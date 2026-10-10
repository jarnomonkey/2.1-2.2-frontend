import type { ReadingListItem } from "./ReadingListItem";

export type Student = {
        id: string;
        name: string;
        email: string;
        role: "STUDENT" | "CURSIST";
        readingList: ReadingListItem[];
    };