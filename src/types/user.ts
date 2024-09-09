export interface userData{
    username:string;
    name:string;
    password:string;
    email:string;
    avatar:string;
}

export interface userLogin{
    username:string;
    password:string
}

export interface filteredResultTypes{
    id:number;
    username:string;
    name:string;
    email:string;
    avatar?:string;
    isverified:string;
}

export interface Passwords{
    oldPassword:string;
    newPassword:string;
}