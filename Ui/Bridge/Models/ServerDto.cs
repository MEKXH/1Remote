using System;
using System.Collections.Generic;

namespace _1RM.Bridge.Models
{
    public class ServerDto
    {
        public string Id { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string SubTitle { get; set; } = string.Empty;
        public string Protocol { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new List<string>();
        public DateTime LastConnectTime { get; set; }
        public string DataSourceName { get; set; } = string.Empty;
    }

    public class IpcRequest
    {
        public string Method { get; set; } = string.Empty;
        public object? Params { get; set; }
        public string Id { get; set; } = string.Empty;
    }

    public class IpcResponse
    {
        public object? Result { get; set; }
        public string? Error { get; set; }
        public string Id { get; set; } = string.Empty;
    }

    public class UpdateServerParams
    {
        public string ServerId { get; set; } = string.Empty;
        public ServerCreateDto Server { get; set; } = new();
    }

    public class GeneralConfigDto
    {
        public string Language { get; set; } = "en-us";
        public bool DoNotCheckNewVersion { get; set; }
        public bool AppStartAutomatically { get; set; }
        public int CloseButtonBehavior { get; set; }
        public bool ConfirmBeforeClosingSession { get; set; }
        public bool ShowSessionIconInSessionWindow { get; set; }
        public int LogLevel { get; set; }
    }

    public class ThemeConfigDto
    {
        public string ThemeName { get; set; } = "Dark";
        public string AccentMidColor { get; set; } = string.Empty;
    }

    public class DashboardStatsDto
    {
        public int ActiveSessions { get; set; }
        public int TotalServers { get; set; }
        public int Favorites { get; set; }
        public int Recent { get; set; }
    }
}
