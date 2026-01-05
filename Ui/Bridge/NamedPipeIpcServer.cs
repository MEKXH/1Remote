using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using _1RM.Bridge.Models;
using _1RM.Model;
using _1RM.Service;
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
                try
                {
                    using var server = new NamedPipeServerStream(_pipeName, PipeDirection.InOut, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
                    await server.WaitForConnectionAsync(token);

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
                    break;
                }
                catch (Exception ex)
                {
                    SimpleLogHelper.Error(ex);
                    await Task.Delay(1000, token);
                }
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
                vm.CmdConnServer.Execute(null);
                return true;
            }
            return false;
        }
    }
}
