export interface User {
    id: number;
}

export interface BlogFormData {
    title: string;
    content: string;
}

export interface GetBlogQuery{
    page:string;
    limit:string;
}