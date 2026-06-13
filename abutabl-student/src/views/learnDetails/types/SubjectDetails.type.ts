interface IBasicInfo {
    id: string;
    name: string
}

export interface ISubjectDetails {
    basic_info: IBasicInfo[];
    units: []


}