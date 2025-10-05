

namespace Fivvy.Api.Models;
public class AddClientRequestModel
{
    public required string CompanyName { get; set; }
    public required string ContactName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}