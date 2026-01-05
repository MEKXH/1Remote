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
}
