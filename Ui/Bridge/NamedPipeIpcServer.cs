using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using _1RM.Bridge.Models;
using _1RM.Model;
using _1RM.Model.Protocol.Base;
using _1RM.Service;
using _1RM.Service.DataSource;
using _1RM.Service.DataSource.DAO;
using _1RM.Service.DataSource.Model;
using _1RM.Utils;
using Newtonsoft.Json;
using Shawn.Utils;

namespace _1RM.Bridge
{
    public class NamedPipeIpcServer
    {
        private readonly string _pipeName;
        private CancellationTokenSource? _cts;

        public NamedPipeIpcServer(string pipeName)
        {
            _pipeName = pipeName;
        }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => ListenLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task ListenLoop(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                var server = new NamedPipeServerStream(
                    _pipeName,
                    PipeDirection.InOut,
                    NamedPipeServerStream.MaxAllowedServerInstances,
                    PipeTransmissionMode.Byte,
                    PipeOptions.Asynchronous);

                try
                {
                    await server.WaitForConnectionAsync(token);
                    _ = Task.Run(() => HandleClientAsync(server, token), token);
                }
                catch (OperationCanceledException)
                {
                    server.Dispose();
                    break;
                }
                catch (Exception ex)
                {
                    server.Dispose();
                    SimpleLogHelper.Error(ex);
                    await Task.Delay(1000, token);
                }
            }
        }

