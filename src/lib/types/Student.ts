type Student = {
        id: string;
        name: string;
        email: string;
        role: "STUDENT" | "CURSIST";
        readingList: ReadingListItem[];
    };