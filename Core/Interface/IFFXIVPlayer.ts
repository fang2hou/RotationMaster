export interface IFFXIVPlayer {
    ID: string;
    Name: string;
    Job: string;
    Level: number;
    CurrentMP: number;
    MaxMP: number;
    JobSource: {
        Beast?: number;
    }
}