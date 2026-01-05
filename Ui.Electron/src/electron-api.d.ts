export interface IServerDto {
    Id: string;
    DisplayName: string;
    SubTitle: string;
    Protocol: string;
    Tags: string[];
    LastConnectTime: string;
    DataSourceName: string;
}

export interface INetworkInterfaceInfo {
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
    cidr: string | null;
}

export interface IServerCreateDto {
    Protocol: string;
    DisplayName: string;
    Host: string;
    Port: string;
    Username: string;
    Password: string;
}

export interface IResult {
    IsSuccess: boolean;
    ErrorInfo: string;
    NeedReloadUI: boolean;
}

export interface IGeneralSettings {
    Language: string;
    DoNotCheckNewVersion: boolean;
    AppStartAutomatically: boolean;
    CloseButtonBehavior: number;
    ConfirmBeforeClosingSession: boolean;
    ShowSessionIconInSessionWindow: boolean;
    LogLevel: number;
}

export interface IThemeSettings {
    ThemeName: string;
    AccentMidColor: string;
}

export interface IDashboardStats {
    ActiveSessions: number;
    TotalServers: number;
    Favorites: number;
    Recent: number;
}

export interface IElectronAPI {
    getServers: () => Promise<IServerDto[]>;
    getServer: (serverId: string) => Promise<IServerCreateDto | null>;
    getTags: () => Promise<string[]>;
    getDashboardStats: () => Promise<IDashboardStats>;
    connect: (serverId: string) => Promise<boolean>;
    addServer: (server: IServerCreateDto) => Promise<IResult>;
    deleteServer: (serverId: string) => Promise<IResult>;
    duplicateServer: (serverId: string) => Promise<IResult>;
    updateServer: (serverId: string, server: IServerCreateDto) => Promise<IResult>;
    getGeneralSettings: () => Promise<IGeneralSettings>;
    updateGeneralSettings: (settings: IGeneralSettings) => Promise<IResult>;
    getThemeSettings: () => Promise<IThemeSettings>;
    updateThemeSettings: (settings: IThemeSettings) => Promise<IResult>;
    getNetworkInterfaces: () => Promise<Record<string, INetworkInterfaceInfo[]>>;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}
