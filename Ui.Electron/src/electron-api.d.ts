export interface IServerDto {
    Id: string;
    DisplayName: string;
    SubTitle: string;
    Protocol: string;
    Tags: string[];
    LastConnectTime: string;
    DataSourceName: string;
}

export interface IElectronAPI {
    getServers: () => Promise<IServerDto[]>;
    connect: (serverId: string) => Promise<boolean>;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}