        private async Task HandleClientAsync(NamedPipeServerStream server, CancellationToken token)
        {
            try
            {
                using var reader = new StreamReader(server, Encoding.UTF8);
                using var writer = new StreamWriter(server, Encoding.UTF8) { AutoFlush = true };

                while (server.IsConnected && !token.IsCancellationRequested)
                {
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrEmpty(line)) break;

                    var response = HandleRequest(line);
                    await writer.WriteLineAsync(JsonConvert.SerializeObject(response));
                }
            }
            catch (OperationCanceledException)
            {
                // ignore on shutdown
            }
            catch (Exception ex)
            {
                SimpleLogHelper.Error(ex);
            }
            finally
            {
                server.Dispose();
            }
        }

        private IpcResponse HandleRequest(string json)
        {
            IpcRequest? request = null;
            try
            {
                request = JsonConvert.DeserializeObject<IpcRequest>(json);
                if (request == null) return new IpcResponse { Error = "Invalid request" };

                object? result = null;
                switch (request.Method)
                {
                    case "getServers":
                        result = GetServers();
                        break;
                    case "connect":
                        result = Connect(request.Params?.ToString());
                        break;
                    case "getNetworkInterfaces":
                        result = GetNetworkInterfaces();
                        break;
                    case "addServer":
                        result = AddServer(request.Params?.ToString());
                        break;
                    case "deleteServer":
                        result = DeleteServer(request.Params?.ToString());
                        break;
                    case "duplicateServer":
                        result = DuplicateServer(request.Params?.ToString());
                        break;
                    case "getServer":
                        result = GetServer(request.Params?.ToString());
                        break;
                    case "updateServer":
                        result = UpdateServer(request.Params?.ToString());
                        break;
                    case "getGeneralSettings":
                        result = GetGeneralSettings();
                        break;
                    case "updateGeneralSettings":
                        result = UpdateGeneralSettings(request.Params?.ToString());
                        break;
                    case "getThemeSettings":
                        result = GetThemeSettings();
                        break;
                    case "updateThemeSettings":
                        result = UpdateThemeSettings(request.Params?.ToString());
                        break;
                    case "getDashboardStats":
                        result = GetDashboardStats();
                        break;
                    case "getTags":
                        result = GetTags();
                        break;
                    case "getLocalDataSourceStatus":
                        result = GetLocalDataSourceStatus();
                        break;
                    case "reloadServers":
                        result = ReloadServers();
                        break;
                    case "getActiveSessions":
                        result = GetActiveSessions();
                        break;
                    case "closeSession":
                        result = CloseSession(request.Params?.ToString());
                        break;
                    case "reconnectSession":
                        result = ReconnectSession(request.Params?.ToString());
                        break;
                    default:
                        return new IpcResponse { Id = request.Id, Error = $"Method '{request.Method}' not found" };
                }

                return new IpcResponse { Id = request.Id, Result = result };
            }
            catch (Exception ex)
            {
                return new IpcResponse { Id = request?.Id ?? "", Error = ex.Message };
            }
        }

        private List<string> GetTags()
        {
            var globalData = IoC.Get<GlobalData>();
            return globalData.TagList.Select(x => x.Name).ToList();
        }

        private Result DuplicateServer(string? serverId)
        {
            if (string.IsNullOrEmpty(serverId)) return Result.Fail("Server ID is empty");
            var globalData = IoC.Get<GlobalData>();
            var vm = globalData.VmItemList.FirstOrDefault(x => x.Id == serverId);
            if (vm != null)
            {
                var newProtocol = vm.Server.Clone();
                newProtocol.DisplayName += " (Copy)";
                var dataSourceService = IoC.Get<DataSourceService>();
                var localSource = dataSourceService.LocalDataSource;
                if (localSource != null)
                {
                    return globalData.AddServer(newProtocol, localSource);
                }
                return Result.Fail("Local data source not found");
            }
            return Result.Fail("Server not found");
        }

        private Result DeleteServer(string? serverId)
        {
            if (string.IsNullOrEmpty(serverId)) return Result.Fail("Server ID is empty");
            var globalData = IoC.Get<GlobalData>();
            var vm = globalData.VmItemList.FirstOrDefault(x => x.Id == serverId);
            if (vm != null)
            {
                var result = globalData.DeleteServer(new[] { vm.Server });
                return result;
            }
            return Result.Fail("Server not found");
        }

        private List<ServerDto> GetServers()
        {
            var globalData = IoC.Get<GlobalData>();
            return globalData.VmItemList.Select(vm => new ServerDto
            {
                Id = vm.Id,
                DisplayName = vm.DisplayName,
                SubTitle = vm.SubTitle,
                Protocol = vm.ProtocolDisplayNameInShort,
                Tags = vm.Server.Tags,
                LastConnectTime = vm.LastConnectTime,
                DataSourceName = vm.DataSourceName
            }).ToList();
        }

        private bool Connect(string? serverId)
        {
            if (string.IsNullOrEmpty(serverId)) return false;
            var globalData = IoC.Get<GlobalData>();
            var vm = globalData.VmItemList.FirstOrDefault(x => x.Id == serverId);
            if (vm != null)
            {
                // Ensure WPF window is active (optional, but good for UX)
                System.Windows.Application.Current.Dispatcher.Invoke(() =>
                {
                    System.Windows.Application.Current.MainWindow?.Activate();
                    if (System.Windows.Application.Current.MainWindow?.WindowState == System.Windows.WindowState.Minimized)
                    {
                        System.Windows.Application.Current.MainWindow.WindowState = System.Windows.WindowState.Normal;
                    }
                });

                vm.CmdConnServer.Execute(null);
                return true;
            }
            return false;
        }

        private Result AddServer(string? json)
        {
            if (string.IsNullOrEmpty(json)) return Result.Fail("Request body is empty");
            var dto = JsonConvert.DeserializeObject<ServerCreateDto>(json);
            if (dto == null) return Result.Fail("Failed to deserialize request");

            _1RM.Model.Protocol.Base.ProtocolBase? protocol = null;
            if (string.Equals(dto.Protocol, "RDP", StringComparison.OrdinalIgnoreCase))
            {
                var rdp = new _1RM.Model.Protocol.RDP();
                rdp.Address = dto.Host;
                if (!string.IsNullOrEmpty(dto.Port)) rdp.Port = dto.Port;
                rdp.UserName = dto.Username;
                rdp.Password = UnSafeStringEncipher.SimpleEncrypt(dto.Password);
                rdp.DisplayName = dto.DisplayName;
                protocol = rdp;
            }
            else if (string.Equals(dto.Protocol, "SSH", StringComparison.OrdinalIgnoreCase))
            {
                var ssh = new _1RM.Model.Protocol.SSH();
                ssh.Address = dto.Host;
                if (!string.IsNullOrEmpty(dto.Port)) ssh.Port = dto.Port;
                ssh.UserName = dto.Username;
                ssh.Password = UnSafeStringEncipher.SimpleEncrypt(dto.Password);
                ssh.DisplayName = dto.DisplayName;
                protocol = ssh;
            }

            if (protocol != null)
            {
                var globalData = IoC.Get<GlobalData>();
                var dataSourceService = IoC.Get<DataSourceService>();
                var localSource = dataSourceService.LocalDataSource;

                if (localSource != null)
                {
                    var result = globalData.AddServer(protocol, localSource);
                    return result;
                }
                return Result.Fail("Local data source not found");
            }
            return Result.Fail("Invalid protocol or protocol creation failed");
        }

        private ServerCreateDto? GetServer(string? serverId)
        {
            if (string.IsNullOrEmpty(serverId)) return null;
            var globalData = IoC.Get<GlobalData>();
            var vm = globalData.VmItemList.FirstOrDefault(x => x.Id == serverId);
            if (vm != null)
            {
                var protocol = vm.Server;
                var dto = new ServerCreateDto
                {
                    Protocol = protocol.Protocol,
                    DisplayName = protocol.DisplayName,
                };

                if (protocol is ProtocolBaseWithAddressPortUserPwd p)
                {
                    dto.Host = p.Address;
                    dto.Port = p.Port;
                    dto.Username = p.UserName;
                    dto.Password = UnSafeStringEncipher.SimpleDecrypt(p.Password);
                }
                return dto;
            }
            return null;
        }

        private Result UpdateServer(string? json)
        {
            if (string.IsNullOrEmpty(json)) return Result.Fail("Request body is empty");
            var updateParams = JsonConvert.DeserializeObject<UpdateServerParams>(json);
            if (updateParams == null || string.IsNullOrEmpty(updateParams.ServerId)) return Result.Fail("Invalid parameters");

            var globalData = IoC.Get<GlobalData>();
            var vm = globalData.VmItemList.FirstOrDefault(x => x.Id == updateParams.ServerId);
            if (vm == null) return Result.Fail("Server not found");

            var dto = updateParams.Server;
            var protocol = vm.Server;

            protocol.DisplayName = dto.DisplayName;
            if (protocol is ProtocolBaseWithAddressPortUserPwd p)
            {
                p.Address = dto.Host;
                p.Port = dto.Port;
                p.UserName = dto.Username;
                if (!string.IsNullOrEmpty(dto.Password))
                {
                    p.Password = UnSafeStringEncipher.SimpleEncrypt(dto.Password);
                }
            }

            return globalData.UpdateServer(protocol);
        }

        private Dictionary<string, List<NetworkInterfaceDto>> GetNetworkInterfaces()
        {
            var interfaces = new Dictionary<string, List<NetworkInterfaceDto>>();

            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                var list = new List<NetworkInterfaceDto>();
                var ipProps = ni.GetIPProperties();

                foreach (var ip in ipProps.UnicastAddresses)
                {
                    var dto = new NetworkInterfaceDto
                    {
                        Address = ip.Address.ToString(),
                        Mac = string.Join(":", ni.GetPhysicalAddress().GetAddressBytes().Select(b => b.ToString("X2"))),
                        Internal = ni.NetworkInterfaceType == NetworkInterfaceType.Loopback,
                        Family = ip.Address.AddressFamily == AddressFamily.InterNetwork ? "IPv4" : "IPv6"
                    };

                    if (ip.Address.AddressFamily == AddressFamily.InterNetwork)
                    {
                        dto.Netmask = ip.IPv4Mask.ToString();
                        dto.Cidr = $"{ip.Address}/{GetCidrFromSubnetMask(ip.IPv4Mask)}";
                    }

                    list.Add(dto);
                }
                
                if (list.Count > 0)
                {
                    interfaces[ni.Name] = list;
                }
            }

            return interfaces;
        }

        private GeneralConfigDto GetGeneralSettings()
        {
            var cfg = IoC.Get<ConfigurationService>().General;
            return new GeneralConfigDto
            {
                Language = cfg.CurrentLanguageCode,
                DoNotCheckNewVersion = cfg.DoNotCheckNewVersion,
                CloseButtonBehavior = cfg.CloseButtonBehavior,
                ConfirmBeforeClosingSession = cfg.ConfirmBeforeClosingSession,
                ShowSessionIconInSessionWindow = cfg.ShowSessionIconInSessionWindow,
                LogLevel = cfg.LogLevel
            };
        }

        private Result UpdateGeneralSettings(string? json)
        {
            if (string.IsNullOrEmpty(json)) return Result.Fail("Empty settings");
            var dto = JsonConvert.DeserializeObject<GeneralConfigDto>(json);
            if (dto == null) return Result.Fail("Invalid settings format");

            var cfgService = IoC.Get<ConfigurationService>();
            var cfg = cfgService.General;

            cfg.CurrentLanguageCode = dto.Language;
            cfg.DoNotCheckNewVersion = dto.DoNotCheckNewVersion;
            cfg.CloseButtonBehavior = dto.CloseButtonBehavior;
            cfg.ConfirmBeforeClosingSession = dto.ConfirmBeforeClosingSession;
            cfg.ShowSessionIconInSessionWindow = dto.ShowSessionIconInSessionWindow;
            cfg.LogLevel = dto.LogLevel;

            cfgService.Save();
            return Result.Success();
        }

        private ThemeConfigDto GetThemeSettings()
        {
            var cfg = IoC.Get<ConfigurationService>().Theme;
            return new ThemeConfigDto
            {
                ThemeName = cfg.ThemeName,
                AccentMidColor = cfg.AccentMidColor
            };
        }

        private Result UpdateThemeSettings(string? json)
        {
            if (string.IsNullOrEmpty(json)) return Result.Fail("Empty settings");
            var dto = JsonConvert.DeserializeObject<ThemeConfigDto>(json);
            if (dto == null) return Result.Fail("Invalid settings format");

            var cfgService = IoC.Get<ConfigurationService>();
            var cfg = cfgService.Theme;

            cfg.ThemeName = dto.ThemeName;
            if (!string.IsNullOrEmpty(dto.AccentMidColor))
            {
                cfg.AccentMidColor = dto.AccentMidColor;
            }

            cfgService.Save();
            return Result.Success();
        }

        private DashboardStatsDto GetDashboardStats()
        {
            var globalData = IoC.Get<GlobalData>();
            var sessionControl = IoC.Get<SessionControlService>();
            
            return new DashboardStatsDto
            {
                ActiveSessions = sessionControl.ConnectionId2Hosts.Count,
                TotalServers = globalData.VmItemList.Count,
                Favorites = 0, // Handled by frontend for now
                Recent = globalData.VmItemList.Count(x => x.LastConnectTime > DateTime.Now.AddDays(-7))
            };
        }

        private DataSourceStatusDto? GetLocalDataSourceStatus()
        {
            var dataSourceService = IoC.Get<DataSourceService>();
            var localSource = dataSourceService.LocalDataSource;
            if (localSource == null) return null;

            var path = localSource is SqliteSource sqlite ? sqlite.Path : string.Empty;
            return new DataSourceStatusDto
            {
                DataSourceName = localSource.DataSourceName,
                DatabaseType = localSource.DatabaseType.ToString(),
                Status = localSource.Status.ToString(),
                StatusInfo = localSource.StatusInfo,
                Path = path,
                IsWritable = localSource.IsWritable
            };
        }

        private Result ReloadServers()
        {
            var dataSourceService = IoC.Get<DataSourceService>();
            var localSource = dataSourceService.LocalDataSource;
            if (localSource == null)
            {
                return Result.Fail("Local data source not found");
            }

            var globalData = IoC.Get<GlobalData>();
            globalData.ReloadAll(true);

            if (localSource.Status != EnumDatabaseStatus.OK)
            {
                return Result.Fail(localSource.Status.GetErrorInfo());
            }

            return Result.Success();
        }

        private List<SessionDto> GetActiveSessions()
        {
            var sessionControl = IoC.Get<SessionControlService>();
            return sessionControl.ConnectionId2Hosts.Values.Select(host => new SessionDto
            {
                ConnectionId = host.ConnectionId,
                ServerId = host.ProtocolServer.Id,
                DisplayName = host.ProtocolServer.DisplayName,
                SubTitle = host.ProtocolServer.SubTitle,
                Protocol = host.ProtocolServer.Protocol,
                Status = host.Status.ToString()
            }).ToList();
        }

        private Result CloseSession(string? connectionId)
        {
            if (string.IsNullOrEmpty(connectionId)) return Result.Fail("Connection ID is empty");
            var sessionControl = IoC.Get<SessionControlService>();
            sessionControl.CloseProtocolHostAsync(connectionId);
            return Result.Success();
        }

        private Result ReconnectSession(string? connectionId)
        {
            if (string.IsNullOrEmpty(connectionId)) return Result.Fail("Connection ID is empty");
            var sessionControl = IoC.Get<SessionControlService>();
            if (sessionControl.ConnectionId2Hosts.TryGetValue(connectionId, out var host))
            {
                host.ReConn();
                return Result.Success();
            }
            return Result.Fail("Session not found");
        }

        private int GetCidrFromSubnetMask(IPAddress subnetMask)
        {
            var bytes = subnetMask.GetAddressBytes();
            var bits = 0;
            foreach (var b in bytes)
            {
                var currentByte = b;
                while ((currentByte & 0x80) != 0)
                {
                    bits++;
                    currentByte <<= 1;
                }
            }
            return bits;
        }
    }
}
