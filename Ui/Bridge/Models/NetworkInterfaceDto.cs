namespace _1RM.Bridge.Models
{
    public class NetworkInterfaceDto
    {
        public string Address { get; set; } = string.Empty;
        public string Netmask { get; set; } = string.Empty;
        public string Family { get; set; } = string.Empty;
        public string Mac { get; set; } = string.Empty;
        public bool Internal { get; set; }
        public string? Cidr { get; set; }
    }
}
