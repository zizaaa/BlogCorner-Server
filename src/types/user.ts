export interface userData{
    username:string;
    firstname:string;
    lastname:string;
    middlename?:string;
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
    firstname:string;
    lastname:string;
    middlename?:string;
    email:string;
    avatar?:string;
}