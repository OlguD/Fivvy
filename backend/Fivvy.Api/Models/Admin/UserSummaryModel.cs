

namespace Fivvy.Api.Models;

public class UserSummaryModel
{
    public int UserId { get; set; }
    public string? FullName { get; set; }
    public string Email { get; set; } = string.Empty;
    public int ClientCount { get; set; }
}