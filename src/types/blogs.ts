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

export interface GetAllPostedBlogs{
    page:string;
    limit:string;
    userId:string;
}

export interface UpdateBlogFormData{
    id: string;
    title: string;
    content: string;
    path?:string;
}