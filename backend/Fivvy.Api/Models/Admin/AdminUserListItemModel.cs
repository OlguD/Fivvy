namespace Fivvy.Api.Models;

public class AdminUserListItemModel
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int ClientCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
